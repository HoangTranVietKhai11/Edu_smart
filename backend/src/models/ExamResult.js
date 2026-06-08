const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  answer: { type: String, default: '' },
  selectedOption: { type: mongoose.Schema.Types.ObjectId },
  isCorrect: { type: Boolean, default: false },
  points: { type: Number, default: 0 },
}, { _id: false });

const examResultSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  answers: [answerSchema],
  totalScore: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  isPassed: { type: Boolean, default: false },
  attemptNumber: { type: Number, default: 1 },
  startedAt: { type: Date, required: true },
  submittedAt: { type: Date },
  timeSpent: { type: Number, default: 0 }, // in seconds
  status: {
    type: String,
    enum: ['in-progress', 'submitted', 'graded'],
    default: 'in-progress',
  },
  teacherComment: { type: String, default: '' },
  cheatWarnings: { type: Number, default: 0 },
  isCheated: { type: Boolean, default: false },
}, { timestamps: true });

// Compound index: one result per student per exam attempt
examResultSchema.index({ exam: 1, student: 1, attemptNumber: 1 }, { unique: true });

module.exports = mongoose.model('ExamResult', examResultSchema);
