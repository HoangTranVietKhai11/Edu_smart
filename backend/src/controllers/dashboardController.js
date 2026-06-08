const User = require('../models/User');
const Class = require('../models/Class');
const Document = require('../models/Document');
const Exam = require('../models/Exam');
const ExamResult = require('../models/ExamResult');
const Attendance = require('../models/Attendance');
const AIChat = require('../models/AIChat');
const Blog = require('../models/Blog');
const Announcement = require('../models/Announcement');

// @desc   Teacher dashboard stats
// @route  GET /api/dashboard/teacher
// @access Private/Teacher
exports.getTeacherDashboard = async (req, res) => {
  const teacherId = req.user._id;

  const myClasses = await Class.find({ teacher: teacherId, isActive: true }).select('_id students');
  const classIds = myClasses.map(c => c._id);
  const totalStudents = new Set(myClasses.flatMap(c => c.students.map(s => s.toString()))).size;

  const [
    totalDocuments,
    totalExams,
    totalBlogs,
    totalAnnouncements,
    recentDocuments,
    popularDocuments,
    recentExams,
  ] = await Promise.all([
    Document.countDocuments({ uploadedBy: teacherId }),
    Exam.countDocuments({ createdBy: teacherId }),
    Blog.countDocuments({ author: teacherId }),
    Announcement.countDocuments({ teacher: teacherId }),
    Document.find({ uploadedBy: teacherId }).sort('-createdAt').limit(5).populate('class', 'name'),
    Document.find({ uploadedBy: teacherId }).sort('-downloadCount').limit(5).populate('class', 'name'),
    Exam.find({ createdBy: teacherId }).sort('-createdAt').limit(5).populate('class', 'name'),
  ]);

  // AI usage stats
  const aiChats = await AIChat.find({ 'messages.0': { $exists: true } });
  const totalAIMessages = aiChats.reduce((sum, c) => sum + c.totalMessages, 0);

  // Exam completion stats
  const examResults = await ExamResult.find({
    exam: { $in: await Exam.find({ createdBy: teacherId }).distinct('_id') },
  });
  const passedCount = examResults.filter(r => r.isPassed).length;
  const passRate = examResults.length > 0 ? Math.round((passedCount / examResults.length) * 100) : 0;

  res.json({
    success: true,
    data: {
      stats: {
        totalStudents,
        totalClasses: myClasses.length,
        totalDocuments,
        totalExams,
        totalBlogs,
        totalAnnouncements,
        totalAIMessages,
        passRate,
        totalExamSubmissions: examResults.length,
      },
      recentDocuments,
      popularDocuments,
      recentExams,
    },
  });
};

// @desc   Student dashboard stats
// @route  GET /api/dashboard/student
// @access Private/Student
exports.getStudentDashboard = async (req, res) => {
  const studentId = req.user._id;

  const myClasses = await Class.find({ students: studentId, isActive: true })
    .populate('teacher', 'name avatar')
    .select('name subject grade teacher schedule');

  const classIds = myClasses.map(c => c._id);

  const [
    myExamResults,
    attendanceRecords,
    recentDocuments,
    recentAnnouncements,
  ] = await Promise.all([
    ExamResult.find({ student: studentId }).populate('exam', 'title totalPoints').sort('-submittedAt').limit(5),
    Attendance.find({ class: { $in: classIds }, 'records.student': studentId }),
    Document.find({ class: { $in: classIds } }).sort('-createdAt').limit(6).populate('class', 'name'),
    Announcement.find({ class: { $in: classIds } }).sort('-createdAt').limit(5),
  ]);

  const absentCount = attendanceRecords.filter(a => {
    const r = a.records.find(r => r.student.toString() === studentId.toString());
    return r?.status === 'absent';
  }).length;

  const presentCount = attendanceRecords.filter(a => {
    const r = a.records.find(r => r.student.toString() === studentId.toString());
    return r?.status === 'present';
  }).length;

  const avgScore = myExamResults.length > 0
    ? Math.round((myExamResults.reduce((s, r) => s + r.percentage, 0) / myExamResults.length) * 10) / 10
    : 0;

  res.json({
    success: true,
    data: {
      stats: {
        totalClasses: myClasses.length,
        totalLessonsAttended: presentCount,
        totalAbsent: absentCount,
        attendanceRate: attendanceRecords.length > 0
          ? Math.round((presentCount / attendanceRecords.length) * 100)
          : 100,
        totalExamsTaken: myExamResults.length,
        averageScore: avgScore,
      },
      myClasses,
      recentExamResults: myExamResults,
      recentDocuments,
      recentAnnouncements,
    },
  });
};

// @desc   Get teacher public profile
// @route  GET /api/dashboard/teacher-profile
// @access Public
exports.getTeacherProfile = async (req, res) => {
  const teacher = await User.findOne({ role: 'teacher', isActive: true })
    .select('-password -lastLogin -isFirstLogin');

  if (!teacher) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin giáo viên.' });
  }

  const [totalClasses, totalDocuments, totalBlogs] = await Promise.all([
    Class.countDocuments({ teacher: teacher._id }),
    Document.countDocuments({ uploadedBy: teacher._id }),
    Blog.countDocuments({ author: teacher._id, isPublished: true }),
  ]);

  res.json({
    success: true,
    data: {
      teacher,
      stats: { totalClasses, totalDocuments, totalBlogs },
    },
  });
};
