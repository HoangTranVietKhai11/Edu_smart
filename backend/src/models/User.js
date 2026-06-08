const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const teachingScheduleSchema = new mongoose.Schema({
  day: { type: String, required: true },
  time: { type: String, required: true },
  subject: { type: String, required: true },
  room: { type: String },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập họ tên'],
    trim: true,
    maxlength: [100, 'Tên không được vượt quá 100 ký tự'],
  },
  email: {
    type: String,
    required: [true, 'Vui lòng nhập email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'],
  },
  password: {
    type: String,
    required: [true, 'Vui lòng nhập mật khẩu'],
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
    select: false,
  },
  role: {
    type: String,
    enum: ['teacher', 'student', 'admin'],
    default: 'student',
  },
  avatar: { type: String, default: '' },
  phone: { type: String, default: '' },
  bio: { type: String, default: '' },
  // Teacher-specific fields
  specialization: { type: String, default: '' },
  subjects: [{ type: String }],
  experience: { type: Number, default: 0 },
  achievements: [{ type: String }],
  education: { type: String, default: '' },
  teachingSchedule: [teachingScheduleSchema],
  tuitionFee: { type: Number, default: 0 },
  socialLinks: {
    facebook: { type: String, default: '' },
    zalo: { type: String, default: '' },
    email: { type: String, default: '' },
  },
  // Student-specific fields
  studentId: { type: String, default: '' },
  grade: { type: String, default: '' },
  school: { type: String, default: '' },
  parentPhone: { type: String, default: '' },
  // Common
  isActive: { type: Boolean, default: true },
  isFirstLogin: { type: Boolean, default: true },
  lastLogin: { type: Date },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
