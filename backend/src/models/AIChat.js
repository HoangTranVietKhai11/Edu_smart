const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  sources: [{ title: String, excerpt: String }],
  timestamp: { type: Date, default: Date.now },
}, { _id: true });

const aiChatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: { type: String, default: 'Cuộc trò chuyện mới' },
  messages: [messageSchema],
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
  },
  context: { type: String, default: '' }, // Subject context
  totalMessages: { type: Number, default: 0 },
}, { timestamps: true });

// Update message count on save
aiChatSchema.pre('save', function (next) {
  this.totalMessages = this.messages.length;
  next();
});

module.exports = mongoose.model('AIChat', aiChatSchema);
