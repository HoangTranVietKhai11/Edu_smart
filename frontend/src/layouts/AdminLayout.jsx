import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppShell, Burger, Group, Avatar, Text, UnstyledButton, Menu, rem } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  LayoutDashboard, 
  Users, 
  LogOut,
  Home,
  Menu as MenuIcon,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Quản lý Người dùng' },
  { to: '/admin/classes', icon: BookOpen, label: 'Quản lý Lớp học' },
];

export default function AdminLayout() {
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
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <Text fw={700} size="lg" className="text-slate-800">EduSmart Admin</Text>
            </div>
          </Group>

          <Group>
            <Link to="/admin/dashboard" className="text-sm text-slate-500 hover:text-purple-600 flex items-center gap-1 transition-colors hidden sm:flex">
              <Home size={16} /> Trang chủ
            </Link>
            
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <UnstyledButton className="flex items-center gap-2 hover:bg-slate-100 p-1.5 sm:pr-3 rounded-full transition-colors">
                  <Avatar src={user?.avatar} radius="xl" size="sm" color="purple">
                    {user?.name?.[0]?.toUpperCase()}
                  </Avatar>
                  <Text size="sm" fw={500} className="text-slate-700 hidden sm:block">
                    {user?.name}
                  </Text>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Tài khoản Quản trị</Menu.Label>
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

      <AppShell.Navbar p="md" className="border-r border-slate-200 shadow-xl sm:shadow-none z-50">
        <div className="flex-1 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => { if(opened) toggle(); }}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-purple-50 text-purple-700 shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
                `}
              >
                <item.icon size={20} strokeWidth={2.5} className={isActive ? 'text-purple-600' : 'text-slate-400'} />
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
        <div className="h-full">
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
    </AppShell>
  );
}
