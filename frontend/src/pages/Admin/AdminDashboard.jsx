import { useState, useEffect } from 'react';
import { Title, Card, Text, SimpleGrid, Group, RingProgress, Center } from '@mantine/core';
import { Users, Book, User, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalAdmins: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { title: 'Tổng người dùng', value: stats.totalUsers, icon: Users, color: 'blue', desc: 'Toàn hệ thống' },
    { title: 'Học sinh', value: stats.totalStudents, icon: Book, color: 'teal', desc: 'Đang hoạt động' },
    { title: 'Giáo viên', value: stats.totalTeachers, icon: User, color: 'orange', desc: 'Đang giảng dạy' },
    { title: 'Quản trị viên', value: stats.totalAdmins, icon: Shield, color: 'purple', desc: 'Quản lý hệ thống' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Title order={2} className="text-slate-800">Tổng quan Hệ thống</Title>
          <Text c="dimmed" size="sm">Theo dõi hoạt động của người dùng trên nền tảng.</Text>
        </div>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card shadow="sm" padding="lg" radius="md" withBorder className="h-full">
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed" fw={500}>{stat.title}</Text>
                <div className={`p-2 bg-${stat.color}-50 rounded-lg`}>
                  <stat.icon size={20} className={`text-${stat.color}-600`} />
                </div>
              </Group>
              
              <Group align="flex-end" gap="xs">
                <Text size="xl" fw={700} className="text-slate-800 text-3xl">
                  {loading ? '...' : stat.value}
                </Text>
              </Group>
              
              <Text size="xs" c="dimmed" mt="sm">
                {stat.desc}
              </Text>
            </Card>
          </motion.div>
        ))}
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Card withBorder radius="md" p="xl" className="shadow-sm">
          <Title order={4} mb="lg">Tỷ lệ Học sinh / Giáo viên</Title>
          <Center>
            <RingProgress
              size={200}
              thickness={20}
              label={
                <Text size="xl" ta="center" fw={700} className="text-slate-700">
                  {stats.totalTeachers > 0 ? (stats.totalStudents / stats.totalTeachers).toFixed(1) : 0}
                </Text>
              }
              sections={[
                { value: (stats.totalStudents / (stats.totalUsers || 1)) * 100, color: 'teal', tooltip: 'Học sinh' },
                { value: (stats.totalTeachers / (stats.totalUsers || 1)) * 100, color: 'orange', tooltip: 'Giáo viên' },
              ]}
            />
          </Center>
        </Card>
      </SimpleGrid>
    </div>
  );
}
