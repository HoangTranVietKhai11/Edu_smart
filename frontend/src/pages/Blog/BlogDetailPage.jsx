import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { blogAPI } from '../../services/api';
import ReactMarkdown from 'react-markdown';

export default function BlogDetailPage() {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    blogAPI.getOne(id).then(r => { setBlog(r.data); document.title = `${r.data.title} - EduSmart`; }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8"><div className="skeleton h-96" /></div>;
  if (!blog) return <div className="text-center py-16 text-slate-400">Không tìm thấy bài viết</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {blog.coverImage && <img src={blog.coverImage} alt={blog.title} className="w-full h-64 object-cover rounded-2xl mb-8" />}
      <h1 className="text-3xl font-bold text-slate-800 mb-4">{blog.title}</h1>
      <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700 overflow-hidden">
          {blog.author?.avatar ? <img src={blog.author.avatar} alt="" className="w-full h-full object-cover" /> : blog.author?.name?.[0]}
        </div>
        <div>
          <p className="font-semibold text-slate-800">{blog.author?.name}</p>
          <p className="text-sm text-slate-400">{blog.author?.specialization} • {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('vi-VN')}</p>
        </div>
        <span className="ml-auto text-sm text-slate-400">👁 {blog.viewCount} lượt xem</span>
      </div>
      <div className="prose prose-slate max-w-none">
        <ReactMarkdown>{blog.content}</ReactMarkdown>
      </div>
    </div>
  );
}
