import React from 'react';
import { Moon, Sun, Search, Sparkles, Flame, Volume2, Command } from 'lucide-react';

export default function Header({ 
  currentTab, 
  isDark, 
  toggleTheme, 
  stats, 
  onOpenCommandPalette,
  audioSpeed = 0.9,
  onToggleAudioSpeed
}) {
  const titles = {
    dashboard: { title: 'Tổng Quan Tiến Độ', desc: 'Theo dõi chỉ số ghi nhớ, chuỗi ngày học và hàng đợi ôn tập hôm nay' },
    vocab: { title: 'Kho Từ Vựng & Collocations', desc: 'Quản lý vốn từ, ngữ cảnh thực tế và cấu trúc cụm từ' },
    patterns: { title: 'Mẫu Câu & Cấu Trúc Ngữ Pháp', desc: 'Làm chủ khung xương diễn đạt tự nhiên như người bản xứ' },
    quiz: { title: 'Interactive Quiz Hub', desc: 'Luyện tập trắc nghiệm, phản xạ và ghi nhớ sâu theo từng chủ đề Topic' },
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
      padding: '1.25rem 2.5rem',
      borderBottom: '1px solid var(--border-color)',
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      {/* Title */}
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          {current.title}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
          {current.desc}
        </p>
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Quick Search & Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            padding: '0.55rem 1rem',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            boxShadow: 'var(--shadow-sm)'
          }}
          className="glow-hover"
        >
          <Search size={16} style={{ color: 'var(--accent-primary)' }} />
          <span>Tìm nhanh...</span>
          <div style={{ display: 'flex', gap: '2px' }}>
            <span className="kbd-pill">⌘</span>
            <span className="kbd-pill">K</span>
          </div>
        </button>

        {/* Audio Speed Toggle */}
        <button
          onClick={onToggleAudioSpeed}
          className="btn-secondary"
          style={{ padding: '0.55rem 0.85rem', fontSize: '0.8rem', fontWeight: 700 }}
          title="Tốc độ phát âm (0.75x, 0.9x, 1.1x)"
        >
          <Volume2 size={15} style={{ color: 'var(--accent-primary)' }} />
          <span>{audioSpeed}x</span>
        </button>

        {/* Dark/Light mode button */}
        <button
          onClick={toggleTheme}
          className="btn-icon"
          title={isDark ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
          style={{
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            padding: '0.55rem'
          }}
        >
          {isDark ? <Sun size={18} style={{ color: '#fbbf24' }} /> : <Moon size={18} style={{ color: '#0284c7' }} />}
        </button>
      </div>
    </header>
  );
}
