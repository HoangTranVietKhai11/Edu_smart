import { useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, classAPI } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  Title, Text, Grid, Paper, Group, ThemeIcon, Skeleton, 
  UnstyledButton, Stack, Box, Badge, SimpleGrid, Modal, TextInput, Button, Alert
} from '@mantine/core';
import { 
  School, CheckCircle, FileText, Star, 
  BookOpen, AlertTriangle, FileQuestion, Bot,
  Bell, CheckCircle2, XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <Paper withBorder p="md" radius="md" className="transition-all hover:shadow-md text-center">
    <ThemeIcon color={color} variant="light" size={48} radius="xl" mx="auto" mb="sm">
      <Icon size={24} />
    </ThemeIcon>
    <Text fw={700} size="xl" style={{ color: `var(--mantine-color-${color}-6)` }}>
      {value ?? '—'}
    </Text>
    <Text c="dimmed" size="xs" fw={500} mt={4}>
      {label}
    </Text>
  </Paper>
);

export default function StudentDashboard() {
  const [joinCode, setJoinCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ['studentDashboard'],
    queryFn: () => dashboardAPI.getStudent(),
  });

  const joinMutation = useMutation({
    mutationFn: (code) => classAPI.join(code),
    onSuccess: (res) => {
      toast.success(res.message || 'Tham gia lớp học thành công!');
      setShowJoinModal(false);
      setJoinCode('');
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Lỗi khi tham gia lớp học');
    }
  });

  const handleJoinClass = (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return toast.error('Vui lòng nhập mã lớp');
    joinMutation.mutate(joinCode.trim());
  };

  if (isLoading) {
    return (
      <Box p="md">
        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
          {[1,2,3,4].map(i => <Skeleton key={i} height={120} radius="md" />)}
        </SimpleGrid>
      </Box>
    );
  }

  const data = response?.data;
  const { stats, myClasses = [], recentExamResults = [], recentAnnouncements = [] } = data || {};

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <Title order={2} className="text-slate-800">Tổng Quan Học Tập</Title>
        <Text c="dimmed" size="sm">Theo dõi tiến độ học tập của bạn</Text>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <StatCard icon={School} label="Lớp học" value={stats?.totalClasses} color="blue" />
        <StatCard icon={FileText} label="Đã kiểm tra" value={stats?.totalExamsTaken} color="violet" />
        <StatCard icon={Star} label="Điểm TB" value={`${stats?.averageScore || 0}%`} color="orange" />
      </SimpleGrid>



      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" mb="md">
          <Title order={4}>Lớp học của tôi</Title>
          <Button size="xs" color="blue" onClick={() => setShowJoinModal(true)}>
            + Tham gia lớp
          </Button>
        </Group>

        {myClasses.length === 0 ? (
          <Text c="dimmed" size="sm" ta="center" py="xl">
            Bạn chưa tham gia lớp học nào.<br/>Nhờ giáo viên cung cấp mã lớp để tham gia.
          </Text>
        ) : (
          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
            {myClasses.map(cls => (
              <Paper key={cls._id} withBorder p="md" radius="md" className="hover:border-blue-300 transition-colors">
                <Group wrap="nowrap" align="flex-start">
                  <ThemeIcon size={40} radius="md" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                    <Text fw={700}>{cls.subject?.[0]}</Text>
                  </ThemeIcon>
                  <Box>
                    <Text fw={600} size="sm">{cls.name}</Text>
                    <Text size="xs" c="dimmed">{cls.subject} - {cls.grade}</Text>
                    <Text size="xs" mt="xs" c="dimmed">Giáo viên: {cls.teacher?.name}</Text>
                  </Box>
                </Group>
              </Paper>
            ))}
          </SimpleGrid>
        )}
      </Paper>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        {[
          { to: '/student/documents', icon: BookOpen, label: 'Tài liệu học', desc: 'Xem & tải tài liệu', color: 'blue' },
          { to: '/student/exams', icon: FileQuestion, label: 'Bài kiểm tra', desc: 'Làm & xem kết quả', color: 'violet' },
          { to: '/student/ai-chat', icon: Bot, label: 'Hỏi AI', desc: 'Trợ lý 24/7', color: 'teal' },
        ].map(item => (
          <UnstyledButton 
            key={item.to} 
            component={Link} 
            to={item.to}
            className={`p-4 rounded-xl text-center transition-all bg-${item.color}-50 hover:bg-${item.color}-100`}
          >
            <ThemeIcon color={item.color} variant="transparent" size={48} mx="auto" mb="sm">
              <item.icon size={32} />
            </ThemeIcon>
            <Text fw={600} size="sm" className="text-slate-800">{item.label}</Text>
            <Text size="xs" c="dimmed" mt={4}>{item.desc}</Text>
          </UnstyledButton>
        ))}
      </SimpleGrid>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" radius="md" h="100%">
            <Title order={4} mb="md">Kết quả kiểm tra gần đây</Title>
            <Stack gap="sm">
              {recentExamResults.length === 0 ? (
                <Text c="dimmed" size="sm" ta="center" py="md">Chưa có kết quả nào</Text>
              ) : (
                recentExamResults.map(result => (
                  <Group key={result._id} wrap="nowrap" gap="md" className="p-2 rounded-md hover:bg-slate-50">
                    <ThemeIcon color={result.isPassed ? 'teal' : 'red'} variant="light" size={40} radius="md">
                      <Text fw={700} size="xs">{result.percentage}%</Text>
                    </ThemeIcon>
                    <Box style={{ flex: 1 }}>
                      <Text size="sm" fw={500} lineClamp={1}>{result.exam?.title}</Text>
                      <Text size="xs" c="dimmed">{new Date(result.submittedAt).toLocaleDateString('vi-VN')}</Text>
                    </Box>
                    <Badge color={result.isPassed ? 'teal' : 'red'} variant="light" leftSection={result.isPassed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}>
                      {result.isPassed ? 'Đạt' : 'Chưa đạt'}
                    </Badge>
                  </Group>
                ))
              )}
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" radius="md" h="100%">
            <Title order={4} mb="md">Thông báo mới nhất</Title>
            <Stack gap="sm">
              {recentAnnouncements.length === 0 ? (
                <Text c="dimmed" size="sm" ta="center" py="md">Không có thông báo mới</Text>
              ) : (
                recentAnnouncements.map(ann => (
                  <Box key={ann._id} className={`p-3 rounded-xl bg-${ann.type === 'info' ? 'blue' : ann.type === 'warning' ? 'orange' : 'red'}-50`}>
                    <Text size="sm" fw={600} className="text-slate-800">{ann.title}</Text>
                    <Text size="xs" c="dimmed" mt={2} lineClamp={2}>{ann.content}</Text>
                    <Text size="xs" c="dimmed" mt={4}>{new Date(ann.createdAt).toLocaleDateString('vi-VN')}</Text>
                  </Box>
                ))
              )}
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

      <Modal opened={showJoinModal} onClose={() => setShowJoinModal(false)} title="Tham gia lớp học" centered>
        <form onSubmit={handleJoinClass}>
          <TextInput
            label="Mã lớp học"
            placeholder="VD: CLASS-1234"
            required
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            description="Hãy hỏi giáo viên để nhận mã lớp học"
            className="uppercase"
            styles={{ input: { textTransform: 'uppercase', letterSpacing: '1px' } }}
          />
          <Group justify="flex-end" mt="xl">
            <Button variant="default" onClick={() => setShowJoinModal(false)}>Hủy</Button>
            <Button type="submit" color="blue" loading={joinMutation.isPending} disabled={!joinCode}>
              Tham gia ngay
            </Button>
          </Group>
        </form>
      </Modal>
    </motion.div>
  );
}
