import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Zap, GraduationCap, User, Users } from 'lucide-react';

interface StartScreenProps {
  onStart: (name: string, className: string) => void;
}

export default function StartScreen({ onStart }: StartScreenProps) {
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');

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
        <h1 className="text-3xl font-bold text-gray-800 text-center">Energy Quest</h1>
        <p className="text-gray-500 text-center mt-2">Thử thách năng lượng bằng cử chỉ đầu!</p>
      </div>

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
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl shadow-lg transform transition hover:scale-105 active:scale-95 text-xl"
        >
          Bắt đầu ngay!
        </button>
      </form>
    </motion.div>
  );
}
