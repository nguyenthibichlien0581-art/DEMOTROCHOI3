import { useEffect, useRef, useState } from 'react';
import { FaceMesh, Results } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

export type HeadPosition = 'Center' | 'Left' | 'Right';

export function useHeadTracking(active: boolean) {
  const [position, setPosition] = useState<HeadPosition>('Center');
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
        const landmarks = results.multiFaceLandmarks[0];
        
        /**
         * LOGIC NHẬN DIỆN NGHIÊNG ĐẦU:
         * Chúng ta lấy 2 điểm mốc ở đuôi mắt trái (33) và đuôi mắt phải (263).
         * Tính góc của đường thẳng nối 2 điểm này so với trục nằm ngang.
         * - Nếu góc dương > ngưỡng: Đầu đang nghiêng sang PHẢI.
         * - Nếu góc âm < ngưỡng: Đầu đang nghiêng sang TRÁI.
         */
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];
        
        const dx = rightEye.x - leftEye.x;
        const dy = rightEye.y - leftEye.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        // Ngưỡng nghiêng đầu (độ) - Có thể điều chỉnh để nhạy hơn hoặc ít nhạy hơn
        const TILT_THRESHOLD = 15;
        
        let currentPos: HeadPosition = 'Center';
        if (angle > TILT_THRESHOLD) {
          currentPos = 'Right'; // Nghiêng phải
        } else if (angle < -TILT_THRESHOLD) {
          currentPos = 'Left'; // Nghiêng trái
        }
        
        setPosition(currentPos);
      } else {
        setPosition('Center');
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
    confidence,
    confirmedPosition,
    videoRef,
    resetConfirmation: () => setConfirmedPosition(null)
  };
}
