const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  day: { type: String, required: true },
  time: { type: String, required: true },
  room: { type: String, default: '' },
}, { _id: false });

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên lớp'],
    trim: true,
  },
  code: {
    type: String,
    unique: true,
    uppercase: true,
  },
  subject: {
    type: String,
    required: [true, 'Vui lòng chọn môn học'],
  },
  grade: { type: String, required: [true, 'Vui lòng chọn khối lớp'] },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  description: { type: String, default: '' },
  schedule: [scheduleSchema],
  coverImage: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  academicYear: { type: String, default: '' },
}, { timestamps: true });

// Auto-generate class code
classSchema.pre('save', function (next) {
  if (!this.code) {
    this.code = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

// Virtual: student count
classSchema.virtual('studentCount').get(function () {
  return this.students ? this.students.length : 0;
});

classSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Class', classSchema);
