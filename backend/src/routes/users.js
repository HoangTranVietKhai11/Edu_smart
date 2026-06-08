const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// Get all students (Teacher only)
router.get('/', protect, authorize('teacher'), async (req, res) => {
  const students = await User.find({ role: 'student', isActive: true }).select('-password').sort('name');
  res.json({ success: true, data: students });
});

// Get single user
router.get('/:id', protect, async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
  res.json({ success: true, data: user });
});

// Deactivate user (Teacher only)
router.patch('/:id/deactivate', protect, authorize('teacher'), async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: 'Đã vô hiệu hóa tài khoản.' });
});

module.exports = router;
