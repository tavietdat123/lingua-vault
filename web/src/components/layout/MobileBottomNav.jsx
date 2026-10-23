import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Sparkles, 
  Target, 
  Menu
} from 'lucide-react';

export default function MobileBottomNav({ currentTab, dueCount = 0, vocabCount = 0, onOpenMenu }) {
  const tabs = [
    {
      id: 'dashboard',
      path: '/',
      label: 'Tổng Quan',
      icon: LayoutDashboard
    },
    {
      id: 'vocab',
      path: '/vocab',
      label: 'Kho Từ',
      icon: BookOpen,
      count: vocabCount
    },
    {
      id: 'review',
      path: '/review',
      label: 'Ôn Tập',
      icon: Sparkles,
      dueCount: dueCount,
      highlight: true
    },
    {
      id: 'quiz',
      path: '/quiz',
      label: 'Quiz',
      icon: Target
    }
  ];

  return (
    <nav className="mobile-bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id || (tab.id === 'dashboard' && currentTab === '');

        return (
          <NavLink
            key={tab.id}
            to={tab.path}
            className={`mobile-bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="mobile-nav-icon-wrapper">
              <Icon size={20} />
              {tab.dueCount > 0 && (
                <span className="mobile-nav-badge-due">
                  {tab.dueCount > 99 ? '99+' : tab.dueCount}
                </span>
              )}
            </div>
            <span className="mobile-nav-label">{tab.label}</span>
          </NavLink>
        );
      })}

      {/* 5th Tab: Menu button to open full sidebar */}
      <button
        type="button"
        onClick={onOpenMenu}
        className="mobile-bottom-nav-item mobile-bottom-nav-menu-btn"
      >
        <div className="mobile-nav-icon-wrapper">
          <Menu size={20} />
        </div>
        <span className="mobile-nav-label">Menu</span>
      </button>
    </nav>
  );
}
