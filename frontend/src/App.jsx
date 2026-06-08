import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// Layouts
import MainLayout from './layouts/MainLayout';
import TeacherLayout from './layouts/TeacherLayout';
import StudentLayout from './layouts/StudentLayout';

// Public Pages
import HomePage from './pages/Home/HomePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';

// Teacher Pages
import TeacherDashboard from './pages/Teacher/Dashboard';
import ClassesPage from './pages/Teacher/ClassesPage';
import ClassDetailPage from './pages/Teacher/ClassDetailPage';
import DocumentsTeacherPage from './pages/Teacher/DocumentsPage';
import AttendancePage from './pages/Teacher/AttendancePage';
import AnnouncementsTeacherPage from './pages/Teacher/AnnouncementsPage';
import ExamManagerPage from './pages/Teacher/ExamManagerPage';
import ExamEditorPage from './pages/Teacher/ExamEditorPage';
import ExamResultsPage from './pages/Teacher/ExamResultsPage';
import TeacherProfileEdit from './pages/Teacher/ProfilePage';

// Student Pages
import StudentDashboard from './pages/Student/Dashboard';
import DocumentsStudentPage from './pages/Student/DocumentsPage';
import MissedLessonsPage from './pages/Student/MissedLessonsPage';
import AnnouncementsStudentPage from './pages/Student/AnnouncementsPage';
import ExamListPage from './pages/Student/ExamListPage';
import ExamTakePage from './pages/Student/ExamTakePage';
import ExamResultPage from './pages/Student/ExamResultPage';
import StudentProfilePage from './pages/Student/ProfilePage';

// AI Pages
import AIChatPage from './pages/AI/AIChatPage';
import AIImagePage from './pages/AI/AIImagePage';

// Admin Pages
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';
import UserManagementPage from './pages/Admin/UserManagementPage';
import AdminClassManagementPage from './pages/Admin/AdminClassManagementPage';

// Tutorial
import TutorialOverlay from './components/common/TutorialOverlay';

const PrivateRoute = ({ children, role }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="loading-spinner" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) {
    if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to={user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} replace />;
  }
  return children;
};

function AppRoutes() {
  const { user, isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated && user?.isFirstLogin && <TutorialOverlay />}
      <Routes>
        {/* Public routes with layout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
        </Route>

        {/* Auth routes - standalone, no MainLayout/AppShell */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Teacher routes */}
        <Route element={<PrivateRoute role="teacher"><TeacherLayout /></PrivateRoute>}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/profile" element={<TeacherProfileEdit />} />
          <Route path="/teacher/classes" element={<ClassesPage />} />
          <Route path="/teacher/classes/:id" element={<ClassDetailPage />} />
          <Route path="/teacher/documents" element={<DocumentsTeacherPage />} />
          <Route path="/teacher/attendance" element={<AttendancePage />} />
          <Route path="/teacher/announcements" element={<AnnouncementsTeacherPage />} />
          <Route path="/teacher/exams" element={<ExamManagerPage />} />
          <Route path="/teacher/exams/create" element={<ExamEditorPage />} />
          <Route path="/teacher/exams/:id/edit" element={<ExamEditorPage />} />
          <Route path="/teacher/exams/:id/results" element={<ExamResultsPage />} />
          <Route path="/teacher/ai-chat" element={<AIChatPage />} />
        </Route>

        {/* Student routes */}
        <Route element={<PrivateRoute role="student"><StudentLayout /></PrivateRoute>}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/profile" element={<StudentProfilePage />} />
          <Route path="/student/documents" element={<DocumentsStudentPage />} />
          <Route path="/student/missed-lessons" element={<MissedLessonsPage />} />
          <Route path="/student/announcements" element={<AnnouncementsStudentPage />} />
          <Route path="/student/exams" element={<ExamListPage />} />
          <Route path="/student/exams/:id/take" element={<ExamTakePage />} />
          <Route path="/student/exams/:id/result" element={<ExamResultPage />} />
          <Route path="/student/ai-chat" element={<AIChatPage />} />
          <Route path="/student/ai-image" element={<AIImagePage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<PrivateRoute role="admin"><AdminLayout /></PrivateRoute>}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="classes" element={<AdminClassManagementPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
