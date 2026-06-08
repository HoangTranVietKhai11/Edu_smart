import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { examAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function ExamResultsPage() {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Kết quả bài kiểm tra';
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [examRes, resultsRes] = await Promise.all([
        examAPI.getOne(id),
        examAPI.getResults(id)
      ]);
      setExam(examRes.data);
      setResults(resultsRes.data || []);
    } catch (error) {
      toast.error('Không thể tải dữ liệu kết quả.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="loading-spinner"></div></div>;
  if (!exam) return <div className="text-center py-20 text-slate-500">Không tìm thấy bài kiểm tra.</div>;

  // Statistics
  const totalSubmissions = results.length;
  const passedCount = results.filter(r => r.isPassed).length;
  const averageScore = totalSubmissions > 0 
    ? (results.reduce((acc, curr) => acc + curr.totalScore, 0) / totalSubmissions).toFixed(1)
    : 0;
  const averagePercentage = totalSubmissions > 0 
    ? (results.reduce((acc, curr) => acc + curr.percentage, 0) / totalSubmissions).toFixed(1)
    : 0;

  // Chart data
  const scoreDistribution = [
    { name: '0-20%', count: 0 },
    { name: '21-40%', count: 0 },
    { name: '41-60%', count: 0 },
    { name: '61-80%', count: 0 },
    { name: '81-100%', count: 0 },
  ];

  results.forEach(r => {
    if (r.percentage <= 20) scoreDistribution[0].count++;
    else if (r.percentage <= 40) scoreDistribution[1].count++;
    else if (r.percentage <= 60) scoreDistribution[2].count++;
    else if (r.percentage <= 80) scoreDistribution[3].count++;
    else scoreDistribution[4].count++;
  });

  return (
    <div className="max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/teacher/exams" className="btn btn-secondary btn-sm">← Quay lại</Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kết quả: {exam.title}</h1>
          <p className="text-slate-500 text-sm mt-1">Lớp: {exam.class?.name}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <p className="text-sm font-medium text-blue-600 mb-1">Đã nộp bài</p>
          <p className="text-3xl font-bold text-slate-800">{totalSubmissions}</p>
        </div>
        <div className="card text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <p className="text-sm font-medium text-green-600 mb-1">Tỷ lệ Đạt</p>
          <p className="text-3xl font-bold text-slate-800">
            {totalSubmissions > 0 ? Math.round((passedCount / totalSubmissions) * 100) : 0}%
          </p>
          <p className="text-xs text-slate-500 mt-1">{passedCount} học sinh</p>
        </div>
        <div className="card text-center p-6 bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-100">
          <p className="text-sm font-medium text-amber-600 mb-1">Điểm trung bình</p>
          <p className="text-3xl font-bold text-slate-800">{averageScore}<span className="text-lg text-slate-500">/{exam.totalPoints}</span></p>
        </div>
        <div className="card text-center p-6 bg-gradient-to-br from-purple-50 to-fuchsia-50 border-purple-100">
          <p className="text-sm font-medium text-purple-600 mb-1">Tỷ lệ làm đúng</p>
          <p className="text-3xl font-bold text-slate-800">{averagePercentage}%</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Table */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h2 className="font-semibold text-slate-700">Danh sách nộp bài</h2>
            <button className="btn btn-secondary btn-sm">📥 Xuất Excel</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                  <th className="p-4 font-medium">Học sinh</th>
                  <th className="p-4 font-medium">Lượt thi</th>
                  <th className="p-4 font-medium text-center">Điểm số</th>
                  <th className="p-4 font-medium text-center">Tỷ lệ</th>
                  <th className="p-4 font-medium text-center">Thời gian làm</th>
                  <th className="p-4 font-medium text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-400">Chưa có học sinh nào nộp bài.</td>
                  </tr>
                ) : (
                  results.map((result) => (
                    <tr key={result._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
                            {result.student?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{result.student?.name}</p>
                            <p className="text-xs text-slate-500">{result.student?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">{result.attemptNumber}</td>
                      <td className="p-4 text-center font-semibold text-slate-700">
                        {result.totalScore}/{result.maxScore}
                      </td>
                      <td className="p-4 text-center">{result.percentage}%</td>
                      <td className="p-4 text-center text-slate-500">
                        {Math.floor(result.timeSpent / 60)}p {result.timeSpent % 60}s
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`badge ${result.isPassed ? 'badge-green' : 'badge-red'}`}>
                            {result.isPassed ? 'Đạt' : 'Không đạt'}
                          </span>
                          {result.isCheated && (
                            <span className="badge badge-red bg-red-100 text-red-700 text-[10px] font-bold border-red-200 mt-1" title={`Cảnh báo thoát trang: ${result.cheatWarnings} lần`}>
                              ⚠️ Gian lận ({result.cheatWarnings})
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chart */}
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-6">Phổ điểm</h2>
          {totalSubmissions > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} allowDecimals={false} />
                  <RechartsTooltip 
                    cursor={{fill: '#F1F5F9'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Số lượng" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="h-64 flex items-center justify-center text-slate-400 border-2 border-dashed rounded-xl">
               Chưa có dữ liệu thống kê
             </div>
          )}
        </div>

      </div>
    </div>
  );
}
