import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Question, Difficulty } from '../types';
import { storage } from '../utils/storage';
import { Settings, Plus, Trash2, Edit2, Save, X, LogOut, Lock, Download, Upload, Image as ImageIcon, Music } from 'lucide-react';
import * as XLSX from 'xlsx';

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [questions, setQuestions] = useState<Question[]>(storage.getQuestions());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Question>>({});

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsLoggedIn(true);
    } else {
      alert('Sai mật khẩu!');
    }
  };

  const handleExportExcel = () => {
    const data = questions.map(q => ({
      'ID': q.id,
      'Câu hỏi': q.content,
      'Đáp án (TRUE/FALSE)': q.isCorrect ? 'TRUE' : 'FALSE',
      'Giải thích': q.explanation,
      'Độ khó (Easy/Medium/Hard)': q.difficulty,
      'Link ảnh': q.imageUrl || '',
      'Link âm thanh': q.audioUrl || ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, "EnergyQuest_Questions.xlsx");
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];
      
      const imported: Question[] = data.map((row, index) => ({
        id: row['ID'] || Date.now().toString() + index,
        content: row['Câu hỏi'] || '',
        isCorrect: String(row['Đáp án (TRUE/FALSE)']).toUpperCase() === 'TRUE',
        explanation: row['Giải thích'] || '',
        difficulty: (row['Độ khó (Easy/Medium/Hard)'] || 'Easy') as Difficulty,
        imageUrl: row['Link ảnh'] || undefined,
        audioUrl: row['Link âm thanh'] || undefined
      }));

      if (confirm(`Bạn có muốn nhập ${imported.length} câu hỏi từ file Excel? (Sẽ ghi đè danh sách hiện tại)`)) {
        setQuestions(imported);
        storage.saveQuestions(imported);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleAdd = () => {
    const newQ: Question = {
      id: Date.now().toString(),
      content: 'Câu hỏi mới...',
      isCorrect: true,
      explanation: 'Giải thích...',
      difficulty: 'Easy'
    };
    const updated = [...questions, newQ];
    setQuestions(updated);
    storage.saveQuestions(updated);
    setEditingId(newQ.id);
    setEditForm(newQ);
  };

  const handleSave = () => {
    if (editingId) {
      const updated = questions.map(q => q.id === editingId ? { ...q, ...editForm } as Question : q);
      setQuestions(updated);
      storage.saveQuestions(updated);
      setEditingId(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc muốn xóa câu hỏi này?')) {
      const updated = questions.filter(q => q.id !== id);
      setQuestions(updated);
      storage.saveQuestions(updated);
    }
  };

  const handleResetLeaderboard = () => {
    if (confirm('Bạn có chắc muốn xóa toàn bộ bảng vinh danh?')) {
      storage.clearLeaderboard();
      alert('Đã reset bảng vinh danh!');
    }
  };

  if (!isLoggedIn) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border-4 border-gray-800"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="bg-gray-100 p-4 rounded-full mb-4">
            <Lock className="w-10 h-10 text-gray-800" />
          </div>
          <h2 className="text-2xl font-black text-gray-800">Admin Login</h2>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gray-800 focus:outline-none"
            placeholder="Nhập mật khẩu..."
          />
          <button type="submit" className="w-full bg-gray-800 text-white font-bold py-3 rounded-xl hover:bg-gray-900 transition-colors">
            Đăng nhập
          </button>
          <button type="button" onClick={onClose} className="w-full text-gray-500 font-bold py-2">
            Quay lại
          </button>
        </form>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh]"
    >
      <div className="bg-gray-800 p-6 text-white flex items-center justify-between">
        <h2 className="text-2xl font-black flex items-center gap-2">
          <Settings className="w-6 h-6" /> Quản trị hệ thống
        </h2>
        <div className="flex gap-2">
          <button onClick={handleExportExcel} className="bg-blue-500 hover:bg-blue-600 p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold">
            <Download className="w-4 h-4" /> Xuất Excel
          </button>
          <label className="bg-orange-500 hover:bg-orange-600 p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer">
            <Upload className="w-4 h-4" /> Nhập Excel
            <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} className="hidden" />
          </label>
          <button onClick={handleResetLeaderboard} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-xs font-bold transition-colors">
            Reset Bảng Vinh Danh
          </button>
          <button onClick={() => setIsLoggedIn(false)} className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
          <button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Danh sách câu hỏi ({questions.length})</h3>
          <button onClick={handleAdd} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-md transition-transform active:scale-95">
            <Plus className="w-5 h-5" /> Thêm câu hỏi
          </button>
        </div>

        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="border-2 border-gray-100 rounded-2xl p-4 hover:border-gray-200 transition-colors">
              {editingId === q.id ? (
                <div className="space-y-4">
                  <textarea
                    className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    placeholder="Nội dung câu hỏi..."
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      className="p-3 rounded-xl border border-gray-300"
                      value={editForm.difficulty}
                      onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value as Difficulty })}
                    >
                      <option value="Easy">Dễ</option>
                      <option value="Medium">Trung bình</option>
                      <option value="Hard">Khó</option>
                    </select>
                    <select
                      className="p-3 rounded-xl border border-gray-300"
                      value={editForm.isCorrect ? 'true' : 'false'}
                      onChange={(e) => setEditForm({ ...editForm, isCorrect: e.target.value === 'true' })}
                    >
                      <option value="true">Đúng (A)</option>
                      <option value="false">Sai (B)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        className="w-full p-3 pl-10 rounded-xl border border-gray-300"
                        value={editForm.imageUrl || ''}
                        onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                        placeholder="Link hình ảnh (URL)..."
                      />
                    </div>
                    <div className="relative">
                      <Music className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        className="w-full p-3 pl-10 rounded-xl border border-gray-300"
                        value={editForm.audioUrl || ''}
                        onChange={(e) => setEditForm({ ...editForm, audioUrl: e.target.value })}
                        placeholder="Link âm thanh (URL)..."
                      />
                    </div>
                  </div>
                  <textarea
                    className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editForm.explanation}
                    onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                    placeholder="Giải thích..."
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSave} className="flex-grow bg-blue-500 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-2">
                      <Save className="w-4 h-4" /> Lưu
                    </button>
                    <button onClick={() => setEditingId(null)} className="px-6 bg-gray-200 text-gray-600 py-2 rounded-xl font-bold">
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        q.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                        q.difficulty === 'Medium' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {q.difficulty}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        q.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {q.isCorrect ? 'Đúng' : 'Sai'}
                      </span>
                      {(q.imageUrl || q.audioUrl) && (
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded flex items-center gap-1">
                          {q.imageUrl && <ImageIcon className="w-3 h-3" />}
                          {q.audioUrl && <Music className="w-3 h-3" />}
                          Media
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-gray-800">{q.content}</p>
                    <p className="text-sm text-gray-500 italic mt-1">{q.explanation}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => { setEditingId(q.id); setEditForm(q); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(q.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
