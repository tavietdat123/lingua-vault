import React from 'react';
import { Moon, Sun, Search, Sparkles, Flame, Volume2, Command, Brain, Menu } from 'lucide-react';
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
  onLogout,
  isSidebarCollapsed = false,
  onToggleSidebar,
  onToggleMobileMenu
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
    <header className="app-header">
      {/* Title & Mobile Menu Button */}
      <div className="header-title-group">
        {(onToggleSidebar || onToggleMobileMenu) && (
          <button
            onClick={() => {
              if (window.innerWidth < 768) {
                if (onToggleMobileMenu) onToggleMobileMenu();
                else if (onToggleSidebar) onToggleSidebar();
              } else {
                if (onToggleSidebar) onToggleSidebar();
              }
            }}
            className="btn-icon header-sidebar-toggle-btn mobile-menu-btn"
            title={isSidebarCollapsed ? "Phóng to / Mở rộng thanh bên (Ctrl+B)" : "Thu gọn thanh bên (Ctrl+B)"}
            aria-label="Thu gọn / Mở rộng thanh bên"
          >
            <Menu size={19} />
          </button>
        )}

        <div className="header-title-text">
          <h2 className="header-title">
            {current.title}
          </h2>
          <p className="header-desc">
            {current.desc}
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="header-actions">
        {/* Gamification Level & XP Pill */}
        <div className="header-level-pill-wrapper">
          <LevelPill 
            profile={gamificationProfile} 
            onOpenReport={onOpenAIMasteryReport} 
          />
        </div>

        {/* AI Vocabulary Mastery Report Button */}
        {onOpenAIMasteryReport && (
          <button
            onClick={onOpenAIMasteryReport}
            className="header-ai-report-btn hover-card"
            title="Xem Báo Cáo Đánh Giá Năng Lực Từ Vựng Toàn Diện Theo AI (CEFR & SM-2)"
          >
            <Brain size={15} />
            <span className="btn-label-text">Đánh Giá AI</span>
          </button>
        )}

        {/* Quick Search & Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="header-search-btn glow-hover"
          title="Tìm kiếm nhanh (Cmd + K)"
        >
          <Search size={15} style={{ color: 'var(--accent-primary)' }} />
          <span className="btn-label-text">Tìm nhanh</span>
          <span className="kbd-pill kbd-shortcut">⌘K</span>
        </button>

        {/* Audio Speed Granular Popover */}
        <AudioSpeedPopover
          audioSpeed={audioSpeed}
          onSpeedChange={onAudioSpeedChange}
        />

        {/* Dark/Light mode button */}
        <button
          onClick={toggleTheme}
          className="btn-icon header-theme-btn"
          title={isDark ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
        >
          {isDark ? <Sun size={17} style={{ color: '#fbbf24' }} /> : <Moon size={17} style={{ color: '#0284c7' }} />}
        </button>

        <div className="header-divider" />

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
