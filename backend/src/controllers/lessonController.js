const Lesson = require('../models/Lesson');

exports.getLessons = async (req, res) => {
  const { classId } = req.query;
  const query = classId ? { class: classId } : {};
  const lessons = await Lesson.find(query)
    .populate('class', 'name subject')
    .populate('documents', 'title fileUrl fileType')
    .populate('createdBy', 'name')
    .sort('-date');
  res.json({ success: true, data: lessons });
};

exports.getLesson = async (req, res) => {
  const lesson = await Lesson.findById(req.params.id)
    .populate('class', 'name subject grade')
    .populate('documents', 'title fileUrl fileType fileSize')
    .populate('createdBy', 'name avatar');
  if (!lesson) return res.status(404).json({ success: false, message: 'Không tìm thấy bài học.' });
  res.json({ success: true, data: lesson });
};

exports.createLesson = async (req, res) => {
  req.body.createdBy = req.user._id;
  const lesson = await Lesson.create(req.body);
  res.status(201).json({ success: true, data: lesson });
};

exports.updateLesson = async (req, res) => {
  const lesson = await Lesson.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user._id },
    req.body,
    { new: true }
  );
  if (!lesson) return res.status(404).json({ success: false, message: 'Không tìm thấy bài học.' });
  res.json({ success: true, data: lesson });
};

exports.deleteLesson = async (req, res) => {
  await Lesson.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
  res.json({ success: true, message: 'Đã xóa bài học.' });
};
