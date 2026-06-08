const express = require('express');
const router = express.Router();
const { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } = require('../controllers/announcementController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getAnnouncements);
router.post('/', protect, authorize('teacher'), createAnnouncement);
router.put('/:id', protect, authorize('teacher'), updateAnnouncement);
router.delete('/:id', protect, authorize('teacher'), deleteAnnouncement);

module.exports = router;
