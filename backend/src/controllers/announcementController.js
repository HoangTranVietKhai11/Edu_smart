const Announcement = require('../models/Announcement');

// @desc   Get announcements
// @route  GET /api/announcements
// @access Private
exports.getAnnouncements = async (req, res) => {
  const { classId, type, page = 1, limit = 20 } = req.query;
  const query = {};

  if (classId) query.class = classId;
  if (type) query.type = type;

  const skip = (page - 1) * limit;
  const [announcements, total] = await Promise.all([
    Announcement.find(query)
      .populate('teacher', 'name avatar')
      .populate('class', 'name')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Announcement.countDocuments(query),
  ]);

  res.json({ success: true, count: announcements.length, total, data: announcements });
};

// @desc   Create announcement
// @route  POST /api/announcements
// @access Private/Teacher
exports.createAnnouncement = async (req, res) => {
  req.body.teacher = req.user._id;
  const announcement = await Announcement.create(req.body);
  const populated = await Announcement.findById(announcement._id)
    .populate('teacher', 'name avatar')
    .populate('class', 'name');
  res.status(201).json({ success: true, data: populated });
};

// @desc   Update announcement
// @route  PUT /api/announcements/:id
// @access Private/Teacher
exports.updateAnnouncement = async (req, res) => {
  const announcement = await Announcement.findOneAndUpdate(
    { _id: req.params.id, teacher: req.user._id },
    req.body,
    { new: true }
  ).populate('teacher', 'name avatar').populate('class', 'name');

  if (!announcement) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo.' });
  }
  res.json({ success: true, data: announcement });
};

// @desc   Delete announcement
// @route  DELETE /api/announcements/:id
// @access Private/Teacher
exports.deleteAnnouncement = async (req, res) => {
  await Announcement.findOneAndDelete({ _id: req.params.id, teacher: req.user._id });
  res.json({ success: true, message: 'Đã xóa thông báo.' });
};
