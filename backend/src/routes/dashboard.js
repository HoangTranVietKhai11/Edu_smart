const express = require('express');
const router = express.Router();
const { getTeacherDashboard, getStudentDashboard, getTeacherProfile } = require('../controllers/dashboardController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

router.get('/teacher', protect, authorize('teacher'), getTeacherDashboard);
router.get('/student', protect, authorize('student'), getStudentDashboard);
router.get('/teacher-profile', optionalAuth, getTeacherProfile);

module.exports = router;
