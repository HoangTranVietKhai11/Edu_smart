import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppShell, Group, Button, Text } from '@mantine/core';
import { LogIn, UserPlus, LogOut, LayoutDashboard } from 'lucide-react';

export default function MainLayout() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();

  return (
    <AppShell
      header={{ height: 60 }}
      padding="0"
    >
      <AppShell.Header className="bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <Group h="100%" px="md" justify="space-between" className="max-w-7xl mx-auto w-full">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <Text fw={700} size="lg" className="text-slate-800">EduSmart AI</Text>
          </Link>

          <Group>
            {isAuthenticated ? (
              <Group>
                <Button 
                  component={Link} 
                  to={user?.role === 'admin' ? '/admin/dashboard' : (user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard')}
                  variant="filled" 
                  color="blue" 
                  size="sm"
                  leftSection={<LayoutDashboard size={16} />}
                >
                  Dashboard
                </Button>
                <Button 
                  variant="light" 
                  color="red" 
                  size="sm" 
                  onClick={logout}
                  leftSection={<LogOut size={16} />}
                >
                  Đăng xuất
                </Button>
              </Group>
            ) : (
              <Group>
                <Button 
                  component={Link} 
                  to="/login" 
                  variant="default" 
                  size="sm"
                  leftSection={<LogIn size={16} />}
                >
                  Đăng nhập
                </Button>
                <Button 
                  component={Link} 
                  to="/register" 
                  variant="filled" 
                  color="blue" 
                  size="sm"
                  leftSection={<UserPlus size={16} />}
                >
                  Đăng ký
                </Button>
              </Group>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main className="bg-slate-50 min-h-screen flex flex-col">
        <div className="flex-1">
          <Outlet />
        </div>
        
        <footer className="bg-slate-800 text-slate-300 py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm">© 2026 EduSmart AI - Hệ thống hỗ trợ giảng dạy thông minh</p>
            <p className="text-xs mt-1 text-slate-400">Powered by AI & Mantine UI</p>
          </div>
        </footer>
      </AppShell.Main>
    </AppShell>
  );
}
