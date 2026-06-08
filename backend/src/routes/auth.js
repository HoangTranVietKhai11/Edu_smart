const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword, tutorialDone } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, uploadImage, updateProfile);
router.post('/change-password', protect, changePassword);
router.post('/tutorial-done', protect, tutorialDone);

module.exports = router;
