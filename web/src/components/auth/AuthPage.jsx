import React, { useState } from 'react';
import { 
  Lock, 
  User, 
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
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';

export default function AuthPage({ onAuthSuccess, isDark, toggleTheme }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      const res = await api.auth.login(username.trim(), password);
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

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Dark/Light mode switcher toggle in top right */}
      <button
        onClick={toggleTheme}
        className="btn-icon"
        title={isDark ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
        style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          zIndex: 50,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          padding: '0.6rem',
          borderRadius: 'var(--radius-full)',
          boxShadow: 'var(--shadow-md)',
          cursor: 'pointer'
        }}
      >
        {isDark ? <Sun size={20} style={{ color: '#fbbf24' }} /> : <Moon size={20} style={{ color: '#0284c7' }} />}
      </button>

      {/* LEFT SHOWCASE HERO BANNER (Desktop View) */}
      <div style={{
        flex: 1.1,
        background: 'linear-gradient(145deg, rgba(2, 132, 199, 0.12) 0%, rgba(99, 102, 241, 0.08) 50%, rgba(139, 92, 246, 0.12) 100%)',
        borderRight: '1px solid var(--border-color)',
        padding: '3.5rem 3rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative'
      }} className="auth-hero-banner">
        {/* Brand Logo & Tagline */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(2, 132, 199, 0.35)'
            }}>
              <BookOpen size={24} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: '900', letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #0284c7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                LinguaVault
              </h1>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                PRO MAX KNOWLEDGE HUB
              </span>
            </div>
          </div>

          <h2 style={{ fontSize: '2.2rem', fontWeight: '800', lineHeight: 1.25, letterSpacing: '-0.02em', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Làm Chủ Tiếng Anh Học Thuật & Giao Tiếp Chuẩn Bản Xứ
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '520px', marginBottom: '2.5rem' }}>
            Hệ thống học tập cá nhân hóa tích hợp thuật toán ngắt quãng <strong>SuperMemo SM-2</strong>, <strong>AI Speaking Lab</strong> chấm điểm ngữ âm và kho bài tập trắc nghiệm thông minh.
          </p>

          {/* Feature Highlights Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', maxWidth: '560px' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', flexShrink: 0 }}>
                <Brain size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', margin: 0 }}>Cỗ Máy SRS (SM-2)</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Chống quên từ vựng vĩnh viễn</p>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
                <Mic size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', margin: 0 }}>AI Speaking Lab</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Chấm ngữ âm & đối thoại AI</p>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', flexShrink: 0 }}>
                <Award size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', margin: 0 }}>Level Mastery & XP</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Bậc thang danh hiệu học thuật</p>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', flexShrink: 0 }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', margin: 0 }}>Bảo Mật Local-First</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Dữ liệu SQLite riêng tư 100%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '2rem' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            LinguaVault Core v2.0 • Hoạt động độc lập & Đồng bộ thời gian thực
          </span>
        </div>
      </div>

      {/* RIGHT AUTH FORM CONTAINER */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 2rem',
        overflowY: 'auto'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '24px',
          padding: '2.25rem',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative'
        }}>
          {/* Form Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15), rgba(99, 102, 241, 0.15))',
              border: '1px solid rgba(2, 132, 199, 0.3)',
              fontSize: '1.8rem',
              marginBottom: '1rem',
              boxShadow: '0 8px 20px rgba(2, 132, 199, 0.2)'
            }}>
              🔐
            </div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              Đăng Nhập Hệ Thống
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Vui lòng nhập tài khoản để mở khóa các phân hệ học tập
            </p>
          </div>

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

          {/* Login Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Username Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.45rem', color: 'var(--text-secondary)' }}>
                Tên đăng nhập
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên đăng nhập..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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

            {/* Password Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.45rem', color: 'var(--text-secondary)' }}>
                Mật khẩu
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '0.9rem',
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                fontSize: '0.95rem',
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(2, 132, 199, 0.35)',
                transition: 'all 0.2s ease',
                marginTop: '0.5rem'
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
          </form>
        </div>
      </div>
    </div>
  );
}
