const express = require('express');
const router = express.Router();
const { getExams, getExam, createExam, updateExam, deleteExam, addQuestion, updateQuestion, deleteQuestion, submitExam, getExamResults, extractQuestionsFromFile } = require('../controllers/examController');
const { protect, authorize } = require('../middleware/auth');
const { uploadDocument } = require('../middleware/upload');

router.get('/', protect, getExams);
router.post('/', protect, authorize('teacher'), createExam);
router.get('/:id', protect, getExam);
router.put('/:id', protect, authorize('teacher'), updateExam);
router.delete('/:id', protect, authorize('teacher'), deleteExam);
router.post('/:id/questions', protect, authorize('teacher'), addQuestion);
router.put('/:id/questions/:qId', protect, authorize('teacher'), updateQuestion);
router.delete('/:id/questions/:qId', protect, authorize('teacher'), deleteQuestion);
router.post('/:id/submit', protect, authorize('student'), submitExam);
router.get('/:id/results', protect, getExamResults);
router.post('/:id/extract-from-file', protect, authorize('teacher'), uploadDocument, extractQuestionsFromFile);

module.exports = router;
