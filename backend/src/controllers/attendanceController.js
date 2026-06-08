const Attendance = require('../models/Attendance');
const Lesson = require('../models/Lesson');
const Class = require('../models/Class');
const Document = require('../models/Document');

// @desc   Get attendance for a class
// @route  GET /api/attendance/class/:classId
// @access Private
exports.getClassAttendance = async (req, res) => {
  const { classId } = req.params;
  const { month, year } = req.query;

  const query = { class: classId };
  if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    query.date = { $gte: start, $lte: end };
  }

  const attendance = await Attendance.find(query)
    .populate('lesson', 'title date')
    .populate('records.student', 'name avatar email')
    .sort('-date');

  res.json({ success: true, data: attendance });
};

// @desc   Get attendance for a student
// @route  GET /api/attendance/student/:studentId
// @access Private
exports.getStudentAttendance = async (req, res) => {
  const studentId = req.params.studentId || req.user._id;

  const attendance = await Attendance.find({ 'records.student': studentId })
    .populate('lesson', 'title date content documents videoUrl')
    .populate('class', 'name subject')
    .sort('-date');

  // Extract relevant records
  const result = attendance.map(att => {
    const record = att.records.find(r => r.student.toString() === studentId.toString());
    return {
      _id: att._id,
      lesson: att.lesson,
      class: att.class,
      date: att.date,
      status: record?.status,
      note: record?.note,
    };
  });

  res.json({ success: true, data: result });
};

// @desc   Get missed lessons for a student
// @route  GET /api/attendance/missed
// @access Private/Student
exports.getMissedLessons = async (req, res) => {
  const studentId = req.user._id;

  const attendance = await Attendance.find({
    'records': { $elemMatch: { student: studentId, status: 'absent' } },
  })
    .populate({
      path: 'lesson',
      populate: {
        path: 'documents',
        model: 'Document',
        select: 'title fileUrl fileType',
      },
    })
    .populate('class', 'name subject grade')
    .sort('-date');

  const missedLessons = attendance.map(att => {
    const record = att.records.find(r => r.student.toString() === studentId.toString());
    return {
      attendance: att._id,
      lesson: att.lesson,
      class: att.class,
      date: att.date,
      status: record?.status,
    };
  });

  res.json({ success: true, count: missedLessons.length, data: missedLessons });
};

// @desc   Submit attendance
// @route  POST /api/attendance
// @access Private/Teacher
exports.createAttendance = async (req, res) => {
  const { lessonId, classId, date, records } = req.body;

  // Check if attendance already exists
  const existing = await Attendance.findOne({ lesson: lessonId, class: classId });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Đã điểm danh cho buổi học này rồi.' });
  }

  const attendance = await Attendance.create({
    lesson: lessonId,
    class: classId,
    date: date || new Date(),
    records,
    createdBy: req.user._id,
  });

  const populated = await Attendance.findById(attendance._id)
    .populate('lesson', 'title date')
    .populate('records.student', 'name avatar');

  res.status(201).json({ success: true, data: populated });
};

// @desc   Update attendance
// @route  PUT /api/attendance/:id
// @access Private/Teacher
exports.updateAttendance = async (req, res) => {
  const attendance = await Attendance.findByIdAndUpdate(
    req.params.id,
    { records: req.body.records, notes: req.body.notes },
    { new: true }
  ).populate('records.student', 'name avatar');

  if (!attendance) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy dữ liệu điểm danh.' });
  }

  res.json({ success: true, data: attendance });
};

// @desc   Get attendance stats for a class
// @route  GET /api/attendance/stats/:classId
// @access Private/Teacher
exports.getAttendanceStats = async (req, res) => {
  const attendance = await Attendance.find({ class: req.params.classId });

  const statsMap = {};
  attendance.forEach(att => {
    att.records.forEach(r => {
      const sid = r.student.toString();
      if (!statsMap[sid]) statsMap[sid] = { present: 0, absent: 0, late: 0, total: 0 };
      statsMap[sid][r.status]++;
      statsMap[sid].total++;
    });
  });

  res.json({ success: true, data: statsMap });
};
