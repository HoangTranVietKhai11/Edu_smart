import { useState, useEffect } from 'react';
import { 
  Title, Card, Table, Text, Badge, Select, ActionIcon, Group, 
  Switch, Tooltip, Modal, Button, TextInput, PasswordInput
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Trash2, Edit, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const roleColors = {
  admin: 'purple',
  teacher: 'orange',
  student: 'teal'
};

const roleLabels = {
  admin: 'Quản trị viên',
  teacher: 'Giáo viên',
  student: 'Học sinh'
};

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'teacher'
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const url = filterRole === 'all' ? '/admin/users' : `/admin/users?role=${filterRole}`;
      const res = await api.get(url);
      setUsers(res.data);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filterRole]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', formData);
      toast.success('Tạo tài khoản thành công');
      closeCreate();
      setFormData({ name: '', email: '', password: '', role: 'teacher' });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi tạo tài khoản');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}`, { role: newRole });
      toast.success('Cập nhật quyền thành công');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi cập nhật');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/admin/users/${userId}`, { isActive: !currentStatus });
      toast.success(currentStatus ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi cập nhật');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/users/${selectedUser._id}`);
      toast.success('Xóa người dùng thành công');
      close();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi xóa người dùng');
    }
  };

  const confirmDelete = (user) => {
    setSelectedUser(user);
    open();
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title order={2} className="text-slate-800">Quản lý Người dùng</Title>
          <Text c="dimmed" size="sm">Xem, phân quyền và khóa tài khoản người dùng.</Text>
        </div>

        <Group className="w-full sm:w-auto">
          <Select
            data={[
              { value: 'all', label: 'Tất cả' },
              { value: 'student', label: 'Học sinh' },
              { value: 'teacher', label: 'Giáo viên' },
              { value: 'admin', label: 'Quản trị viên' },
            ]}
            value={filterRole}
            onChange={setFilterRole}
            placeholder="Lọc theo vai trò"
            className="flex-1 sm:w-48"
          />
          <Button leftSection={<Plus size={16} />} onClick={openCreate} color="blue">
            Tạo tài khoản
          </Button>
        </Group>
      </div>

      <Card shadow="sm" radius="md" withBorder>
        <div className="overflow-x-auto">
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Họ tên</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Vai trò</Table.Th>
                <Table.Th>Trạng thái</Table.Th>
                <Table.Th>Hành động</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {users.map((u) => (
                <Table.Tr key={u._id}>
                  <Table.Td fw={500}>{u.name}</Table.Td>
                  <Table.Td>{u.email}</Table.Td>
                  <Table.Td>
                    <Select
                      data={[
                        { value: 'student', label: 'Học sinh' },
                        { value: 'teacher', label: 'Giáo viên' },
                        { value: 'admin', label: 'Admin' },
                      ]}
                      value={u.role}
                      onChange={(val) => handleUpdateRole(u._id, val)}
                      variant="unstyled"
                      className={`w-32 bg-${roleColors[u.role]}-50 px-2 rounded font-medium text-${roleColors[u.role]}-700`}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Switch
                      checked={u.isActive}
                      onChange={() => handleToggleStatus(u._id, u.isActive)}
                      color="teal"
                      label={u.isActive ? "Hoạt động" : "Bị khóa"}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Group gap="sm">
                      <Tooltip label="Xóa tài khoản">
                        <ActionIcon color="red" variant="light" onClick={() => confirmDelete(u)}>
                          <Trash2 size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
              {users.length === 0 && !loading && (
                <Table.Tr>
                  <Table.Td colSpan={5} className="text-center py-8 text-slate-500">
                    Không tìm thấy người dùng nào.
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </div>
      </Card>

      <Modal opened={opened} onClose={close} title="Xác nhận xóa" centered>
        <Text size="sm" mb="lg">
          Bạn có chắc chắn muốn xóa người dùng <strong>{selectedUser?.name}</strong> không? Hành động này không thể hoàn tác.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={close}>Hủy</Button>
          <Button color="red" onClick={handleDelete}>Xóa vĩnh viễn</Button>
        </Group>
      </Modal>

      <Modal opened={createOpened} onClose={closeCreate} title={<Text fw={600}>Tạo tài khoản mới</Text>} centered>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <TextInput
            label="Họ và tên"
            placeholder="Nhập họ tên"
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          <TextInput
            label="Email"
            type="email"
            placeholder="Nhập địa chỉ email"
            required
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <PasswordInput
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            required
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
          <Select
            label="Vai trò"
            data={[
              { value: 'student', label: 'Học sinh' },
              { value: 'teacher', label: 'Giáo viên' },
              { value: 'admin', label: 'Quản trị viên' }
            ]}
            value={formData.role}
            onChange={(val) => setFormData({...formData, role: val})}
            required
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeCreate}>Hủy</Button>
            <Button type="submit" color="blue">Tạo tài khoản</Button>
          </Group>
        </form>
      </Modal>
    </div>
  );
}
