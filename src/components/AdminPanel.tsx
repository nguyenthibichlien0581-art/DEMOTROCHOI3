import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Question, Difficulty, MediaOption } from '../types';
import { storage } from '../utils/storage';
import { Settings, Plus, Trash2, Edit2, Save, X, LogOut, Lock, Download, Upload, Image as ImageIcon, Music, Film, Type, FileJson, FileSpreadsheet, HardDriveDownload, HardDriveUpload } from 'lucide-react';
import * as XLSX from 'xlsx';
import clsx from 'clsx';

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Question>>({});
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const load = async () => {
      const qs = await storage.getQuestions();
      setQuestions(qs);
    };
    load();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Lien123') {
      setIsLoggedIn(true);
      setError(null);
    } else {
      setError('Sai mật khẩu!');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string, subField?: keyof MediaOption) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setError('File quá lớn! Vui lòng chọn file dưới 20MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (subField) {
        setEditForm(prev => ({
          ...prev,
          [field]: {
            ...(prev[field as keyof Question] as any || {}),
            [subField]: base64String
          }
        }));
      } else {
        setEditForm(prev => ({ ...prev, [field]: base64String }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExportExcel = () => {
    const data = questions.map(q => ({
      'ID': q.id,
      'Câu hỏi': q.content,
      'Link ảnh': q.imageUrl || '',
      'Link âm thanh': q.audioUrl || '',
      'Link video': q.videoUrl || '',
      'Option A Text': q.optionA.text,
      'Option A Ảnh': q.optionA.imageUrl || '',
      'Option A Audio': q.optionA.audioUrl || '',
      'Option B Text': q.optionB.text,
      'Option B Ảnh': q.optionB.imageUrl || '',
      'Option B Audio': q.optionB.audioUrl || '',
      'Đáp án (A/B)': q.correctOption,
      'Giải thích': q.explanation
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, "NghiengDauLuomKienThuc_Questions.xlsx");
  };

  const handleDownloadTemplate = () => {
    const template = [{
      'ID': '1',
      'Câu hỏi': 'Ví dụ: Năng lượng không tự nhiên sinh ra...',
      'Link ảnh': '',
      'Link âm thanh': '',
      'Link video': '',
      'Option A Text': 'Đúng',
      'Option A Ảnh': '',
      'Option A Audio': '',
      'Option B Text': 'Sai',
      'Option B Ảnh': '',
      'Option B Audio': '',
      'Đáp án (A/B)': 'A',
      'Giải thích': 'Đây là định luật bảo toàn năng lượng.'
    }];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "NghiengDauLuomKienThuc_Template.xlsx");
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
        id: row['ID']?.toString() || Date.now().toString() + index,
        content: row['Câu hỏi'] || '',
        imageUrl: row['Link ảnh'] || undefined,
        audioUrl: row['Link âm thanh'] || undefined,
        videoUrl: row['Link video'] || undefined,
        optionA: {
          text: row['Option A Text'] || 'Đúng',
          imageUrl: row['Option A Ảnh'] || undefined,
          audioUrl: row['Option A Audio'] || undefined
        },
        optionB: {
          text: row['Option B Text'] || 'Sai',
          imageUrl: row['Option B Ảnh'] || undefined,
          audioUrl: row['Option B Audio'] || undefined
        },
        correctOption: (row['Đáp án (A/B)'] || 'A') as 'A' | 'B',
        explanation: row['Giải thích'] || '',
        difficulty: 'Easy'
      }));

      setConfirmAction({
        message: `Bạn có muốn nhập ${imported.length} câu hỏi từ Excel?`,
        onConfirm: () => {
          const updated = [...questions, ...imported];
          setQuestions(updated);
          storage.saveQuestions(updated).then();
          setConfirmAction(null);
        }
      });
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // Reset input
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(questions, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'NghiengDauLuomKienThuc_Backup.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const imported = JSON.parse(evt.target?.result as string) as Question[];
        setConfirmAction({
          message: `Bạn có muốn khôi phục ${imported.length} câu hỏi từ bản sao lưu JSON (bao gồm cả media)?`,
          onConfirm: () => {
            setQuestions(imported);
            storage.saveQuestions(imported).then();
            setConfirmAction(null);
          }
        });
      } catch (err) {
        setError('File JSON không hợp lệ!');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleAdd = () => {
    const newQ: Question = {
      id: Date.now().toString(),
      content: 'Câu hỏi mới...',
      optionA: { text: 'Lựa chọn A' },
      optionB: { text: 'Lựa chọn B' },
      correctOption: 'A',
      explanation: 'Giải thích...',
      difficulty: 'Easy'
    };
    const updated = [...questions, newQ];
    setQuestions(updated);
    storage.saveQuestions(updated).then();
    setEditingId(newQ.id);
    setEditForm(newQ);
  };

  const handleSave = async () => {
    if (editingId) {
      const updated = questions.map(q => q.id === editingId ? { ...q, ...editForm } as Question : q);
      setQuestions(updated);
      await storage.saveQuestions(updated);
      setEditingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const updated = questions.filter(q => q.id !== id);
    setQuestions(updated);
    await storage.saveQuestions(updated);
    setDeletingId(null);
  };

  const handleDeleteAllQuestions = async () => {
    setConfirmAction({
      message: 'Bạn có chắc chắn muốn xóa TẤT CẢ các câu hỏi hiện có? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        setQuestions([]);
        await storage.saveQuestions([]);
        setConfirmAction(null);
      }
    });
  };

  const handleResetLeaderboard = async () => {
    setConfirmAction({
      message: 'Bạn có chắc muốn xóa toàn bộ bảng vinh danh?',
      onConfirm: async () => {
        await storage.clearLeaderboard();
        setConfirmAction(null);
      }
    });
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
            className={clsx(
              "w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all",
              error ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-gray-800"
            )}
            placeholder="Nhập mật khẩu..."
          />
          {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
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
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="max-w-6xl w-full bg-white/95 backdrop-blur-xl rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col h-[92vh] border-8 border-gray-900 ring-1 ring-white/20"
    >
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 text-white flex items-center justify-between shrink-0 shadow-lg relative z-20">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-2xl shadow-inner">
            <Settings className="w-8 h-8 text-orange-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">Hệ Thống Quản Trị</h2>
            <p className="text-xs text-white/50 font-bold">NGÂN HÀNG CÂU HỎI ĐA PHƯƠNG TIỆN</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1 bg-black/30 p-1 rounded-xl border border-white/10">
            <button onClick={handleDownloadTemplate} className="hover:bg-white/10 p-2 rounded-lg transition-all flex items-center gap-2 text-[10px] font-bold" title="Tải file mẫu Excel">
              <FileSpreadsheet className="w-4 h-4 text-green-400" /> Mẫu Excel
            </button>
            <label className="hover:bg-white/10 p-2 rounded-lg transition-all flex items-center gap-2 text-[10px] font-bold cursor-pointer" title="Nhập Excel">
              <Upload className="w-4 h-4 text-orange-400" /> Nhập Excel
              <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} className="hidden" />
            </label>
            <button onClick={handleExportExcel} className="hover:bg-white/10 p-2 rounded-lg transition-all flex items-center gap-2 text-[10px] font-bold" title="Xuất Excel">
              <Download className="w-4 h-4 text-blue-400" /> Xuất Excel
            </button>
          </div>

          <div className="flex gap-1 bg-black/30 p-1 rounded-xl border border-white/10">
            <button onClick={handleExportJSON} className="hover:bg-white/10 p-2 rounded-lg transition-all flex items-center gap-2 text-[10px] font-bold" title="Sao lưu JSON (Kèm media)">
              <HardDriveDownload className="w-4 h-4 text-purple-400" /> Backup
            </button>
            <label className="hover:bg-white/10 p-2 rounded-lg transition-all flex items-center gap-2 text-[10px] font-bold cursor-pointer" title="Khôi phục JSON">
              <HardDriveUpload className="w-4 h-4 text-pink-400" /> Restore
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
          </div>

          <button onClick={handleResetLeaderboard} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/50 px-3 py-2 rounded-xl text-[10px] font-black transition-all shadow-lg active:translate-y-1">
            RESET BẢNG ĐIỂM
          </button>
          
          <button onClick={handleDeleteAllQuestions} className="bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white border border-red-600/50 px-3 py-2 rounded-xl text-[10px] font-black transition-all shadow-lg active:translate-y-1">
            XÓA TẤT CẢ CÂU HỎI
          </button>
          
          <div className="w-[1px] h-10 bg-white/10 mx-2" />

          <button onClick={() => setIsLoggedIn(false)} className="bg-white/5 hover:bg-white/20 p-3 rounded-2xl transition-all border border-white/10">
            <LogOut className="w-5 h-5" />
          </button>
          <button onClick={onClose} className="bg-white/5 hover:bg-white/20 p-3 rounded-2xl transition-all border border-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-8 space-y-8 bg-gray-50/50">
        <div className="flex justify-between items-center bg-white/80 backdrop-blur-md p-6 rounded-[2rem] sticky top-0 z-10 shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white">
          <div>
            <h3 className="text-xl font-black text-gray-800">Kho Câu Hỏi</h3>
            <p className="text-sm text-gray-400 font-bold">Tổng số: {questions.length} câu hiện có</p>
          </div>
          <button onClick={handleAdd} className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-[0_8px_0_0_#15803d] transition-all active:shadow-none active:translate-y-2 uppercase tracking-wider text-sm">
            <Plus className="w-6 h-6" /> Thêm Câu Hỏi Mới
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {questions.map((q, index) => (
            <div 
              key={q.id} 
              className={clsx(
                "group relative border-2 border-gray-100 rounded-[2.5rem] p-6 transition-all bg-white",
                editingId === q.id ? "ring-4 ring-blue-500 ring-offset-4 border-transparent" : "hover:border-blue-200 hover:shadow-2xl hover:-translate-y-1"
              )}
            >
              {editingId === q.id ? (
                <div className="space-y-8">
                  {/* Edit Header */}
                  <div className="flex items-center gap-4 text-blue-600 font-black">
                    <Edit2 className="w-6 h-6" />
                    <span className="text-xl uppercase italic">Chỉnh sửa câu hỏi #{index + 1}</span>
                  </div>

                  <div className="bg-gray-50 p-8 rounded-[2rem] space-y-6 shadow-inner border-2 border-dashed border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                       <Type className="w-5 h-5 text-gray-400" />
                       <h4 className="font-black text-sm text-gray-500 uppercase">Nội dung câu hỏi</h4>
                    </div>
                    <textarea
                      className="w-full p-6 h-32 rounded-3xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-lg font-medium"
                      value={editForm.content}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      placeholder="Câu hỏi gì thế nhỉ?..."
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-3">
                        <label className="text-xs font-black text-gray-400 uppercase flex items-center gap-2"><ImageIcon className="w-4 h-4 text-blue-500"/> Hình ảnh câu hỏi</label>
                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'imageUrl')} className="text-xs w-full block bg-gray-50 p-2 rounded-lg cursor-pointer"/>
                        <p className="text-[10px] text-gray-400 truncate">{editForm.imageUrl ? '✅ Đã tải lên' : '❌ Chưa có'}</p>
                      </div>
                      <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-3">
                        <label className="text-xs font-black text-gray-400 uppercase flex items-center gap-2"><Music className="w-4 h-4 text-purple-500"/> Âm thanh câu hỏi</label>
                        <input type="file" accept="audio/*" onChange={(e) => handleFileUpload(e, 'audioUrl')} className="text-xs w-full block bg-gray-50 p-2 rounded-lg cursor-pointer"/>
                        <p className="text-[10px] text-gray-400 truncate">{editForm.audioUrl ? '✅ Đã tải lên' : '❌ Chưa có'}</p>
                      </div>
                      <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-3">
                        <label className="text-xs font-black text-gray-400 uppercase flex items-center gap-2"><Film className="w-4 h-4 text-pink-500"/> Video câu hỏi</label>
                        <input type="file" accept="video/*" onChange={(e) => handleFileUpload(e, 'videoUrl')} className="text-xs w-full block bg-gray-50 p-2 rounded-lg cursor-pointer"/>
                        <p className="text-[10px] text-gray-400 truncate">{editForm.videoUrl ? '✅ Đã tải lên' : '❌ Chưa có'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Option A Section */}
                    <div className="bg-green-50/50 p-8 rounded-[2.5rem] space-y-4 border-2 border-green-100 relative group/opt">
                      <div className="absolute -top-4 left-8 bg-green-500 text-white px-4 py-1 rounded-full text-xs font-black shadow-lg">LỰA CHỌN A</div>
                      <input
                        className="w-full p-4 rounded-2xl border-2 border-green-200 focus:border-green-500 focus:outline-none font-bold"
                        value={editForm.optionA?.text || ''}
                        onChange={(e) => setEditForm({ ...editForm, optionA: { ...editForm.optionA!, text: e.target.value } })}
                        placeholder="Văn bản cho lựa chọn A..."
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-green-600 uppercase">Ảnh A</label>
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'optionA', 'imageUrl')} className="text-[10px] w-full"/>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-green-600 uppercase">Audio A</label>
                          <input type="file" accept="audio/*" onChange={(e) => handleFileUpload(e, 'optionA', 'audioUrl')} className="text-[10px] w-full"/>
                        </div>
                      </div>
                    </div>

                    {/* Option B Section */}
                    <div className="bg-red-50/50 p-8 rounded-[2.5rem] space-y-4 border-2 border-red-100 relative group/opt">
                      <div className="absolute -top-4 left-8 bg-red-500 text-white px-4 py-1 rounded-full text-xs font-black shadow-lg">LỰA CHỌN B</div>
                      <input
                        className="w-full p-4 rounded-2xl border-2 border-red-200 focus:border-red-500 focus:outline-none font-bold"
                        value={editForm.optionB?.text || ''}
                        onChange={(e) => setEditForm({ ...editForm, optionB: { ...editForm.optionB!, text: e.target.value } })}
                        placeholder="Văn bản cho lựa chọn B..."
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-red-600 uppercase">Ảnh B</label>
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'optionB', 'imageUrl')} className="text-[10px] w-full"/>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-red-600 uppercase">Audio B</label>
                          <input type="file" accept="audio/*" onChange={(e) => handleFileUpload(e, 'optionB', 'audioUrl')} className="text-[10px] w-full"/>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2rem] border-2 border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-sm">
                    <div className="space-y-3">
                      <label className="text-sm font-black text-gray-400 uppercase">Đáp án chính xác</label>
                      <div className="flex gap-4">
                        {['A', 'B'].map(opt => (
                          <button
                            key={opt}
                            onClick={() => setEditForm({ ...editForm, correctOption: opt as 'A' | 'B' })}
                            className={clsx(
                              "flex-grow py-4 rounded-2xl font-black transition-all border-2",
                              editForm.correctOption === opt 
                                ? "bg-blue-600 text-white border-blue-600 shadow-lg scale-105" 
                                : "bg-gray-50 text-gray-400 border-gray-200 hover:border-blue-200"
                            )}
                          >
                            Lựa chọn {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-black text-gray-400 uppercase tracking-wider">Giải thích đáp án</label>
                      <textarea
                        className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                        value={editForm.explanation}
                        onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                        placeholder="Đây là giải thích hiện ra sau khi trả lời..."
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 p-2">
                    <button onClick={handleSave} className="flex-grow bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-3xl font-black flex items-center justify-center gap-3 shadow-[0_8px_0_0_#1d4ed8] transition-all active:shadow-none active:translate-y-2 uppercase tracking-widest text-lg">
                      <Save className="w-6 h-6" /> LƯU CÂU HỎI NGAY
                    </button>
                    <button onClick={() => setEditingId(null)} className="px-12 bg-white text-gray-400 hover:text-gray-600 py-5 rounded-3xl font-black border-2 border-gray-100 hover:border-gray-300 transition-all">
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center gap-6">
                   <div className="flex items-center gap-6 flex-grow min-w-0">
                      <div className="w-16 h-16 bg-gray-900 rounded-3xl flex items-center justify-center text-white font-black text-2xl shrink-0 shadow-lg">
                        {index + 1}
                      </div>

                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={clsx(
                            "text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-sm",
                            q.correctOption === 'A' ? "bg-green-500 text-white" : "bg-red-500 text-white"
                          )}>
                            ĐÁP ÁN: {q.correctOption}
                          </span>
                          <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                            {q.imageUrl && <ImageIcon className="w-3 h-3 text-blue-500" title="Có ảnh"/>}
                            {q.audioUrl && <Music className="w-3 h-3 text-purple-500" title="Có thanh"/>}
                            {q.videoUrl && <Film className="w-3 h-3 text-pink-500" title="Có video"/>}
                          </div>
                        </div>
                        <h4 className="text-xl font-black text-gray-800 truncate mb-1">{q.content}</h4>
                        <div className="flex gap-4 text-xs font-bold text-gray-400">
                           <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-400"/> A: {q.optionA.text}</span>
                           <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400"/> B: {q.optionB.text}</span>
                        </div>
                      </div>
                   </div>

                   <div className="flex gap-2">
                      <button 
                         onClick={() => { setEditingId(q.id); setEditForm(q); }} 
                         className="p-4 bg-blue-50 text-blue-600 rounded-3xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95 border-2 border-blue-100 hover:border-blue-600"
                         title="Chỉnh sửa câu hỏi"
                      >
                        <Edit2 className="w-6 h-6" />
                      </button>
                      
                      {deletingId === q.id ? (
                        <div className="flex items-center gap-1 bg-red-50 p-1 rounded-3xl border-2 border-red-100">
                          <button 
                            onClick={() => handleDelete(q.id)}
                            className="px-4 py-3 bg-red-500 text-white rounded-2xl text-[10px] font-black hover:bg-red-600 active:scale-90 transition-all uppercase"
                          >
                            Xóa
                          </button>
                          <button 
                            onClick={() => setDeletingId(null)}
                            className="px-4 py-3 bg-white text-gray-400 rounded-2xl text-[10px] font-black hover:text-gray-600 active:scale-90 transition-all uppercase"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <button 
                           onClick={() => setDeletingId(q.id)} 
                           className="p-4 bg-red-50 text-red-500 rounded-3xl hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95 border-2 border-red-100 hover:border-red-600"
                           title="Xóa câu hỏi"
                        >
                          <Trash2 className="w-6 h-6" />
                        </button>
                      )}
                   </div>
                </div>
              )}
            </div>
          ))}

          {questions.length === 0 && (
            <div className="text-center py-24 bg-white rounded-[3rem] border-4 border-dashed border-gray-100">
               <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Type className="w-10 h-10 text-gray-200" />
               </div>
               <h4 className="text-gray-400 font-black text-xl">CHƯA CÓ CÂU HỎI NÀO</h4>
               <p className="text-gray-300 font-bold mb-6">Hãy thêm câu hỏi đầu tiên ngay bây giờ!</p>
               <button onClick={handleAdd} className="bg-blue-500 text-white px-8 py-3 rounded-2xl font-black shadow-lg">Thêm ngay</button>
            </div>
          )}
        </div>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border-4 border-gray-900"
          >
            <h4 className="text-xl font-black text-gray-800 mb-4 text-center">{confirmAction.message}</h4>
            <div className="flex gap-4">
              <button 
                onClick={confirmAction.onConfirm}
                className="flex-grow bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 transition-all uppercase tracking-widest shadow-[0_4px_0_0_#1d4ed8]"
              >
                Xác nhận
              </button>
              <button 
                onClick={() => setConfirmAction(null)}
                className="flex-grow bg-gray-100 text-gray-400 py-4 rounded-2xl font-black hover:bg-gray-200 transition-all uppercase tracking-widest"
              >
                Hủy
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
