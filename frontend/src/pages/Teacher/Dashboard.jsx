import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import { useQuery } from '@tanstack/react-query';
import { 
  Title, Text, Grid, Paper, Group, ThemeIcon, Skeleton, RingProgress, 
  UnstyledButton, Stack, Box, Badge, SimpleGrid, Anchor
} from '@mantine/core';
import { 
  Users, School, BookOpen, Target, FileText, Rss, Bell, Bot,
  File, FileText as FileTextIcon, Image as ImageIcon, Video, Paperclip, ChevronRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

const FILE_ICONS = { 
  pdf: <FileTextIcon size={20} className="text-red-500" />, 
  docx: <FileTextIcon size={20} className="text-blue-500" />, 
  pptx: <FileTextIcon size={20} className="text-orange-500" />, 
  image: <ImageIcon size={20} className="text-teal-500" />, 
  video: <Video size={20} className="text-purple-500" />, 
  other: <Paperclip size={20} className="text-gray-500" /> 
};

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <Paper withBorder p="md" radius="md" className="transition-all hover:shadow-md">
    <Group justify="space-between" align="flex-start">
      <div>
        <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
          {label}
        </Text>
        <Text fw={700} size="xl" mt="xs">
          {value ?? '—'}
        </Text>
        {sub && <Text c="dimmed" size="xs" mt={4}>{sub}</Text>}
      </div>
      <ThemeIcon color={color} variant="light" size={48} radius="md">
        <Icon size={24} />
      </ThemeIcon>
    </Group>
  </Paper>
);

export default function TeacherDashboard() {
  const { data: response, isLoading } = useQuery({
    queryKey: ['teacherDashboard'],
    queryFn: () => dashboardAPI.getTeacher(),
  });

  const data = response?.data;

  if (isLoading) {
    return (
      <Box p="md">
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
          {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} height={100} radius="md" />)}
        </SimpleGrid>
      </Box>
    );
  }

  const { stats, recentDocuments = [], recentExams = [] } = data || {};

  const chartData = [
    { name: 'Tài liệu', value: stats?.totalDocuments || 0, color: '#3b82f6' },
    { name: 'Bài kiểm tra', value: stats?.totalExams || 0, color: '#8b5cf6' },
    { name: 'Blog', value: stats?.totalBlogs || 0, color: '#06b6d4' },
    { name: 'Thông báo', value: stats?.totalAnnouncements || 0, color: '#f59e0b' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <Title order={2} className="text-slate-800">Dashboard Giáo Viên</Title>
        <Text c="dimmed" size="sm">Tổng quan hoạt động giảng dạy của bạn</Text>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        <StatCard icon={Users} label="Học sinh" value={stats?.totalStudents} color="blue" />
        <StatCard icon={School} label="Lớp học" value={stats?.totalClasses} color="violet" />
        <StatCard icon={BookOpen} label="Tài liệu" value={stats?.totalDocuments} color="cyan" />
        <StatCard icon={Target} label="Tỷ lệ qua" value={`${stats?.passRate || 0}%`} sub="bài kiểm tra" color="teal" />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        <StatCard icon={FileText} label="Bài kiểm tra" value={stats?.totalExams} color="orange" />
        <StatCard icon={Rss} label="Blog" value={stats?.totalBlogs} color="pink" />
        <StatCard icon={Bell} label="Thông báo" value={stats?.totalAnnouncements} color="indigo" />
        <StatCard icon={Bot} label="Lượt dùng AI" value={stats?.totalAIMessages} color="grape" />
      </SimpleGrid>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper withBorder p="md" radius="md" h="100%">
            <Title order={4} mb="lg">Tổng quan hoạt động</Title>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder p="md" radius="md" h="100%">
            <Title order={4} mb="md">Thao tác nhanh</Title>
            <Stack gap="xs">
              {[
                { to: '/teacher/classes', icon: School, label: 'Quản lý lớp học', color: 'blue' },
                { to: '/teacher/documents', icon: BookOpen, label: 'Upload tài liệu', color: 'teal' },
                { to: '/teacher/exams/create', icon: FileText, label: 'Tạo bài kiểm tra', color: 'orange' },
                { to: '/teacher/announcements', icon: Bell, label: 'Đăng thông báo', color: 'indigo' },
                { to: '/teacher/ai-chat', icon: Bot, label: 'Mở AI Assistant', color: 'grape' },
              ].map(item => (
                <UnstyledButton 
                  key={item.to} 
                  component={Link} 
                  to={item.to}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Group gap="sm">
                    <ThemeIcon color={item.color} variant="light" size="md" radius="md">
                      <item.icon size={16} />
                    </ThemeIcon>
                    <Text size="sm" fw={500}>{item.label}</Text>
                  </Group>
                  <ChevronRight size={16} className="text-slate-400" />
                </UnstyledButton>
              ))}
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" radius="md">
            <Group justify="space-between" mb="md">
              <Title order={4}>Tài liệu mới nhất</Title>
              <Anchor component={Link} to="/teacher/documents" size="xs">Xem tất cả</Anchor>
            </Group>
            
            <Stack gap="sm">
              {recentDocuments.length === 0 ? (
                <Text c="dimmed" size="sm" ta="center" py="md">Chưa có tài liệu nào</Text>
              ) : recentDocuments.map(doc => (
                <Group key={doc._id} wrap="nowrap" gap="md" className="p-2 rounded-md hover:bg-slate-50">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                    {FILE_ICONS[doc.fileType] || FILE_ICONS.other}
                  </div>
                  <Box style={{ flex: 1 }}>
                    <Text size="sm" fw={500} lineClamp={1}>{doc.title}</Text>
                    <Text size="xs" c="dimmed">{doc.class?.name} • {new Date(doc.createdAt).toLocaleDateString('vi-VN')}</Text>
                  </Box>
                  <Badge variant="light" color="gray" size="sm">{doc.downloadCount} tải</Badge>
                </Group>
              ))}
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" radius="md">
            <Group justify="space-between" mb="md">
              <Title order={4}>Bài kiểm tra gần đây</Title>
              <Anchor component={Link} to="/teacher/exams" size="xs">Xem tất cả</Anchor>
            </Group>

            <Stack gap="sm">
              {recentExams.length === 0 ? (
                <Text c="dimmed" size="sm" ta="center" py="md">Chưa có bài kiểm tra nào</Text>
              ) : recentExams.map(exam => {
                const now = new Date();
                const isOpen = exam.isPublished && now >= new Date(exam.openAt) && now <= new Date(exam.closeAt);
                return (
                  <Group key={exam._id} wrap="nowrap" gap="md" className="p-2 rounded-md hover:bg-slate-50">
                    <ThemeIcon color="orange" variant="light" size="lg" radius="md">
                      <FileText size={20} />
                    </ThemeIcon>
                    <Box style={{ flex: 1 }}>
                      <Text size="sm" fw={500} lineClamp={1}>{exam.title}</Text>
                      <Text size="xs" c="dimmed">{exam.class?.name} • {exam.duration} phút</Text>
                    </Box>
                    <Badge color={isOpen ? 'green' : 'gray'} variant="light">
                      {isOpen ? 'Đang mở' : 'Đóng'}
                    </Badge>
                  </Group>
                );
              })}
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </motion.div>
  );
}
