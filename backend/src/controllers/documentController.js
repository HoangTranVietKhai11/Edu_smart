const Document = require('../models/Document');
const Class = require('../models/Class');
const path = require('path');
const { getFileType, getFileUrl } = require('../middleware/upload');

// @desc   Get documents (with filters)
// @route  GET /api/documents
// @access Private
exports.getDocuments = async (req, res) => {
  const { classId, subject, chapter, topic, fileType, search, page = 1, limit = 20 } = req.query;

  const query = {};

  if (classId) query.class = classId;
  if (subject) query.subject = subject;
  if (chapter) query.chapter = chapter;
  if (topic) query.topic = topic;
  if (fileType) query.fileType = fileType;
  if (search) query.$text = { $search: search };

  // Students can only see documents from their classes
  if (req.user.role === 'student') {
    const myClasses = await Class.find({ students: req.user._id }).select('_id');
    const classIds = myClasses.map(c => c._id);
    if (classId && !classIds.some(id => id.toString() === classId)) {
      return res.status(403).json({ success: false, message: 'Bạn không thuộc lớp này.' });
    }
    if (!classId) query.class = { $in: classIds };
  } else if (req.user.role === 'teacher') {
    const myClasses = await Class.find({ teacher: req.user._id }).select('_id');
    const classIds = myClasses.map(c => c._id);
    if (!classId) query.class = { $in: classIds };
  }

  const skip = (page - 1) * limit;
  const [documents, total] = await Promise.all([
    Document.find(query)
      .populate('class', 'name subject grade')
      .populate('uploadedBy', 'name avatar')
      .populate('lesson', 'title date')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit)),
    Document.countDocuments(query),
  ]);

  res.json({
    success: true,
    count: documents.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    data: documents,
  });
};

// @desc   Get single document
// @route  GET /api/documents/:id
// @access Private
exports.getDocument = async (req, res) => {
  const doc = await Document.findById(req.params.id)
    .populate('class', 'name subject grade')
    .populate('uploadedBy', 'name avatar')
    .populate('lesson', 'title date content');

  if (!doc) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy tài liệu.' });
  }

  // Increment view count
  doc.viewCount += 1;
  await doc.save({ validateBeforeSave: false });

  res.json({ success: true, data: doc });
};

// @desc   Upload document
// @route  POST /api/documents
// @access Private/Teacher
exports.uploadDocument = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Vui lòng chọn file để tải lên.' });
  }

  const { title, description, classId, lessonId, subject, chapter, topic, tags } = req.body;

  const fileType = getFileType(req.file.mimetype);
  const fileUrl = getFileUrl(req.file.filename, req.file.mimetype);

  const doc = await Document.create({
    title: title || req.file.originalname,
    description,
    fileUrl,
    fileName: req.file.originalname,
    fileType,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    class: classId,
    lesson: lessonId,
    subject,
    chapter,
    topic,
    uploadedBy: req.user._id,
    tags: tags ? tags.split(',').map(t => t.trim()) : [],
  });

  const populated = await Document.findById(doc._id)
    .populate('class', 'name subject')
    .populate('uploadedBy', 'name avatar');

  res.status(201).json({ success: true, data: populated });
};

// @desc   Update document
// @route  PUT /api/documents/:id
// @access Private/Teacher
exports.updateDocument = async (req, res) => {
  let doc = await Document.findById(req.params.id);
  if (!doc) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy tài liệu.' });
  }
  if (doc.uploadedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Bạn không có quyền sửa tài liệu này.' });
  }

  const { title, description, subject, chapter, topic, tags, lessonId } = req.body;
  doc = await Document.findByIdAndUpdate(
    req.params.id,
    { title, description, subject, chapter, topic, lesson: lessonId, tags: tags ? tags.split(',').map(t => t.trim()) : doc.tags },
    { new: true }
  ).populate('class', 'name').populate('uploadedBy', 'name avatar');

  res.json({ success: true, data: doc });
};

// @desc   Delete document
// @route  DELETE /api/documents/:id
// @access Private/Teacher
exports.deleteDocument = async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy tài liệu.' });
  }
  if (doc.uploadedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa tài liệu này.' });
  }

  await doc.deleteOne();
  res.json({ success: true, message: 'Đã xóa tài liệu.' });
};

// @desc   Download document (increment count)
// @route  GET /api/documents/:id/download
// @access Private
exports.downloadDocument = async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy tài liệu.' });
  }

  doc.downloadCount += 1;
  await doc.save({ validateBeforeSave: false });

  res.json({ success: true, data: { fileUrl: doc.fileUrl, fileName: doc.fileName } });
};

// @desc   Trigger AI embedding for a document
// @route  POST /api/documents/:id/embed
// @access Private/Teacher
exports.embedDocument = async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy tài liệu.' });
  }

  // Proxy request to AI service
  const axios = require('axios');
  try {
    const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/rag/embed`, {
      document_id: doc._id.toString(),
      file_path: path.join(__dirname, '../', doc.fileUrl),
      file_type: doc.fileType,
      metadata: {
        title: doc.title,
        class_id: doc.class?.toString(),
        subject: doc.subject,
      },
    });

    doc.isEmbedded = true;
    doc.embeddedAt = new Date();
    doc.vectorIds = aiResponse.data.vector_ids || [];
    await doc.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Tài liệu đã được nhúng vào hệ thống AI.', data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Không thể kết nối đến AI service. Vui lòng thử lại.' });
  }
};
