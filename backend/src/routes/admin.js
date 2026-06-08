const express = require('express');
const router = express.Router();
const { 
  getUsers, updateUser, deleteUser, getStats, createUser,
  getClasses, createClass, updateClass, deleteClass, addStudentToClass, removeStudentFromClass
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Protect all admin routes
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getStats);
router.route('/users')
  .get(getUsers)
  .post(createUser);

router.route('/users/:id')
  .put(updateUser)
  .delete(deleteUser);

// Classes management
router.route('/classes')
  .get(getClasses)
  .post(createClass);

router.route('/classes/:id')
  .put(updateClass)
  .delete(deleteClass);

router.route('/classes/:id/students')
  .post(addStudentToClass);

router.route('/classes/:id/students/:studentId')
  .delete(removeStudentFromClass);

module.exports = router;
