import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { documentAPI, classAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Card, Text, Badge, Button, Group, Stack, SimpleGrid, 
  ThemeIcon, Modal, TextInput, Select, Box, ActionIcon,
  Tooltip, Skeleton, Title, Flex
} from '@mantine/core';
import { 
  FileText, Image as ImageIcon, Video, Paperclip, UploadCloud, 
  Trash2, Eye, Bot, Plus, BookOpen
} from 'lucide-react';

const FILE_ICONS = { 
  pdf: <FileText size={24} className="text-red-500" />, 
  docx: <FileText size={24} className="text-blue-500" />, 
  pptx: <FileText size={24} className="text-orange-500" />, 
  image: <ImageIcon size={24} className="text-teal-500" />, 
  video: <Video size={24} className="text-purple-500" />, 
  other: <Paperclip size={24} className="text-gray-500" /> 
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ title: '', classId: '', subject: '', chapter: '', topic: '' });
  const [filter, setFilter] = useState({ classId: '', fileType: '' });
  const [embeddingId, setEmbeddingId] = useState(null);

  useEffect(() => {
    document.title = 'Quản Lý Tài Liệu - EduSmart';
    Promise.all([
      documentAPI.getAll(filter).then(r => setDocuments(r.data || [])),
      classAPI.getAll().then(r => setClasses(r.data || [])),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, [filter]);

  const onDrop = useCallback((files) => {
    const f = files[0];
    if (f) { 
      setFile(f); 
      setForm(p => ({ ...p, title: f.name.replace(/\.[^.]+$/, '') })); 
      setShowUpload(true); 
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxFiles: 1, maxSize: 50 * 1024 * 1024 });

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { toast.error('Vui lòng chọn file'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      const res = await documentAPI.upload(fd);
      setDocuments(p => [res.data, ...p]);
      setShowUpload(false);
      setFile(null);
      setForm({ title: '', classId: '', subject: '', chapter: '', topic: '' });
      toast.success('Tải lên thành công!');
    } catch (err) { toast.error(err.message || 'Lỗi tải lên'); }
    finally { setUploading(false); }
  };

  const handleEmbed = async (docId) => {
    setEmbeddingId(docId);
    try {
      await documentAPI.embed(docId);
      setDocuments(p => p.map(d => d._id === docId ? { ...d, isEmbedded: true } : d));
      toast.success('Đã nhúng tài liệu vào AI!');
    } catch { toast.error('Không thể kết nối AI service.'); }
    finally { setEmbeddingId(null); }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Xóa tài liệu này?')) return;
    await documentAPI.delete(docId);
    setDocuments(p => p.filter(d => d._id !== docId));
    toast.success('Đã xóa tài liệu.');
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Box pb={40}>
      <Flex direction={{ base: 'column', sm: 'row' }} justify="space-between" align={{ base: 'stretch', sm: 'center' }} mb="lg" gap="md">
        <div>
          <Title order={2} className="text-slate-800">📚 Quản Lý Tài Liệu</Title>
          <Text c="dimmed" size="sm">Upload và quản lý tài liệu học tập cho lớp học</Text>
        </div>
        <Button 
          leftSection={<Plus size={18} />} 
          color="blue" 
          onClick={() => setShowUpload(true)}
          fullWidth={{ base: true, sm: false }}
        >
          Tải lên tài liệu
        </Button>
      </Flex>

      {/* Upload Modal */}
      <Modal 
        opened={showUpload} 
        onClose={() => !uploading && setShowUpload(false)} 
        title={<Text fw={600} size="lg">📤 Tải lên tài liệu mới</Text>}
        size="lg"
        centered
        closeOnClickOutside={!uploading}
        closeOnEscape={!uploading}
        overlayProps={{ blur: 3 }}
      >
        <form onSubmit={handleUpload}>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center mb-6 cursor-pointer transition-all ${
              isDragActive ? 'border-blue-400 bg-blue-50' : 
              file ? 'border-teal-400 bg-teal-50' : 
              'border-slate-300 hover:border-blue-300'
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <Stack align="center" gap="xs">
                <ThemeIcon size={48} radius="xl" color="teal" variant="light"><FileText size={24} /></ThemeIcon>
                <Text fw={600} c="teal.7">{file.name}</Text>
                <Text size="sm" c="teal.6">{formatSize(file.size)}</Text>
              </Stack>
            ) : (
              <Stack align="center" gap="xs">
                <ThemeIcon size={48} radius="xl" color="gray" variant="light"><UploadCloud size={24} /></ThemeIcon>
                <Text fw={500} c="slate.6">Kéo thả hoặc click để chọn file</Text>
                <Text size="xs" c="dimmed">Hỗ trợ PDF, DOCX, PPTX, Ảnh, Video (Tối đa 50MB)</Text>
              </Stack>
            )}
          </div>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="xl">
            <TextInput 
              label="Tiêu đề" 
              placeholder="Nhập tiêu đề tài liệu" 
              required 
              value={form.title} 
              onChange={e => setForm(p => ({...p, title: e.target.value}))} 
              style={{ gridColumn: '1 / -1' }}
            />
            <Select 
              label="Lớp học" 
              placeholder="-- Chọn lớp --"
              data={classes.map(c => ({ value: c._id, label: `${c.name} - ${c.subject}` }))}
              value={form.classId} 
              onChange={val => setForm(p => ({...p, classId: val || ''}))} 
              clearable
            />
            <TextInput 
              label="Môn học" 
              placeholder="Toán, Lý, Hóa..." 
              value={form.subject} 
              onChange={e => setForm(p => ({...p, subject: e.target.value}))} 
            />
            <TextInput 
              label="Chương" 
              placeholder="VD: Chương 1" 
              value={form.chapter} 
              onChange={e => setForm(p => ({...p, chapter: e.target.value}))} 
            />
            <TextInput 
              label="Chủ đề" 
              placeholder="VD: Động lực học" 
              value={form.topic} 
              onChange={e => setForm(p => ({...p, topic: e.target.value}))} 
            />
          </SimpleGrid>

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setShowUpload(false)} disabled={uploading}>Hủy</Button>
            <Button type="submit" color="blue" loading={uploading} leftSection={<UploadCloud size={18} />}>
              Tải lên
            </Button>
          </Group>
        </form>
      </Modal>

      {/* Filters */}
      <Card withBorder p="sm" radius="md" mb="lg" className="bg-slate-50">
        <Group align="flex-end">
          <Select 
            label="Lớp học"
            placeholder="Tất cả lớp"
            data={classes.map(c => ({ value: c._id, label: c.name }))}
            value={filter.classId} 
            onChange={val => setFilter(p => ({...p, classId: val || ''}))} 
            clearable
            w={{ base: '100%', sm: 200 }}
          />
          <Select 
            label="Loại file"
            placeholder="Tất cả loại"
            data={['pdf', 'docx', 'pptx', 'image', 'video'].map(t => ({ value: t, label: t.toUpperCase() }))}
            value={filter.fileType} 
            onChange={val => setFilter(p => ({...p, fileType: val || ''}))} 
            clearable
            w={{ base: '100%', sm: 200 }}
          />
        </Group>
      </Card>

      {/* Document list */}
      {loading ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} height={120} radius="md" />)}
        </SimpleGrid>
      ) : documents.length === 0 ? (
        <Card withBorder radius="md" p="xl" className="text-center border-dashed bg-slate-50">
          <ThemeIcon size={64} radius="xl" variant="light" color="gray" mx="auto" mb="md">
            <BookOpen size={32} />
          </ThemeIcon>
          <Text fw={700} size="lg">Chưa có tài liệu nào</Text>
          <Text c="dimmed" size="sm" mt="xs">Hãy tải lên tài liệu đầu tiên cho học sinh của bạn.</Text>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {documents.map(doc => (
            <Card key={doc._id} withBorder radius="md" padding="md" className="hover:shadow-md transition-shadow">
              <Group wrap="nowrap" align="flex-start" mb="sm">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                  {FILE_ICONS[doc.fileType] || FILE_ICONS.other}
                </div>
                <Box style={{ flex: 1 }}>
                  <Text fw={600} size="sm" lineClamp={2} title={doc.title}>{doc.title}</Text>
                  <Text size="xs" c="dimmed" mt={2}>{formatSize(doc.fileSize)} • {doc.downloadCount} lượt tải</Text>
                </Box>
              </Group>
              
              <Group gap="xs" mb="md">
                {doc.class && <Badge color="blue" variant="light" size="sm">{doc.class.name}</Badge>}
                {doc.subject && <Badge color="gray" variant="outline" size="sm">{doc.subject}</Badge>}
                {doc.isEmbedded && <Badge color="teal" variant="filled" size="sm">AI Ready</Badge>}
              </Group>
              
              <Group gap="xs" justify="flex-end" mt="auto" className="border-t border-slate-100 pt-3">
                {!doc.isEmbedded && (
                  <Tooltip label="Nhúng vào AI để trợ lý có thể trả lời câu hỏi dựa trên tài liệu này">
                    <Button 
                      variant="light" 
                      color="teal" 
                      size="xs" 
                      onClick={() => handleEmbed(doc._id)} 
                      loading={embeddingId === doc._id}
                      leftSection={<Bot size={14} />}
                    >
                      Nhúng AI
                    </Button>
                  </Tooltip>
                )}
                <ActionIcon 
                  component="a" 
                  href={doc.fileUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  variant="light" 
                  color="blue"
                  aria-label="Xem tài liệu"
                >
                  <Eye size={18} />
                </ActionIcon>
                <ActionIcon 
                  variant="light" 
                  color="red" 
                  onClick={() => handleDelete(doc._id)}
                  aria-label="Xóa tài liệu"
                >
                  <Trash2 size={18} />
                </ActionIcon>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}
