const User = require('../models/User');
const Class = require('../models/Class');

// @desc   Get all users with optional role filter
// @route  GET /api/admin/users
// @access Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter).select('-password').sort('-createdAt');
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// @desc   Create user manually by admin
// @route  POST /api/admin/users
// @access Private/Admin
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email đã được sử dụng' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      isFirstLogin: false
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// @desc   Update user role and status
// @route  PUT /api/admin/users/:id
// @access Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { role, isActive } = req.body;
    
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    // Prevent removing the last admin
    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Không thể hạ quyền Admin cuối cùng' });
      }
    }

    const updateData = {};
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).select('-password');

    res.json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// @desc   Delete a user
// @route  DELETE /api/admin/users/:id
// @access Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Không thể xóa Admin cuối cùng' });
      }
    }

    await user.deleteOne();
    res.json({ success: true, message: 'Đã xóa người dùng' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// @desc   Get statistics
// @route  GET /api/admin/stats
// @access Private/Admin
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalAdmins
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ================= CLASS MANAGEMENT =================

// @desc   Get all classes
// @route  GET /api/admin/classes
// @access Private/Admin
exports.getClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('teacher', 'name email')
      .populate('students', 'name email')
      .sort('-createdAt');
    res.json({ success: true, count: classes.length, data: classes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// @desc   Create class manually by admin
// @route  POST /api/admin/classes
// @access Private/Admin
exports.createClass = async (req, res) => {
  try {
    const { name, subject, grade, teacher, description } = req.body;

    if (!name || !subject || !grade || !teacher) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đủ thông tin lớp học (tên, môn, khối, giáo viên)' });
    }

    const teacherExists = await User.findOne({ _id: teacher, role: 'teacher' });
    if (!teacherExists) {
      return res.status(400).json({ success: false, message: 'Giáo viên không tồn tại hoặc không hợp lệ' });
    }

    const newClass = await Class.create({
      name,
      subject,
      grade,
      teacher,
      description
    });

    const populatedClass = await Class.findById(newClass._id).populate('teacher', 'name email');

    res.status(201).json({ success: true, data: populatedClass });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// @desc   Update class manually by admin
// @route  PUT /api/admin/classes/:id
// @access Private/Admin
exports.updateClass = async (req, res) => {
  try {
    const { name, subject, grade, teacher, description, isActive } = req.body;

    let classItem = await Class.findById(req.params.id);
    if (!classItem) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
    }

    if (teacher) {
      const teacherExists = await User.findOne({ _id: teacher, role: 'teacher' });
      if (!teacherExists) {
        return res.status(400).json({ success: false, message: 'Giáo viên không tồn tại hoặc không hợp lệ' });
      }
    }

    classItem = await Class.findByIdAndUpdate(
      req.params.id,
      { name, subject, grade, teacher, description, isActive },
      { new: true, runValidators: true }
    ).populate('teacher', 'name email').populate('students', 'name email');

    res.json({ success: true, data: classItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// @desc   Delete class by admin
// @route  DELETE /api/admin/classes/:id
// @access Private/Admin
exports.deleteClass = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
    }

    await classItem.deleteOne();
    res.json({ success: true, message: 'Đã xóa lớp học' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// @desc   Add student to class
// @route  POST /api/admin/classes/:id/students
// @access Private/Admin
exports.addStudentToClass = async (req, res) => {
  try {
    const { studentId } = req.body;
    
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ID học sinh' });
    }

    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy học sinh' });
    }

    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
    }

    if (classItem.students.includes(studentId)) {
      return res.status(400).json({ success: false, message: 'Học sinh đã có trong lớp này' });
    }

    classItem.students.push(studentId);
    await classItem.save();

    const updatedClass = await Class.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('students', 'name email');

    res.json({ success: true, data: updatedClass });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// @desc   Remove student from class
// @route  DELETE /api/admin/classes/:id/students/:studentId
// @access Private/Admin
exports.removeStudentFromClass = async (req, res) => {
  try {
    const { studentId } = req.params;

    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
    }

    classItem.students = classItem.students.filter(id => id.toString() !== studentId);
    await classItem.save();

    const updatedClass = await Class.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('students', 'name email');

    res.json({ success: true, data: updatedClass });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
