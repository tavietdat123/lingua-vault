import React, { useState } from 'react';
import { Award, Zap, ChevronRight, Sparkles, Shield, X } from 'lucide-react';

export default function LevelPill({ profile, onOpenReport }) {
  const [showLadderModal, setShowLadderModal] = useState(false);

  if (!profile) return null;

  const {
    level = 1,
    title = 'Novice Scholar 🌱',
    totalXp = 0,
    progressPercent = 0,
    xpIntoLevel = 0,
    xpNeededForLevel = 200,
    nextLevel = 2,
    ladder = []
  } = profile;

  return (
    <>
      <div
        onClick={() => setShowLadderModal(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.6rem',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          padding: '0.35rem 0.75rem',
          borderRadius: 'var(--radius-full)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
        }}
        className="hover-card"
        title="Nhấn để xem Bảng Bậc Thang Cấp Độ & EXP"
      >
        {/* Level Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          backgroundColor: 'linear-gradient(135deg, var(--accent-primary) 0%, #38bdf8 100%)',
          background: 'var(--accent-primary)',
          color: '#ffffff',
          padding: '0.15rem 0.55rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.75rem',
          fontWeight: 800,
          letterSpacing: '0.5px'
        }}>
          <Award size={13} />
          <span>Lv.{level}</span>
        </div>

        {/* Title & XP Progress */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {title}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', fontWeight: 800 }}>
              {totalXp} XP
            </span>
          </div>

          {/* Glowing XP Progress Bar */}
          <div style={{
            width: '100px',
            height: '4px',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min(100, Math.max(8, progressPercent))}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
              borderRadius: '2px',
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>
      </div>

      {/* Level Progression Ladder Details Modal */}
      {showLadderModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem',
          zIndex: 9999
        }}>
          <div style={{
            width: '100%',
            maxWidth: '520px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '24px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-tertiary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-primary-light)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Award size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                    Bậc Thang Cấp Độ Học Thuật
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Tích lũy EXP để mở khóa các danh hiệu ngôn ngữ cao cấp
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowLadderModal(false)}
                className="btn-icon"
                style={{ padding: '0.4rem' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Current XP Progress Highlight */}
            <div style={{
              padding: '1.25rem 1.5rem',
              backgroundColor: 'var(--accent-primary-light)',
              borderBottom: '1px solid rgba(2, 132, 199, 0.15)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                  CẤP ĐỘ HIỆN TẠI
                </span>
                <h4 style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Level {level}: {title}
                </h4>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Tiến độ: <b>{xpIntoLevel} / {xpNeededForLevel} XP</b> ({progressPercent}%) • Cần thêm +{xpNeededForLevel - xpIntoLevel} XP lên Lv.{nextLevel}
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                  {totalXp}
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block' }}>
                  TỔNG EXP
                </span>
              </div>
            </div>

            {/* Ladder Steps List */}
            <div style={{ padding: '1rem 1.5rem', maxHeight: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {ladder.map((item) => {
                const isCurrent = item.level === level;
                const isUnlocked = totalXp >= item.minXp;

                return (
                  <div
                    key={item.level}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: '14px',
                      backgroundColor: isCurrent ? 'var(--accent-primary-light)' : (isUnlocked ? 'var(--bg-tertiary)' : 'transparent'),
                      border: isCurrent ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      opacity: isUnlocked ? 1 : 0.6
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        backgroundColor: isCurrent ? 'var(--accent-primary)' : (isUnlocked ? 'var(--bg-secondary)' : 'var(--bg-tertiary)'),
                        color: isCurrent ? '#ffffff' : (isUnlocked ? 'var(--accent-primary)' : 'var(--text-muted)'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 800
                      }}>
                        {item.level}
                      </div>

                      <div>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                          {item.title} {isCurrent && '⭐'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {item.perk}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isUnlocked ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {item.minXp} XP
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {onOpenReport && (
                <button
                  onClick={() => {
                    setShowLadderModal(false);
                    onOpenReport();
                  }}
                  className="btn-secondary"
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                >
                  <Sparkles size={15} color="var(--accent-primary)" />
                  <span>Xem Đánh Giá Năng Lực AI</span>
                </button>
              )}
              <button
                onClick={() => setShowLadderModal(false)}
                className="btn-primary"
                style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem', marginLeft: 'auto' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
