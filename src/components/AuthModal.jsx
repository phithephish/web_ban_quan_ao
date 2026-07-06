import React, { useState } from 'react';
import { X, Mail, Lock, User, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      // Admin Account Bypass for Developer Convenience
      if (email.trim() === 'admin@gmail.com' && password === '123456') {
        const mockAdminUser = {
          id: 'admin-uuid-0000-0000-000000000000',
          email: 'admin@gmail.com',
          user_metadata: {
            full_name: 'Quản Trị Viên'
          }
        };
        
        // Seed profile dynamically in DB
        try {
          await supabase.from('profiles').insert({
            id: mockAdminUser.id,
            email: mockAdminUser.email,
            full_name: mockAdminUser.user_metadata.full_name
          });
        } catch (dbErr) {
          // Ignore table/RLS errors
        }

        onAuthSuccess(mockAdminUser, 'Đăng nhập Quản Trị Viên thành công!');
        onClose();
        return;
      }

      if (isLoginMode) {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onAuthSuccess(data.user, 'Đăng nhập thành công!');
        onClose();
      } else {
        // Sign Up
        if (!fullName.trim()) {
          setErrorMsg('Vui lòng điền họ và tên');
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });
        if (error) throw error;
        
        if (data?.user) {
          // Attempt to insert profile. Catch failure silently to preserve fallback capability
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: email.trim(),
              full_name: fullName.trim()
            });
          if (profileError) {
            console.warn("Failed to insert user profile. Profile table might not exist yet:", profileError);
          }
        }

        onAuthSuccess(data.user, 'Đăng ký thành công! Bạn có thể sử dụng hệ thống ngay bây giờ.');
        onClose();
      }
    } catch (error) {
      setErrorMsg(error.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="auth-modal-content animate-fade-in">
        <button className="modal-close-btn" onClick={onClose} aria-label="Đóng">
          <X size={20} />
        </button>

        <div className="auth-header">
          <h2 className="auth-title">
            {isLoginMode ? 'Đăng nhập' : 'Tạo tài khoản mới'}
          </h2>
          <p className="auth-subtitle">
            {isLoginMode 
              ? 'Chào mừng bạn quay lại với STUDIO / MINIMAL' 
              : 'Trải nghiệm mua sắm tiện lợi và quản lý đơn hàng tốt hơn'}
          </p>
        </div>

        {errorMsg && <div className="auth-error-box">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLoginMode && (
            <div className="auth-input-group">
              <label htmlFor="fullName">Họ và tên</label>
              <div className="input-wrapper">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  id="fullName"
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="auth-input-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <Mail size={16} className="input-icon" />
              <input
                type="email"
                id="email"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label htmlFor="password">Mật khẩu</label>
            <div className="input-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>{isLoginMode ? 'Đăng nhập' : 'Đăng ký'}</span>
            )}
          </button>
        </form>

        <div className="auth-switch-mode">
          {isLoginMode ? (
            <p>
              Chưa có tài khoản?{' '}
              <button onClick={() => { setIsLoginMode(false); setErrorMsg(''); }}>Đăng ký ngay</button>
            </p>
          ) : (
            <p>
              Đã có tài khoản?{' '}
              <button onClick={() => { setIsLoginMode(true); setErrorMsg(''); }}>Đăng nhập</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
