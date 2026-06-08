import { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, login } = useAuth(); // using login to update context user if needed
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: '', phone: '', bio: '', specialization: '', education: '', experience: 0
  });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    document.title = '👤 Hồ Sơ Của Tôi - EduSmart';
    authAPI.getMe().then(res => {
      const data = res.data || {};
      setProfile({
        name: data.name || '',
        phone: data.phone || '',
        bio: data.bio || '',
        specialization: data.specialization || '',
        education: data.education || '',
        experience: data.experience || 0
      });
    }).catch(() => toast.error('Lỗi tải thông tin')).finally(() => setLoading(false));
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authAPI.updateProfile(profile);
      // Update local storage user data
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...stored, ...res.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      login(localStorage.getItem('token'), updatedUser); // refresh context
      toast.success('Cập nhật hồ sơ thành công!');
    } catch (err) {
      toast.error(err.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      return toast.error('Mật khẩu xác nhận không khớp!');
    }
    setSaving(true);
    try {
      await authAPI.changePassword({
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword
      });
      toast.success('Đổi mật khẩu thành công!');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.message || 'Lỗi đổi mật khẩu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center"><span className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin inline-block"></span></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">👤 Hồ Sơ Của Tôi</h1>
        <p className="text-slate-500 text-sm">Quản lý thông tin cá nhân và tài khoản</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <form onSubmit={handleUpdateProfile} className="card">
            <h3 className="font-bold text-slate-700 mb-4 text-lg border-b pb-2">Thông tin chung</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group col-span-2 md:col-span-1">
                <label className="form-label">Họ và Tên *</label>
                <input required className="form-input" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
              </div>
              <div className="form-group col-span-2 md:col-span-1">
                <label className="form-label">Số điện thoại</label>
                <input className="form-input" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} />
              </div>
              <div className="form-group col-span-2">
                <label className="form-label">Môn chuyên môn</label>
                <input className="form-input" value={profile.specialization} onChange={e => setProfile({...profile, specialization: e.target.value})} placeholder="VD: Toán học, Vật lý..." />
              </div>
              <div className="form-group col-span-2 md:col-span-1">
                <label className="form-label">Trình độ học vấn</label>
                <input className="form-input" value={profile.education} onChange={e => setProfile({...profile, education: e.target.value})} placeholder="VD: Cử nhân, Thạc sĩ..." />
              </div>
              <div className="form-group col-span-2 md:col-span-1">
                <label className="form-label">Số năm kinh nghiệm</label>
                <input type="number" min="0" className="form-input" value={profile.experience} onChange={e => setProfile({...profile, experience: Number(e.target.value)})} />
              </div>
              <div className="form-group col-span-2">
                <label className="form-label">Giới thiệu ngắn (Bio)</label>
                <textarea className="form-input" rows={3} value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} placeholder="Vài nét về bản thân..." />
              </div>
            </div>
            <div className="mt-6">
              <button type="submit" disabled={saving} className="btn btn-primary px-8">
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="card text-center">
            <div className="w-24 h-24 mx-auto rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-3xl font-bold mb-4">
              {profile.name?.[0] || 'T'}
            </div>
            <h3 className="font-bold text-slate-800 text-lg">{profile.name}</h3>
            <p className="text-slate-500 text-sm mb-4">{user?.email}</p>
            <span className="badge badge-blue">Giáo viên</span>
          </div>

          <form onSubmit={handleChangePassword} className="card">
            <h3 className="font-bold text-slate-700 mb-4 border-b pb-2">Đổi mật khẩu</h3>
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Mật khẩu hiện tại</label>
                <input type="password" required className="form-input" value={passForm.currentPassword} onChange={e => setPassForm({...passForm, currentPassword: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Mật khẩu mới</label>
                <input type="password" required minLength={6} className="form-input" value={passForm.newPassword} onChange={e => setPassForm({...passForm, newPassword: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Xác nhận mật khẩu mới</label>
                <input type="password" required minLength={6} className="form-input" value={passForm.confirmPassword} onChange={e => setPassForm({...passForm, confirmPassword: e.target.value})} />
              </div>
            </div>
            <div className="mt-4">
              <button type="submit" disabled={saving} className="btn btn-secondary w-full">Cập nhật mật khẩu</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
