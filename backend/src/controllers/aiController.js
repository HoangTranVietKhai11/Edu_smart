const axios = require('axios');
const AIChat = require('../models/AIChat');
const Document = require('../models/Document');
const path = require('path');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// @desc   Send chat message
// @route  POST /api/ai/chat
// @access Private
exports.chat = async (req, res) => {
  const { message, chatId, classId } = req.body;

  // Get or create chat session
  let chat;
  if (chatId) {
    chat = await AIChat.findById(chatId);
  }
  if (!chat) {
    chat = await AIChat.create({
      user: req.user._id,
      class: classId,
      messages: [],
      title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
    });
  }

  // Add user message
  chat.messages.push({ role: 'user', content: message });

  try {
    // Call AI service
    const response = await axios.post(`${AI_SERVICE_URL}/chat/`, {
      message,
      user_id: req.user._id.toString(),
      class_id: classId,
      history: chat.messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
      student_name: req.user.name,
    }, { timeout: 30000 });

    const { reply, sources } = response.data;

    // Add assistant message
    chat.messages.push({
      role: 'assistant',
      content: reply,
      sources: sources || [],
    });

    await chat.save();

    res.json({
      success: true,
      data: {
        chatId: chat._id,
        reply,
        sources: sources || [],
      },
    });
  } catch (error) {
    // Fallback response
    const fallbackReply = 'Xin lỗi, AI assistant đang gặp sự cố. Vui lòng thử lại sau.';
    chat.messages.push({ role: 'assistant', content: fallbackReply });
    await chat.save();

    res.json({
      success: true,
      data: { chatId: chat._id, reply: fallbackReply, sources: [] },
    });
  }
};

// @desc   Analyze image (OCR + AI guidance)
// @route  POST /api/ai/analyze-image
// @access Private
exports.analyzeImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Vui lòng tải lên hình ảnh.' });
  }

  const { question } = req.body;
  const imagePath = path.join(__dirname, '../', `/uploads/images/${req.file.filename}`);

  try {
    const response = await axios.post(`${AI_SERVICE_URL}/ocr/analyze`, {
      image_path: imagePath,
      question: question || '',
      student_name: req.user.name,
    }, { timeout: 30000 });

    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Không thể phân tích ảnh. Vui lòng thử lại.',
    });
  }
};

// @desc   Get chat history
// @route  GET /api/ai/chats
// @access Private
exports.getChatHistory = async (req, res) => {
  const chats = await AIChat.find({ user: req.user._id })
    .select('title totalMessages createdAt updatedAt')
    .sort('-updatedAt')
    .limit(20);
  res.json({ success: true, data: chats });
};

// @desc   Get single chat
// @route  GET /api/ai/chats/:id
// @access Private
exports.getChat = async (req, res) => {
  const chat = await AIChat.findOne({ _id: req.params.id, user: req.user._id });
  if (!chat) return res.status(404).json({ success: false, message: 'Không tìm thấy cuộc trò chuyện.' });
  res.json({ success: true, data: chat });
};

// @desc   Delete chat
// @route  DELETE /api/ai/chats/:id
// @access Private
exports.deleteChat = async (req, res) => {
  await AIChat.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ success: true, message: 'Đã xóa cuộc trò chuyện.' });
};
