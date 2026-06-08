const express = require('express');
const router = express.Router();
const { getLessons, getLesson, createLesson, updateLesson, deleteLesson } = require('../controllers/lessonController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getLessons);
router.post('/', protect, authorize('teacher'), createLesson);
router.get('/:id', protect, getLesson);
router.put('/:id', protect, authorize('teacher'), updateLesson);
router.delete('/:id', protect, authorize('teacher'), deleteLesson);

module.exports = router;
