import { useState, useEffect } from 'react';
import { 
  Title, Card, Table, Text, Badge, ActionIcon, Group, 
  Switch, Tooltip, Modal, Button, TextInput, Select
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Trash2, Edit, Plus, Users as UsersIcon, UserPlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';

export default function AdminClassManagementPage() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [opened, { open, close }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [studentsOpened, { open: openStudents, close: closeStudents }] = useDisclosure(false);
  
  const [selectedClass, setSelectedClass] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    grade: '',
    teacher: '',
    description: ''
  });

  const [studentToAdd, setStudentToAdd] = useState('');

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getClasses();
      setClasses(res.data || []);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách lớp học');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const [tRes, sRes] = await Promise.all([
        adminAPI.getUsers({ role: 'teacher' }),
        adminAPI.getUsers({ role: 'student' })
      ]);
      setTeachers(tRes.data || []);
      setStudents(sRes.data || []);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách người dùng');
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchUsers();
  }, []);

  const handleSaveClass = async (e) => {
    e.preventDefault();
    try {
      if (selectedClass) {
        await adminAPI.updateClass(selectedClass._id, formData);
        toast.success('Cập nhật lớp học thành công');
      } else {
        await adminAPI.createClass(formData);
        toast.success('Tạo lớp học thành công');
      }
      close();
      fetchClasses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi lưu lớp học');
    }
  };

  const handleDeleteClass = async () => {
    try {
      await adminAPI.deleteClass(selectedClass._id);
      toast.success('Xóa lớp học thành công');
      closeDelete();
      fetchClasses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi xóa lớp học');
    }
  };

  const handleToggleStatus = async (classItem) => {
    try {
      await adminAPI.updateClass(classItem._id, { isActive: !classItem.isActive });
      toast.success(classItem.isActive ? 'Đã đóng lớp học' : 'Đã mở lớp học');
      fetchClasses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi cập nhật');
    }
  };

  const handleAddStudent = async () => {
    if (!studentToAdd) return toast.error('Vui lòng chọn học sinh');
    try {
      await adminAPI.addStudentToClass(selectedClass._id, { studentId: studentToAdd });
      toast.success('Đã thêm học sinh vào lớp');
      setStudentToAdd('');
      // Update selected class directly or fetch all
      fetchClasses();
      
      // Update the local state of selected class to show new student list immediately
      const newStudentObj = students.find(s => s._id === studentToAdd);
      setSelectedClass(prev => ({
        ...prev,
        students: [...prev.students, newStudentObj]
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi thêm học sinh');
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa học sinh này khỏi lớp?')) return;
    try {
      await adminAPI.removeStudentFromClass(selectedClass._id, studentId);
      toast.success('Đã xóa học sinh khỏi lớp');
      fetchClasses();
      
      setSelectedClass(prev => ({
        ...prev,
        students: prev.students.filter(s => s._id !== studentId)
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi xóa học sinh');
    }
  };

  const openCreateModal = () => {
    setSelectedClass(null);
    setFormData({ name: '', subject: '', grade: '', teacher: '', description: '' });
    open();
  };

  const openEditModal = (cls) => {
    setSelectedClass(cls);
    setFormData({
      name: cls.name,
      subject: cls.subject,
      grade: cls.grade,
      teacher: cls.teacher?._id || '',
      description: cls.description || ''
    });
    open();
  };

  const confirmDelete = (cls) => {
    setSelectedClass(cls);
    openDelete();
  };

  const openManageStudents = (cls) => {
    setSelectedClass(cls);
    setStudentToAdd('');
    openStudents();
  };

  const teacherOptions = teachers.map(t => ({ value: t._id, label: `${t.name} (${t.email})` }));
  const studentOptions = students.map(s => ({ value: s._id, label: `${s.name} (${s.email})` }));

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title order={2} className="text-slate-800">Quản lý Lớp học</Title>
          <Text c="dimmed" size="sm">Xem, tạo mới và quản lý thông tin các lớp học.</Text>
        </div>

        <Button leftSection={<Plus size={16} />} onClick={openCreateModal} color="blue">
          Tạo lớp học
        </Button>
      </div>

      <Card shadow="sm" radius="md" withBorder>
        <div className="overflow-x-auto">
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Mã lớp</Table.Th>
                <Table.Th>Tên lớp</Table.Th>
                <Table.Th>Môn - Khối</Table.Th>
                <Table.Th>Giáo viên</Table.Th>
                <Table.Th>Học sinh</Table.Th>
                <Table.Th>Trạng thái</Table.Th>
                <Table.Th>Hành động</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                <Table.Tr>
                  <Table.Td colSpan="7" className="text-center py-10">Đang tải...</Table.Td>
                </Table.Tr>
              ) : classes.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan="7" className="text-center py-10 text-slate-500">Chưa có lớp học nào.</Table.Td>
                </Table.Tr>
              ) : (
                classes.map((cls) => (
                  <Table.Tr key={cls._id}>
                    <Table.Td><Badge color="gray">{cls.code}</Badge></Table.Td>
                    <Table.Td fw={500}>{cls.name}</Table.Td>
                    <Table.Td>{cls.subject} - {cls.grade}</Table.Td>
                    <Table.Td>{cls.teacher?.name || '---'}</Table.Td>
                    <Table.Td>
                      <Badge color="blue" variant="light">{cls.students?.length || 0} học sinh</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Switch 
                        checked={cls.isActive} 
                        onChange={() => handleToggleStatus(cls)}
                        color="teal"
                      />
                    </Table.Td>
                    <Table.Td>
                      <Group gap={8}>
                        <Tooltip label="Quản lý học sinh">
                          <ActionIcon color="blue" variant="light" onClick={() => openManageStudents(cls)}>
                            <UsersIcon size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Chỉnh sửa">
                          <ActionIcon color="orange" variant="light" onClick={() => openEditModal(cls)}>
                            <Edit size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Xóa">
                          <ActionIcon color="red" variant="light" onClick={() => confirmDelete(cls)}>
                            <Trash2 size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </div>
      </Card>

      {/* Modal Create/Edit */}
      <Modal 
        opened={opened} 
        onClose={close} 
        title={selectedClass ? "Chỉnh sửa Lớp học" : "Tạo Lớp học mới"}
      >
        <form onSubmit={handleSaveClass} className="space-y-4">
          <TextInput
            required
            label="Tên lớp học"
            placeholder="VD: Toán nâng cao 10A1"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          <Group grow>
            <TextInput
              required
              label="Môn học"
              placeholder="VD: Toán"
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
            />
            <TextInput
              required
              label="Khối lớp"
              placeholder="VD: 10"
              value={formData.grade}
              onChange={(e) => setFormData({...formData, grade: e.target.value})}
            />
          </Group>
          <Select
            required
            label="Giáo viên phụ trách"
            placeholder="Chọn giáo viên"
            data={teacherOptions}
            value={formData.teacher}
            onChange={(val) => setFormData({...formData, teacher: val})}
            searchable
          />
          <TextInput
            label="Mô tả"
            placeholder="Mô tả ngắn gọn về lớp học"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
          <Button fullWidth type="submit" mt="md" color="blue">
            {selectedClass ? 'Cập nhật Lớp học' : 'Tạo Lớp học'}
          </Button>
        </form>
      </Modal>

      {/* Modal Delete Confirm */}
      <Modal opened={deleteOpened} onClose={closeDelete} title="Xác nhận xóa" centered>
        <Text size="sm" mb="lg">
          Bạn có chắc chắn muốn xóa lớp học <b>{selectedClass?.name}</b>? Hành động này không thể hoàn tác và sẽ xóa lớp khỏi danh sách của giáo viên.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={closeDelete}>Hủy</Button>
          <Button color="red" onClick={handleDeleteClass}>Xóa</Button>
        </Group>
      </Modal>

      {/* Modal Manage Students */}
      <Modal opened={studentsOpened} onClose={closeStudents} title={`Học sinh lớp: ${selectedClass?.name}`} size="lg">
        <div className="mb-6">
          <Text size="sm" fw={500} mb={8}>Thêm học sinh vào lớp</Text>
          <Group>
            <Select
              placeholder="Tìm kiếm học sinh..."
              data={studentOptions}
              value={studentToAdd}
              onChange={setStudentToAdd}
              searchable
              className="flex-1"
            />
            <Button leftSection={<UserPlus size={16} />} onClick={handleAddStudent}>
              Thêm
            </Button>
          </Group>
        </div>

        <Text size="sm" fw={500} mb={8}>Danh sách học sinh ({selectedClass?.students?.length || 0})</Text>
        <div className="border border-slate-200 rounded-md overflow-hidden max-h-64 overflow-y-auto">
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Họ tên</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th style={{ width: 80 }}>Xóa</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(!selectedClass?.students || selectedClass.students.length === 0) ? (
                <Table.Tr>
                  <Table.Td colSpan="3" className="text-center py-4 text-slate-500">Chưa có học sinh</Table.Td>
                </Table.Tr>
              ) : (
                selectedClass.students.map(s => (
                  <Table.Tr key={s._id}>
                    <Table.Td>{s.name}</Table.Td>
                    <Table.Td>{s.email}</Table.Td>
                    <Table.Td>
                      <ActionIcon color="red" variant="subtle" onClick={() => handleRemoveStudent(s._id)}>
                        <X size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </div>
      </Modal>
    </div>
  );
}
