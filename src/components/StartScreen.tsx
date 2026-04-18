import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Zap, GraduationCap, User, Settings, Volume2, VolumeX } from 'lucide-react';

interface StartScreenProps {
  onStart: (name: string, className: string) => void;
  onAdmin: () => void;
  hasInteracted: boolean;
  onEnableAudio: () => void;
}

export default function StartScreen({ onStart, onAdmin, hasInteracted, onEnableAudio }: StartScreenProps) {
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');

  const handleEnableAudio = () => {
    // Unlocking audio context
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
    audio.volume = 0;
    audio.play().then(() => {
      onEnableAudio();
    }).catch(e => {
      console.log('Audio unlock failed:', e);
      onEnableAudio(); // Still call it even if play fails, might need another browser gesture
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && className) {
      onStart(name, className);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border-4 border-orange-400"
    >
      <div className="flex flex-col items-center mb-8">
        <div className="bg-orange-100 p-4 rounded-full mb-4">
          <Zap className="w-12 h-12 text-orange-500 fill-orange-500" />
        </div>
        <h1 className="text-3xl font-black text-gray-800 text-center uppercase tracking-tight">Nghiêng đầu lượm kiến thức</h1>
        <p className="text-gray-500 text-center mt-2 font-medium">Thử thách trí tuệ bằng cử chỉ đầu!</p>
      </div>

      {!hasInteracted && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 p-4 bg-orange-50 border-2 border-dashed border-orange-200 rounded-2xl flex flex-col items-center gap-3 text-center"
        >
          <div className="bg-orange-100 p-3 rounded-full flex items-center justify-center">
            <VolumeX className="w-6 h-6 text-orange-500 animate-pulse" />
          </div>
          <div>
            <div className="font-bold text-orange-900 text-sm">Âm thanh đang tắt</div>
            <p className="text-[11px] text-orange-600/80 leading-tight">Nhấp vào nút bên dưới để bật âm nhạc và hiệu ứng trong trò chơi</p>
          </div>
          <button
            type="button"
            onClick={handleEnableAudio}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-black py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Volume2 className="w-4 h-4" /> BẬT ÂM THANH NGAY
          </button>
        </motion.div>
      )}

      {hasInteracted && (
        <div className="mb-8 flex items-center justify-center gap-2 py-2 px-4 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 mx-auto w-fit">
          <Volume2 className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest text">Âm thanh đã sẵn sàng</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <User className="w-4 h-4" /> Tên học sinh
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors text-lg"
            placeholder="Nhập tên của em..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <GraduationCap className="w-4 h-4" /> Lớp
          </label>
          <input
            type="text"
            required
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors text-lg"
            placeholder="Ví dụ: 6A1"
          />
        </div>

        <button
          type="submit"
          disabled={!name || !className}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl shadow-[0_6px_0_0_#c2410c] transform transition active:translate-y-1 active:shadow-none text-xl"
        >
          Bắt đầu ngay!
        </button>

        <button
          type="button"
          onClick={onAdmin}
          className="w-full flex items-center justify-center gap-2 text-orange-600/70 hover:text-orange-700 font-bold py-2 transition-colors text-sm"
        >
          <Settings className="w-4 h-4" /> Quản trị hệ thống
        </button>
      </form>
    </motion.div>
  );
}
