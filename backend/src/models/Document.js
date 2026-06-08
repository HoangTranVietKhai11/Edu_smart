const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Vui lòng nhập tên tài liệu'],
    trim: true,
  },
  description: { type: String, default: '' },
  fileUrl: {
    type: String,
    required: [true, 'File URL là bắt buộc'],
  },
  fileName: { type: String, default: '' },
  fileType: {
    type: String,
    enum: ['pdf', 'docx', 'pptx', 'image', 'video', 'other'],
    required: true,
  },
  fileSize: { type: Number, default: 0 },
  mimeType: { type: String, default: '' },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
  },
  subject: { type: String, default: '' },
  chapter: { type: String, default: '' },
  topic: { type: String, default: '' },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  downloadCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  // RAG / AI embedding status
  isEmbedded: { type: Boolean, default: false },
  embeddedAt: { type: Date },
  vectorIds: [{ type: String }],
  tags: [{ type: String }],
  isPublic: { type: Boolean, default: true },
}, { timestamps: true });

// Text index for search
documentSchema.index({ title: 'text', description: 'text', tags: 'text', subject: 'text' });

module.exports = mongoose.model('Document', documentSchema);
