import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { examAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function ExamResultPage() {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Kết quả bài thi';
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [examRes, resultsRes] = await Promise.all([
        examAPI.getOne(id),
        examAPI.getResults(id) // As student, this returns their own results
      ]);
      
      setExam(examRes.data);
      if (resultsRes.data && resultsRes.data.length > 0) {
        // Get the latest attempt
        setResult(resultsRes.data[0]);
      }
    } catch (error) {
      toast.error('Không thể tải kết quả bài kiểm tra.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="loading-spinner"></div></div>;
  
  if (!exam || !result) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl mb-4">📭</h2>
        <p className="text-slate-500">Không tìm thấy kết quả hoặc bạn chưa làm bài này.</p>
        <Link to="/student/exams" className="btn btn-primary mt-4">Về danh sách bài thi</Link>
      </div>
    );
  }

  // Create a map for quick answer lookup
  const answerMap = {};
  result.answers.forEach(a => {
    answerMap[a.question] = a;
  });

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/student/exams" className="btn btn-secondary btn-sm">← Danh sách</Link>
        <h1 className="text-2xl font-bold text-slate-800">Kết quả thi</h1>
      </div>

      {/* Result Summary */}
      <div className="card text-center relative overflow-hidden mb-8 border-t-4 border-t-primary-500">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <span className="text-8xl">🎯</span>
        </div>
        
        <h2 className="text-xl font-bold text-slate-800 mb-2">{exam.title}</h2>
        <p className="text-slate-500 mb-6">{exam.class?.name}</p>

        <div className="flex flex-wrap justify-center gap-8 md:gap-16">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Điểm số</p>
            <p className="text-4xl font-black text-primary-600">{result.totalScore}<span className="text-xl text-slate-400 font-bold">/{result.maxScore}</span></p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Tỷ lệ đúng</p>
            <p className="text-4xl font-black text-slate-800">{result.percentage}%</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Thời gian làm bài</p>
            <p className="text-4xl font-black text-slate-800">{Math.floor(result.timeSpent / 60)}<span className="text-xl font-medium">p</span> {result.timeSpent % 60}<span className="text-xl font-medium">s</span></p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-50 border border-slate-100">
            <span className="font-medium text-slate-600">Đánh giá:</span>
            {result.isPassed ? (
              <span className="font-bold text-green-600 flex items-center gap-1">✅ ĐẠT YÊU CẦU</span>
            ) : (
              <span className="font-bold text-red-600 flex items-center gap-1">❌ CHƯA ĐẠT</span>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Review */}
      <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Chi tiết bài làm</h3>
      
      <div className="space-y-6">
        {exam.questions?.map((q, index) => {
          const studentAnswer = answerMap[q._id];
          const isCorrect = studentAnswer?.isCorrect;
          
          return (
            <div key={q._id} className={`card border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <div className="flex gap-4 mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {index + 1}
                </div>
                <div className="text-slate-800 font-medium whitespace-pre-wrap mt-1">
                  {q.content}
                </div>
              </div>

              {q.type === 'multiple-choice' && (
                <div className="space-y-2 pl-12 mb-4">
                  {q.options.map(opt => {
                    // Cần lấy đáp án đúng từ Backend (khi nộp bài mới thấy)
                    // Hiện tại getExam đã filter correctAnswers cho student
                    // Nhưng ở trang result, cần API trả về full chi tiết
                    const isSelected = studentAnswer?.selectedOption === opt._id;
                    // Tạm thời hiển thị màu xanh cho đáp án đúng dựa vào so khớp với kết quả (nếu Backend trả về)
                    // ...
                    return (
                      <div 
                        key={opt._id} 
                        className={`flex items-start p-3 rounded-lg border ${
                          isSelected 
                            ? isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50' 
                            : 'border-slate-100 bg-slate-50'
                        }`}
                      >
                        <span className="ml-2 text-slate-700">
                          {opt.text} 
                          {isSelected && isCorrect && <span className="ml-2 text-green-600 font-bold">✓ Đáp án của bạn (Đúng)</span>}
                          {isSelected && !isCorrect && <span className="ml-2 text-red-600 font-bold">✗ Đáp án của bạn (Sai)</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {q.explanation && (
                <div className="pl-12 mt-4">
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm">
                    <p className="font-semibold text-blue-800 mb-1">💡 Giải thích / Lời giải:</p>
                    <p className="text-blue-900 whitespace-pre-wrap">{q.explanation}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
