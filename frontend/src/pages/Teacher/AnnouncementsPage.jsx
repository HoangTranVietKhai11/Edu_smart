import { useState, useEffect } from 'react';
import { announcementAPI, classAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', type: 'general', class: '', isPinned: false });

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
    document.title = '🔔 Quản Lý Thông Báo - EduSmart';
    fetchAnnouncements();
    classAPI.getAll().then(res => setClasses(res.data || [])).catch(() => {});
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const dataToSubmit = { ...form };
      if (!dataToSubmit.class) delete dataToSubmit.class;

      await announcementAPI.create(dataToSubmit);
      toast.success('Đăng thông báo thành công!');
      setShowForm(false);
      setForm({ title: '', content: '', type: 'general', class: '', isPinned: false });
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi đăng thông báo');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa thông báo này?')) return;
    try {
      await announcementAPI.delete(id);
      setAnnouncements(prev => prev.filter(a => a._id !== id));
      toast.success('Đã xóa thông báo');
    } catch (err) {
      toast.error('Lỗi khi xóa thông báo');
    }
  };

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">🔔 Quản Lý Thông Báo</h1>
          <p className="text-slate-500 text-sm">Tạo và quản lý các thông báo cho lớp học</p>
        </div>
        <button onClick={() => setShowForm(p => !p)} className="btn btn-primary">
          {showForm ? 'Hủy' : '+ Viết thông báo'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 animate-fade-in bg-white shadow p-6 rounded-xl">
          <h3 className="font-bold text-slate-700 mb-4 text-lg">Viết thông báo mới</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group col-span-2 md:col-span-1">
              <label className="form-label">Tiêu đề *</label>
              <input required className="form-input" value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} placeholder="VD: Thay đổi lịch học tuần tới" />
            </div>
            <div className="form-group">
              <label className="form-label">Loại thông báo</label>
              <select className="form-input" value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))}>
                <option value="general">Chung</option>
                <option value="schedule">Lịch học</option>
                <option value="exam">Kiểm tra / Thi</option>
                <option value="holiday">Nghỉ học</option>
                <option value="result">Kết quả học tập</option>
                <option value="urgent">Khẩn cấp</option>
              </select>
            </div>
            <div className="form-group col-span-2">
              <label className="form-label">Nội dung *</label>
              <textarea required className="form-input" value={form.content} onChange={e => setForm(p => ({...p, content: e.target.value}))} placeholder="Nội dung chi tiết..." rows={4} />
            </div>
            <div className="form-group">
              <label className="form-label">Lớp nhận thông báo (Bỏ trống = Gửi toàn bộ)</label>
              <select className="form-input" value={form.class} onChange={e => setForm(p => ({...p, class: e.target.value}))}>
                <option value="">-- Tất cả các lớp --</option>
                {classes.map(c => (
                  <option key={c._id} value={c._id}>{c.name} - {c.subject}</option>
                ))}
              </select>
            </div>
            <div className="form-group flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPinned} onChange={e => setForm(p => ({...p, isPinned: e.target.checked}))} className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span className="text-slate-700 font-medium">📌 Ghim thông báo này</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button type="submit" className="btn btn-primary px-6">Đăng thông báo</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary px-6">Hủy</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="card text-center py-16 text-slate-400">Chưa có thông báo nào.</div>
          ) : (
            announcements.map(ann => (
              <div key={ann._id} className={`card card-interactive border-l-4 ${ann.isPinned ? 'border-l-primary-500 bg-primary-50' : 'border-l-transparent'}`}>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex gap-2 items-center mb-2">
                      {ann.isPinned && <span className="text-sm" title="Đã ghim">📌</span>}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeStyle(ann.type)}`}>
                        {getTypeName(ann.type)}
                      </span>
                      {ann.class ? (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Lớp: {ann.class.name || 'Không xác định'}</span>
                      ) : (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Tất cả lớp</span>
                      )}
                      <span className="text-xs text-slate-400">• {new Date(ann.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg">{ann.title}</h3>
                    <p className="text-slate-600 mt-2 whitespace-pre-wrap">{ann.content}</p>
                  </div>
                  <button onClick={() => handleDelete(ann._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Xóa thông báo">
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
