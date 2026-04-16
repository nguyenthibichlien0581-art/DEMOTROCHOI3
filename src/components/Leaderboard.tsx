import React from 'react';
import { motion } from 'motion/react';
import { ScoreEntry } from '../types';
import { Trophy, Medal, User, GraduationCap, ArrowLeft } from 'lucide-react';

interface LeaderboardProps {
  entries: ScoreEntry[];
  onBack: () => void;
}

export default function Leaderboard({ entries, onBack }: LeaderboardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border-b-8 border-blue-200"
    >
      <div className="bg-blue-600 p-6 text-white flex items-center justify-between">
        <button onClick={onBack} className="hover:bg-white/20 p-2 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-black flex items-center gap-2">
          <Trophy className="w-6 h-6" /> Bảng Vinh Danh
        </h2>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="p-6">
        {entries.length === 0 ? (
          <div className="text-center py-12 text-gray-400 italic">
            Chưa có kỷ lục nào được ghi nhận.
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 ${
                  index === 0 ? 'bg-yellow-50 border-yellow-200' : 
                  index === 1 ? 'bg-gray-50 border-gray-200' :
                  index === 2 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'
                }`}
              >
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center font-black text-xl">
                  {index === 0 ? <Medal className="text-yellow-500 w-8 h-8" /> :
                   index === 1 ? <Medal className="text-gray-400 w-8 h-8" /> :
                   index === 2 ? <Medal className="text-orange-400 w-8 h-8" /> :
                   index + 1}
                </div>
                
                <div className="flex-grow">
                  <div className="font-bold text-gray-800 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" /> {entry.name}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" /> Lớp {entry.className}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-blue-600">{entry.score}</div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold">Điểm</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
