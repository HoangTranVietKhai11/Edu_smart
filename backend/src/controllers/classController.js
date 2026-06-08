const Class = require('../models/Class');
const User = require('../models/User');

// @desc   Get all classes
// @route  GET /api/classes
// @access Private
exports.getClasses = async (req, res) => {
  let query;
  if (req.user.role === 'teacher') {
    query = Class.find({ teacher: req.user._id, isActive: true });
  } else {
    query = Class.find({ students: req.user._id, isActive: true });
  }

  const classes = await query
    .populate('teacher', 'name avatar specialization')
    .populate('students', 'name avatar email')
    .sort('-createdAt');

  res.json({ success: true, count: classes.length, data: classes });
};

// @desc   Get single class
// @route  GET /api/classes/:id
// @access Private
exports.getClass = async (req, res) => {
  const cls = await Class.findById(req.params.id)
    .populate('teacher', 'name avatar email phone specialization subjects')
    .populate('students', 'name avatar email phone school grade');

  if (!cls) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học.' });
  }

  res.json({ success: true, data: cls });
};

// @desc   Create class
// @route  POST /api/classes
// @access Private/Teacher
exports.createClass = async (req, res) => {
  req.body.teacher = req.user._id;
  const cls = await Class.create(req.body);
  res.status(201).json({ success: true, data: cls });
};

// @desc   Update class
// @route  PUT /api/classes/:id
// @access Private/Teacher
exports.updateClass = async (req, res) => {
  let cls = await Class.findById(req.params.id);
  if (!cls) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học.' });
  }
  if (cls.teacher.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa lớp này.' });
  }

  cls = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, data: cls });
};

// @desc   Delete class
// @route  DELETE /api/classes/:id
// @access Private/Teacher
exports.deleteClass = async (req, res) => {
  const cls = await Class.findById(req.params.id);
  if (!cls) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học.' });
  }
  if (cls.teacher.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa lớp này.' });
  }

  cls.isActive = false;
  await cls.save();
  res.json({ success: true, message: 'Đã xóa lớp học.' });
};

// @desc   Add student to class
// @route  POST /api/classes/:id/students
// @access Private/Teacher
exports.addStudent = async (req, res) => {
  const { studentId, classCode } = req.body;
  const cls = await Class.findById(req.params.id);
  if (!cls) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học.' });
  }

  let student;
  if (studentId) {
    student = await User.findById(studentId);
  }
  if (!student) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy học sinh.' });
  }

  if (cls.students.includes(student._id)) {
    return res.status(400).json({ success: false, message: 'Học sinh đã có trong lớp.' });
  }

  cls.students.push(student._id);
  await cls.save();

  const updatedClass = await Class.findById(cls._id).populate('students', 'name avatar email');
  res.json({ success: true, data: updatedClass });
};

// @desc   Remove student from class
// @route  DELETE /api/classes/:id/students/:studentId
// @access Private/Teacher
exports.removeStudent = async (req, res) => {
  const cls = await Class.findById(req.params.id);
  if (!cls) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học.' });
  }

  cls.students = cls.students.filter(s => s.toString() !== req.params.studentId);
  await cls.save();

  res.json({ success: true, message: 'Đã xóa học sinh khỏi lớp.' });
};

// @desc   Join class by code
// @route  POST /api/classes/join
// @access Private/Student
exports.joinClass = async (req, res) => {
  const { code } = req.body;
  const cls = await Class.findOne({ code: code.toUpperCase(), isActive: true });

  if (!cls) {
    return res.status(404).json({ success: false, message: 'Mã lớp học không tồn tại.' });
  }

  if (cls.students.includes(req.user._id)) {
    return res.status(400).json({ success: false, message: 'Bạn đã tham gia lớp này rồi.' });
  }

  cls.students.push(req.user._id);
  await cls.save();

  const updatedClass = await Class.findById(cls._id).populate('teacher', 'name avatar');
  res.json({ success: true, data: updatedClass, message: `Tham gia lớp ${cls.name} thành công!` });
};
