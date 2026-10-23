import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Mail,
  Eye, 
  EyeOff, 
  ArrowRight, 
  Brain, 
  ShieldCheck, 
  BookOpen, 
  Mic, 
  Award,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  LogIn,
  UserPlus
} from 'lucide-react';
import { api } from '../../services/api';

export default function AuthPage({ onAuthSuccess, isDark, toggleTheme }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  
  // Login State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register State
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!loginUsername.trim() || !loginPassword.trim()) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      const res = await api.auth.login(loginUsername.trim(), loginPassword);
      if (res && res.success && res.data?.user) {
        onAuthSuccess(res.data.user);
      } else {
        setError(res?.error || 'Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản.');
      }
    } catch (err) {
      setError(err.message || 'Không thể kết nối đến máy chủ API');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!regFullName.trim() || !regUsername.trim() || !regPassword.trim()) {
      setError('Vui lòng điền họ tên, tên đăng nhập và mật khẩu');
      return;
    }

    if (regUsername.trim().length < 3) {
      setError('Tên đăng nhập phải có ít nhất 3 ký tự');
      return;
    }

    if (regPassword.length < 4) {
      setError('Mật khẩu phải có ít nhất 4 ký tự');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      const res = await api.auth.register({
        full_name: regFullName.trim(),
        username: regUsername.trim(),
        email: regEmail.trim() || null,
        password: regPassword
      });

      if (res && res.success && res.data?.user) {
        setSuccessMsg('Đăng ký tài khoản thành công! Đang tự động đăng nhập...');
        setTimeout(() => {
          onAuthSuccess(res.data.user);
        }, 800);
      } else {
        setError(res?.error || 'Đăng ký không thành công. Vui lòng thử lại.');
      }
    } catch (err) {
      setError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Dark/Light mode switcher toggle in top right */}
      <button
        onClick={toggleTheme}
        className="auth-theme-btn"
        title={isDark ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
      >
        {isDark ? <Sun size={20} style={{ color: '#fbbf24' }} /> : <Moon size={20} style={{ color: '#0284c7' }} />}
      </button>

      {/* LEFT SHOWCASE HERO BANNER (Responsive for both Desktop & Mobile) */}
      <div className="auth-hero-banner">
        <div>
          {/* Brand Logo & Tagline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(2, 132, 199, 0.35)',
              flexShrink: 0
            }}>
              <BookOpen size={24} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: '900', letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #0284c7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                LinguaVault
              </h1>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                PRO MAX KNOWLEDGE HUB
              </span>
            </div>
          </div>

          <h2 className="auth-hero-title">
            Làm Chủ Tiếng Anh Học Thuật & Giao Tiếp Chuẩn Bản Xứ
          </h2>
          <p className="auth-hero-desc">
            Hệ thống học tập cá nhân hóa tích hợp thuật toán ngắt quãng <strong>SuperMemo SM-2</strong>, <strong>AI Speaking Lab</strong> chấm điểm ngữ âm và kho bài tập trắc nghiệm thông minh.
          </p>

          {/* Feature Highlights Grid */}
          <div className="auth-hero-features-grid">
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', flexShrink: 0 }}>
                <Brain size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: '700', margin: 0 }}>Cỗ Máy SRS (SM-2)</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Chống quên từ vựng vĩnh viễn</p>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
                <Mic size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: '700', margin: 0 }}>AI Speaking Lab</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Chấm ngữ âm & đối thoại AI</p>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', flexShrink: 0 }}>
                <Award size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: '700', margin: 0 }}>Level Mastery & XP</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Bậc thang danh hiệu học thuật</p>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', flexShrink: 0 }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: '700', margin: 0 }}>Bảo Mật Local-First</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Dữ liệu SQLite riêng tư 100%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Badge (Hidden on small mobile) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '2rem' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            LinguaVault Core v2.0 • Hoạt động độc lập & Đồng bộ thời gian thực
          </span>
        </div>
      </div>

      {/* RIGHT AUTH FORM CONTAINER */}
      <div className="auth-form-wrapper">
        <div className="auth-form-card">
          {/* Form Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15), rgba(99, 102, 241, 0.15))',
              border: '1px solid rgba(2, 132, 199, 0.3)',
              fontSize: '1.65rem',
              marginBottom: '0.75rem',
              boxShadow: '0 8px 20px rgba(2, 132, 199, 0.2)'
            }}>
              {mode === 'login' ? '🔐' : '✨'}
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              {mode === 'login' ? 'Đăng Nhập Hệ Thống' : 'Tạo Tài Khoản Mới'}
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              {mode === 'login' 
                ? 'Nhập tài khoản để tiếp tục hành trình học tiếng Anh'
                : 'Đăng ký ngay để lưu trữ từ vựng và lịch sử học tập riêng biệt'}
            </p>
          </div>

          {/* Tab Switcher: Đăng Nhập vs Đăng Ký */}
          <div className="auth-tab-switch">
            <button
              type="button"
              className={`auth-tab-switch-btn ${mode === 'login' ? 'active' : 'inactive'}`}
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessMsg('');
              }}
            >
              <LogIn size={16} />
              <span>Đăng Nhập</span>
            </button>
            <button
              type="button"
              className={`auth-tab-switch-btn ${mode === 'register' ? 'active' : 'inactive'}`}
              onClick={() => {
                setMode('register');
                setError('');
                setSuccessMsg('');
              }}
            >
              <UserPlus size={16} />
              <span>Đăng Ký</span>
            </button>
          </div>

          {/* Success Message Box */}
          {successMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-lg)',
              fontSize: '0.84rem',
              marginBottom: '1.25rem'
            }}>
              <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Message Box */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-lg)',
              fontSize: '0.84rem',
              marginBottom: '1.25rem'
            }}>
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.45rem', color: 'var(--text-secondary)' }}>
                  Tên đăng nhập
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    placeholder="Nhập tên đăng nhập..."
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    autoCapitalize="none"
                    autoCorrect="off"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.5rem',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <User size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.45rem', color: 'var(--text-secondary)' }}>
                  Mật khẩu
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Nhập mật khẩu..."
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.6rem 0.75rem 2.5rem',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <Lock size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.9rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.85rem',
                  background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 15px rgba(2, 132, 199, 0.35)',
                  transition: 'all 0.2s ease',
                  marginTop: '0.4rem'
                }}
                className="hover-card"
              >
                {loading ? (
                  <span>Đang xác thực...</span>
                ) : (
                  <>
                    <span>Đăng Nhập Vào Hệ Thống</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Chưa có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-primary)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '0.84rem'
                    }}
                  >
                    Đăng ký tài khoản ngay
                  </button>
                </span>
              </div>
            </form>
          )}

          {/* 2. REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  Họ và tên *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Hoàng Minh Anh"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.5rem',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <User size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  Tên đăng nhập *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    placeholder="Tối thiểu 3 ký tự (viết liền, không dấu)..."
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    autoCapitalize="none"
                    autoCorrect="off"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.5rem',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <User size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  Email (tùy chọn)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.5rem',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <Mail size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  Mật khẩu *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Tối thiểu 4 ký tự..."
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.6rem 0.75rem 2.5rem',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <Lock size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.9rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  Xác nhận mật khẩu *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Nhập lại mật khẩu..."
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.5rem',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <ShieldCheck size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.85rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
                  transition: 'all 0.2s ease',
                  marginTop: '0.4rem'
                }}
                className="hover-card"
              >
                {loading ? (
                  <span>Đang tạo tài khoản...</span>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Đăng Ký Tài Khoản Mới</span>
                  </>
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Đã có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-primary)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '0.84rem'
                    }}
                  >
                    Đăng nhập ngay
                  </button>
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
