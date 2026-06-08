import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, announcementAPI, documentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const ANNOUNCEMENT_ICONS = {
  urgent: '🚨', exam: '📝', schedule: '📅', holiday: '🎉', general: '📢', result: '🏆',
};
const ANNOUNCEMENT_LABELS = {
  urgent: 'Khẩn', exam: 'Kiểm tra', schedule: 'Lịch học', holiday: 'Nghỉ học', general: 'Thông báo', result: 'Kết quả',
};

const FILE_ICONS = { pdf: '📄', docx: '📝', pptx: '📊', image: '🖼️', video: '🎬', other: '📎' };

export default function HomePage() {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'EduSmart AI - Hỗ Trợ Giảng Dạy Thông Minh';
    const fetchAll = async () => {
      try {
        const [tRes, aRes, dRes] = await Promise.allSettled([
          dashboardAPI.getTeacherProfile(),
          announcementAPI.getAll({ limit: 5 }),
          documentAPI.getAll({ limit: 6 }),
        ]);
        if (tRes.status === 'fulfilled') setTeacher(tRes.value.data?.teacher);
        if (aRes.status === 'fulfilled') setAnnouncements(aRes.value.data || []);
        if (dRes.status === 'fulfilled') setDocuments(dRes.value.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden pb-12" style={{background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%)', minHeight: '560px'}}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 pt-20 pb-28 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white/80 text-sm mb-6">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Hệ thống AI đang hoạt động
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              Học Thông Minh Hơn<br />
              <span className="text-transparent bg-clip-text" style={{backgroundImage: 'linear-gradient(90deg, #60a5fa, #c084fc)'}}>
                Cùng AI Trợ Lý
              </span>
            </h1>
            <p className="text-white/70 text-lg mb-8 max-w-lg">
              Nền tảng học tập hiện đại giúp giáo viên quản lý và học sinh tiếp cận kiến thức mọi lúc, mọi nơi với sự hỗ trợ của AI.
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              {user ? (
                <Link to="/dashboard" className="btn btn-lg hover:scale-105 transition-transform" style={{background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', border: 'none'}}>
                  🚀 Đi đến Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-lg hover:scale-105 transition-transform" style={{background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', border: 'none'}}>
                    🚀 Bắt đầu miễn phí
                  </Link>
                  <Link to="/login" className="btn btn-lg hover:bg-white/10 transition-colors" style={{background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)'}}>
                    Đăng nhập
                  </Link>
                </>
              )}
            </div>
            <div className="flex items-center gap-6 mt-8 justify-center md:justify-start">
              {[['🤖', 'AI 24/7'], ['📚', 'Kho tài liệu'], ['✅', 'Điểm danh tự động']].map(([icon, label]) => (
                <div key={label} className="flex items-center gap-2 text-white/60 text-sm">
                  <span>{icon}</span><span>{label}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Teacher card */}
          {teacher && (
            <div className="flex-shrink-0 animate-slide-in-right">
              <div className="glass rounded-3xl p-6 text-center w-64">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 overflow-hidden shadow-xl">
                  {teacher.avatar ? <img src={teacher.avatar} alt="" className="w-full h-full object-cover" /> : teacher.name?.[0]}
                </div>
                <h3 className="font-bold text-white text-lg">{teacher.name}</h3>
                <p className="text-white/70 text-sm mt-1">{teacher.specialization}</p>
                <div className="flex justify-center gap-2 mt-3 flex-wrap">
                  {teacher.subjects?.slice(0,3).map(s => (
                    <span key={s} className="px-2 py-1 bg-white/10 rounded-full text-white/80 text-xs">{s}</span>
                  ))}
                </div>
                <p className="text-white/50 text-xs mt-3">{teacher.experience} năm kinh nghiệm</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* STATS */}
      <section className="max-w-7xl mx-auto px-4 relative -mt-16 z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '👥', label: 'Học sinh', value: '500+' },
            { icon: '📚', label: 'Tài liệu', value: '1000+' },
            { icon: '🤖', label: 'AI Hỗ trợ', value: '24/7' },
            { icon: '🎯', label: 'Bài kiểm tra', value: '200+' },
          ].map(stat => (
            <div key={stat.label} className="card text-center shadow-md">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-primary-600">{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ANNOUNCEMENTS */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">📢 Thông báo mới nhất</h2>
        </div>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-20" />)}</div>
        ) : announcements.length === 0 ? (
          <div className="card text-center py-10 text-slate-400">Chưa có thông báo nào</div>
        ) : (
          <div className="space-y-3">
            {announcements.map(ann => (
              <div key={ann._id} className={`card ann-${ann.type} animate-fade-in`}>
                <div className="flex items-start gap-4">
                  <span className="text-2xl">{ANNOUNCEMENT_ICONS[ann.type] || '📢'}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-800">{ann.title}</h3>
                      {ann.isPinned && <span className="badge badge-yellow">📌 Ghim</span>}
                      <span className={`badge badge-blue text-xs`}>{ANNOUNCEMENT_LABELS[ann.type]}</span>
                    </div>
                    <p className="text-slate-600 text-sm line-clamp-2">{ann.content}</p>
                    <p className="text-slate-400 text-xs mt-2">{new Date(ann.createdAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* DOCUMENTS */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">📚 Tài liệu mới nhất</h2>
          <Link to="/login" className="text-primary-600 text-sm font-medium hover:underline">Xem tất cả →</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-32" />)}</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {documents.map(doc => (
              <div key={doc._id} className="card-interactive text-center">
                <div className="text-4xl mb-3">{FILE_ICONS[doc.fileType] || '📎'}</div>
                <p className="text-sm font-medium text-slate-700 line-clamp-2">{doc.title}</p>
                <p className="text-xs text-slate-400 mt-2">{doc.class?.name}</p>
              </div>
            ))}
          </div>
        )}
      </section>



      {/* QUICK GUIDE */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-10">🚀 Bắt đầu trong 3 bước</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: '01', icon: '📝', title: 'Đăng ký tài khoản', desc: 'Tạo tài khoản học sinh miễn phí và tham gia lớp học bằng mã code từ giáo viên.' },
            { step: '02', icon: '📚', title: 'Tiếp cận tài liệu', desc: 'Xem và tải về tài liệu bài giảng, video học tập mọi lúc mọi nơi.' },
            { step: '03', icon: '🤖', title: 'Hỏi AI 24/7', desc: 'Chat với AI trợ lý học tập thông minh để được hướng dẫn giải bài bất cứ lúc nào.' },
          ].map(item => (
            <div key={item.step} className="card text-center relative overflow-hidden">
              <div className="absolute top-4 right-4 text-6xl font-black text-slate-100">{item.step}</div>
              <div className="text-5xl mb-4">{item.icon}</div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">{item.title}</h3>
              <p className="text-slate-500 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
