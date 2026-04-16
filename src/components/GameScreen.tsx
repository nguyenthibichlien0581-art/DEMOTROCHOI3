import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Question, Difficulty } from '../types';
import { useHeadTracking } from '../hooks/useHeadTracking';
import { CheckCircle2, XCircle, ArrowRight, Camera as CameraIcon, Info, Timer, Volume2 } from 'lucide-react';
import clsx from 'clsx';

import confetti from 'canvas-confetti';

interface GameScreenProps {
  questions: Question[];
  difficulty: Difficulty;
  onFinish: (score: number, answers: { questionId: string; isCorrect: boolean }[]) => void;
}

const QUESTION_TIME = 20; // 20 seconds per question

export default function GameScreen({ questions, difficulty, onFinish }: GameScreenProps) {
  const filteredQuestions = questions.filter(q => q.difficulty === difficulty);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [answers, setAnswers] = useState<{ questionId: string; isCorrect: boolean }[]>([]);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  
  const currentQuestion = filteredQuestions[currentIndex];
  const { position, confidence, confirmedPosition, videoRef, resetConfirmation } = useHeadTracking(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
      const userChoice = confirmedPosition === 'Left'; // Left = True, Right = False
      const correct = userChoice === currentQuestion.isCorrect;
      
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

  const playAudio = () => {
    if (currentQuestion.audioUrl) {
      const audio = new Audio(currentQuestion.audioUrl);
      audio.play();
    }
  };

  return (
    <div className="max-w-4xl w-full flex flex-col gap-6">
      {/* Header Info */}
      <div className="flex justify-between items-center bg-white/20 backdrop-blur-md p-4 rounded-2xl text-white font-bold">
        <div className="flex items-center gap-4">
          <div className="text-xl">Câu {currentIndex + 1} / {filteredQuestions.length}</div>
          <div className={clsx(
            "flex items-center gap-2 px-4 py-1 rounded-full text-lg",
            timeLeft < 5 ? "bg-red-500 animate-pulse" : "bg-black/30"
          )}>
            <Timer className="w-5 h-5" /> {timeLeft}s
          </div>
        </div>
        <div className="text-2xl bg-orange-500 px-6 py-1 rounded-full shadow-lg">Điểm: {score}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Question & Controls */}
        <div className="space-y-8 order-2 lg:order-1">
          <motion.div 
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] p-10 shadow-2xl min-h-[350px] flex flex-col items-center justify-center border-b-[12px] border-orange-100 relative overflow-hidden group"
          >
            {currentQuestion.imageUrl && (
              <div className="w-full h-48 mb-6 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center border-2 border-gray-100">
                <img 
                  src={currentQuestion.imageUrl} 
                  alt="Question" 
                  className="max-w-full max-h-full object-contain transition-transform group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            
            <h2 className="text-3xl md:text-4xl font-black text-gray-800 leading-tight text-center">
              {currentQuestion.content}
            </h2>

            {currentQuestion.audioUrl && (
              <button 
                onClick={playAudio}
                className="mt-6 p-4 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-all shadow-lg hover:shadow-orange-200 active:scale-90"
              >
                <Volume2 className="w-8 h-8" />
              </button>
            )}
          </motion.div>

          {/* Controls / Options */}
          <div className="grid grid-cols-2 gap-6">
            <div className={clsx(
              "p-8 rounded-3xl border-4 transition-all flex flex-col items-center justify-center gap-3 shadow-lg",
              position === 'Left' ? "border-green-500 bg-green-50 scale-105 shadow-green-100" : "border-gray-100 bg-white",
              showResult && currentQuestion.isCorrect && "ring-4 ring-green-500 ring-offset-4"
            )}>
              <div className="text-5xl font-black text-green-600">A</div>
              <div className="text-2xl font-black text-gray-800">ĐÚNG</div>
              <div className="text-sm font-bold text-gray-400 mt-2 uppercase tracking-wider">Nghiêng TRÁI</div>
            </div>

            <div className={clsx(
              "p-8 rounded-3xl border-4 transition-all flex flex-col items-center justify-center gap-3 shadow-lg",
              position === 'Right' ? "border-red-500 bg-red-50 scale-105 shadow-red-100" : "border-gray-100 bg-white",
              showResult && !currentQuestion.isCorrect && "ring-4 ring-red-500 ring-offset-4"
            )}>
              <div className="text-5xl font-black text-red-600">B</div>
              <div className="text-2xl font-black text-gray-800">SAI</div>
              <div className="text-sm font-bold text-gray-400 mt-2 uppercase tracking-wider">Nghiêng PHẢI</div>
            </div>
          </div>
        </div>

        {/* Right Column: Camera & Status */}
        <div className="space-y-8 order-1 lg:order-2">
          <div className="relative aspect-square lg:aspect-auto lg:h-[500px] bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white group">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            
            {/* Camera Overlay UI */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Top Bar */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                <div className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/20">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  LIVE CAMERA
                </div>
                <div className="bg-white/90 backdrop-blur-md text-gray-900 text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
                  {position === 'Center' ? 'GIỮ THẲNG ĐẦU' : position === 'Left' ? 'ĐANG CHỌN ĐÚNG' : 'ĐANG CHỌN SAI'}
                </div>
              </div>

              {/* Center Guide */}
              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <div className="w-64 h-64 border-2 border-dashed border-white rounded-full" />
              </div>

              {/* Tilt Indicators */}
              <div className={clsx(
                "absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-green-500/40 to-transparent transition-opacity duration-300",
                position === 'Left' ? "opacity-100" : "opacity-0"
              )} />
              <div className={clsx(
                "absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-red-500/40 to-transparent transition-opacity duration-300",
                position === 'Right' ? "opacity-100" : "opacity-0"
              )} />
            </div>
            
            {/* Confirmation Progress Bar */}
            {position !== 'Center' && !showResult && (
              <div className="absolute bottom-6 left-6 right-6 h-4 bg-black/40 backdrop-blur-md rounded-full overflow-hidden border border-white/20 p-1">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence * 100}%` }}
                  className={clsx(
                    "h-full rounded-full shadow-lg",
                    position === 'Left' ? "bg-green-500 shadow-green-500/50" : "bg-red-500 shadow-red-500/50"
                  )}
                />
              </div>
            )}
          </div>

          <div className="bg-white/20 backdrop-blur-md p-6 rounded-3xl text-white border border-white/20 shadow-xl">
            <h4 className="font-black text-lg flex items-center gap-2 mb-3">
              <Info className="w-5 h-5" /> HƯỚNG DẪN ĐIỀU KHIỂN
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">1</div>
                <p className="text-sm opacity-90 leading-tight">Nghiêng đầu để di chuyển lựa chọn</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">2</div>
                <p className="text-sm opacity-90 leading-tight">Giữ nguyên tư thế trong 2 giây</p>
              </div>
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
