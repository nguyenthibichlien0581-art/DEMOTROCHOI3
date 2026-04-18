import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, RotateCcw, ListOrdered } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ResultScreenProps {
  score: number;
  total: number;
  onRestart: () => void;
  onShowLeaderboard: () => void;
  isAudioEnabled: boolean;
}

export default function ResultScreen({ score, total, onRestart, onShowLeaderboard, isAudioEnabled }: ResultScreenProps) {
  useEffect(() => {
    if (!isAudioEnabled) return;

    // Play celebratory applause and loop it
    const applauseAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
    applauseAudio.volume = 0.5;
    applauseAudio.loop = true;
    applauseAudio.play().catch(e => console.log('Audio play blocked:', e));

    let interval: any;

    if (score > 0) {
      // Continuous confetti effect for positive scores
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      interval = setInterval(function() {
        confetti({ ...defaults, particleCount: 30, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount: 30, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 750);
    }

    // Cleanup: Stop audio and confetti when leaving the screen
    return () => {
      applauseAudio.pause();
      applauseAudio.currentTime = 0;
      if (interval) clearInterval(interval);
      confetti.reset();
    };
  }, [score]);

  const percentage = (score / total) * 100;
  let message = "Cố gắng hơn lần sau nhé!";
  if (percentage >= 80) message = "Xuất sắc! Những cú nghiêng đầu của em thật chính xác và thông minh!";
  else if (percentage >= 50) message = "Làm tốt lắm! Tiếp tục phát huy nhé!";

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center border-b-8 border-orange-200"
    >
      <div className="bg-yellow-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
        <Trophy className="w-12 h-12 text-yellow-600" />
      </div>
      
      <h2 className="text-3xl font-black text-gray-800 mb-2">Kết thúc!</h2>
      <p className="text-gray-500 mb-6">{message}</p>
      
      <div className="bg-orange-50 rounded-2xl p-6 mb-8">
        <div className="text-sm text-orange-600 font-bold uppercase tracking-widest mb-1">Tổng điểm</div>
        <div className="text-6xl font-black text-orange-500">{score}</div>
      </div>

      <div className="space-y-4">
        <button
          onClick={onRestart}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <RotateCcw className="w-5 h-5" /> Chơi lại
        </button>
        <button
          onClick={onShowLeaderboard}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <ListOrdered className="w-5 h-5" /> Bảng vinh danh
        </button>
      </div>
    </motion.div>
  );
}
