import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Phone, MapPin, Mail, Save, Calendar, CheckCircle2 } from 'lucide-react';
import { supabase } from '../supabase';

export default function UserProfilePage({ user, onBackToShop, onUpdateProfile }) {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Initial load
  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    setLoading(true);
    setErrorMsg('');
    
    // 1. Try local storage first as quick display
    let localData = null;
    try {
      const saved = localStorage.getItem(`minimal_profile_${user.id}`);
      if (saved) {
        localData = JSON.parse(saved);
        setFormData({
          fullName: localData.full_name || '',
          phone: localData.phone || '',
          address: localData.address || ''
        });
      }
    } catch (e) {
      console.warn("Failed to parse local profile:", e);
    }

    // 2. Try fetching from Supabase database
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        const dbProfile = {
          fullName: data.full_name || '',
          phone: data.phone || '',
          address: data.address || ''
        };
        setFormData(dbProfile);
        
        // Sync back to local storage
        localStorage.setItem(`minimal_profile_${user.id}`, JSON.stringify(data));
      }
    } catch (err) {
      console.warn("Could not load profile from Supabase, relying on local storage:", err);
      // If local storage was empty, initialize with auth metadata defaults
      if (!localData) {
        setFormData({
          fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          phone: '',
          address: ''
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const validateField = (name, value) => {
    let error = '';
    if (name === 'fullName') {
      if (!value.trim()) {
        error = 'Vui lòng nhập Họ và Tên.';
      } else if (value.trim().length < 2) {
        error = 'Họ và tên phải có ít nhất 2 ký tự.';
      } else if (/[0-9]/.test(value)) {
        error = 'Họ và tên không được chứa số.';
      } else if (/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
        error = 'Họ và tên không được chứa ký tự đặc biệt.';
      }
    } else if (name === 'phone') {
      if (!value.trim()) {
        error = 'Vui lòng nhập Số điện thoại.';
      } else if (!/^0\d{9}$/.test(value.trim())) {
        error = 'Số điện thoại không hợp lệ (Phải bắt đầu bằng số 0 và có đúng 10 số).';
      }
    } else if (name === 'address') {
      if (!value.trim()) {
        error = 'Vui lòng nhập Địa chỉ.';
      } else if (value.trim().length < 8) {
        error = 'Địa chỉ nhận hàng phải từ 8 ký tự trở lên để đảm bảo chính xác.';
      } else if (!value.trim().includes(' ')) {
        error = 'Vui lòng nhập địa chỉ đầy đủ (Ví dụ: Số nhà, tên đường, tên phường...).';
      }
    }
    return error;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleInputBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const profilePayload = {
      id: user.id,
      email: user.email,
      full_name: formData.fullName.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim()
    };

    try {
      // 1. Try to upsert to Supabase
      const { error } = await supabase
        .from('profiles')
        .upsert(profilePayload);

      if (error) throw error;
      
      setSuccessMsg('Cập nhật thông tin thành công!');
      // Update local storage
      localStorage.setItem(`minimal_profile_${user.id}`, JSON.stringify(profilePayload));

      // Trigger state updates in App
      if (onUpdateProfile) {
        onUpdateProfile({
          ...user,
          user_metadata: {
            ...user.user_metadata,
            full_name: profilePayload.full_name
          }
        });
      }
    } catch (err) {
      console.warn("Failed to save profile to Supabase. Saving locally:", err);
      // Save locally to local storage as fallback
      localStorage.setItem(`minimal_profile_${user.id}`, JSON.stringify(profilePayload));
      setSuccessMsg('Đã lưu thông tin cá nhân cục bộ thành công!');
      
      if (onUpdateProfile) {
        onUpdateProfile({
          ...user,
          user_metadata: {
            ...user.user_metadata,
            full_name: profilePayload.full_name
          }
        });
      }
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const userInitials = formData.fullName
    ? formData.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="profile-page-container animate-fade-in">
      {/* Navigation Header */}
      <div className="checkout-header-nav">
        <button className="back-to-shop-btn" onClick={onBackToShop}>
          <ArrowLeft size={16} />
          <span>Quay lại Cửa hàng</span>
        </button>
        <h2>Thông tin tài khoản</h2>
      </div>

      <div className="profile-centered-card animate-fade-in">
        {/* Profile Card Header (Avatar & Badge Details) */}
        <div className="profile-card-header">
          <div className="badge-avatar-circle">
            <User size={36} />
          </div>
          <h3 className="badge-name">{formData.fullName || 'Thành viên mới'}</h3>
          <span className="badge-role-tag">
            {user.email === 'admin@gmail.com' ? 'Quản trị viên' : 'Thành viên'}
          </span>
          <p className="badge-joined-date">
            <Calendar size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Tham gia từ: {user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}
          </p>
        </div>

        <hr className="profile-card-divider" />

        {/* Profile Card Body (Form fields) */}
        <form onSubmit={handleSubmit} className="profile-form-body">
          {successMsg && (
            <div className="profile-alert success animate-fade-in">
              <CheckCircle2 size={16} className="alert-icon" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="profile-alert error animate-fade-in">
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Email Input (ReadOnly) */}
          <div className="form-input-group">
            <label htmlFor="profile-email">Địa chỉ Email</label>
            <div className="readonly-input-wrapper">
              <Mail size={16} className="input-icon-left" />
              <input
                type="email"
                id="profile-email"
                value={user.email}
                disabled
                className="readonly-field"
              />
            </div>
            <span className="input-hint-msg">Địa chỉ Email đăng nhập không thể thay đổi.</span>
          </div>

          {/* Full Name Input */}
          <div className="form-input-group">
            <label htmlFor="fullName">Họ và Tên *</label>
            <div className="input-with-icon-wrapper">
              <User size={16} className="input-icon-left" />
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder="Nhập họ và tên đầy đủ"
                className={errors.fullName ? 'error' : ''}
              />
            </div>
            {errors.fullName && <span className="input-error-msg">{errors.fullName}</span>}
          </div>

          {/* Phone Input */}
          <div className="form-input-group">
            <label htmlFor="phone">Số điện thoại *</label>
            <div className="input-with-icon-wrapper">
              <Phone size={16} className="input-icon-left" />
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder="VD: 0903xxxxxx"
                className={errors.phone ? 'error' : ''}
              />
            </div>
            {errors.phone && <span className="input-error-msg">{errors.phone}</span>}
          </div>

          {/* Address Input */}
          <div className="form-input-group">
            <label htmlFor="address">Địa chỉ mặc định *</label>
            <div className="input-with-icon-wrapper">
              <MapPin size={16} className="input-icon-left" />
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                className={errors.address ? 'error' : ''}
              />
            </div>
            {errors.address && <span className="input-error-msg">{errors.address}</span>}
          </div>

          <button type="submit" className="save-profile-btn" disabled={loading}>
            <Save size={16} style={{ marginRight: '8px' }} />
            {loading ? 'Đang lưu thay đổi...' : 'Lưu thay đổi'}
          </button>
        </form>
      </div>
    </div>
  );
}
