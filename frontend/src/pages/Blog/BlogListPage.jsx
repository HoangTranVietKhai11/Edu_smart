import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogAPI } from '../../services/api';

const CATEGORIES = { 'study-tips': 'Kỹ năng học', 'career': 'Định hướng', 'teaching': 'Nghề giáo', 'inspiration': 'Truyền cảm hứng', 'subject-tips': 'Phương pháp', 'other': 'Khác' };

export default function BlogListPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.title = 'Blog - EduSmart';
    blogAPI.getAll({ category, search }).then(r => setBlogs(r.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, [category, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">✍️ Blog Chia Sẻ</h1>
      <p className="text-slate-500 mb-8">Kiến thức, kinh nghiệm và định hướng từ giáo viên</p>

      <div className="flex gap-3 flex-wrap mb-8">
        <button onClick={() => setCategory('')} className={`badge ${!category ? 'badge-blue' : 'badge-gray'} cursor-pointer`}>Tất cả</button>
        {Object.entries(CATEGORIES).map(([k, v]) => (
          <button key={k} onClick={() => setCategory(k)} className={`badge ${category === k ? 'badge-blue' : 'badge-gray'} cursor-pointer`}>{v}</button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-64" />)}</div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">Chưa có bài viết nào</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map(blog => (
            <Link key={blog._id} to={`/blogs/${blog.slug || blog._id}`} className="card card-interactive group">
              {blog.coverImage && (
                <div className="h-48 rounded-xl overflow-hidden mb-4 bg-slate-100">
                  <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              )}
              <span className="badge badge-blue mb-2">{CATEGORIES[blog.category] || blog.category}</span>
              <h3 className="font-bold text-slate-800 mb-2 line-clamp-2">{blog.title}</h3>
              <p className="text-slate-500 text-sm line-clamp-3">{blog.excerpt}</p>
              <div className="flex items-center gap-2 mt-4">
                <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">
                  {blog.author?.name?.[0]}
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-700">{blog.author?.name}</p>
                  <p className="text-xs text-slate-400">{new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <span className="ml-auto text-xs text-slate-400">👁 {blog.viewCount}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
