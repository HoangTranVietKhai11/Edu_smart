import { Link } from 'react-router-dom';
import { examAPI } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  Title, Text, Group, Button, Paper, SimpleGrid, ThemeIcon, 
  Badge, ActionIcon, Menu, Box, Skeleton, Tooltip
} from '@mantine/core';
import { 
  FileText, Plus, MoreVertical, Trash, Edit, Clock, Calendar, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function ExamManagerPage() {
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: examAPI.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => examAPI.delete(id),
    onSuccess: () => {
      toast.success('Đã xóa bài kiểm tra');
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
    onError: () => {
      toast.error('Lỗi khi xóa bài kiểm tra');
    }
  });

  const handleDelete = (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài kiểm tra này? Mọi dữ liệu làm bài của học sinh sẽ bị mất!')) return;
    deleteMutation.mutate(id);
  };

  const getStatus = (exam) => {
    if (!exam.isPublished) return { text: 'Bản nháp', color: 'orange' };
    const now = new Date();
    const open = new Date(exam.openAt);
    const close = new Date(exam.closeAt);
    
    if (now < open) return { text: 'Sắp tới', color: 'blue' };
    if (now >= open && now <= close) return { text: 'Đang diễn ra', color: 'teal' };
    return { text: 'Đã kết thúc', color: 'gray' };
  };

  const exams = response?.data || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Group justify="space-between" align="center">
        <div>
          <Title order={2} className="text-slate-800 flex items-center gap-2">
            <FileText size={28} className="text-orange-600" /> Quản lý Bài Kiểm Tra
          </Title>
          <Text c="dimmed" size="sm">Tạo và quản lý các bài kiểm tra trắc nghiệm cho học sinh</Text>
        </div>
        <Button 
          component={Link} 
          to="/teacher/exams/create" 
          leftSection={<Plus size={18} />} 
          color="blue"
        >
          Tạo bài kiểm tra
        </Button>
      </Group>

      {isLoading ? (
        <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} height={200} radius="md" />)}
        </SimpleGrid>
      ) : exams.length === 0 ? (
        <Box className="py-20 text-center">
          <ThemeIcon size={64} variant="light" color="gray" mx="auto" mb="md">
            <FileText size={32} />
          </ThemeIcon>
          <Title order={3} className="text-slate-700" mb="xs">Chưa có bài kiểm tra nào</Title>
          <Text c="dimmed" mb="lg">Hãy tạo bài kiểm tra đầu tiên để đánh giá học sinh.</Text>
          <Button component={Link} to="/teacher/exams/create" color="blue">Tạo ngay</Button>
        </Box>
      ) : (
        <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
          {exams.map(exam => {
            const status = getStatus(exam);
            return (
              <Paper key={exam._id} withBorder p={0} radius="md" className="flex flex-col hover:shadow-md transition-all group overflow-hidden">
                <Box p="md" style={{ flex: 1 }}>
                  <Group justify="space-between" align="flex-start" mb="sm">
                    <Badge color={status.color} variant="light">{status.text}</Badge>
                  </Group>
                  
                  <Title order={4} className="text-slate-800" lineClamp={2} title={exam.title}>{exam.title}</Title>
                  <Text size="sm" fw={500} c="blue" mb="md">{exam.class?.name || 'Chưa gán lớp'}</Text>
                  
                  <div className="space-y-2 mt-4">
                    <Group gap="xs" wrap="nowrap">
                      <Clock size={14} className="text-slate-400 shrink-0" />
                      <Text size="sm" c="dimmed">{exam.duration} phút ({exam.questions?.length || 0} câu hỏi)</Text>
                    </Group>
                    <Group gap="xs" wrap="nowrap">
                      <Calendar size={14} className="text-slate-400 shrink-0" />
                      <Text size="sm" c="dimmed">{new Date(exam.openAt).toLocaleString('vi-VN', {hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit', year:'numeric'})}</Text>
                    </Group>
                    <Group gap="xs" wrap="nowrap">
                      <AlertCircle size={14} className="text-red-400 shrink-0" />
                      <Text size="sm" c="red.6">{new Date(exam.closeAt).toLocaleString('vi-VN', {hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit', year:'numeric'})}</Text>
                    </Group>
                  </div>
                </Box>
                
                <Box bg="gray.0" p="md" className="border-t border-slate-100">
                  <Group justify="space-between">
                    <Text size="xs" fw={500} c="dimmed">
                      Tổng điểm: {exam.totalPoints} (Đạt: {exam.passingScore})
                    </Text>
                    <Group gap="xs">
                      <Tooltip label="Chỉnh sửa bài kiểm tra">
                        <ActionIcon component={Link} to={`/teacher/exams/${exam._id}/edit`} variant="light" color="blue" size="md" radius="md">
                          <Edit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Xóa bài kiểm tra">
                        <ActionIcon onClick={() => handleDelete(exam._id)} variant="light" color="red" size="md" radius="md">
                          <Trash size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Button 
                        component={Link} 
                        to={`/teacher/exams/${exam._id}/results`}
                        variant="light" 
                        color="violet" 
                        size="xs"
                        radius="md"
                      >
                        Kết quả →
                      </Button>
                    </Group>
                  </Group>
                </Box>
              </Paper>
            );
          })}
        </SimpleGrid>
      )}
    </motion.div>
  );
}
