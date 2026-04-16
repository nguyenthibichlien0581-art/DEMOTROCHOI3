import React from 'react';
import { motion } from 'motion/react';
import { Difficulty } from '../types';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

interface ModeSelectionProps {
  onSelect: (difficulty: Difficulty) => void;
}

export default function ModeSelection({ onSelect }: ModeSelectionProps) {
  const modes: { type: Difficulty; label: string; icon: any; color: string; desc: string }[] = [
    { 
      type: 'Easy', 
      label: 'Dễ', 
      icon: ShieldCheck, 
      color: 'bg-green-500',
      desc: 'Câu hỏi cơ bản về năng lượng'
    },
    { 
      type: 'Medium', 
      label: 'Trung bình', 
      icon: Shield, 
      color: 'bg-blue-500',
      desc: 'Sự chuyển hóa năng lượng'
    },
    { 
      type: 'Hard', 
      label: 'Khó', 
      icon: ShieldAlert, 
      color: 'bg-red-500',
      desc: 'Vận dụng kiến thức thực tế'
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl w-full"
    >
      <h2 className="text-3xl font-bold text-white text-center mb-8 drop-shadow-md">Chọn độ khó</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modes.map((mode) => (
          <button
            key={mode.type}
            onClick={() => onSelect(mode.type)}
            className="group relative bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 border-b-8 border-gray-200 active:border-b-0 active:translate-y-0"
          >
            <div className={`${mode.color} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg`}>
              <mode.icon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{mode.label}</h3>
            <p className="text-sm text-gray-500">{mode.desc}</p>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
