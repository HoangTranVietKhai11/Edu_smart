import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function ExamTakePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [startedAt] = useState(new Date().toISOString());
  const [cheatWarnings, setCheatWarnings] = useState(0);

  const timerRef = useRef(null);
  const answersRef = useRef(answers);

  // Sync answers to ref for auto-submit
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    document.title = 'Đang làm bài thi...';
    
    // Warn before leave
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Anti-cheat: Tab visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setCheatWarnings(prev => {
          const newCount = prev + 1;
          if (newCount === 1 || newCount === 2) {
            toast.error(`CẢNH BÁO GIAN LẬN (${newCount}/2)\nBạn đã rời khỏi trang làm bài. Nếu tiếp tục vi phạm, bài thi sẽ bị thu tự động.`, {
              duration: 5000,
              icon: '🚨',
              style: { border: '2px solid red', padding: '16px', color: '#7f1d1d', fontWeight: 'bold' },
            });
          } else if (newCount >= 3) {
            toast.error('THU BÀI TỰ ĐỘNG\nBạn đã vi phạm quy chế thi quá 2 lần!', {
              duration: 8000,
              icon: '🛑',
            });
            // Auto submit with cheat flag
            autoSubmitCheat();
          }
          return newCount;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    fetchExam();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id]);

  const fetchExam = async () => {
    try {
      const res = await examAPI.getOne(id);
      
      // Basic validations
      const now = new Date();
      if (now < new Date(res.data.openAt)) {
        toast.error('Bài kiểm tra chưa mở.');
        return navigate('/student/exams');
      }
      if (now > new Date(res.data.closeAt)) {
        toast.error('Bài kiểm tra đã đóng.');
        return navigate('/student/exams');
      }

      setExam(res.data);
      setTimeLeft(res.data.duration * 60);

      // Start timer
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            autoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error) {
      toast.error('Không thể tải bài kiểm tra.');
      navigate('/student/exams');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, optionId) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const autoSubmitCheat = () => {
    handleSubmit(null, true, true);
  };

  const autoSubmit = () => {
    toast('Đã hết thời gian! Hệ thống đang nộp bài...', { icon: '⏳' });
    handleSubmit(null, true, false);
  };

  const handleSubmit = async (e, isAuto = false, isCheated = false) => {
    if (e) e.preventDefault();
    if (!isAuto && !window.confirm('Bạn có chắc chắn muốn nộp bài? Bạn không thể thay đổi sau khi nộp.')) return;

    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const currentAnswers = answersRef.current;
    const formattedAnswers = Object.entries(currentAnswers).map(([qId, optId]) => ({
      questionId: qId,
      selectedOption: optId
    }));

    // Cập nhật số lần warning từ ref/state. Tuy nhiên trong closure có thể cheatWarnings cũ.
    // Lấy số lần từ DOM hoặc ref nếu cần. Dùng setter function để lấy state mới nhất.
    setCheatWarnings(currentWarnings => {
      examAPI.submit(id, { 
        answers: formattedAnswers, 
        startedAt,
        cheatWarnings: isCheated ? 3 : currentWarnings,
        isCheated: isCheated || currentWarnings >= 3
      })
      .then(() => {
        toast.success('Nộp bài thành công!');
        navigate(`/student/exams/${id}/result`);
      })
      .catch(error => {
        toast.error(error.response?.data?.message || 'Lỗi khi nộp bài. Vui lòng thử lại.');
        setSubmitting(false);
      });
      return currentWarnings;
    });
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) return <div className="flex justify-center py-20"><div className="loading-spinner"></div></div>;
  if (!exam) return null;

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = exam.questions?.length || 0;

  return (
    <div className="max-w-6xl mx-auto pb-20 select-none">
      {/* Cảnh báo quy chế thi */}
      <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 flex items-start gap-3 border border-red-200 shadow-sm">
        <span className="text-xl">⚠️</span>
        <div>
          <h4 className="font-bold">QUY CHẾ THI NGHIÊM NGẶT</h4>
          <p className="text-sm mt-1">Bạn <b>không được phép</b> chuyển sang tab khác hoặc thu nhỏ cửa sổ trong quá trình làm bài. Nếu vi phạm quá <b>2 lần</b>, hệ thống sẽ tự động thu bài và đánh dấu <b>Gian lận</b> để gửi cho Giáo viên.</p>
        </div>
      </div>
      {/* Sticky Header */}
      <div className="sticky top-[73px] z-40 bg-white border-b border-slate-200 py-3 shadow-sm mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">{exam.title}</h1>
            <p className="text-sm text-slate-500">
              Đã làm: <span className="font-medium text-primary-600">{answeredCount}/{totalQuestions}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-lg font-mono text-xl font-bold ${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
              ⏱️ {formatTime(timeLeft)}
            </div>
            <button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Đang nộp...' : 'Nộp Bài'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Question List */}
        <div className="flex-1 space-y-6">
          {exam.questions?.map((q, index) => (
            <div key={q._id} id={`q-${index}`} className="card border border-slate-200">
              <div className="flex gap-4 mb-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0">
                  {index + 1}
                </div>
                <div className="text-slate-800 font-medium whitespace-pre-wrap mt-1">
                  {q.content}
                </div>
              </div>

              {q.type === 'multiple-choice' ? (
                <div className="space-y-3 pl-12">
                  {q.options.map(opt => (
                    <label 
                      key={opt._id} 
                      className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${
                        answers[q._id] === opt._id 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name={`q-${q._id}`} 
                        value={opt._id}
                        checked={answers[q._id] === opt._id}
                        onChange={() => handleSelectOption(q._id, opt._id)}
                        className="mt-1 w-4 h-4 text-primary-600 border-slate-300 focus:ring-primary-500"
                      />
                      <span className="ml-3 text-slate-700">{opt.text}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="pl-12">
                  <textarea 
                    className="input h-32" 
                    placeholder="Nhập câu trả lời của bạn..."
                    disabled
                  ></textarea>
                  <p className="text-xs text-slate-400 mt-1">Lưu ý: Hệ thống hiện chỉ chấm điểm tự động với trắc nghiệm.</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Question Navigator */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="card sticky top-[160px]">
            <h3 className="font-semibold text-slate-700 mb-4 border-b pb-2">Danh sách câu hỏi</h3>
            <div className="grid grid-cols-5 gap-2">
              {exam.questions?.map((q, index) => {
                const isAnswered = !!answers[q._id];
                return (
                  <button 
                    key={q._id}
                    onClick={() => document.getElementById(`q-${index}`).scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    className={`w-10 h-10 rounded text-sm font-medium transition-colors ${
                      isAnswered 
                        ? 'bg-primary-500 text-white border border-primary-600' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-primary-300'
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
