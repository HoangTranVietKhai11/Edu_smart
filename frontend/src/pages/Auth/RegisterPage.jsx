import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  TextInput,
  PasswordInput,
  Select,
  Anchor,
  Paper,
  Title,
  Text,
  Container,
  Button
} from '@mantine/core';
import { Mail, Lock, User, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Đăng ký thành công! Đang chuyển hướng...');
      navigate(form.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
    } catch (err) {
      toast.error(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <Container size={420} my={40} w="100%">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg shadow-blue-200">
              E
            </div>
            <Title order={2} ta="center" className="text-slate-800">
              Tạo tài khoản mới
            </Title>
            <Text c="dimmed" size="sm" ta="center" mt={5}>
              Đã có tài khoản?{' '}
              <Anchor size="sm" component={Link} to="/login" className="font-semibold text-blue-600">
                Đăng nhập
              </Anchor>
            </Text>
          </div>

          <Paper withBorder shadow="md" p={30} mt={30} radius="md" component="form" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <TextInput
                label="Họ và Tên"
                placeholder="Nguyễn Văn A"
                required
                leftSection={<User size={16} />}
                value={form.name}
                onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
              />
              
              <TextInput
                label="Email"
                placeholder="you@edusmart.vn"
                required
                type="email"
                leftSection={<Mail size={16} />}
                value={form.email}
                onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
              />

              <PasswordInput
                label="Mật khẩu"
                placeholder="Nhập mật khẩu"
                required
                leftSection={<Lock size={16} />}
                value={form.password}
                onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
              />

            </div>
            
            <Button fullWidth mt="xl" size="md" type="submit" loading={loading} color="blue">
              Tạo tài khoản
            </Button>
          </Paper>
        </motion.div>
      </Container>
    </div>
  );
}
