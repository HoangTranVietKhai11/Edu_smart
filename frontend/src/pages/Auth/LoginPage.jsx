import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  TextInput,
  PasswordInput,
  Checkbox,
  Anchor,
  Paper,
  Title,
  Text,
  Container,
  Group,
  Button,
  Box
} from '@mantine/core';
import { Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
    } catch (err) {
      toast.error(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <Container size={420} my={40} w="100%">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg shadow-blue-200">
              E
            </div>
            <Title order={2} ta="center" className="text-slate-800">
              Đăng nhập EduSmart
            </Title>
            <Text c="dimmed" size="sm" ta="center" mt={5}>
              Chưa có tài khoản?{' '}
              <Anchor size="sm" component={Link} to="/register" className="font-semibold text-blue-600">
                Đăng ký ngay
              </Anchor>
            </Text>
          </div>

          <Paper withBorder shadow="md" p={30} mt={30} radius="md" component="form" onSubmit={handleSubmit}>
            <TextInput
              label="Email"
              placeholder="you@edusmart.vn"
              required
              leftSection={<Mail size={16} />}
              value={form.email}
              onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
            />
            
            <PasswordInput
              label="Mật khẩu"
              placeholder="Nhập mật khẩu"
              required
              mt="md"
              leftSection={<Lock size={16} />}
              value={form.password}
              onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
            />
            
            <Group justify="space-between" mt="lg">
              <Checkbox label="Ghi nhớ đăng nhập" size="sm" />
              <Anchor component="button" size="sm" type="button" c="dimmed">
                Quên mật khẩu?
              </Anchor>
            </Group>
            
            <Button fullWidth mt="xl" size="md" type="submit" loading={loading} color="blue">
              Đăng nhập
            </Button>

          </Paper>
        </motion.div>
      </Container>
    </div>
  );
}
