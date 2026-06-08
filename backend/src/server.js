require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const { createServer } = require('http');

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const classRoutes = require('./routes/classes');
const documentRoutes = require('./routes/documents');
const lessonRoutes = require('./routes/lessons');
const announcementRoutes = require('./routes/announcements');
const blogRoutes = require('./routes/blogs');
const attendanceRoutes = require('./routes/attendance');
const examRoutes = require('./routes/exams');
const dashboardRoutes = require('./routes/dashboard');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');
const setupRoutes = require('./routes/setup'); // TEMPORARY - REMOVE AFTER USE

const app = express();
const httpServer = createServer(app);

// Connect to database
connectDB();

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/setup', setupRoutes); // TEMPORARY - REMOVE AFTER USE

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), service: 'EduSmart API' });
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 EduSmart API running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

module.exports = { app, httpServer };
