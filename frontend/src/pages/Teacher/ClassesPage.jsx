import { useState } from 'react';
import { classAPI } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  Title, Text, Group, Button, Paper, TextInput, Textarea, 
  SimpleGrid, Modal, ThemeIcon, Badge, ActionIcon, Menu, Box, Skeleton
} from '@mantine/core';
import { 
  School, Plus, Copy, MoreVertical, Trash, Edit, Users
} from 'lucide-react';
import { useForm } from '@mantine/form';
import { motion } from 'framer-motion';

export default function ClassesPage() {
  const [opened, setOpened] = useState(false);
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: classAPI.getAll,
  });

  const form = useForm({
    initialValues: {
      name: '',
      subject: '',
      grade: '',
      description: ''
    },
    validate: {
      name: (val) => val.trim().length > 0 ? null : 'Vui lòng nhập tên lớp',
      subject: (val) => val.trim().length > 0 ? null : 'Vui lòng nhập môn học',
      grade: (val) => val.trim().length > 0 ? null : 'Vui lòng nhập khối',
    }
  });

  const createMutation = useMutation({
    mutationFn: (newClass) => classAPI.create(newClass),
    onSuccess: () => {
      toast.success('Tạo lớp học thành công!');
      setOpened(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Lỗi tạo lớp');
    }
  });

  const handleCreate = (values) => {
    createMutation.mutate(values);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Đã copy mã lớp!');
  };

  const classes = response?.data || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Group justify="space-between" align="center">
        <div>
          <Title order={2} className="text-slate-800 flex items-center gap-2">
            <School size={28} className="text-blue-600" /> Quản Lý Lớp Học
          </Title>
          <Text c="dimmed" size="sm">Tạo và quản lý các lớp học của bạn</Text>
        </div>
        <Button 
          leftSection={<Plus size={18} />} 
          color="blue" 
          onClick={() => setOpened(true)}
        >
          Tạo lớp mới
        </Button>
      </Group>

      {isLoading ? (
        <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
          {[1,2,3].map(i => <Skeleton key={i} height={160} radius="md" />)}
        </SimpleGrid>
      ) : (
        <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
          {classes.length === 0 ? (
            <Box className="col-span-full py-20 text-center">
              <ThemeIcon size={64} variant="light" color="gray" mx="auto" mb="md">
                <School size={32} />
              </ThemeIcon>
              <Text c="dimmed" size="lg">Chưa có lớp học nào.</Text>
              <Button mt="md" variant="light" onClick={() => setOpened(true)}>Tạo lớp học đầu tiên</Button>
            </Box>
          ) : (
            classes.map(cls => (
              <Paper key={cls._id} withBorder p="md" radius="md" className="hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3">
                  <Menu position="bottom-end" shadow="sm">
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray">
                        <MoreVertical size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item leftSection={<Edit size={14} />}>Chỉnh sửa</Menu.Item>
                      <Menu.Item color="red" leftSection={<Trash size={14} />}>Xóa lớp</Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </div>

                <Group wrap="nowrap" align="flex-start" mb="md">
                  <ThemeIcon size={48} radius="md" variant="gradient" gradient={{ from: 'blue', to: 'indigo' }}>
                    <Text fw={700} size="xl">{cls.subject?.[0]}</Text>
                  </ThemeIcon>
                  <Box>
                    <Text fw={700} size="lg" className="text-slate-800" lineClamp={1}>{cls.name}</Text>
                    <Text size="sm" c="dimmed">{cls.subject} - Khối {cls.grade}</Text>
                  </Box>
                </Group>

                <Group justify="space-between" align="flex-end" mt="auto" pt="sm" className="border-t border-slate-100">
                  <Box>
                    <Badge variant="light" color="blue" size="lg" className="font-mono tracking-wider cursor-pointer" onClick={() => copyCode(cls.code)}>
                      {cls.code}
                    </Badge>
                    <Group gap="xs" mt={8}>
                      <Users size={14} className="text-slate-400" />
                      <Text size="xs" c="dimmed">{cls.students?.length || 0} học sinh</Text>
                    </Group>
                  </Box>
                  <ActionIcon variant="light" color="blue" onClick={() => copyCode(cls.code)} title="Copy mã lớp">
                    <Copy size={16} />
                  </ActionIcon>
                </Group>
              </Paper>
            ))
          )}
        </SimpleGrid>
      )}

      <Modal opened={opened} onClose={() => setOpened(false)} title="Tạo lớp học mới" centered>
        <form onSubmit={form.onSubmit(handleCreate)} className="space-y-4">
          <TextInput
            label="Tên lớp"
            placeholder="VD: Lớp Toán 12A1"
            withAsterisk
            {...form.getInputProps('name')}
          />
          <Group grow>
            <TextInput
              label="Môn học"
              placeholder="Toán, Lý, Hóa..."
              withAsterisk
              {...form.getInputProps('subject')}
            />
            <TextInput
              label="Khối lớp"
              placeholder="12, 11, 10..."
              withAsterisk
              {...form.getInputProps('grade')}
            />
          </Group>
          <Textarea
            label="Mô tả"
            placeholder="Mô tả ngắn về lớp học"
            rows={3}
            {...form.getInputProps('description')}
          />
          <Group justify="flex-end" mt="xl">
            <Button variant="default" onClick={() => setOpened(false)}>Hủy</Button>
            <Button type="submit" color="blue" loading={createMutation.isPending}>Tạo lớp</Button>
          </Group>
        </form>
      </Modal>
    </motion.div>
  );
}
