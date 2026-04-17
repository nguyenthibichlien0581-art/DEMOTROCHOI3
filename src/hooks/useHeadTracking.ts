import { useEffect, useRef, useState } from 'react';
import { FaceMesh, Results } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

export type HeadPosition = 'Center' | 'Left' | 'Right';

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export function useHeadTracking(active: boolean) {
  const [position, setPosition] = useState<HeadPosition>('Center');
  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null);
  const [confidence, setConfidence] = useState(0); // 0 to 1
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  
  // Timer for confirmation
  const stableTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [confirmedPosition, setConfirmedPosition] = useState<HeadPosition | null>(null);

  useEffect(() => {
    if (!active) {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      return;
    }

    const faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults((results: Results) => {
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const currentLandmarks = results.multiFaceLandmarks[0];
        setLandmarks(currentLandmarks);
        
        /**
         * LOGIC NHẬN DIỆN NGHIÊNG ĐẦU:
         * Chúng ta lấy 2 điểm mốc ở đuôi mắt trái (33) và đuôi mắt phải (263).
         * Tính góc của đường thẳng nối 2 điểm này so với trục nằm ngang.
         * - Nếu góc dương > ngưỡng: Đầu đang nghiêng sang PHẢI.
         * - Nếu góc âm < ngưỡng: Đầu đang nghiêng sang TRÁI.
         */
        const leftEye = currentLandmarks[33]; // Student's Left eye (appears on right side of image)
        const rightEye = currentLandmarks[263]; // Student's Right eye (appears on left side of image)
        
        // Height difference between eyes
        // If student tilts to THEIR LEFT: left eye goes down (higher y), right eye goes up (lower y)
        // dy = LeftEye.y - RightEye.y will be POSITIVE
        const dy = leftEye.y - rightEye.y;
        
        // Ngưỡng nghiêng đầu (thay đổi giá trị này để điều chỉnh độ nhạy)
        const TILT_THRESHOLD = 0.05; 
        
        let currentPos: HeadPosition = 'Center';
        if (dy > TILT_THRESHOLD) {
          currentPos = 'Right'; // Visually tilts toward the RIGHT side of the camera feed (Choice A)
        } else if (dy < -TILT_THRESHOLD) {
          currentPos = 'Left'; // Visually tilts toward the LEFT side of the camera feed (Choice B)
        }
        
        setPosition(currentPos);
      } else {
        setPosition('Center');
        setLandmarks(null);
      }
    });

    faceMeshRef.current = faceMesh;

    if (videoRef.current) {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) {
            await faceMesh.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
      });
      camera.start();
      cameraRef.current = camera;
    }

    return () => {
      if (cameraRef.current) cameraRef.current.stop();
      if (faceMeshRef.current) faceMeshRef.current.close();
    };
  }, [active]);

  // Handle confirmation logic (2 seconds stable)
  useEffect(() => {
    if (position === 'Center') {
      if (stableTimerRef.current) {
        clearTimeout(stableTimerRef.current);
        stableTimerRef.current = null;
      }
      setConfidence(0);
      return;
    }

    // If position changed to Left or Right, start timer
    setConfidence(0.1);
    const startTime = Date.now();
    const duration = 2000; // 2 seconds

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setConfidence(progress);
      
      if (progress >= 1) {
        setConfirmedPosition(position);
        clearInterval(interval);
      }
    }, 100);

    stableTimerRef.current = setTimeout(() => {
      // This is handled by interval now for confidence tracking
    }, duration);

    return () => {
      clearInterval(interval);
      if (stableTimerRef.current) clearTimeout(stableTimerRef.current);
      setConfirmedPosition(null);
    };
  }, [position]);

  return {
    position,
    landmarks,
    confidence,
    confirmedPosition,
    videoRef,
    resetConfirmation: () => setConfirmedPosition(null)
  };
}
