import { useState, useEffect } from 'react';
import { classAPI, lessonAPI, attendanceAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AttendancePage() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [lessons, setLessons] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState('');

  const [students, setStudents] = useState([]);
  const [attendanceRecord, setAttendanceRecord] = useState(null);
  const [recordsMap, setRecordsMap] = useState({}); // studentId -> { status, note }
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch classes
  useEffect(() => {
    document.title = '📋 Điểm Danh - EduSmart';
    classAPI.getAll().then(res => {
      setClasses(res.data || []);
      if (res.data?.length > 0) setSelectedClassId(res.data[0]._id);
    }).catch(() => toast.error('Lỗi tải danh sách lớp'));
  }, []);

  // Fetch lessons & attendance when class changes
  useEffect(() => {
    if (!selectedClassId) return;
    setLoading(true);
    
    // Get students for this class
    const cls = classes.find(c => c._id === selectedClassId);
    setStudents(cls?.students || []);

    Promise.all([
      lessonAPI.getAll(selectedClassId),
      attendanceAPI.getClassAttendance(selectedClassId)
    ]).then(([lessonRes, attRes]) => {
      const classLessons = lessonRes.data || [];
      setLessons(classLessons);
      
      // Select nearest lesson or first one
      if (classLessons.length > 0) {
        setSelectedLessonId(classLessons[0]._id);
      } else {
        setSelectedLessonId('');
      }

      // Store fetched attendances in a hidden state or process later
      // Actually we will fetch specifically when lesson is selected to keep it clean,
      // but getClassAttendance returns all. Let's just store it in window for quick access
      window.__attendances = attRes.data || [];
      processSelectedLesson(classLessons[0]?._id, attRes.data || []);
    }).catch(() => toast.error('Lỗi tải dữ liệu lớp học')).finally(() => setLoading(false));
  }, [selectedClassId, classes]);

  // When lesson changes
  useEffect(() => {
    if (selectedLessonId) {
      processSelectedLesson(selectedLessonId, window.__attendances || []);
    }
  }, [selectedLessonId]);

  const processSelectedLesson = (lessonId, allAttendances) => {
    if (!lessonId) return;
    const existing = allAttendances.find(a => a.lesson?._id === lessonId);
    if (existing) {
      setAttendanceRecord(existing);
      const map = {};
      existing.records.forEach(r => {
        map[r.student._id || r.student] = { status: r.status, note: r.note };
      });
      setRecordsMap(map);
    } else {
      setAttendanceRecord(null);
      const map = {};
      students.forEach(s => {
        map[s._id] = { status: 'present', note: '' };
      });
      setRecordsMap(map);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setRecordsMap(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const handleNoteChange = (studentId, note) => {
    setRecordsMap(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], note }
    }));
  };

  const handleSave = async () => {
    if (!selectedClassId || !selectedLessonId) return toast.error('Vui lòng chọn lớp và buổi học');
    
    const recordsArray = Object.keys(recordsMap).map(studentId => ({
      student: studentId,
      status: recordsMap[studentId].status,
      note: recordsMap[studentId].note
    }));

    setSaving(true);
    try {
      if (attendanceRecord) {
        await attendanceAPI.update(attendanceRecord._id, { records: recordsArray });
        toast.success('Cập nhật điểm danh thành công!');
      } else {
        const res = await attendanceAPI.create({
          classId: selectedClassId,
          lessonId: selectedLessonId,
          records: recordsArray,
          date: new Date()
        });
        setAttendanceRecord(res.data);
        window.__attendances.push(res.data);
        toast.success('Lưu điểm danh thành công!');
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi khi lưu điểm danh');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">📋 Điểm Danh</h1>
        <p className="text-slate-500 text-sm">Quản lý điểm danh học sinh theo từng buổi học</p>
      </div>

      <div className="card mb-6 bg-white shadow-sm flex flex-wrap gap-4 items-end">
        <div className="form-group flex-1 min-w-[200px] mb-0">
          <label className="form-label">Chọn Lớp học</label>
          <select className="form-input" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
            {classes.length === 0 && <option value="">-- Chưa có lớp học --</option>}
            {classes.map(c => <option key={c._id} value={c._id}>{c.name} - {c.subject}</option>)}
          </select>
        </div>
        <div className="form-group flex-1 min-w-[200px] mb-0">
          <label className="form-label">Chọn Buổi học</label>
          <select className="form-input" value={selectedLessonId} onChange={e => setSelectedLessonId(e.target.value)}>
            {lessons.length === 0 && <option value="">-- Lớp chưa có buổi học --</option>}
            {lessons.map(l => <option key={l._id} value={l._id}>{l.title} ({new Date(l.date).toLocaleDateString()})</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-12"><div className="w-8 h-8 mx-auto border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : students.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">Lớp học này chưa có học sinh nào.</div>
      ) : !selectedLessonId ? (
         <div className="card text-center py-16 text-slate-400">Vui lòng chọn hoặc tạo buổi học trước khi điểm danh.</div>
      ) : (
        <div className="card bg-white shadow-sm p-0 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-700">Danh sách học sinh ({students.length})</h3>
              {attendanceRecord ? (
                <span className="text-sm text-green-600 font-medium">✅ Đã điểm danh lúc {new Date(attendanceRecord.updatedAt || attendanceRecord.createdAt).toLocaleString()}</span>
              ) : (
                <span className="text-sm text-amber-600 font-medium">⚠️ Chưa điểm danh</span>
              )}
            </div>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              {saving ? 'Đang lưu...' : (attendanceRecord ? 'Cập nhật điểm danh' : 'Lưu điểm danh')}
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b">
                  <th className="p-4 font-medium">Học sinh</th>
                  <th className="p-4 font-medium text-center">Có mặt</th>
                  <th className="p-4 font-medium text-center">Đi muộn</th>
                  <th className="p-4 font-medium text-center">Vắng mặt</th>
                  <th className="p-4 font-medium">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student._id} className="border-b hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex justify-center items-center font-bold text-xs">
                          {student.name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{student.name}</p>
                          <p className="text-xs text-slate-500">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <input type="radio" name={`status-${student._id}`} 
                        checked={recordsMap[student._id]?.status === 'present'}
                        onChange={() => handleStatusChange(student._id, 'present')}
                        className="w-5 h-5 text-green-500 cursor-pointer" />
                    </td>
                    <td className="p-4 text-center">
                      <input type="radio" name={`status-${student._id}`} 
                        checked={recordsMap[student._id]?.status === 'late'}
                        onChange={() => handleStatusChange(student._id, 'late')}
                        className="w-5 h-5 text-amber-500 cursor-pointer" />
                    </td>
                    <td className="p-4 text-center">
                      <input type="radio" name={`status-${student._id}`} 
                        checked={recordsMap[student._id]?.status === 'absent'}
                        onChange={() => handleStatusChange(student._id, 'absent')}
                        className="w-5 h-5 text-red-500 cursor-pointer" />
                    </td>
                    <td className="p-4">
                      <input type="text" className="form-input text-sm py-1" placeholder="Ghi chú (tùy chọn)" 
                        value={recordsMap[student._id]?.note || ''}
                        onChange={(e) => handleNoteChange(student._id, e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
