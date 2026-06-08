import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
});

// Request interceptor - add auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
API.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Dispatch event instead of window.location.href to avoid full page reload
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default API;

// Auth
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
  changePassword: (data) => API.post('/auth/change-password', data),
  tutorialDone: () => API.post('/auth/tutorial-done'),
};

// Classes
export const classAPI = {
  getAll: () => API.get('/classes'),
  getOne: (id) => API.get(`/classes/${id}`),
  create: (data) => API.post('/classes', data),
  update: (id, data) => API.put(`/classes/${id}`, data),
  delete: (id) => API.delete(`/classes/${id}`),
  addStudent: (id, data) => API.post(`/classes/${id}/students`, data),
  removeStudent: (id, studentId) => API.delete(`/classes/${id}/students/${studentId}`),
  join: (code) => API.post('/classes/join', { code }),
};

// Documents
export const documentAPI = {
  getAll: (params) => API.get('/documents', { params }),
  getOne: (id) => API.get(`/documents/${id}`),
  upload: (formData) => API.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => API.put(`/documents/${id}`, data),
  delete: (id) => API.delete(`/documents/${id}`),
  download: (id) => API.get(`/documents/${id}/download`),
  embed: (id) => API.post(`/documents/${id}/embed`),
};

// Lessons
export const lessonAPI = {
  getAll: (classId) => API.get('/lessons', { params: { classId } }),
  getOne: (id) => API.get(`/lessons/${id}`),
  create: (data) => API.post('/lessons', data),
  update: (id, data) => API.put(`/lessons/${id}`, data),
  delete: (id) => API.delete(`/lessons/${id}`),
};

// Announcements
export const announcementAPI = {
  getAll: (params) => API.get('/announcements', { params }),
  create: (data) => API.post('/announcements', data),
  update: (id, data) => API.put(`/announcements/${id}`, data),
  delete: (id) => API.delete(`/announcements/${id}`),
};

// Blogs
export const blogAPI = {
  getAll: (params) => API.get('/blogs', { params }),
  getMine: () => API.get('/blogs/my'),
  getOne: (id) => API.get(`/blogs/${id}`),
  create: (data) => API.post('/blogs', data),
  update: (id, data) => API.put(`/blogs/${id}`, data),
  delete: (id) => API.delete(`/blogs/${id}`),
};

// Attendance
export const attendanceAPI = {
  getClassAttendance: (classId, params) => API.get(`/attendance/class/${classId}`, { params }),
  getStudentAttendance: (studentId) => API.get(`/attendance/student/${studentId}`),
  getMissedLessons: () => API.get('/attendance/missed'),
  create: (data) => API.post('/attendance', data),
  update: (id, data) => API.put(`/attendance/${id}`, data),
  getStats: (classId) => API.get(`/attendance/stats/${classId}`),
};

// Exams
export const examAPI = {
  getAll: (params) => API.get('/exams', { params }),
  getOne: (id) => API.get(`/exams/${id}`),
  create: (data) => API.post('/exams', data),
  update: (id, data) => API.put(`/exams/${id}`, data),
  delete: (id) => API.delete(`/exams/${id}`),
  addQuestion: (examId, data) => API.post(`/exams/${examId}/questions`, data),
  updateQuestion: (examId, qId, data) => API.put(`/exams/${examId}/questions/${qId}`, data),
  deleteQuestion: (examId, qId) => API.delete(`/exams/${examId}/questions/${qId}`),
  submit: (examId, data) => API.post(`/exams/${examId}/submit`, data),
  getResults: (examId) => API.get(`/exams/${examId}/results`),
  extractFromFile: (examId, formData) => API.post(`/exams/${examId}/extract-from-file`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// Dashboard
export const dashboardAPI = {
  getTeacher: () => API.get('/dashboard/teacher'),
  getStudent: () => API.get('/dashboard/student'),
  getTeacherProfile: () => API.get('/dashboard/teacher-profile'),
};

// AI
export const aiAPI = {
  chat: (data) => API.post('/ai/chat', data),
  analyzeImage: (formData) => API.post('/ai/analyze-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getChatHistory: () => API.get('/ai/chats'),
  getChat: (id) => API.get(`/ai/chats/${id}`),
  deleteChat: (id) => API.delete(`/ai/chats/${id}`),
};

// Users
export const userAPI = {
  getAll: () => API.get('/users'),
  getOne: (id) => API.get(`/users/${id}`),
};

// Admin
export const adminAPI = {
  getStats: () => API.get('/admin/stats'),
  getUsers: (params) => API.get('/admin/users', { params }),
  createUser: (data) => API.post('/admin/users', data),
  updateUser: (id, data) => API.put(`/admin/users/${id}`, data),
  deleteUser: (id) => API.delete(`/admin/users/${id}`),
  
  getClasses: () => API.get('/admin/classes'),
  createClass: (data) => API.post('/admin/classes', data),
  updateClass: (id, data) => API.put(`/admin/classes/${id}`, data),
  deleteClass: (id) => API.delete(`/admin/classes/${id}`),
  addStudentToClass: (id, data) => API.post(`/admin/classes/${id}/students`, data),
  removeStudentFromClass: (id, studentId) => API.delete(`/admin/classes/${id}/students/${studentId}`),
};
