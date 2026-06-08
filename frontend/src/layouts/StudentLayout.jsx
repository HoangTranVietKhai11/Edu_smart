import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppShell, Burger, Group, Avatar, Text, UnstyledButton, Menu, rem } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  Bell, 
  Bot, 
  Image as ImageIcon,
  User, 
  LogOut,
  Home,
  Menu as MenuIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/student/documents', icon: BookOpen, label: 'Tài liệu học tập' },
  { to: '/student/exams', icon: FileText, label: 'Bài Kiểm tra' },
  { to: '/student/announcements', icon: Bell, label: 'Thông báo' },
  { to: '/student/ai-chat', icon: Bot, label: 'Trợ lý AI (Chat)' },
  { to: '/student/ai-image', icon: ImageIcon, label: 'Phân tích Ảnh' },
  { to: '/student/profile', icon: User, label: 'Hồ sơ' },
];

const mobileNavItems = [
  { to: '/student/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/student/documents', icon: BookOpen, label: 'Tài liệu' },
  { to: '/student/exams', icon: FileText, label: 'Kiểm tra' },
  { to: '/student/ai-chat', icon: Bot, label: 'AI Chat' },
];

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
      bg="gray.0"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            {/* Burger hidden completely on mobile because we use Bottom Bar */}
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" className="hidden" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <Text fw={700} size="lg" className="text-slate-800">EduSmart Học Sinh</Text>
            </div>
          </Group>

          <Group>
            <Link to="/student/dashboard" className="text-sm text-slate-500 hover:text-emerald-600 flex items-center gap-1 transition-colors hidden sm:flex">
              <Home size={16} /> Trang chủ
            </Link>
            
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <UnstyledButton className="flex items-center gap-2 hover:bg-slate-100 p-1.5 sm:pr-3 rounded-full transition-colors">
                  <Avatar src={user?.avatar} radius="xl" size="sm" color="teal">
                    {user?.name?.[0]?.toUpperCase()}
                  </Avatar>
                  <Text size="sm" fw={500} className="text-slate-700 hidden sm:block">
                    {user?.name}
                  </Text>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Tài khoản Học sinh</Menu.Label>
                <Menu.Item 
                  leftSection={<User style={{ width: rem(14), height: rem(14) }} />}
                  onClick={() => navigate('/student/profile')}
                >
                  Hồ sơ của tôi
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item 
                  color="red" 
                  leftSection={<LogOut style={{ width: rem(14), height: rem(14) }} />}
                  onClick={logout}
                >
                  Đăng xuất
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      {/* Sidebar for Desktop & Menu overlay for Mobile */}
      <AppShell.Navbar p="md" className="border-r border-slate-200 shadow-xl sm:shadow-none z-50">
        <div className="flex items-center justify-between sm:hidden mb-4 pb-4 border-b border-slate-100">
          <Text fw={600} className="text-slate-700">Menu</Text>
          <UnstyledButton onClick={toggle} className="p-2 text-slate-500 bg-slate-100 rounded-full">
            ✕
          </UnstyledButton>
        </div>
        <div className="flex-1 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            const tourClass = `tour-${item.to.split('/').pop()}`;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => { if(opened) toggle(); }}
                className={`
                  ${tourClass} flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
                `}
              >
                <item.icon size={20} strokeWidth={2.5} className={isActive ? 'text-emerald-600' : 'text-slate-400'} />
                {item.label}
              </NavLink>
            );
          })}
        </div>
        
        <div className="mt-auto pt-4 border-t border-slate-200">
          <UnstyledButton 
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} strokeWidth={2.5} />
            Đăng xuất
          </UnstyledButton>
        </div>
      </AppShell.Navbar>

      <AppShell.Main>
        <div className="h-full pb-16 sm:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </AppShell.Main>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center justify-around z-40 pb-safe">
        {mobileNavItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          return (
            <Link 
              key={item.to} 
              to={item.to} 
              className={`flex flex-col items-center justify-center w-16 py-2 transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}
            >
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} className="mb-1" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        {/* Menu Toggle */}
        <UnstyledButton 
          onClick={toggle} 
          className={`flex flex-col items-center justify-center w-16 py-2 transition-colors ${opened ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <MenuIcon size={24} strokeWidth={opened ? 2.5 : 2} className="mb-1" />
          <span className="text-[10px] font-medium">Khác</span>
        </UnstyledButton>
      </div>

      {/* Backdrop for mobile sidebar */}
      {opened && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 sm:hidden"
          onClick={toggle}
        />
      )}
    </AppShell>
  );
}
