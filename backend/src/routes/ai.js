const express = require('express');
const router = express.Router();
const { chat, analyzeImage, getChatHistory, getChat, deleteChat } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

router.post('/chat', protect, chat);
router.post('/analyze-image', protect, uploadImage, analyzeImage);
router.get('/chats', protect, getChatHistory);
router.get('/chats/:id', protect, getChat);
router.delete('/chats/:id', protect, deleteChat);

module.exports = router;
