import { useState, useEffect } from 'react';
import { announcementAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = async () => {
    try {
      const res = await announcementAPI.getAll();
      setAnnouncements(res.data || []);
    } catch (err) {
      toast.error('Không thể tải danh sách thông báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = '🔔 Bảng Tin - EduSmart';
    fetchAnnouncements();
  }, []);

  const getTypeStyle = (type) => {
    switch (type) {
      case 'urgent': return 'badge-red text-red-700 bg-red-100';
      case 'exam': return 'badge-orange text-orange-700 bg-orange-100';
      case 'holiday': return 'badge-green text-green-700 bg-green-100';
      case 'schedule': return 'badge-blue text-blue-700 bg-blue-100';
      case 'result': return 'badge-purple text-purple-700 bg-purple-100';
      default: return 'badge-gray text-gray-700 bg-gray-100';
    }
  };

  const getTypeName = (type) => {
    switch (type) {
      case 'urgent': return 'Khẩn cấp';
      case 'exam': return 'Kiểm tra';
      case 'holiday': return 'Nghỉ học';
      case 'schedule': return 'Lịch học';
      case 'result': return 'Kết quả';
      default: return 'Chung';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">🔔 Bảng Tin</h1>
        <p className="text-slate-500 text-sm">Xem các thông báo mới nhất từ giáo viên</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="card text-center py-16 text-slate-400">Không có thông báo nào.</div>
          ) : (
            announcements.map(ann => (
              <div key={ann._id} className={`card border-l-4 ${ann.isPinned ? 'border-l-primary-500 bg-primary-50' : 'border-l-transparent'}`}>
                <div className="flex gap-2 items-center mb-2">
                  {ann.isPinned && <span className="text-sm" title="Đã ghim">📌</span>}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeStyle(ann.type)}`}>
                    {getTypeName(ann.type)}
                  </span>
                  <span className="text-xs text-slate-400">• {new Date(ann.createdAt).toLocaleString('vi-VN')}</span>
                  {ann.teacher && (
                    <span className="text-xs text-slate-500 ml-auto flex items-center gap-1">
                      <span className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-[10px]">
                        {ann.teacher.name?.[0] || 'T'}
                      </span>
                      {ann.teacher.name}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-800 text-lg">{ann.title}</h3>
                <p className="text-slate-600 mt-2 whitespace-pre-wrap">{ann.content}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
