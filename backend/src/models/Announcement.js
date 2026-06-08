const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Vui lòng nhập tiêu đề thông báo'],
    trim: true,
  },
  content: {
    type: String,
    required: [true, 'Vui lòng nhập nội dung thông báo'],
  },
  type: {
    type: String,
    enum: ['schedule', 'exam', 'holiday', 'urgent', 'general', 'result'],
    default: 'general',
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
  },
  isPinned: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: true },
  attachments: [{ type: String }],
  scheduledAt: { type: Date },
  expiresAt: { type: Date },
}, { timestamps: true });

// Index for sorting
announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ isPinned: -1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
