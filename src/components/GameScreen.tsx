import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Question, Difficulty } from '../types';
import { useHeadTracking } from '../hooks/useHeadTracking';
import { CheckCircle2, XCircle, ArrowRight, Camera as CameraIcon, Info, Timer, Volume2, Trophy, VolumeX, Volume1, Play, Pause, Music } from 'lucide-react';
import clsx from 'clsx';

import confetti from 'canvas-confetti';

interface GameScreenProps {
  questions: Question[];
  studentName: string;
  studentClass: string;
  onFinish: (score: number, answers: { questionId: string; isCorrect: boolean }[]) => void;
}

const QUESTION_TIME = 20; // 20 seconds per question

export default function GameScreen({ questions, studentName, studentClass, onFinish }: GameScreenProps) {
  const filteredQuestions = questions;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [answers, setAnswers] = useState<{ questionId: string; isCorrect: boolean }[]>([]);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.4);
  const [customMusicUrl, setCustomMusicUrl] = useState<string | null>(null);
  
  const currentQuestion = filteredQuestions[currentIndex];
  const { position, landmarks, confidence, confirmedPosition, videoRef, resetConfirmation } = useHeadTracking(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw face landmarks
  useEffect(() => {
    if (!canvasRef.current || !landmarks) {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set line style
    ctx.strokeStyle = position === 'Center' ? 'rgba(255, 255, 255, 0.5)' : (position === 'Left' ? 'rgba(236, 72, 153, 0.7)' : 'rgba(14, 165, 233, 0.7)');
    ctx.lineWidth = 1;

    // Draw a selection indicator line connecting eyes
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    
    // Draw dots for main points
    [33, 263, 1, 61, 291, 199].forEach(idx => {
       const p = landmarks[idx];
       if (p) {
         ctx.beginPath();
         ctx.arc(p.x * canvas.width, p.y * canvas.height, 1.5, 0, Math.PI * 2);
         ctx.fillStyle = ctx.strokeStyle;
         ctx.fill();
       }
    });

    // Draw a subtle connecting line
    ctx.beginPath();
    ctx.moveTo(leftEye.x * canvas.width, leftEye.y * canvas.height);
    ctx.lineTo(rightEye.x * canvas.width, rightEye.y * canvas.height);
    ctx.stroke();

  }, [landmarks, position]);

  // Background Music Setup
  useEffect(() => {
    const musicSrc = customMusicUrl || 'https://cdn.pixabay.com/download/audio/2024/02/14/audio_a796030514.mp3?filename=8-bit-arcade-189194.mp3';
    
    if (bgMusicRef.current) {
      bgMusicRef.current.pause();
    }
    
    bgMusicRef.current = new Audio(musicSrc);
    bgMusicRef.current.loop = true;
    bgMusicRef.current.volume = isMusicMuted ? 0 : musicVolume;
    
    const playAttempt = setInterval(() => {
      if (bgMusicRef.current) {
        bgMusicRef.current.play()
          .then(() => clearInterval(playAttempt))
          .catch(() => {});
      }
    }, 1000);

    return () => {
      clearInterval(playAttempt);
      bgMusicRef.current?.pause();
      bgMusicRef.current = null;
    };
  }, [customMusicUrl]);

  // Sync volume and speed
  useEffect(() => {
    if (bgMusicRef.current) {
      bgMusicRef.current.volume = isMusicMuted ? 0 : musicVolume;
      
      // Speed up when time is low
      if (timeLeft <= 5 && timeLeft > 0 && !showResult) {
        bgMusicRef.current.playbackRate = 1.25;
      } else {
        bgMusicRef.current.playbackRate = 1.0;
      }
    }
  }, [musicVolume, isMusicMuted, timeLeft, showResult]);

  // Timer logic
  useEffect(() => {
    if (showResult) return;
    
    if (timeLeft <= 0) {
      handleTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, showResult]);

  const handleTimeUp = () => {
    setIsCorrect(false);
    setAnswers(prev => [...prev, { questionId: currentQuestion.id, isCorrect: false }]);
    setShowResult(true);
    playFeedbackSound(false);
  };

  useEffect(() => {
    if (confirmedPosition && !showResult) {
      // Logic: Tilt towards the visual box to select it
      // Visual Left (Physical Left) -> Option A
      // Visual Right (Physical Right) -> Option B
      const userChoice = confirmedPosition === 'Left' ? 'A' : 'B'; 
      const correct = userChoice === currentQuestion.correctOption;
      
      setIsCorrect(correct);
      if (correct) {
        setScore(s => s + 10);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ff8c00', '#ffd700', '#ffffff']
        });
      }
      setAnswers(prev => [...prev, { questionId: currentQuestion.id, isCorrect: correct }]);
      setShowResult(true);
      playFeedbackSound(correct);
    }
  }, [confirmedPosition, currentQuestion, showResult]);

  const playFeedbackSound = (correct: boolean) => {
    const audio = new Audio(
      correct 
        ? 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3' // Ting ting
        : 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3' // Rè rè/Buzz
    );
    audio.play().catch(e => console.log('Sound play blocked:', e));
  };

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowResult(false);
      setTimeLeft(QUESTION_TIME);
      resetConfirmation();
    } else {
      onFinish(score, answers);
    }
  };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomMusicUrl(url);
    }
  };

  const playAudio = (url?: string) => {
    if (url) {
      const audio = new Audio(url);
      audio.play();
    }
  };

  return (
    <div className="max-w-[1400px] w-full flex flex-col gap-4 p-4 min-h-[90vh]">
      {/* Main Grid */}
      <div className="grid grid-cols-4 gap-4 flex-grow">
        
        {/* Row 1, Col 1-3: Question */}
        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="col-span-3 bg-white rounded-2xl p-10 border-4 border-sky-100 flex items-center justify-center relative shadow-sm"
        >
          <div className="flex flex-col items-center gap-6 w-full">
            {currentQuestion.videoUrl || currentQuestion.imageUrl ? (
              <div className="w-full max-w-2xl h-48 mb-4">
                {currentQuestion.videoUrl ? (
                  <video src={currentQuestion.videoUrl} controls className="w-full h-full object-contain rounded-xl" />
                ) : (
                  <img src={currentQuestion.imageUrl} alt="Q" className="w-full h-full object-contain rounded-xl" referrerPolicy="no-referrer" />
                )}
              </div>
            ) : null}
            
            <h2 className={clsx(
              "font-black text-gray-900 leading-[1.1] text-center transition-all duration-500",
              currentQuestion.content.length > 60 ? "text-3xl md:text-4xl" : "text-4xl md:text-5xl lg:text-6xl"
            )}>
              {currentQuestion.content}
            </h2>

            {currentQuestion.audioUrl && (
              <button 
                onClick={() => playAudio(currentQuestion.audioUrl)}
                className="p-3 bg-sky-50 text-sky-500 rounded-full hover:bg-sky-100 transition-all shadow-sm"
              >
                <Volume2 className="w-8 h-8" />
              </button>
            )}
          </div>
          
          {/* Progress Indicator */}
          <div className="absolute top-4 right-6 flex items-center gap-4 text-sky-400 font-bold">
            <span className="text-sm">Câu {currentIndex + 1} / {filteredQuestions.length}</span>
            <div className={clsx(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border-2",
              timeLeft < 5 ? "border-red-400 text-red-500 animate-pulse" : "border-sky-100"
            )}>
              <Timer className="w-4 h-4" /> {timeLeft}s
            </div>
          </div>
        </motion.div>

        {/* Row 1, Col 4: Camera */}
        <div className="col-span-1 bg-white rounded-2xl p-2 border-4 border-sky-100 shadow-sm relative overflow-hidden group">
          <video
            ref={videoRef}
            className="w-full h-full object-cover rounded-xl shadow-inner bg-black"
            autoPlay
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Camera Overlay */}
          <div className="absolute inset-x-2 top-4 flex justify-between items-center px-2 z-20">
            <div className="bg-black/60 backdrop-blur-md text-[10px] text-white font-bold px-3 py-1 rounded-full border border-white/20 flex items-center gap-2">
              <div className={clsx(
                "w-2 h-2 rounded-full",
                landmarks ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse"
              )} />
              {landmarks ? 'TRACKING ACTIVE' : 'SEARCHING FOR FACE...'}
            </div>
            <div className="bg-white/95 backdrop-blur-md text-gray-900 text-[10px] font-black px-3 py-1 rounded-full shadow-xl border border-white/20">
              {position === 'Center' ? 'GIỮ THẲNG ĐẦU' : position === 'Left' ? 'CHỌN A' : 'CHỌN B'}
            </div>
          </div>

          {/* Minimal visual cues for tilt */}
          <div className={clsx(
            "absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-pink-500/20 to-transparent transition-opacity duration-300 z-10",
            position === 'Left' ? "opacity-100" : "opacity-0"
          )} />
          <div className={clsx(
            "absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-sky-500/20 to-transparent transition-opacity duration-300 z-10",
            position === 'Right' ? "opacity-100" : "opacity-0"
          )} />

          {/* Selection Progress Bar */}
          {confidence > 0 && position !== 'Center' && (
            <div className="absolute inset-x-4 bottom-4 h-2 bg-black/40 rounded-full overflow-hidden z-20">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${confidence * 100}%` }}
                className={clsx(
                  "h-full rounded-full transition-colors",
                  position === 'Left' ? 'bg-pink-500 shadow-[0_0_10px_#ec4899]' : 'bg-sky-500 shadow-[0_0_10px_#0ea5e9]'
                )}
              />
            </div>
          )}

          {/* Grid Overlay for Visual Aid */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <div className="w-1/2 h-1/2 border-2 border-dashed border-white rounded-full" />
          </div>
        </div>

        {/* Row 2, Col 1-3: Options A & B */}
        <div className="col-span-3 grid grid-cols-2 gap-4">
          {/* Option A */}
          <div className={clsx(
            "p-10 rounded-2xl border-4 transition-all flex items-center justify-center relative shadow-sm group",
            position === 'Left' ? "border-pink-400 bg-pink-50/80 scale-[1.02]" : "border-pink-100 bg-pink-50/30",
            showResult && currentQuestion.correctOption === 'A' && "ring-4 ring-pink-400 ring-offset-4"
          )}>
            <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
              A
            </div>
            
            <div className="flex flex-col items-center gap-4 w-full px-4">
              <span className={clsx(
                "font-black text-gray-900 tracking-tight text-center leading-tight transition-all",
                currentQuestion.optionA.text?.length > 20 ? "text-3xl md:text-4xl" : "text-4xl md:text-6xl"
              )}>
                {currentQuestion.optionA.imageUrl ? (
                  <img src={currentQuestion.optionA.imageUrl} className="w-32 h-32 object-contain" alt="A" />
                ) : "A: ĐÚNG"}
              </span>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Nghiêng TRÁI của bạn</div>
            </div>
          </div>

          {/* Option B */}
          <div className={clsx(
            "p-10 rounded-2xl border-4 transition-all flex items-center justify-center relative shadow-sm group",
            position === 'Right' ? "border-sky-400 bg-sky-50/80 scale-[1.02]" : "border-sky-100 bg-sky-50/30",
            showResult && currentQuestion.correctOption === 'B' && "ring-4 ring-sky-400 ring-offset-4"
          )}>
            <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
              B
            </div>

            <div className="flex flex-col items-center gap-4 w-full px-4">
              <span className={clsx(
                "font-black text-gray-900 tracking-tight text-center leading-tight transition-all",
                currentQuestion.optionB.text?.length > 20 ? "text-3xl md:text-4xl" : "text-4xl md:text-6xl"
              )}>
                {currentQuestion.optionB.imageUrl ? (
                  <img src={currentQuestion.optionB.imageUrl} className="w-32 h-32 object-contain" alt="B" />
                ) : "B: SAI"}
              </span>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Nghiêng PHẢI của bạn</div>
            </div>
          </div>
        </div>

        {/* Row 2, Col 4: Scoreboard & Controls */}
        <div className="col-span-1 bg-white rounded-2xl border-4 border-sky-100 p-5 flex flex-col shadow-sm gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-500 font-black mb-4 pb-2 border-b-2 border-sky-50">
              <Trophy className="w-5 h-5" />
              <span className="uppercase tracking-wider">Bảng điểm</span>
            </div>
            
            <div className="bg-emerald-50 border-2 border-emerald-100 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-black text-xs">
                  1
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-gray-700 uppercase">{studentName}</span>
                  <span className="text-[10px] text-gray-400">Lớp {studentClass}</span>
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-600">{score}</div>
            </div>
          </div>

          {/* Music Controls */}
          <div className="mt-4 p-4 bg-sky-50/50 rounded-xl border-2 border-sky-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Âm nhạc</span>
              <div className="flex items-center gap-2">
                <label className="p-1.5 bg-white rounded-lg shadow-sm text-sky-500 hover:bg-sky-100 transition-colors cursor-pointer" title="Chọn nhạc từ máy tính">
                  <Music className="w-4 h-4" />
                  <input 
                    type="file" 
                    accept="audio/*" 
                    className="hidden" 
                    onChange={handleMusicUpload}
                  />
                </label>
                <button 
                  onClick={() => setIsMusicMuted(!isMusicMuted)}
                  className="p-1.5 bg-white rounded-lg shadow-sm text-sky-500 hover:bg-sky-100 transition-colors"
                >
                  {isMusicMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Volume1 className="w-3 h-3 text-sky-300" />
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                value={musicVolume}
                onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                className="flex-grow accent-sky-500 h-1 rounded-lg cursor-pointer"
              />
              <Volume2 className="w-3 h-3 text-sky-400" />
            </div>

            {customMusicUrl && (
              <div className="text-[9px] text-sky-400 font-bold truncate italic">
                Đang phát nhạc tùy chỉnh...
              </div>
            )}
          </div>

          <div className="mt-auto space-y-3">
            <div className="flex items-center gap-3 opacity-30 grayscale">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="h-2 w-24 bg-gray-100 rounded" />
            </div>
            <div className="flex items-center gap-3 opacity-20 grayscale">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="h-2 w-16 bg-gray-100 rounded" />
            </div>
          </div>
        </div>

      </div>

      {/* Result Overlay */}
      <AnimatePresence>
        {showResult && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-t-8 border-orange-500">
              <div className="flex flex-col items-center text-center">
                {isCorrect ? (
                  <CheckCircle2 className="w-20 h-20 text-green-500 mb-4" />
                ) : (
                  <XCircle className="w-20 h-20 text-red-500 mb-4" />
                )}
                <h3 className={clsx(
                  "text-3xl font-black mb-2",
                  isCorrect ? "text-green-600" : "text-red-600"
                )}>
                  {isCorrect ? "CHÍNH XÁC!" : "TIẾC QUÁ!"}
                </h3>
                <p className="text-gray-600 mb-6 text-lg italic">
                  "{currentQuestion.explanation}"
                </p>
                <button
                  onClick={handleNext}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-xl transition-transform active:scale-95"
                >
                  {currentIndex < filteredQuestions.length - 1 ? "Câu tiếp theo" : "Xem kết quả"}
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
