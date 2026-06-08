const Blog = require('../models/Blog');

exports.getBlogs = async (req, res) => {
  const { category, search, page = 1, limit = 12 } = req.query;
  const query = { isPublished: true };
  if (category) query.category = category;
  if (search) query.$text = { $search: search };

  const skip = (page - 1) * limit;
  const [blogs, total] = await Promise.all([
    Blog.find(query).populate('author', 'name avatar specialization').sort('-publishedAt').skip(skip).limit(Number(limit)),
    Blog.countDocuments(query),
  ]);

  res.json({ success: true, data: blogs, total, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.getBlog = async (req, res) => {
  const blog = await Blog.findOne({ $or: [{ _id: req.params.id }, { slug: req.params.id }], isPublished: true })
    .populate('author', 'name avatar specialization bio');
  if (!blog) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });
  blog.viewCount += 1;
  await blog.save({ validateBeforeSave: false });
  res.json({ success: true, data: blog });
};

exports.getMyBlogs = async (req, res) => {
  const blogs = await Blog.find({ author: req.user._id }).sort('-createdAt');
  res.json({ success: true, data: blogs });
};

exports.createBlog = async (req, res) => {
  req.body.author = req.user._id;
  if (req.file) req.body.coverImage = `/uploads/images/${req.file.filename}`;
  const blog = await Blog.create(req.body);
  res.status(201).json({ success: true, data: blog });
};

exports.updateBlog = async (req, res) => {
  if (req.file) req.body.coverImage = `/uploads/images/${req.file.filename}`;
  const blog = await Blog.findOneAndUpdate({ _id: req.params.id, author: req.user._id }, req.body, { new: true });
  if (!blog) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });
  res.json({ success: true, data: blog });
};

exports.deleteBlog = async (req, res) => {
  await Blog.findOneAndDelete({ _id: req.params.id, author: req.user._id });
  res.json({ success: true, message: 'Đã xóa bài viết.' });
};
