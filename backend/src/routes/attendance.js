const express = require('express');
const router = express.Router();
const { getClassAttendance, getStudentAttendance, getMissedLessons, createAttendance, updateAttendance, getAttendanceStats } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

router.get('/missed', protect, authorize('student'), getMissedLessons);
router.get('/class/:classId', protect, getClassAttendance);
router.get('/stats/:classId', protect, authorize('teacher'), getAttendanceStats);
router.get('/student/:studentId', protect, getStudentAttendance);
router.post('/', protect, authorize('teacher'), createAttendance);
router.put('/:id', protect, authorize('teacher'), updateAttendance);

module.exports = router;
