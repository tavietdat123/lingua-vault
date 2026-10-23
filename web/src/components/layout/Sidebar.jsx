import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Layers, 
  FileText, 
  Sparkles, 
  BrainCircuit, 
  Settings, 
  Flame,
  Plus,
  Command,
  Target,
  Mic,
  Timer,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  stats, 
  onOpenQuickAdd, 
  onOpenSettings, 
  onOpenCommandPalette, 
  onSharePublicStats, 
  onOpenSupervisorPortal,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onClose = () => {}
}) {
  const navItems = [
    { id: 'dashboard', path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { 
      id: 'vocab', 
      path: '/vocab',
      label: 'Kho Từ Vựng', 
      icon: BookOpen, 
      count: stats?.words?.total || 0 
    },
    { 
      id: 'patterns', 
      path: '/patterns',
      label: 'Mẫu Câu & Cấu Trúc', 
      icon: Layers, 
      count: stats?.patterns?.total || 0 
    },
    { 
      id: 'quiz', 
      path: '/quiz',
      label: 'Quiz Theo Topic', 
      icon: Target,
      isNew: true
    },
    { 
      id: 'speaking', 
      path: '/speaking',
      label: 'AI Speaking Lab', 
      icon: Mic,
      isNew: true
    },
    { 
      id: 'reader', 
      path: '/reader',
      label: 'Ghi Chú & Bài Đọc', 
      icon: FileText, 
      count: stats?.notes?.total || 0 
    },
    { 
      id: 'review', 
      path: '/review',
      label: 'Ôn Tập SRS', 
      icon: Sparkles, 
      dueCount: stats?.total_due_today || 0,
      highlight: true
    },
    { 
      id: 'timer', 
      path: '/timer',
      label: 'Bấm Giờ & Thống Kê', 
      icon: Timer,
      isNew: true
    },
    { 
      id: 'ai-lab', 
      path: '/ai-lab',
      label: 'AI English Lab', 
      icon: BrainCircuit,
      isAi: true
    }
  ];

  const streak = stats?.streak || 0;

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div 
          className="sidebar-mobile-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`app-sidebar ${isCollapsed && !isMobileOpen ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand-row">
          <NavLink 
            to="/" 
            onClick={() => { if (onClose) onClose(); }}
            className="sidebar-brand-link"
            title="LinguaVault Pro Max Hub"
          >
            <div className="sidebar-brand-icon">
              <BookOpen size={20} />
            </div>
            <div className="sidebar-brand-text">
              <h1 className="sidebar-brand-title">LinguaVault</h1>
              <span className="sidebar-brand-sub">Pro Max Hub</span>
            </div>
          </NavLink>

          {/* Close button on mobile drawer */}
          <button
            type="button"
            onClick={onClose}
            className="btn-icon sidebar-mobile-close-btn"
            title="Đóng menu"
            aria-label="Đóng menu"
          >
            <X size={20} />
          </button>

          {/* Toggle Collapse Button on desktop */}
          {onToggleCollapse && !isMobileOpen && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="sidebar-collapse-toggle-btn"
              title={isCollapsed ? "Phóng to / Mở rộng thanh bên" : "Thu gọn thanh bên"}
              aria-label={isCollapsed ? "Phóng to / Mở rộng thanh bên" : "Thu gọn thanh bên"}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={16} />}
            </button>
          )}
        </div>

        {/* Quick Add Action Button */}
        <button 
          onClick={() => {
            if (onClose) onClose();
            onOpenQuickAdd();
          }}
          className="btn-primary glow-hover sidebar-quick-add-btn" 
          title="Thêm Nhanh (1-Click)"
        >
          <Plus size={18} className="sidebar-btn-icon" />
          <span className="sidebar-text-label">Thêm Nhanh</span>
        </button>

        {/* Navigation List */}
        <nav className="sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id || (item.id === 'dashboard' && currentTab === '');

            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={() => { if (onClose) onClose(); }}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                title={item.label}
              >
                <div className="sidebar-nav-item-content">
                  <div className="sidebar-icon-wrapper">
                    <Icon size={19} className="sidebar-nav-icon" />
                    {item.dueCount > 0 && isCollapsed && !isMobileOpen && (
                      <span className="sidebar-dot-badge-due">
                        {item.dueCount > 99 ? '99+' : item.dueCount}
                      </span>
                    )}
                    {item.isAi && isCollapsed && !isMobileOpen && !item.dueCount && (
                      <span className="sidebar-dot-badge-ai">⚡</span>
                    )}
                  </div>
                  <span className="sidebar-text-label">{item.label}</span>
                </div>

                {/* Badges when expanded */}
                <div className="sidebar-badges-group">
                  {item.dueCount > 0 && (
                    <span className="sidebar-badge-due">
                      {item.dueCount}
                    </span>
                  )}

                  {item.count !== undefined && !item.dueCount && (
                    <span className="sidebar-badge-count">
                      {item.count}
                    </span>
                  )}

                  {item.isNew && (
                    <span className="sidebar-badge-new">
                      MỚI
                    </span>
                  )}

                  {item.isAi && (
                    <span className="sidebar-badge-ai">
                      AI ⚡
                    </span>
                  )}
                </div>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Info, Streak & Settings */}
        <div className="sidebar-footer">
          {/* Streak Pill */}
          <div className="sidebar-streak-pill" title={`Daily Streak: ${streak} ngày liên tục`}>
            <div className="sidebar-streak-left">
              <Flame size={18} style={{ color: 'var(--accent-warning)', flexShrink: 0 }} />
              <span className="sidebar-text-label sidebar-streak-label">Daily Streak</span>
            </div>
            <span className="sidebar-streak-value">
              {streak} <span className="sidebar-text-label">ngày</span>
            </span>
          </div>

          {/* Command Palette Trigger */}
          <button 
            onClick={() => {
              if (onClose) onClose();
              onOpenCommandPalette();
            }}
            className="sidebar-footer-btn"
            title="Tìm kiếm nhanh (Cmd + K)"
          >
            <div className="sidebar-footer-btn-content">
              <Command size={16} />
              <span className="sidebar-text-label">Tìm nhanh</span>
            </div>
            <div className="sidebar-text-label kbd-combo">
              <span className="kbd-pill">⌘K</span>
            </div>
          </button>

          {/* Cổng Giám Sát Học Tập */}
          <button 
            onClick={() => {
              if (onClose) onClose();
              if (onOpenSupervisorPortal) {
                onOpenSupervisorPortal();
              } else {
                const url = `${window.location.origin}/giam-sat`;
                window.open(url, '_blank');
              }
            }}
            className="sidebar-footer-btn supervisor-btn" 
            title="Cổng Giám Sát Học Tập (UI)"
          >
            <div className="sidebar-footer-btn-content">
              <ShieldCheck size={16} style={{ color: 'var(--accent-primary)' }} />
              <span className="sidebar-text-label">Cổng Giám Sát</span>
            </div>
          </button>

          {/* Settings button */}
          <button 
            onClick={() => {
              if (onClose) onClose();
              onOpenSettings();
            }}
            className="sidebar-footer-btn" 
            title="Cài đặt & Sao lưu"
          >
            <div className="sidebar-footer-btn-content">
              <Settings size={16} />
              <span className="sidebar-text-label">Cài đặt</span>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
}
