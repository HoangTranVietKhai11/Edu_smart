const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Vui lòng nhập tên bài kiểm tra'],
    trim: true,
  },
  description: { type: String, default: '' },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
  }],
  duration: {
    type: Number,
    required: [true, 'Vui lòng nhập thời gian làm bài (phút)'],
    min: [1, 'Thời gian tối thiểu là 1 phút'],
  },
  openAt: {
    type: Date,
    required: [true, 'Vui lòng chọn thời gian mở đề'],
  },
  closeAt: {
    type: Date,
    required: [true, 'Vui lòng chọn thời gian đóng đề'],
  },
  totalPoints: { type: Number, default: 10 },
  passingScore: { type: Number, default: 5 },
  shuffleQuestions: { type: Boolean, default: false },
  shuffleOptions: { type: Boolean, default: false },
  showResult: { type: Boolean, default: true },
  maxAttempts: { type: Number, default: 1 },
  subject: { type: String, default: '' },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isPublished: { type: Boolean, default: false },
}, { timestamps: true });

// Virtual: isActive
examSchema.virtual('isActive').get(function () {
  const now = new Date();
  return this.isPublished && now >= this.openAt && now <= this.closeAt;
});

examSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Exam', examSchema);
