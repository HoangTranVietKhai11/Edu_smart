const express = require('express');
const router = express.Router();
const { getBlogs, getBlog, getMyBlogs, createBlog, updateBlog, deleteBlog } = require('../controllers/blogController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

router.get('/', optionalAuth, getBlogs);
router.get('/my', protect, authorize('teacher'), getMyBlogs);
router.get('/:id', optionalAuth, getBlog);
router.post('/', protect, authorize('teacher'), uploadImage, createBlog);
router.put('/:id', protect, authorize('teacher'), uploadImage, updateBlog);
router.delete('/:id', protect, authorize('teacher'), deleteBlog);

module.exports = router;
