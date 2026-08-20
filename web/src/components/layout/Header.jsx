import React from 'react';
import { Moon, Sun, Search, Sparkles, Flame, Volume2, Command, Brain } from 'lucide-react';
import AudioSpeedPopover from './AudioSpeedPopover';
import LevelPill from '../gamification/LevelPill';
import UserProfileDropdown from '../auth/UserProfileDropdown';

export default function Header({ 
  currentTab, 
  isDark, 
  toggleTheme, 
  stats, 
  onOpenCommandPalette,
  audioSpeed = 0.9,
  onAudioSpeedChange,
  gamificationProfile,
  onOpenAIMasteryReport,
  currentUser,
  onOpenProfileEdit,
  onOpenSettings,
  onLogout
}) {
  const titles = {
    dashboard: { title: 'Tổng Quan Tiến Độ', desc: 'Theo dõi chỉ số ghi nhớ, chuỗi ngày học và hàng đợi ôn tập hôm nay' },
    vocab: { title: 'Kho Từ Vựng & Collocations', desc: 'Quản lý vốn từ, ngữ cảnh thực tế và cấu trúc cụm từ' },
    patterns: { title: 'Mẫu Câu & Cấu Trúc Ngữ Pháp', desc: 'Làm chủ khung xương diễn đạt tự nhiên như người bản xứ' },
    quiz: { title: 'Interactive Quiz Hub', desc: 'Luyện tập trắc nghiệm, phản xạ và ghi nhớ sâu theo từng chủ đề Topic' },
    speaking: { title: 'AI Speaking & Pronunciation Lab', desc: 'Chấm điểm phát âm đoạn văn theo mẫu và phân tích phản xạ hỏi đáp đối thoại' },
    reader: { title: 'Ghi Chú & Trình Đọc Thông Minh', desc: 'Đọc tài liệu và bôi đen để lưu từ vựng hoặc phân tích AI tức thì' },
    review: { title: 'Cỗ Máy Ôn Luyện SRS (SM-2)', desc: 'Chống quên theo chu kỳ lặp lại ngắt quãng khoa học' },
    'ai-lab': { title: 'AI English Lab', desc: 'Trợ lý AI phân tích câu, sửa ngữ pháp và sáng tác truyện ôn tập (0đ)' }
  };

  const current = titles[currentTab] || { title: 'LinguaVault Pro Max', desc: 'Personal English Knowledge Hub' };

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.85rem 2rem',
      borderBottom: '1px solid var(--border-color)',
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 10,
      gap: '1rem'
    }}>
      {/* Title */}
      <div style={{ flex: '1 1 auto', minWidth: '160px', overflow: 'hidden' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {current.title}
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {current.desc}
        </p>
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        {/* Gamification Level & XP Pill */}
        <LevelPill 
          profile={gamificationProfile} 
          onOpenReport={onOpenAIMasteryReport} 
        />

        {/* AI Vocabulary Mastery Report Button */}
        {onOpenAIMasteryReport && (
          <button
            onClick={onOpenAIMasteryReport}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)',
              border: '1px solid rgba(2, 132, 199, 0.3)',
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              color: 'var(--accent-primary)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
            className="hover-card"
            title="Xem Báo Cáo Đánh Giá Năng Lực Từ Vựng Toàn Diện Theo AI (CEFR & SM-2)"
          >
            <Brain size={14} />
            <span>Đánh Giá AI</span>
          </button>
        )}

        {/* Quick Search & Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            padding: '0.45rem 0.75rem',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-muted)',
            fontSize: '0.82rem',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
          className="glow-hover"
        >
          <Search size={15} style={{ color: 'var(--accent-primary)' }} />
          <span>Tìm nhanh</span>
          <span className="kbd-pill" style={{ padding: '0.1rem 0.35rem', fontSize: '0.7rem' }}>⌘K</span>
        </button>

        {/* Audio Speed Granular Popover */}
        <AudioSpeedPopover
          audioSpeed={audioSpeed}
          onSpeedChange={onAudioSpeedChange}
        />

        {/* Dark/Light mode button */}
        <button
          onClick={toggleTheme}
          className="btn-icon"
          title={isDark ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
          style={{
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            padding: '0.45rem',
            cursor: 'pointer'
          }}
        >
          {isDark ? <Sun size={17} style={{ color: '#fbbf24' }} /> : <Moon size={17} style={{ color: '#0284c7' }} />}
        </button>

        <div style={{ width: '1px', height: '22px', background: 'var(--border-color)', margin: '0 0.1rem' }} />

        {/* User Profile Dropdown */}
        <UserProfileDropdown
          user={currentUser}
          gamificationProfile={gamificationProfile}
          onOpenProfileEdit={onOpenProfileEdit}
          onOpenSettings={onOpenSettings}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}
