import { useState, useEffect } from 'react';
import { attendanceAPI } from '../../services/api';

export default function MissedLessonsPage() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Bài Học Đã Nghỉ - EduSmart';
    attendanceAPI.getMissedLessons()
      .then(r => setLessons(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const FILE_ICONS = { pdf: '📄', docx: '📝', pptx: '📊', image: '🖼️', video: '🎬', other: '📎' };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">📖 Bài Học Đã Nghỉ</h1>
        <p className="text-slate-500 text-sm mt-1">Xem lại tài liệu và nội dung của những buổi học bạn đã vắng mặt</p>
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-40" />)}</div>
      ) : lessons.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">Tuyệt vời!</h3>
          <p className="text-slate-400">Bạn không có buổi học nào bị nghỉ. Hãy tiếp tục duy trì nhé!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <p className="text-amber-700 text-sm">
              Bạn có <strong>{lessons.length}</strong> buổi học đã nghỉ. Hãy xem lại tài liệu để không bỏ lỡ kiến thức!
            </p>
          </div>

          {lessons.map(item => (
            <div key={item.attendance} className="card animate-fade-in border-l-4 border-amber-400">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{item.lesson?.title}</h3>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="badge badge-red">Vắng mặt</span>
                    <span className="text-sm text-slate-500">📅 {new Date(item.date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <span className="text-sm text-slate-500">🏫 {item.class?.name} - {item.class?.subject}</span>
                  </div>
                </div>
              </div>

              {item.lesson?.content && (
                <div className="bg-slate-50 rounded-xl p-4 mb-4">
                  <h4 className="font-semibold text-slate-700 text-sm mb-2">📋 Nội dung buổi học:</h4>
                  <p className="text-slate-600 text-sm">{item.lesson.content}</p>
                </div>
              )}

              {item.lesson?.videoUrl && (
                <div className="mb-4">
                  <h4 className="font-semibold text-slate-700 text-sm mb-2">🎬 Video bài giảng:</h4>
                  <a href={item.lesson.videoUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600 hover:bg-red-100 transition-colors text-sm">
                    <span>▶️</span> Xem video bài giảng
                  </a>
                </div>
              )}

              {item.lesson?.documents?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-700 text-sm mb-3">📚 Tài liệu buổi học:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {item.lesson.documents.map(doc => (
                      <a
                        key={doc._id}
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all group"
                      >
                        <span className="text-2xl">{FILE_ICONS[doc.fileType] || '📎'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate group-hover:text-primary-700">{doc.title}</p>
                          <p className="text-xs text-slate-400 uppercase">{doc.fileType}</p>
                        </div>
                        <span className="text-slate-300 group-hover:text-primary-500">↓</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {(!item.lesson?.documents || item.lesson.documents.length === 0) && !item.lesson?.videoUrl && (
                <p className="text-slate-400 text-sm italic">Giáo viên chưa tải lên tài liệu cho buổi học này.</p>
              )}

              {/* AI Help */}
              <div className="mt-4 p-3 bg-blue-50 rounded-xl flex items-center gap-3">
                <span className="text-xl">🤖</span>
                <p className="text-blue-700 text-sm flex-1">Chưa hiểu nội dung? AI có thể giải thích cho bạn!</p>
                <a href="/student/ai-chat" className="btn btn-primary btn-sm">Hỏi AI</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
