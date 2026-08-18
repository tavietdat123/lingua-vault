import React, { useState, useEffect } from 'react';
import { Bell, Lock, CheckCircle2, AlertTriangle, ShieldAlert, Sparkles, Trophy } from 'lucide-react';
import { alarmAudio } from '../../services/alarmAudio.js';
import { api } from '../../services/api.js';

export default function AlarmModal({ isOpen, onClose, onChallengeCompleted, words = [], questionCount = 3 }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Initialize Questions and Start Alarm Sound
  useEffect(() => {
    if (isOpen) {
      // Get target question count (default 3, max 10)
      const count = parseInt(localStorage.getItem('linguavault_alarm_q_count') || questionCount, 10) || 3;

      // Build high-impact questions from words or fallback
      const sourceWords = words && words.length >= count ? words : [
        { word: 'resilient', meaning_vi: 'Kiên cường, có khả năng phục hồi nhanh' },
        { word: 'articulate', meaning_vi: 'Ăn nói lưu loát, diễn đạt mạch lạc' },
        { word: 'meticulous', meaning_vi: 'Tỉ mỉ, cẩn thận từng chi tiết nhỏ' },
        { word: 'leverage', meaning_vi: 'Tận dụng, phát huy tối đa đòn bẩy' },
        { word: 'pragmatic', meaning_vi: 'Thực tế, thực dụng và hiệu quả' },
        { word: 'streamline', meaning_vi: 'Tinh giản, tối ưu hóa quy trình' }
      ];

      // Shuffle & pick required count
      const shuffled = [...sourceWords].sort(() => 0.5 - Math.random()).slice(0, count);
      const generated = shuffled.map((w, idx) => {
        const otherMeanings = sourceWords
          .filter(item => item.word !== w.word)
          .map(item => item.meaning_vi)
          .slice(0, 3);

        const options = [...otherMeanings, w.meaning_vi].sort(() => 0.5 - Math.random());

        return {
          id: idx,
          word: w.word,
          phonetic: w.phonetic || '',
          questionText: `Nghĩa tiếng Việt chuẩn xác của từ "${w.word.toUpperCase()}" là gì?`,
          correctAnswer: w.meaning_vi,
          options
        };
      });

      setQuestions(generated);
      setCurrentIndex(0);
      setScore(0);
      setIsCompleted(false);
      setSelectedOption(null);
      setIsAnswered(false);

      // Start ringing alarm continuously
      alarmAudio.startAlarmSound();
    } else {
      alarmAudio.stopAlarmSound();
    }

    return () => {
      alarmAudio.stopAlarmSound();
    };
  }, [isOpen, words, questionCount]);

  if (!isOpen || questions.length === 0) return null;

  const currentQ = questions[currentIndex];

  const handleSelectOption = (opt) => {
    if (isAnswered) return;
    setSelectedOption(opt);
    setIsAnswered(true);

    const isCorrect = opt.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

    if (isCorrect) {
      setScore(prev => prev + 1);

      // If this is the final question: CUT OFF SOUND IMMEDIATELY!
      if (currentIndex + 1 >= questions.length) {
        alarmAudio.stopAlarmSound();
        alarmAudio.playSuccessSound();

        setTimeout(() => {
          setIsCompleted(true);
          if (onChallengeCompleted) onChallengeCompleted();
        }, 400);
      } else {
        alarmAudio.playBeep(1046.5, 0.15, 'sine', true);
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
          setSelectedOption(null);
          setIsAnswered(false);
        }, 500);
      }
    } else {
      alarmAudio.playErrorSound();
      setTimeout(() => {
        setSelectedOption(null);
        setIsAnswered(false);
      }, 900);
    }
  };

  const handleDismiss = () => {
    alarmAudio.stopAlarmSound();
    if (onClose) onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.25rem',
      zIndex: 99999
    }}>
      <div style={{
        width: '100%',
        maxWidth: '540px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '24px',
        border: '2px solid #ef4444',
        boxShadow: '0 0 50px rgba(239, 68, 68, 0.45)',
        overflow: 'hidden',
        animation: 'pulse 1.5s infinite'
      }}>
        {/* Urgent Header */}
        <div style={{
          backgroundColor: '#ef4444',
          color: '#ffffff',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'spin 1s infinite'
            }}>
              <Bell size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, letterSpacing: '0.5px' }}>
                🚨 BÁO THỨC KỶ LUẬT THÉP
              </h3>
              <p style={{ fontSize: '0.78rem', margin: 0, opacity: 0.9 }}>
                Bắt buộc giải đúng 3 câu trắc nghiệm để tắt chuông!
              </p>
            </div>
          </div>

          {/* Hardcore Zero Snooze Badge */}
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            padding: '0.4rem 0.75rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <Lock size={13} color="#fef08a" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fef08a', letterSpacing: '0.5px' }}>
              KHÔNG CHO HOÃN
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {!isCompleted ? (
            <>
              {/* Progress Indicator */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldAlert size={16} />
                  <span>THỬ THÁCH GIẢI MÃ: CÂU {currentIndex + 1} / {questions.length}</span>
                </span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {questions.map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: '28px',
                        height: '6px',
                        borderRadius: '3px',
                        backgroundColor: i < currentIndex ? '#10b981' : i === currentIndex ? '#ef4444' : 'var(--border-color)'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Question Card */}
              <div style={{
                backgroundColor: 'var(--bg-tertiary)',
                padding: '1.25rem',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                textAlign: 'center'
              }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: 'var(--accent-primary)',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}>
                  TỪ VỰNG CẦN GIẢI MÃ
                </span>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.5rem 0 0.2rem 0', color: 'var(--text-primary)' }}>
                  {currentQ.word.toUpperCase()}
                </h2>
                {currentQ.phonetic && (
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                    {currentQ.phonetic}
                  </span>
                )}
              </div>

              {/* Options Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {currentQ.options.map((opt, idx) => {
                  let btnBg = 'var(--bg-tertiary)';
                  let btnBorder = 'var(--border-color)';
                  let btnColor = 'var(--text-primary)';

                  if (isAnswered) {
                    if (opt === currentQ.correctAnswer) {
                      btnBg = 'rgba(16, 185, 129, 0.15)';
                      btnBorder = '#10b981';
                      btnColor = '#10b981';
                    } else if (opt === selectedOption) {
                      btnBg = 'rgba(239, 68, 68, 0.15)';
                      btnBorder = '#ef4444';
                      btnColor = '#ef4444';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(opt)}
                      disabled={isAnswered}
                      style={{
                        padding: '1rem',
                        borderRadius: '14px',
                        backgroundColor: btnBg,
                        border: `1.5px solid ${btnBorder}`,
                        color: btnColor,
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        textAlign: 'left',
                        cursor: isAnswered ? 'default' : 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{opt}</span>
                      {isAnswered && opt === currentQ.correctAnswer && (
                        <CheckCircle2 size={18} color="#10b981" />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            /* Success Screen */
            <div style={{ textAlign: 'center', padding: '1rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981'
              }}>
                <Trophy size={36} />
              </div>

              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.4rem 0' }}>
                  🎉 CHÚC MỪNG BẠN ĐÃ GIẢI MÃ THÀNH CÔNG!
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Chuông báo thức đã được <b>TẮT</b> hoàn toàn. Chuỗi ngày học Streak 🔥 của bạn đã được bảo vệ an toàn!
                </p>
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                backgroundColor: 'var(--bg-tertiary)',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)'
              }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#10b981' }}>+30 XP Thưởng</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>•</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-primary)' }}>3/3 Từ Vựng Đã Ôn</span>
              </div>

              <button
                onClick={handleDismiss}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  fontSize: '1rem',
                  fontWeight: 800,
                  borderRadius: '14px',
                  marginTop: '0.5rem',
                  backgroundColor: '#10b981'
                }}
              >
                Hoàn Thành & Trở Về Bàn Học
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
