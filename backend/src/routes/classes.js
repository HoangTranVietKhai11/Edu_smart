const express = require('express');
const router = express.Router();
const { getClasses, getClass, createClass, updateClass, deleteClass, addStudent, removeStudent, joinClass } = require('../controllers/classController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getClasses);
router.post('/', protect, authorize('teacher'), createClass);
router.post('/join', protect, authorize('student'), joinClass);
router.get('/:id', protect, getClass);
router.put('/:id', protect, authorize('teacher'), updateClass);
router.delete('/:id', protect, authorize('teacher'), deleteClass);
router.post('/:id/students', protect, authorize('teacher'), addStudent);
router.delete('/:id/students/:studentId', protect, authorize('teacher'), removeStudent);

module.exports = router;
