import React, { useState, useEffect, useMemo } from 'react';
import { 
  Volume2, 
  RotateCw, 
  CheckCircle2, 
  ArrowRight, 
  Award,
  BookOpen,
  Headphones,
  FileText,
  Keyboard,
  Trophy,
  Puzzle,
  Sparkles,
  Diamond,
  XCircle,
  Lightbulb
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playAudio, audioService } from '../../services/audioService';

// Format dynamic interval label (SM-2+ multi-milestone)
function getPreviewLabel(item, grade) {
  if (item?.previewIntervals?.[grade]?.text) {
    return item.previewIntervals[grade].text;
  }
  const rep = item?.repetition || 0;
  if (grade === 'again') return '< 10 phút';
  if (grade === 'hard') return rep === 0 ? '1 ngày' : rep === 1 ? '2 ngày' : rep === 2 ? '4 ngày' : '8 ngày';
  if (grade === 'good') return rep === 0 ? '3 ngày' : rep === 1 ? '7 ngày' : rep === 2 ? '14 ngày' : '30 ngày';
  if (grade === 'easy') return rep === 0 ? '7 ngày' : rep === 1 ? '14 ngày' : rep === 2 ? '30 ngày' : '60 ngày';
  return '3 ngày';
}

export default function SRSReviewCenter({ dueItems = [], onReviewSubmit, onFinishSession }) {
  // 1. Deck Filter: 'all' | 'words' | 'patterns'
  const [filterScope, setFilterScope] = useState('all');

  // 2. Active Recall Mode: 'flashcard' | 'cloze' | 'audio'
  const [reviewMode, setReviewMode] = useState('flashcard');

  // Session & Card State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    againCount: 0,
    hardCount: 0,
    goodCount: 0,
    easyCount: 0,
    earnedXp: 0,
  });

  // Calculate filtered counts for badge display
  const wordsCount = useMemo(() => dueItems.filter(i => (i.type || 'word') === 'word').length, [dueItems]);
  const patternsCount = useMemo(() => dueItems.filter(i => i.type === 'pattern').length, [dueItems]);

  // Dynamic session deck based on filter
  const sessionDeck = useMemo(() => {
    if (filterScope === 'words') return dueItems.filter(i => (i.type || 'word') === 'word');
    if (filterScope === 'patterns') return dueItems.filter(i => i.type === 'pattern');
    return dueItems;
  }, [dueItems, filterScope]);

  const filteredCategoryDeck = sessionDeck;
  const currentItem = sessionDeck[currentIndex];
  const isWord = (currentItem?.type || 'word') === 'word';
  const primaryExample = currentItem?.examples?.[0] || '';

  // Confetti on session completion
  useEffect(() => {
    if (isCompleted && sessionStats.reviewed > 0) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {}
    }
  }, [isCompleted, sessionStats.reviewed]);

  // Autoplay audio on audio mode (debounced with lastPlayedKeyRef to eliminate double play)
  const lastPlayedKeyRef = useRef('');
  useEffect(() => {
    if (reviewMode === 'audio' && currentItem && !isFlipped && !isCompleted) {
      const itemKey = `${currentIndex}:${currentItem.id || currentItem.word || currentItem.name}`;
      if (lastPlayedKeyRef.current !== itemKey) {
        lastPlayedKeyRef.current = itemKey;
        playAudio(currentItem.word || currentItem.name, currentItem.audio_url);
      }
    }
  }, [currentIndex, reviewMode, isFlipped, isCompleted]);

  // Keyboard Shortcuts (Space to flip, 1/2/3/4 to grade)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (isCompleted || !currentItem) return;

      if (e.code === 'Space') {
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

  // Handle Rating Submission
  const handleGrade = async (rating) => {
    if (!currentItem) return;

    if (rating === 'again') {
      audioService.playWrongSound();
    } else {
      audioService.playCorrectSound();
    }

    // XP calculation
    const xpMap = { again: 1, hard: 4, good: 7, easy: 10 };
    const xp = xpMap[rating] || 5;

    await onReviewSubmit(currentItem.id, currentItem.type || 'word', rating);

    // Update Session Metrics
    setSessionStats(prev => ({
      ...prev,
      reviewed: prev.reviewed + 1,
      againCount: rating === 'again' ? prev.againCount + 1 : prev.againCount,
      hardCount: rating === 'hard' ? prev.hardCount + 1 : prev.hardCount,
      goodCount: rating === 'good' ? prev.goodCount + 1 : prev.goodCount,
      easyCount: rating === 'easy' ? prev.easyCount + 1 : prev.easyCount,
      earnedXp: prev.earnedXp + xp
    }));

    if (currentIndex + 1 < sessionDeck.length) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setUserAnswer('');
      setIsAnswerChecked(false);
    } else {
      audioService.playVictorySound();
      setIsCompleted(true);
    }
  };

  const getClozeSentence = (sentence, word) => {
    if (!sentence || !word) return sentence;
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    return sentence.replace(regex, '________');
  };

  // Case 1: Session actually completed after reviewing cards
  if (isCompleted && sessionStats.reviewed > 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3.5rem 2rem', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--border-color)', maxWidth: '680px', margin: '2rem auto', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)' }}>
        <div style={{ width: '76px', height: '76px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', boxShadow: '0 0 20px rgba(245, 158, 11, 0.25)' }}>
          <Trophy size={42} />
        </div>
        <h3 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          Hoàn Thành Phiên Ôn Tập Xuất Sắc!
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '2rem', maxWidth: '480px', margin: '0 auto 2rem auto' }}>
          Bạn đã rèn giũa <b>{sessionStats.reviewed} lượt ôn tập</b> với thuật toán SuperMemo SM-2+. Toàn bộ chu kỳ vàng của trí nhớ đã được dời lịch tự động!
        </p>
        <button onClick={onFinishSession} className="btn-primary" style={{ padding: '0.9rem 2.5rem', fontSize: '1.05rem', margin: '0 auto', borderRadius: '14px' }}>
          <span>Trở Về Dashboard</span>
          <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  // Case 2: Zero due items overall
  if (dueItems.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3.5rem 2rem', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--border-color)', maxWidth: '620px', margin: '2rem auto', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)' }}>
        <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
          <CheckCircle2 size={38} />
        </div>
        <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
          Đã Ôn Tập Toàn Bộ Hôm Nay!
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.75rem' }}>
          Không còn thẻ từ vựng hay mẫu câu nào đến hạn. Hãy quay lại vào ngày mai để tiếp tục duy trì chu kỳ vàng trí nhớ.
        </p>
        <button onClick={onFinishSession} className="btn-primary" style={{ padding: '0.8rem 2rem', borderRadius: '12px', margin: '0 auto' }}>
          Về Trang Tổng Quan
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '780px', margin: '0 auto' }}>
      
      {/* 1. TOP BAR: CATEGORY FILTER PILLS & MODE SWITCHER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', background: 'var(--bg-secondary)', padding: '0.85rem 1.25rem', borderRadius: '18px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button onClick={() => setFilterScope('all')} style={{ padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: filterScope === 'all' ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: filterScope === 'all' ? '#ffffff' : 'var(--text-secondary)', transition: 'all 0.2s ease' }}>
            Tất cả ({dueItems.length})
          </button>
          <button onClick={() => setFilterScope('words')} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: filterScope === 'words' ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: filterScope === 'words' ? '#ffffff' : 'var(--text-secondary)', transition: 'all 0.2s ease' }}>
            <BookOpen size={13} />
            <span>Từ vựng ({wordsCount})</span>
          </button>
          <button onClick={() => setFilterScope('patterns')} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: filterScope === 'patterns' ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: filterScope === 'patterns' ? '#ffffff' : 'var(--text-secondary)', transition: 'all 0.2s ease' }}>
            <Puzzle size={13} />
            <span>Mẫu câu ({patternsCount})</span>
          </button>
        </div>

        <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: '12px', gap: '2px' }}>
          <button onClick={() => { setReviewMode('flashcard'); setIsFlipped(false); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0.4rem 0.85rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: reviewMode === 'flashcard' ? 'var(--bg-card)' : 'transparent', color: reviewMode === 'flashcard' ? 'var(--accent-primary)' : 'var(--text-muted)', boxShadow: reviewMode === 'flashcard' ? 'var(--shadow-sm)' : 'none', transition: 'all 0.15s ease' }}>
            <BookOpen size={14} />
            <span>Flashcard</span>
          </button>
          <button onClick={() => { setReviewMode('cloze'); setIsFlipped(false); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0.4rem 0.85rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: reviewMode === 'cloze' ? 'var(--bg-card)' : 'transparent', color: reviewMode === 'cloze' ? 'var(--accent-primary)' : 'var(--text-muted)', boxShadow: reviewMode === 'cloze' ? 'var(--shadow-sm)' : 'none', transition: 'all 0.15s ease' }}>
            <FileText size={14} />
            <span>Điền từ</span>
          </button>
          <button onClick={() => { setReviewMode('audio'); setIsFlipped(false); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0.4rem 0.85rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: reviewMode === 'audio' ? 'var(--bg-card)' : 'transparent', color: reviewMode === 'audio' ? 'var(--accent-primary)' : 'var(--text-muted)', boxShadow: reviewMode === 'audio' ? 'var(--shadow-sm)' : 'none', transition: 'all 0.15s ease' }}>
            <Headphones size={14} />
            <span>Nghe ẩn</span>
          </button>
        </div>
      </div>

      {/* Case 3: Empty state specifically for filtered category */}
      {filteredCategoryDeck.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            {filterScope === 'patterns' ? (
              <Puzzle size={44} color="var(--accent-primary)" />
            ) : (
              <BookOpen size={44} color="var(--accent-primary)" />
            )}
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            {filterScope === 'patterns' ? 'Không có mẫu câu nào cần ôn tập hôm nay!' : 'Không có từ vựng nào cần ôn tập hôm nay!'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.5rem', maxWidth: '440px', margin: '0 auto 1.5rem auto' }}>
            Tất cả các {filterScope === 'patterns' ? 'mẫu câu' : 'từ vựng'} đang trong chu kỳ nhớ an toàn. Hãy chuyển sang danh mục khác còn thẻ đến hạn.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            <button onClick={() => setFilterScope('all')} className="btn-primary" style={{ padding: '0.65rem 1.35rem', borderRadius: '12px' }}>
              Ôn Tất Cả Thẻ ({dueItems.length})
            </button>
            {filterScope !== 'words' && wordsCount > 0 && (
              <button onClick={() => setFilterScope('words')} className="btn-secondary" style={{ padding: '0.65rem 1.35rem', borderRadius: '12px' }}>
                Ôn Từ Vựng ({wordsCount})
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* 2. PROGRESS BAR & REALTIME STATS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Thẻ {currentIndex + 1} / {sessionDeck.length}
              </span>
              <div style={{ width: '140px', height: '6px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, ((currentIndex + 1) / sessionDeck.length) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', borderRadius: 'var(--radius-full)', transition: 'width 0.4s ease' }} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-primary)' }}>
                <Award size={14} /> +{sessionStats.earnedXp} XP
              </span>
              <span>•</span>
              <span style={{ color: '#10b981' }}>✓ {sessionStats.goodCount + sessionStats.easyCount}</span>
              <span style={{ color: '#ef4444' }}>✗ {sessionStats.againCount}</span>
            </div>
          </div>

          {/* 3. 3D FLASHCARD DISPLAY CONTAINER */}
          <div className="flashcard-container" onClick={() => (reviewMode === 'flashcard' || reviewMode === 'audio') && setIsFlipped(!isFlipped)} style={{ minHeight: '440px' }}>
            <div className={`flashcard-inner ${isFlipped ? 'flipped' : ''}`} style={{ minHeight: '440px' }}>
              
              {/* FRONT FACE */}
              <div className="flashcard-face" style={{ minHeight: '440px', borderRadius: '24px', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`badge ${isWord ? 'badge-blue' : 'badge-purple'}`} style={{ fontWeight: 800, padding: '0.25rem 0.65rem' }}>
                      {isWord ? (currentItem?.level || 'B2') : 'MẪU CÂU'}
                    </span>
                    {isWord && currentItem?.part_of_speech && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                        {currentItem.part_of_speech}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    ⏱ Lặp lại: {currentItem?.repetition || 0} lần
                  </span>
                </div>

                <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center' }}>
                  {reviewMode === 'flashcard' && (
                    <>
                      <h3 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                        {isWord ? currentItem?.word : currentItem?.name}
                      </h3>
                      {isWord && currentItem?.phonetic && (
                        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontSize: '1.2rem' }}>
                          {currentItem.phonetic}
                        </p>
                      )}
                      {!isWord && currentItem?.formula && (
                        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontSize: '1.05rem', fontWeight: 700 }}>
                          {currentItem.formula}
                        </p>
                      )}
                    </>
                  )}

                  {reviewMode === 'cloze' && (
                    <div style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.6 }}>
                        "{getClozeSentence(primaryExample || currentItem?.word || currentItem?.name, isWord ? currentItem?.word : currentItem?.name)}"
                      </p>
                      <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
                        Nghĩa: {currentItem?.meaning_vi || currentItem?.meaning}
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <input
                          type="text"
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.stopPropagation();
                              setIsAnswerChecked(true);
                              setIsFlipped(true);
                            }
                          }}
                          onClick={(e) => e.stopPropagation() }
                          placeholder="Gõ từ vựng còn thiếu..."
                          className="input-control"
                          style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 700 }}
                          autoFocus
                        />
                        <button onClick={(e) => { e.stopPropagation(); setIsAnswerChecked(true); setIsFlipped(true); }} className="btn-primary" style={{ padding: '0 1.25rem', borderRadius: '12px', flexShrink: 0 }}>
                          Kiểm Tra
                        </button>
                      </div>
                    </div>
                  )}

                  {reviewMode === 'audio' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                      <button onClick={(e) => { e.stopPropagation(); playAudio(currentItem?.word || currentItem?.name, currentItem?.audio_url); }} style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px var(--accent-primary-glow)' }}>
                        <Volume2 size={36} />
                      </button>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Nghe phát âm chuẩn Studio và nhớ lại nghĩa trước khi lật thẻ
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <RotateCw size={14} />
                  <span>Chạm hoặc bấm [Phím Cách] để lật mặt sau</span>
                </div>
              </div>

              {/* BACK FACE */}
              <div className="flashcard-face flashcard-back" style={{ minHeight: '440px', borderRadius: '24px', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {isWord ? currentItem?.word : currentItem?.name}
                    </h4>
                    <button onClick={(e) => { e.stopPropagation(); playAudio(currentItem?.word || currentItem?.name, currentItem?.audio_url); }} className="btn-icon" style={{ color: 'var(--accent-primary)', width: '32px', height: '32px' }}>
                      <Volume2 size={18} />
                    </button>
                  </div>
                  {isWord && currentItem?.phonetic && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                      {currentItem.phonetic}
                    </span>
                  )}
                </div>

                <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', gap: '0.9rem', textAlign: 'left' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Nghĩa Tiếng Việt:
                    </span>
                    <p style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '0.15rem' }}>
                      {currentItem?.meaning_vi || currentItem?.meaning || currentItem?.description}
                    </p>
                  </div>
                  {currentItem?.meaning_en && (
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {currentItem.meaning_en}
                    </p>
                  )}
                  {currentItem?.collocations && currentItem.collocations.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {currentItem.collocations.map((c, i) => (
                        <span key={i} className="tag-pill" style={{ background: 'var(--accent-primary-light)', color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 700 }}>
                          ⚡ {typeof c === 'string' ? c : c.phrase}
                        </span>
                      ))}
                    </div>
                  )}
                  {primaryExample && (
                    <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-secondary)', borderLeft: '3px solid var(--accent-primary)' }}>
                      "{primaryExample}"
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Chọn mức độ ghi nhớ để SM-2+ tự động tính mốc nhắc lại tiếp theo:
                </div>
              </div>
            </div>
          </div>

          {/* 4. SUPERMEMO SM-2+ MULTI-MILESTONE RATING BUTTONS */}
          {isFlipped ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem', marginTop: '1.25rem', position: 'relative', zIndex: 10 }}>
              <button onClick={() => handleGrade('again')} style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1.5px solid #ef4444', padding: '1rem 0.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', fontWeight: 800, cursor: 'pointer', transition: 'transform 0.15s ease', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)' }}>
                <span style={{ fontSize: '0.98rem' }}>🔴 Quên</span>
                <span style={{ fontSize: '0.78rem', opacity: 0.9, fontWeight: 700 }}>Mốc: &lt; 10 phút</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>[Phím 1]</span>
              </button>
              <button onClick={() => handleGrade('hard')} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: '1.5px solid #f59e0b', padding: '1rem 0.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', fontWeight: 800, cursor: 'pointer', transition: 'transform 0.15s ease', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)' }}>
                <span style={{ fontSize: '0.98rem' }}>🟡 Khó</span>
                <span style={{ fontSize: '0.78rem', opacity: 0.9, fontWeight: 700 }}>Mốc: {getPreviewLabel(currentItem, 'hard')}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>[Phím 2]</span>
              </button>
              <button onClick={() => handleGrade('good')} style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7', border: '1.5px solid #0284c7', padding: '1rem 0.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', fontWeight: 800, cursor: 'pointer', transition: 'transform 0.15s ease', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.15)' }}>
                <span style={{ fontSize: '0.98rem' }}>🟢 Nhớ tốt</span>
                <span style={{ fontSize: '0.78rem', opacity: 0.9, fontWeight: 700 }}>Mốc: {getPreviewLabel(currentItem, 'good')}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>[Phím 3]</span>
              </button>
              <button onClick={() => handleGrade('easy')} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1.5px solid #10b981', padding: '1rem 0.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', fontWeight: 800, cursor: 'pointer', transition: 'transform 0.15s ease', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)' }}>
                <span style={{ fontSize: '0.98rem' }}>💎 Dễ</span>
                <span style={{ fontSize: '0.78rem', opacity: 0.9, fontWeight: 700 }}>Mốc: {getPreviewLabel(currentItem, 'easy')}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>[Phím 4]</span>
              </button>
            </div>
          ) : (
            <button onClick={() => setIsFlipped(true)} className="btn-primary" style={{ width: '100%', padding: '1.1rem', fontSize: '1.05rem', fontWeight: 800, borderRadius: '16px', marginTop: '1.25rem' }}>
              <RotateCw size={18} />
              <span>Lật Thẻ Xem Đáp Án (Phím Space)</span>
            </button>
          )}

          {/* Bottom Hint */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            <Keyboard size={13} />
            <span>Phím tắt: [Space] Lật thẻ • [1] Quên • [2] Khó • [3] Nhớ tốt • [4] Dễ</span>
          </div>
        </>
      )}
    </div>
  );
}
