import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { examAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Card, Text, Badge, Button, Group, Stack, SimpleGrid, ThemeIcon, Skeleton } from '@mantine/core';
import { Clock, Target, Calendar, CheckCircle2, AlertCircle, FileQuestion, ArrowRight } from 'lucide-react';

export default function ExamListPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = '📝 Bài Kiểm Tra - EduSmart';
    examAPI.getAll()
      .then(res => setExams(res.data || []))
      .catch(() => toast.error('Lỗi tải danh sách bài kiểm tra'))
      .finally(() => setLoading(false));
  }, []);

  const getExamStatus = (exam) => {
    const now = new Date();
    const open = new Date(exam.openAt);
    const close = new Date(exam.closeAt);
    
    // Check if user has already taken it
    if (exam.myResult) {
      if (exam.myResult.status === 'submitted') {
        return { state: 'completed', text: 'Đã nộp bài', color: 'blue', btn: 'Xem kết quả', action: `/student/exams/${exam._id}/result` };
      }
      return { state: 'in-progress', text: 'Đang làm', color: 'yellow', btn: 'Tiếp tục', action: `/student/exams/${exam._id}/take` };
    }
    
    // Not taken yet
    if (now < open) return { state: 'upcoming', text: 'Chưa mở', color: 'gray', btn: 'Chưa thể làm', disabled: true };
    if (now > close) return { state: 'missed', text: 'Quá hạn', color: 'red', btn: 'Đã đóng', disabled: true };
    
    return { state: 'available', text: 'Đang mở', color: 'teal', btn: 'Bắt đầu làm bài', action: `/student/exams/${exam._id}/take` };
  };

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-8">
        <Text size="xl" fw={700} className="text-slate-800 flex items-center gap-2">
          <ThemeIcon color="violet" variant="light" size="lg" radius="md">
            <FileQuestion size={20} />
          </ThemeIcon>
          Bài Kiểm Tra
        </Text>
        <Text c="dimmed" size="sm" mt={4}>Danh sách các bài kiểm tra, thi thử từ giáo viên của bạn</Text>
      </div>

      {loading ? (
        <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
          {[1,2,3,4].map(i => <Skeleton key={i} height={220} radius="md" />)}
        </SimpleGrid>
      ) : exams.length === 0 ? (
        <Card withBorder radius="md" p="xl" className="text-center bg-slate-50 border-dashed">
          <ThemeIcon size={64} radius="xl" variant="light" color="gray" mx="auto" mb="md">
            <FileQuestion size={32} />
          </ThemeIcon>
          <Text fw={700} size="lg">Chưa có bài kiểm tra nào</Text>
          <Text c="dimmed" size="sm" mt="xs">Giáo viên chưa giao bài kiểm tra nào cho lớp của bạn.</Text>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
          {exams.map(exam => {
            const status = getExamStatus(exam);
            return (
              <Card key={exam._id} withBorder radius="md" padding="0" className="flex flex-col hover:border-violet-300 transition-colors hover:shadow-md">
                <div className="p-5 flex-1">
                  <Group justify="space-between" mb="sm">
                    <Badge color={status.color} variant="light">{status.text}</Badge>
                    <Badge color="gray" variant="transparent" size="sm">
                      Lượt: {exam.myResult ? 1 : 0}/{exam.maxAttempts}
                    </Badge>
                  </Group>
                  
                  <Text fw={700} size="lg" lineClamp={2} mb="xs">{exam.title}</Text>
                  <Text c="violet.6" fw={500} size="sm" mb="md">{exam.class?.name}</Text>
                  
                  <Stack gap="xs">
                    <Group gap="xs" wrap="nowrap">
                      <Clock size={16} className="text-slate-400 shrink-0" />
                      <Text size="sm" c="dimmed">Thời gian: <Text component="span" fw={600} c="slate.7">{exam.duration} phút</Text></Text>
                    </Group>
                    <Group gap="xs" wrap="nowrap">
                      <Target size={16} className="text-slate-400 shrink-0" />
                      <Text size="sm" c="dimmed">Điểm đạt: <Text component="span" fw={600} c="slate.7">{exam.passingScore}/{exam.totalPoints}</Text></Text>
                    </Group>
                    <Group gap="xs" wrap="nowrap" align="flex-start">
                      <Calendar size={16} className="text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <Text size="xs" c="dimmed">
                          {new Date(exam.openAt).toLocaleString('vi-VN', {hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'})} 
                          {' - '}
                          {new Date(exam.closeAt).toLocaleString('vi-VN', {hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'})}
                        </Text>
                      </div>
                    </Group>
                  </Stack>
                </div>
                
                <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {exam.myResult && exam.myResult.status === 'submitted' ? (
                    <Group gap="xs">
                      <Text size="sm" fw={500} c="slate.5">Điểm:</Text>
                      <Text fw={700} c={exam.myResult.isPassed ? 'teal.6' : 'red.6'}>
                        {exam.myResult.totalScore}/{exam.totalPoints}
                      </Text>
                      {exam.myResult.isPassed ? <CheckCircle2 size={16} className="text-teal-500" /> : <AlertCircle size={16} className="text-red-500" />}
                    </Group>
                  ) : (
                    <Text size="xs" c="dimmed" fs="italic" className="hidden sm:block">
                      {status.state === 'missed' ? 'Đã bỏ lỡ' : 'Hãy chuẩn bị kỹ'}
                    </Text>
                  )}
                  
                  <Button 
                    component={status.disabled ? 'button' : Link}
                    to={status.disabled ? undefined : status.action}
                    disabled={status.disabled}
                    color={status.state === 'completed' ? 'gray' : 'violet'}
                    variant={status.state === 'completed' ? 'light' : 'filled'}
                    fullWidth
                    className="sm:w-auto"
                    rightSection={!status.disabled && <ArrowRight size={16} />}
                  >
                    {status.btn}
                  </Button>
                </div>
              </Card>
            );
          })}
        </SimpleGrid>
      )}
    </div>
  );
}
