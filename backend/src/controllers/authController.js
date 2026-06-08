const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isFirstLogin: user.isFirstLogin,
    },
  });
};

// @desc   Register student
// @route  POST /api/auth/register
// @access Public
exports.register = async (req, res) => {
  const { name, password, phone, school, grade } = req.body;
  const email = req.body.email?.trim().toLowerCase();

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Email đã được sử dụng.' });
  }

  const user = await User.create({
    name,
    email,
    password,
    role: 'student',
    phone,
    school,
    grade,
  });

  sendTokenResponse(user, 201, res);
};

// @desc   Login
// @route  POST /api/auth/login
// @access Public
exports.login = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu.' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng.' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng.' });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Tài khoản đã bị vô hiệu hóa.' });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
};

// @desc   Get current user
// @route  GET /api/auth/me
// @access Private
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, data: user });
};

// @desc   Update profile
// @route  PUT /api/auth/profile
// @access Private
exports.updateProfile = async (req, res) => {
  const allowedFields = [
    'name', 'phone', 'bio', 'specialization', 'subjects', 'experience',
    'achievements', 'education', 'teachingSchedule', 'tuitionFee', 'socialLinks',
    'school', 'grade', 'parentPhone', 'studentId',
  ];

  const updateData = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) updateData[field] = req.body[field];
  });

  if (req.file) {
    updateData.avatar = `/uploads/images/${req.file.filename}`;
  }

  const user = await User.findByIdAndUpdate(req.user._id, updateData, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, data: user });
};

// @desc   Change password
// @route  POST /api/auth/change-password
// @access Private
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng.' });
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Đổi mật khẩu thành công.' });
};

// @desc   Mark tutorial as seen
// @route  POST /api/auth/tutorial-done
// @access Private
exports.tutorialDone = async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { isFirstLogin: false });
  res.json({ success: true, message: 'Đã lưu trạng thái hướng dẫn.' });
};
