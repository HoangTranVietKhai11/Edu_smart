import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { aiAPI } from '../../services/api';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

export default function AIImagePage() {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    const f = acceptedFiles[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleAnalyze = async () => {
    if (!file) { toast.error('Vui lòng chọn ảnh trước!'); return; }
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      if (question) formData.append('question', question);
      const res = await aiAPI.analyzeImage(formData);
      setResult(res.data);
    } catch (err) {
      toast.error(err.message || 'Không thể phân tích ảnh. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setQuestion('');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">📸 Hỏi Bài Tập Qua Ảnh</h1>
        <p className="text-slate-500">Chụp ảnh bài tập và AI sẽ hướng dẫn bạn cách giải, không đưa đáp án trực tiếp.</p>
      </div>

      {/* Upload zone */}
      <div className="card mb-6">
        {!preview ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${isDragActive ? 'border-primary-400 bg-primary-50' : 'border-slate-300 hover:border-primary-400 hover:bg-slate-50'}`}
          >
            <input {...getInputProps()} id="image-upload-input" />
            <div className="text-5xl mb-4">📷</div>
            <p className="text-slate-700 font-medium text-lg mb-2">
              {isDragActive ? 'Thả ảnh vào đây...' : 'Kéo thả ảnh bài tập vào đây'}
            </p>
            <p className="text-slate-400 text-sm">hoặc click để chọn ảnh</p>
            <p className="text-slate-400 text-xs mt-2">Hỗ trợ: JPG, PNG, GIF, WEBP • Tối đa 10MB</p>

            <div className="flex justify-center gap-4 mt-6">
              {[['📐', 'Toán học'], ['⚗️', 'Hóa học'], ['⚡', 'Vật lý'], ['🔤', 'Anh văn']].map(([icon, label]) => (
                <div key={label} className="flex items-center gap-1 text-xs text-slate-400">
                  <span>{icon}</span><span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="relative">
              <img src={preview} alt="Preview" className="w-full max-h-80 object-contain rounded-xl border border-slate-200" />
              <button
                onClick={handleReset}
                className="absolute top-3 right-3 bg-white rounded-full p-1.5 shadow-md hover:bg-red-50 text-slate-500 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-slate-500 mt-2 text-center">📎 {file?.name}</p>
          </div>
        )}
      </div>

      {/* Additional question */}
      <div className="card mb-6">
        <label className="form-label">💬 Câu hỏi thêm (không bắt buộc)</label>
        <input
          id="image-question"
          type="text"
          className="form-input"
          placeholder="VD: Em không hiểu bước tính đạo hàm..."
          value={question}
          onChange={e => setQuestion(e.target.value)}
        />
        <p className="text-xs text-slate-400 mt-1">Cho AI biết bạn đang bị vướng ở đâu để được hỗ trợ chính xác hơn</p>
      </div>

      <button
        id="analyze-btn"
        onClick={handleAnalyze}
        disabled={!file || loading}
        className="btn btn-primary w-full btn-lg mb-6"
      >
        {loading ? (
          <span className="flex items-center gap-2 justify-center">
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Đang phân tích...
          </span>
        ) : '🔍 Phân tích bài tập'}
      </button>

      {/* Result */}
      {result && (
        <div className="space-y-4 animate-fade-in">
          {/* OCR Result */}
          <div className="card border-l-4 border-blue-400">
            <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span>🔤</span> Nội dung nhận diện được
              {result.subject_hint !== 'không xác định' && (
                <span className="badge badge-blue ml-2">{result.subject_hint}</span>
              )}
            </h3>
            <div className="bg-slate-50 rounded-xl p-4 font-mono text-sm text-slate-700 whitespace-pre-wrap">
              {result.extracted_text || 'Không nhận diện được nội dung rõ ràng.'}
            </div>
          </div>

          {/* AI Guidance */}
          <div className="card border-l-4 border-emerald-400">
            <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span>🤖</span> Hướng dẫn từ AI
            </h3>
            <div className="prose prose-sm max-w-none text-slate-700">
              <ReactMarkdown>{result.guidance}</ReactMarkdown>
            </div>
            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-amber-700 text-xs">
                ⚠️ AI chỉ hướng dẫn phương pháp tiếp cận, không đưa ra đáp án cuối cùng.
                Hãy tự suy nghĩ và làm theo gợi ý!
              </p>
            </div>
          </div>

          {/* Ask followup */}
          <div className="card text-center">
            <p className="text-slate-600 mb-3">Vẫn chưa hiểu? Hãy thử chat trực tiếp với AI!</p>
            <a href="/student/ai-chat" className="btn btn-primary">💬 Mở AI Chat</a>
          </div>
        </div>
      )}
    </div>
  );
}
