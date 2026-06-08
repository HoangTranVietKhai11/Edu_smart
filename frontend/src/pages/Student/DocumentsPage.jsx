import { useState, useEffect } from 'react';
import { documentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const FILE_ICONS = { pdf: '📄', docx: '📝', pptx: '📊', image: '🖼️', video: '🎬', other: '📎' };

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterType) params.fileType = filterType;
      
      const res = await documentAPI.getAll(params);
      setDocuments(res.data || []);
    } catch (err) {
      toast.error('Lỗi tải danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = '📚 Kho Tài Liệu - EduSmart';
    fetchDocuments();
  }, [filterType]); // Refetch when filter changes

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDocuments();
  };

  const handleDownload = async (doc) => {
    try {
      const res = await documentAPI.download(doc._id);
      // Trigger download using the returned URL
      const link = document.createElement('a');
      link.href = res.data.fileUrl.startsWith('http') ? res.data.fileUrl : `http://localhost:5000${res.data.fileUrl}`;
      link.download = res.data.fileName || doc.title;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Optioanlly update the local view count for UI feedback
      setDocuments(prev => prev.map(d => d._id === doc._id ? { ...d, downloadCount: (d.downloadCount || 0) + 1 } : d));
    } catch (err) {
      toast.error('Không thể tải tài liệu này');
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">📚 Kho Tài Liệu</h1>
          <p className="text-slate-500 text-sm">Xem và tải về bài giảng, đề thi, tài liệu tham khảo</p>
        </div>
        
        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
          <input 
            type="text" 
            className="form-input flex-1 min-w-[250px]" 
            placeholder="🔍 Tìm kiếm tài liệu..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-primary whitespace-nowrap">Tìm kiếm</button>
        </form>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
        <button onClick={() => setFilterType('')} className={`px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-colors ${!filterType ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
          Tất cả
        </button>
        {Object.keys(FILE_ICONS).filter(k => k !== 'other').map(type => (
          <button key={type} onClick={() => setFilterType(type)} className={`px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-colors flex items-center gap-2 ${filterType === type ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {FILE_ICONS[type]} {type.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="skeleton h-48 rounded-xl" />)}
        </div>
      ) : documents.length === 0 ? (
        <div className="card text-center py-20">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="font-bold text-slate-700 text-lg mb-2">Không tìm thấy tài liệu nào</h3>
          <p className="text-slate-500">Giáo viên của bạn chưa tải lên tài liệu nào hoặc không khớp với tìm kiếm.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {documents.map(doc => (
            <div key={doc._id} className="card p-0 overflow-hidden flex flex-col hover:shadow-lg transition-shadow border border-slate-100 group">
              <div className="h-32 bg-slate-50 flex items-center justify-center text-5xl relative border-b border-slate-100 group-hover:bg-primary-50 transition-colors">
                {FILE_ICONS[doc.fileType] || '📎'}
                {doc.isEmbedded && (
                  <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded shadow-sm text-xs font-bold text-indigo-600 flex items-center gap-1" title="Tài liệu này đã được AI học">
                    ✨ AI Ready
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-slate-800 line-clamp-2 mb-1" title={doc.title}>{doc.title}</h3>
                {doc.class && <p className="text-xs text-primary-600 font-medium mb-2">{doc.class.name}</p>}
                <p className="text-slate-500 text-xs line-clamp-2 flex-1">{doc.description}</p>
                
                <div className="mt-4 pt-3 border-t flex items-center justify-between">
                  <span className="text-xs text-slate-400">{formatSize(doc.fileSize)}</span>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span title="Lượt xem">👁️ {doc.viewCount || 0}</span>
                    <span title="Lượt tải">⬇️ {doc.downloadCount || 0}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => handleDownload(doc)} className="bg-slate-800 text-white py-3 w-full font-medium text-sm hover:bg-slate-900 transition-colors flex items-center justify-center gap-2">
                ⬇️ Tải xuống
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
