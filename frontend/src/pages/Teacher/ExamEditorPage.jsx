import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { examAPI, classAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function ExamEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState([]);

  // Exam form state
  const [exam, setExam] = useState({
    title: '', class: '', duration: 45, totalPoints: 10, passingScore: 5,
    openAt: '', closeAt: '', isPublished: false,
    questions: []
  });

  // Question modal state
  const [showQModal, setShowQModal] = useState(false);
  const [currentQ, setCurrentQ] = useState(null);
  const [savingQ, setSavingQ] = useState(false);
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    document.title = isEditMode ? 'Sửa bài kiểm tra' : 'Tạo bài kiểm tra';
    
    classAPI.getAll().then(res => setClasses(res.data || []));

    if (isEditMode) {
      examAPI.getOne(id).then(res => {
        const data = res.data;
        setExam({
          ...data,
          class: data.class?._id || data.class,
          openAt: new Date(data.openAt).toISOString().slice(0, 16),
          closeAt: new Date(data.closeAt).toISOString().slice(0, 16),
        });
      }).catch(() => {
        toast.error('Không tìm thấy bài kiểm tra');
        navigate('/teacher/exams');
      }).finally(() => setLoading(false));
    }
  }, [id, navigate, isEditMode]);

  const handleSaveExam = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditMode) {
        await examAPI.update(id, exam);
        toast.success('Cập nhật thành công');
      } else {
        const res = await examAPI.create(exam);
        toast.success('Tạo bài kiểm tra thành công');
        navigate(`/teacher/exams/${res.data._id}/edit`);
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi lưu bài kiểm tra');
    } finally {
      setSaving(false);
    }
  };

  const openQuestionModal = (q = null) => {
    if (q) {
      setCurrentQ(q);
    } else {
      setCurrentQ({
        content: '', type: 'multiple-choice', points: 1, explanation: '',
        options: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ]
      });
    }
    setShowQModal(true);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    // Validate options
    if (currentQ.type === 'multiple-choice') {
      const hasCorrect = currentQ.options.some(o => o.isCorrect);
      if (!hasCorrect) return toast.error('Vui lòng chọn ít nhất 1 đáp án đúng');
    }

    setSavingQ(true);
    try {
      if (currentQ._id) {
        await examAPI.updateQuestion(id, currentQ._id, currentQ);
        toast.success('Đã cập nhật câu hỏi');
      } else {
        await examAPI.addQuestion(id, currentQ);
        toast.success('Đã thêm câu hỏi');
      }
      
      // Refresh exam data
      const res = await examAPI.getOne(id);
      setExam(prev => ({ ...prev, questions: res.data.questions }));
      setShowQModal(false);
    } catch (err) {
      toast.error(err.message || 'Lỗi lưu câu hỏi');
    } finally {
      setSavingQ(false);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;
    try {
      await examAPI.deleteQuestion(id, qId);
      setExam(prev => ({
        ...prev,
        questions: prev.questions.filter(q => q._id !== qId)
      }));
      toast.success('Đã xóa câu hỏi');
    } catch (err) {
      toast.error('Lỗi xóa câu hỏi');
    }
  };

  const handleExtractFromFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
      return toast.error('Chỉ hỗ trợ file .pdf hoặc .docx');
    }

    setExtracting(true);
    const loadingToast = toast.loading('Hệ thống đang đọc và phân tích file... Có thể mất tới 1 phút.');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await examAPI.extractFromFile(id, formData);
      toast.success(res.message || 'Trích xuất thành công!', { id: loadingToast });
      
      // Refresh exam data
      const updatedExam = await examAPI.getOne(id);
      setExam(prev => ({ ...prev, questions: updatedExam.data.questions }));
    } catch (err) {
      toast.error(err.message || 'Lỗi khi phân tích file', { id: loadingToast });
    } finally {
      setExtracting(false);
      e.target.value = null; // reset file input
    }
  };

  if (loading) return <div className="text-center py-20"><div className="loading-spinner"></div></div>;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/teacher/exams" className="btn btn-secondary px-3">←</Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{isEditMode ? 'Sửa bài kiểm tra' : 'Tạo bài kiểm tra mới'}</h1>
        </div>
      </div>

      <div className="card mb-8">
        <h2 className="font-bold text-slate-700 text-lg mb-4 border-b pb-2">Thông tin chung</h2>
        <form onSubmit={handleSaveExam}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group col-span-2">
              <label className="form-label">Tên bài kiểm tra *</label>
              <input required className="form-input" value={exam.title} onChange={e => setExam({...exam, title: e.target.value})} placeholder="VD: Kiểm tra 15 phút Toán đại số" />
            </div>
            
            <div className="form-group">
              <label className="form-label">Chọn lớp học *</label>
              <select required className="form-input" value={exam.class} onChange={e => setExam({...exam, class: e.target.value})}>
                <option value="">-- Chọn lớp --</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Thời gian làm bài (phút) *</label>
              <input type="number" min="1" required className="form-input" value={exam.duration} onChange={e => setExam({...exam, duration: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label">Thời gian bắt đầu (Mở đề) *</label>
              <input type="datetime-local" required className="form-input" value={exam.openAt} onChange={e => setExam({...exam, openAt: e.target.value})} />
            </div>
            
            <div className="form-group">
              <label className="form-label">Thời gian kết thúc (Đóng đề) *</label>
              <input type="datetime-local" required className="form-input" value={exam.closeAt} onChange={e => setExam({...exam, closeAt: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label">Tổng điểm *</label>
              <input type="number" required className="form-input" value={exam.totalPoints} onChange={e => setExam({...exam, totalPoints: e.target.value})} />
            </div>
            
            <div className="form-group">
              <label className="form-label">Điểm đạt *</label>
              <input type="number" required className="form-input" value={exam.passingScore} onChange={e => setExam({...exam, passingScore: e.target.value})} />
            </div>

            <div className="form-group col-span-2 flex items-center gap-2">
              <input type="checkbox" id="published" checked={exam.isPublished} onChange={e => setExam({...exam, isPublished: e.target.checked})} className="w-5 h-5 text-primary-600 rounded" />
              <label htmlFor="published" className="font-medium text-slate-700 cursor-pointer">Xuất bản bài kiểm tra (Học sinh có thể thấy)</label>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button type="submit" disabled={saving} className="btn btn-primary px-8">
              {saving ? 'Đang lưu...' : 'Lưu thông tin'}
            </button>
          </div>
        </form>
      </div>

      {isEditMode && (
        <div className="card">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="font-bold text-slate-700 text-lg">Câu hỏi ({exam.questions?.length || 0})</h2>
            <div className="flex gap-2">
              <div>
                <input 
                  type="file" 
                  id="file-upload" 
                  className="hidden" 
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleExtractFromFile}
                  disabled={extracting}
                />
                <label htmlFor="file-upload" className={`btn btn-secondary btn-sm cursor-pointer ${extracting ? 'opacity-50 pointer-events-none' : ''}`}>
                  {extracting ? '⏳ Đang xử lý...' : '📄 Nhập từ File'}
                </label>
              </div>
              <button onClick={() => openQuestionModal()} className="btn btn-primary btn-sm" disabled={extracting}>+ Thêm câu hỏi</button>
            </div>
          </div>

          {exam.questions?.length === 0 ? (
            <div className="text-center py-10 text-slate-500">Chưa có câu hỏi nào.</div>
          ) : (
            <div className="space-y-4">
              {exam.questions?.map((q, idx) => (
                <div key={q._id} className="p-4 border rounded-xl hover:border-primary-300 transition-colors">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <p className="font-bold text-slate-800 flex-1"><span className="text-primary-600 mr-2">Câu {idx + 1}:</span> {q.content}</p>
                    <div className="flex gap-2">
                      <button onClick={() => openQuestionModal(q)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg text-sm">Sửa</button>
                      <button onClick={() => handleDeleteQuestion(q._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg text-sm">Xóa</button>
                    </div>
                  </div>
                  {q.type === 'multiple-choice' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                      {q.options.map((opt, i) => (
                        <div key={i} className={`p-2 rounded-lg text-sm border ${opt.isCorrect ? 'border-green-500 bg-green-50 text-green-800 font-medium' : 'border-slate-200 text-slate-600 bg-slate-50'}`}>
                          {String.fromCharCode(65 + i)}. {opt.text}
                          {opt.isCorrect && <span className="float-right">✅</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 text-xs text-slate-400 flex gap-4">
                    <span>Điểm: {q.points}</span>
                    <span>Loại: {q.type === 'multiple-choice' ? 'Trắc nghiệm' : 'Tự luận'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Question Modal */}
      {showQModal && currentQ && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl my-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">{currentQ._id ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}</h3>
                <button onClick={() => setShowQModal(false)} className="text-slate-400 hover:text-slate-600 p-2 text-xl">&times;</button>
              </div>
              <form onSubmit={handleSaveQuestion}>
                <div className="form-group mb-4">
                  <label className="form-label">Nội dung câu hỏi *</label>
                  <textarea required className="form-input min-h-[100px]" value={currentQ.content} onChange={e => setCurrentQ({...currentQ, content: e.target.value})} placeholder="Nhập nội dung..." />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="form-group mb-0">
                    <label className="form-label">Loại câu hỏi</label>
                    <select className="form-input" value={currentQ.type} onChange={e => setCurrentQ({...currentQ, type: e.target.value})}>
                      <option value="multiple-choice">Trắc nghiệm</option>
                      <option value="essay">Tự luận</option>
                    </select>
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label">Điểm số</label>
                    <input type="number" min="0" step="0.5" required className="form-input" value={currentQ.points} onChange={e => setCurrentQ({...currentQ, points: Number(e.target.value)})} />
                  </div>
                </div>

                {currentQ.type === 'multiple-choice' && (
                  <div className="mb-4">
                    <label className="form-label">Các đáp án (Tích chọn đáp án đúng)</label>
                    <div className="space-y-3">
                      {currentQ.options.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <input 
                            type="radio" 
                            name="correctAnswer" 
                            checked={opt.isCorrect} 
                            onChange={() => {
                              const newOpts = currentQ.options.map((o, i) => ({ ...o, isCorrect: i === idx }));
                              setCurrentQ({...currentQ, options: newOpts});
                            }}
                            className="w-5 h-5 text-green-500 cursor-pointer"
                          />
                          <span className="font-bold text-slate-500 w-6 text-center">{String.fromCharCode(65 + idx)}</span>
                          <input 
                            type="text" 
                            required 
                            className="form-input flex-1 py-2" 
                            value={opt.text} 
                            onChange={e => {
                              const newOpts = [...currentQ.options];
                              newOpts[idx].text = e.target.value;
                              setCurrentQ({...currentQ, options: newOpts});
                            }}
                            placeholder={`Nhập đáp án ${String.fromCharCode(65 + idx)}`} 
                          />
                          {currentQ.options.length > 2 && (
                            <button type="button" onClick={() => {
                              const newOpts = currentQ.options.filter((_, i) => i !== idx);
                              setCurrentQ({...currentQ, options: newOpts});
                            }} className="text-red-400 hover:text-red-600 p-2">✕</button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => {
                      setCurrentQ({...currentQ, options: [...currentQ.options, { text: '', isCorrect: false }]});
                    }} className="text-primary-600 text-sm font-medium mt-3 hover:underline">+ Thêm đáp án</button>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Giải thích (Tùy chọn)</label>
                  <textarea className="form-input" rows="2" value={currentQ.explanation} onChange={e => setCurrentQ({...currentQ, explanation: e.target.value})} placeholder="Sẽ hiển thị cho học sinh sau khi làm bài xong..." />
                </div>

                <div className="mt-8 flex gap-3">
                  <button type="submit" disabled={savingQ} className="btn btn-primary flex-1">
                    {savingQ ? 'Đang lưu...' : 'Lưu câu hỏi'}
                  </button>
                  <button type="button" onClick={() => setShowQModal(false)} className="btn btn-secondary flex-1">
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
