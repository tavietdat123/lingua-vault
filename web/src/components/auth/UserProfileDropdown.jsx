import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  LogIn, 
  LogOut, 
  Key, 
  Settings, 
  Sparkles, 
  ShieldCheck, 
  ChevronDown, 
  Crown,
  Edit3
} from 'lucide-react';

export default function UserProfileDropdown({ 
  user, 
  gamificationProfile,
  onOpenProfileEdit, 
  onOpenSettings,
  onLogout 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const currentLevel = gamificationProfile?.level ?? user?.profile?.current_level ?? 1;
  const currentXp = gamificationProfile?.totalXp ?? user?.profile?.total_xp ?? 0;
  const currentTitle = gamificationProfile?.title ?? user?.profile?.title ?? 'Novice Scholar 🌱';

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.55rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          padding: '0.35rem 0.75rem 0.35rem 0.45rem',
          borderRadius: 'var(--radius-full)',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 0.2s ease'
        }}
        className="hover-card"
      >
        {/* Avatar Circle */}
        <div style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.2))',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem'
        }}>
          {user.avatar_url || '🧑‍🎓'}
        </div>

        {/* User Info Text */}
        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1, maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.full_name || user.username}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1, maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            @{user.username}
          </span>
        </div>

        <ChevronDown size={13} style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0 }} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '240px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-xl)',
          padding: '0.6rem',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 100,
          backdropFilter: 'blur(16px)'
        }} className="modal-pop">
          {/* Header Card inside dropdown */}
          <div style={{
            padding: '0.75rem',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '0.5rem',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '1.4rem' }}>{user.avatar_url || '🧑‍🎓'}</span>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {user.full_name}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {user.role === 'admin' ? '👑 Quản trị viên' : user.role === 'guest' ? '🚀 Khách trải nghiệm' : '✨ Thành viên'}
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
              color: 'var(--accent-primary)',
              fontWeight: 700,
              marginTop: '0.45rem',
              paddingTop: '0.45rem',
              borderTop: '1px solid var(--border-color)'
            }}>
              <span>Cấp {currentLevel} • {currentTitle}</span>
              <span>{currentXp} XP</span>
            </div>
          </div>

          {/* Menu Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenProfileEdit();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                width: '100%',
                padding: '0.6rem 0.75rem',
                border: 'none',
                background: 'transparent',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.84rem',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s ease'
              }}
              className="hover-card"
            >
              <Edit3 size={15} style={{ color: 'var(--accent-primary)' }} />
              <span>Chỉnh sửa thông tin</span>
            </button>

            {onOpenSettings && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  border: 'none',
                  background: 'transparent',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.84rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease'
                }}
                className="hover-card"
              >
                <Settings size={15} style={{ color: 'var(--text-muted)' }} />
                <span>Cài đặt AI & Telegram</span>
              </button>
            )}

            <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.3rem 0' }} />

            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                width: '100%',
                padding: '0.6rem 0.75rem',
                border: 'none',
                background: 'rgba(239, 68, 68, 0.08)',
                borderRadius: 'var(--radius-md)',
                color: '#ef4444',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s ease'
              }}
              className="hover-card"
            >
              <LogOut size={15} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
