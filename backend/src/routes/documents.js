const express = require('express');
const router = express.Router();
const { getDocuments, getDocument, uploadDocument, updateDocument, deleteDocument, downloadDocument, embedDocument } = require('../controllers/documentController');
const { protect, authorize } = require('../middleware/auth');
const { uploadDocument: uploadMiddleware } = require('../middleware/upload');

router.get('/', protect, getDocuments);
router.post('/', protect, authorize('teacher'), uploadMiddleware, uploadDocument);
router.get('/:id', protect, getDocument);
router.put('/:id', protect, authorize('teacher'), updateDocument);
router.delete('/:id', protect, authorize('teacher'), deleteDocument);
router.get('/:id/download', protect, downloadDocument);
router.post('/:id/embed', protect, authorize('teacher'), embedDocument);

module.exports = router;
