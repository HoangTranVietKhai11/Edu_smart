import { useState, useEffect } from 'react';
import { blogAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function BlogEditorPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    title: '', content: '', coverImage: '', tags: '', isPublished: true
  });

  const fetchBlogs = async () => {
    try {
      const res = await blogAPI.getMine();
      setBlogs(res.data || []);
    } catch (err) {
      toast.error('Lỗi tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = '✍️ Viết Blog - EduSmart';
    fetchBlogs();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dataToSubmit = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
      };
      await blogAPI.create(dataToSubmit);
      toast.success('Đã lưu bài viết thành công!');
      setShowForm(false);
      setForm({ title: '', content: '', coverImage: '', tags: '', isPublished: true });
      fetchBlogs();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi lưu bài viết');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    try {
      await blogAPI.delete(id);
      setBlogs(prev => prev.filter(b => b._id !== id));
      toast.success('Đã xóa bài viết');
    } catch (err) {
      toast.error('Lỗi khi xóa');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">✍️ Viết Blog / Bài Giảng</h1>
          <p className="text-slate-500 text-sm">Chia sẻ kiến thức, kinh nghiệm với học sinh và cộng đồng</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Hủy' : '+ Bài viết mới'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-8 animate-fade-in">
          <h3 className="font-bold text-slate-700 mb-4 text-lg border-b pb-2">Soạn bài viết mới</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group col-span-2">
              <label className="form-label">Tiêu đề bài viết *</label>
              <input required className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="VD: 5 Cách Ghi Nhớ Từ Vựng Tiếng Anh Hiệu Quả" />
            </div>
            <div className="form-group col-span-2 md:col-span-1">
              <label className="form-label">Link ảnh bìa (URL)</label>
              <input className="form-input" value={form.coverImage} onChange={e => setForm({...form, coverImage: e.target.value})} placeholder="https://..." />
            </div>
            <div className="form-group col-span-2 md:col-span-1">
              <label className="form-label">Thẻ tags (cách nhau bởi dấu phẩy)</label>
              <input className="form-input" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="VD: tienganh, thpt, onthi" />
            </div>
            <div className="form-group col-span-2">
              <label className="form-label">Nội dung bài viết (Hỗ trợ định dạng) *</label>
              {/* In a real app we would use a Rich Text Editor like Quill or TinyMCE here */}
              <textarea required className="form-input font-mono text-sm" rows={12} value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="Nhập nội dung bài viết vào đây..." />
            </div>
            <div className="form-group col-span-2 flex items-center gap-2">
              <input type="checkbox" id="publish" checked={form.isPublished} onChange={e => setForm({...form, isPublished: e.target.checked})} className="w-4 h-4" />
              <label htmlFor="publish" className="text-slate-700 cursor-pointer">Xuất bản ngay lập tức</label>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button type="submit" disabled={saving} className="btn btn-primary px-8">{saving ? 'Đang lưu...' : 'Lưu bài viết'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary px-6">Hủy</button>
          </div>
        </form>
      )}

      <h3 className="font-bold text-slate-800 mb-4 text-lg">Bài viết của bạn ({blogs.length})</h3>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-48" />)}
        </div>
      ) : blogs.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">Bạn chưa có bài viết nào. Hãy bắt đầu chia sẻ kiến thức nhé!</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blogs.map(blog => (
            <div key={blog._id} className="card p-0 overflow-hidden flex flex-col">
              {blog.coverImage && (
                <div className="h-40 bg-slate-200">
                  <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h3 className="font-bold text-slate-800 text-lg line-clamp-2">{blog.title}</h3>
                  <button onClick={() => handleDelete(blog._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg" title="Xóa bài viết">🗑️</button>
                </div>
                <p className="text-slate-500 text-sm line-clamp-3 mb-4 flex-1">{blog.excerpt || blog.content}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className={`badge ${blog.isPublished ? 'badge-green' : 'badge-yellow'}`}>
                    {blog.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
                  </span>
                  <span className="text-xs text-slate-400">{new Date(blog.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
