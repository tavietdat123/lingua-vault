import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Volume2, 
  RotateCw, 
  CheckCircle2, 
  ArrowRight, 
  Flame, 
  Layers, 
  HelpCircle,
  Eye,
  Keyboard
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playAudio } from '../../services/audioService';

export default function SRSReviewCenter({ dueItems = [], onReviewSubmit, onFinishSession }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewMode, setReviewMode] = useState('flashcard'); // 'flashcard' | 'cloze' | 'audio'
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  const currentItem = dueItems[currentIndex];

  useEffect(() => {
    if (dueItems.length === 0 && !isCompleted) {
      setIsCompleted(true);
    }
  }, [dueItems, isCompleted]);

  // Autoplay audio on card show if audio mode or word has audio
  useEffect(() => {
    if (currentItem && (reviewMode === 'audio' || isFlipped)) {
      playAudio(currentItem.word || currentItem.name, currentItem.audio_url);
    }
  }, [currentIndex, isFlipped, reviewMode]);

  // Handle rating submission
  const handleGrade = async (rating) => {
    if (!currentItem) return;

    await onReviewSubmit(currentItem.id, currentItem.type || 'word', rating);
    setReviewedCount(prev => prev + 1);

    if (currentIndex + 1 < dueItems.length) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setUserAnswer('');
      setIsAnswerChecked(false);
    } else {
      setIsCompleted(true);
      // Trigger Celebration Confetti!
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {
        console.log('Confetti triggered');
      }
    }
  };

  // Cloze Sentence generator (hides target word with blanks)
  const getClozeSentence = (sentence, word) => {
    if (!sentence || !word) return sentence;
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    return sentence.replace(regex, '________');
  };

  // Keyboard shortcut listener (Space = Flip, 1 = Again, 2 = Hard, 3 = Good, 4 = Easy)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isCompleted || !currentItem) return;

      if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (isFlipped) {
        if (e.key === '1') handleGrade('again');
        if (e.key === '2') handleGrade('hard');
        if (e.key === '3') handleGrade('good');
        if (e.key === '4') handleGrade('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentIndex, isCompleted, currentItem]);

  // If session finished or no due items
  if (isCompleted || dueItems.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '4rem 2rem',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-color)',
        maxWidth: '650px',
        margin: '2rem auto',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          background: 'var(--accent-success-light)',
          color: 'var(--accent-success)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem auto'
        }}>
          <CheckCircle2 size={40} />
        </div>

        <h3 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
          Tuyệt Vời! Đã Hoàn Thành Ôn Tập
        </h3>

        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '2rem' }}>
          Bạn đã hoàn thành <b>{reviewedCount || dueItems.length} thẻ</b> hôm nay. Thuật toán SRS đã tính toán lại chu kỳ vàng tiếp theo cho trí nhớ của bạn.
        </p>

        <button
          onClick={onFinishSession}
          className="btn-primary"
          style={{ padding: '0.85rem 2rem', fontSize: '1.05rem', margin: '0 auto' }}
        >
          <span>Quay Lại Dashboard</span>
          <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  const isWord = currentItem.type === 'word' || !currentItem.formula;
  const primaryExample = currentItem.examples?.[0] || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '750px', margin: '0 auto' }}>
      {/* 1. SESSION TOP BAR: PROGRESS & MODE SWITCHER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            Thẻ {currentIndex + 1} / {dueItems.length}
          </span>
          <div style={{
            width: '120px',
            height: '8px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${((currentIndex + 1) / dueItems.length) * 100}%`,
              height: '100%',
              background: 'var(--accent-primary)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Mode Selector */}
        <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
          <button
            onClick={() => setReviewMode('flashcard')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: reviewMode === 'flashcard' ? 'var(--bg-card)' : 'transparent',
              color: reviewMode === 'flashcard' ? 'var(--accent-primary)' : 'var(--text-muted)'
            }}
          >
            Flashcard
          </button>
          <button
            onClick={() => setReviewMode('cloze')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: reviewMode === 'cloze' ? 'var(--bg-card)' : 'transparent',
              color: reviewMode === 'cloze' ? 'var(--accent-primary)' : 'var(--text-muted)'
            }}
          >
            Điền từ
          </button>
          <button
            onClick={() => setReviewMode('audio')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: reviewMode === 'audio' ? 'var(--bg-card)' : 'transparent',
              color: reviewMode === 'audio' ? 'var(--accent-primary)' : 'var(--text-muted)'
            }}
          >
            Luyện nghe
          </button>
        </div>
      </div>

      {/* 2. 3D FLASHCARD CONTAINER */}
      <div 
        className="flashcard-container"
        onClick={() => reviewMode === 'flashcard' && setIsFlipped(!isFlipped)}
      >
        <div className={`flashcard-inner ${isFlipped ? 'flipped' : ''}`}>
          {/* FRONT FACE */}
          <div className="flashcard-face">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-blue">
                {isWord ? (currentItem.level || 'Vocab') : 'Pattern / Ngữ Pháp'}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {isWord ? currentItem.part_of_speech : currentItem.tone}
              </span>
            </div>

            {/* Front Content depending on mode */}
            <div style={{ margin: 'auto 0', padding: '1rem 0' }}>
              {reviewMode === 'audio' ? (
                /* Audio Mode Front */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudio(currentItem.word || currentItem.name, currentItem.audio_url);
                    }}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'var(--accent-primary-light)',
                      color: 'var(--accent-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 14px rgba(56,189,248,0.25)'
                    }}
                  >
                    <Volume2 size={32} />
                  </button>
                  <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                    Chạm loa để nghe và đoán nghĩa của từ
                  </p>
                </div>
              ) : reviewMode === 'cloze' && primaryExample ? (
                /* Cloze Mode Front */
                <div>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.6, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                    "{getClozeSentence(primaryExample, currentItem.word)}"
                  </h4>
                  <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '350px', margin: '0 auto' }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="Gõ từ còn thiếu..."
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setIsFlipped(true);
                        }
                      }}
                      autoFocus
                      style={{ textAlign: 'center', fontWeight: 700 }}
                    />
                  </div>
                </div>
              ) : (
                /* Standard Flashcard Front */
                <div>
                  <h3 style={{ fontSize: '2.4rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
                    {isWord ? currentItem.word : currentItem.name}
                  </h3>

                  {isWord && currentItem.phonetic && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', color: 'var(--text-muted)' }}>
                      {currentItem.phonetic}
                    </span>
                  )}

                  {!isWord && (
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', color: 'var(--accent-primary)', marginTop: '0.5rem' }}>
                      {currentItem.formula}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <RotateCw size={14} />
              <span>Chạm hoặc bấm [Phím Cách] để lật mặt sau</span>
            </div>
          </div>

          {/* BACK FACE */}
          <div className="flashcard-face flashcard-back">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h4 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                  {isWord ? currentItem.word : currentItem.name}
                </h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio(currentItem.word || currentItem.name, currentItem.audio_url);
                  }}
                  className="btn-icon"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  <Volume2 size={18} />
                </button>
              </div>

              {isWord && currentItem.phonetic && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  {currentItem.phonetic}
                </span>
              )}
            </div>

            {/* Back Content */}
            <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Nghĩa tiếng Việt:
                </span>
                <p style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '0.2rem' }}>
                  {currentItem.meaning_vi}
                </p>
              </div>

              {currentItem.meaning_en && (
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {currentItem.meaning_en}
                </p>
              )}

              {/* Collocations */}
              {currentItem.collocations && currentItem.collocations.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center' }}>
                  {currentItem.collocations.map((c, i) => (
                    <span key={i} className="tag-pill" style={{ background: 'var(--accent-primary-light)', color: 'var(--accent-primary)' }}>
                      {c}
                    </span>
                  ))}
                </div>
              )}

              {/* Example */}
              {primaryExample && (
                <div style={{
                  background: 'var(--bg-tertiary)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem',
                  fontStyle: 'italic',
                  color: 'var(--text-secondary)'
                }}>
                  "{primaryExample}"
                </div>
              )}
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Hãy tự đánh giá mức độ ghi nhớ để thuật toán SM-2 dời lịch ôn tập:
            </div>
          </div>
        </div>
      </div>

      {/* 3. SM-2 GRADE BUTTONS (AGAIN / HARD / GOOD / EASY) */}
      {isFlipped ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.75rem',
          marginTop: '0.5rem'
        }}>
          {/* Again */}
          <button
            onClick={() => handleGrade('again')}
            style={{
              background: 'var(--accent-danger-light)',
              color: 'var(--accent-danger)',
              border: '1px solid var(--accent-danger)',
              padding: '0.85rem 0.5rem',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.2rem',
              fontWeight: 700
            }}
          >
            <span style={{ fontSize: '1rem' }}>🔴 Quên (Again)</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Nhắc lại: &lt;10m [Phím 1]</span>
          </button>

          {/* Hard */}
          <button
            onClick={() => handleGrade('hard')}
            style={{
              background: 'var(--accent-warning-light)',
              color: 'var(--accent-warning)',
              border: '1px solid var(--accent-warning)',
              padding: '0.85rem 0.5rem',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.2rem',
              fontWeight: 700
            }}
          >
            <span style={{ fontSize: '1rem' }}>🟡 Khó (Hard)</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Nhắc lại: 1-2 ngày [Phím 2]</span>
          </button>

          {/* Good */}
          <button
            onClick={() => handleGrade('good')}
            style={{
              background: 'var(--accent-primary-light)',
              color: 'var(--accent-primary)',
              border: '1px solid var(--accent-primary)',
              padding: '0.85rem 0.5rem',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.2rem',
              fontWeight: 700
            }}
          >
            <span style={{ fontSize: '1rem' }}>🟢 Nhớ tốt (Good)</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Nhắc lại: 4-6 ngày [Phím 3]</span>
          </button>

          {/* Easy */}
          <button
            onClick={() => handleGrade('easy')}
            style={{
              background: 'var(--accent-success-light)',
              color: 'var(--accent-success)',
              border: '1px solid var(--accent-success)',
              padding: '0.85rem 0.5rem',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.2rem',
              fontWeight: 700
            }}
          >
            <span style={{ fontSize: '1rem' }}>🔵 Quá dễ (Easy)</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Nhắc lại: 10+ ngày [Phím 4]</span>
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsFlipped(true)}
          className="btn-primary"
          style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', justifyContent: 'center' }}
        >
          <RotateCw size={18} />
          <span>Lật Thẻ Xem Đáp Án (Phím Space)</span>
        </button>
      )}

      {/* Keyboard Hint */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <Keyboard size={14} />
        <span>Phím tắt: [Space] Lật thẻ • [1] Quên • [2] Khó • [3] Nhớ tốt • [4] Quá dễ</span>
      </div>
    </div>
  );
}
