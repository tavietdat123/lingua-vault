import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { audioService } from '../../services/audioService';
import { 
  Trophy, 
  Target, 
  CheckCircle, 
  XCircle, 
  Volume2, 
  RotateCcw, 
  BookOpen, 
  Zap, 
  Tag, 
  Flame, 
  Sparkles, 
  History, 
  Plus, 
  RefreshCw, 
  Layers, 
  Puzzle, 
  CheckCircle2, 
  FileText,
  Clock,
  Shuffle,
  Headphones,
  Edit3,
  ArrowRight
} from 'lucide-react';

export default function QuizCenter({ onOpenReview }) {
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'
  const [quizCategory, setQuizCategory] = useState('vocab'); // 'vocab' | 'pattern'
  const [topics, setTopics] = useState([]);
  const [patternCategories, setPatternCategories] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState(['All']);
  const [selectedPatternCategory, setSelectedPatternCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [questionCount, setQuestionCount] = useState(5);
  const [quizMode, setQuizMode] = useState('mixed');
  const [loading, setLoading] = useState(false);

  // History State
  const [quizHistory, setQuizHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'vocab' | 'pattern'

  // Active Quiz State
  const [quizData, setQuizData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [streakCount, setStreakCount] = useState(0);

  // Result State
  const [quizResult, setQuizResult] = useState(null);

  useEffect(() => {
    loadTopics();
    loadPatternCategories();
    loadQuizHistory();
  }, []);

  const loadTopics = async () => {
    const res = await api.getQuizTopics();
    if (res.success) {
      setTopics(res.data || []);
    }
  };

  const loadPatternCategories = async () => {
    const res = await api.getPatternCategories();
    if (res.success) {
      setPatternCategories(res.data || []);
    }
  };

  const loadQuizHistory = async () => {
    const res = await api.getQuizHistory();
    if (res.success) {
      setQuizHistory(res.data || []);
    }
  };

  const handleRetakeQuiz = async (historyItem) => {
    setLoading(true);
    try {
      const res = await api.getQuizHistoryById(historyItem.id);
      if (res.success && res.data && res.data.questions?.length > 0) {
        setQuizData(res.data);
        setCurrentIndex(0);
        setUserAnswers([]);
        setSelectedOption(null);
        setIsAnswered(false);
        setStreakCount(0);
        setQuizResult(null);
      } else {
        alert('Không thể tải lại đề thi: ' + (res.error || 'Dữ liệu câu hỏi rỗng'));
      }
    } catch (e) {
      alert('Lỗi nạp đề thi: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Bạn có chắc muốn xóa bộ đề này khỏi lịch sử?')) return;
    try {
      const res = await api.deleteQuizHistory(id);
      if (res.success) {
        loadQuizHistory();
      } else {
        alert(res.error || 'Không thể xóa');
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const toggleTopic = (topicKey) => {
    if (topicKey === 'All' || topicKey === 'all') {
      setSelectedTopics(['All']);
      return;
    }

    let updated = selectedTopics.filter(t => t !== 'All' && t !== 'all');
    if (updated.includes(topicKey)) {
      updated = updated.filter(t => t !== topicKey);
      if (updated.length === 0) updated = ['All'];
    } else {
      updated.push(topicKey);
    }
    setSelectedTopics(updated);
  };

  const handleStartQuiz = async (useAi = false) => {
    setLoading(true);
    try {
      let res;
      if (quizCategory === 'pattern') {
        if (useAi) {
          res = await api.generateAIPatternQuiz({
            category: selectedPatternCategory,
            count: questionCount,
            level: selectedLevel,
            mode: quizMode
          });
        } else {
          res = await api.generatePatternQuiz({
            category: selectedPatternCategory,
            count: questionCount,
            mode: quizMode,
            level: selectedLevel
          });
        }
      } else {
        if (useAi) {
          res = await api.generateAIQuiz({
            topic: selectedTopics,
            count: questionCount,
            level: selectedLevel,
            mode: quizMode
          });
        } else {
          res = await api.generateQuiz({
            topic: selectedTopics,
            count: questionCount,
            mode: quizMode,
            level: selectedLevel
          });
        }
      }

      if (res.success && res.data.questions?.length > 0) {
        setQuizData(res.data);
        setCurrentIndex(0);
        setUserAnswers([]);
        setSelectedOption(null);
        setIsAnswered(false);
        setStreakCount(0);
        setQuizResult(null);
        loadQuizHistory();

        // Auto-play audio if first question is listening
        if (res.data.questions[0].type === 'listening') {
          audioService.speak(res.data.questions[0].word);
        }
      } else {
        alert(res.error || 'Không đủ dữ liệu để tạo bài Quiz.');
      }
    } catch (err) {
      alert('Lỗi tạo bài quiz: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetakeCurrentQuiz = () => {
    if (quizData && quizData.questions?.length > 0) {
      setCurrentIndex(0);
      setUserAnswers([]);
      setSelectedOption(null);
      setIsAnswered(false);
      setStreakCount(0);
      setQuizResult(null);

      // Auto-play audio if first question is listening
      if (quizData.questions[0]?.type === 'listening') {
        audioService.speak(quizData.questions[0].word);
      }
    } else {
      handleStartQuiz(false);
    }
  };

  const handleSelectOption = (option) => {
    if (isAnswered) return;

    setSelectedOption(option);
    setIsAnswered(true);

    const currentQ = quizData.questions[currentIndex];
    const isCorrect = option.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

    if (isCorrect) {
      const nextStreak = streakCount + 1;
      setStreakCount(nextStreak);
      if (nextStreak >= 3) {
        audioService.playStreakSound(nextStreak);
      } else {
        audioService.playCorrectSound();
      }
    } else {
      setStreakCount(0);
      audioService.playWrongSound();
    }

    // Save answer at current question index
    const answerItem = {
      id: currentQ.id,
      word: currentQ.word,
      questionText: currentQ.questionText,
      correctAnswer: currentQ.correctAnswer,
      userAnswer: option
    };

    setUserAnswers(prev => {
      const updated = [...prev];
      updated[currentIndex] = answerItem;
      return updated;
    });
  };

  const handleNextQuestion = async () => {
    audioService.playTapSound();

    if (currentIndex + 1 < quizData.questions.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSelectedOption(null);
      setIsAnswered(false);

      if (quizData.questions[nextIdx].type === 'listening') {
        audioService.speak(quizData.questions[nextIdx].word);
      }
    } else {
      // Ensure all answers across all questions are aggregated
      setLoading(true);
      try {
        const answersToSubmit = quizData.questions.map((q, idx) => {
          if (userAnswers[idx]) return userAnswers[idx];
          if (idx === currentIndex && selectedOption) {
            return {
              id: q.id,
              word: q.word,
              questionText: q.questionText,
              correctAnswer: q.correctAnswer,
              userAnswer: selectedOption
            };
          }
          return {
            id: q.id,
            word: q.word,
            questionText: q.questionText,
            correctAnswer: q.correctAnswer,
            userAnswer: ''
          };
        });

        const res = await api.submitQuiz(answersToSubmit, quizData?.history_id || null);
        if (res.success && res.data) {
          audioService.playVictorySound();
          setQuizResult(res.data);
          loadQuizHistory();
        } else {
          alert('Lỗi nộp bài: ' + (res.error || 'Vui lòng thử lại'));
        }
      } catch (err) {
        alert('Lỗi nộp bài: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Keyboard shortcut listener (1, 2, 3, 4)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!quizData || isAnswered || quizResult) return;
      const currentQ = quizData.questions[currentIndex];
      if (!currentQ) return;

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= currentQ.options.length) {
        handleSelectOption(currentQ.options[num - 1]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quizData, currentIndex, isAnswered, quizResult]);

  // ================= 1. RESULT SCREEN =================
  if (quizResult) {
    const isGreat = quizResult.score >= 80;
    return (
      <div className="quiz-center-container">
        <div className="quiz-result-card">
          <div className="result-header">
            <div className={`result-badge-icon ${isGreat ? 'success' : 'warning'}`}>
              {isGreat ? <Trophy size={42} /> : <Target size={42} />}
            </div>
            <h2>{isGreat ? 'Xuất Sắc! Hoàn Thành Bài Quiz' : 'Hoàn Thành Bài Tập!'}</h2>
            <p className="result-subtitle">
              Bạn đã trả lời đúng <b>{quizResult.correctCount} / {quizResult.totalQuestions}</b> câu hỏi
            </p>
          </div>

          <div className="result-stats-row">
            <div className="result-stat-box">
              <span className="stat-label">Điểm Số</span>
              <span className="stat-val score">{quizResult.score}%</span>
            </div>
            <div className="result-stat-box">
              <span className="stat-label">Kinh Nghiệm</span>
              <span className="stat-val xp">+{quizResult.xpEarned} XP</span>
            </div>
            <div className="result-stat-box">
              <span className="stat-label">Độ Chính Xác</span>
              <span className="stat-val accuracy">{quizResult.isPerfect ? '100% Hoàn hảo' : `${quizResult.correctCount}/${quizResult.totalQuestions}`}</span>
            </div>
          </div>

          <div className="result-breakdown">
            <h3>Chi Tiết Câu Trả Lời</h3>
            <div className="breakdown-list">
              {quizResult.results.map((item, idx) => (
                <div key={idx} className={`breakdown-item ${item.isCorrect ? 'correct' : 'incorrect'}`}>
                  <div className="item-status-icon">
                    {item.isCorrect ? <CheckCircle size={18} color="#10b981" /> : <XCircle size={18} color="#ef4444" />}
                  </div>
                  <div className="item-details">
                    <div className="item-word">
                      <b>{item.word}</b>
                      <button 
                        className="mini-audio-btn" 
                        onClick={() => audioService.speak(item.word)}
                        title="Nghe phát âm"
                      >
                        <Volume2 size={14} />
                      </button>
                    </div>
                    <div className="item-answers">
                      <span>Bạn chọn: <i className={item.isCorrect ? 'text-green' : 'text-red'}>{item.userAnswer}</i></span>
                      {!item.isCorrect && (
                        <span> • Đáp án đúng: <b className="text-green">{item.correctAnswer}</b></span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="result-actions">
            <button className="btn btn-primary" onClick={handleRetakeCurrentQuiz} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <RotateCcw size={16} />
              <span>Làm Lại Bài Quiz Này</span>
            </button>
            <button className="btn btn-secondary" onClick={() => { setQuizData(null); setQuizResult(null); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={16} />
              <span>Chọn Topic Khác</span>
            </button>
            {onOpenReview && (
              <button className="btn btn-secondary" onClick={onOpenReview} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={16} />
                <span>Vào Ôn Tập SRS</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ================= 2. ACTIVE QUIZ PLAY SCREEN =================
  if (quizData && quizData.questions.length > 0) {
    const currentQ = quizData.questions[currentIndex];
    const progressPercent = ((currentIndex + 1) / quizData.questions.length) * 100;
    const optionLabels = ['A', 'B', 'C', 'D'];

    return (
      <div className="quiz-center-container">
        <div className="quiz-active-card">
          {/* 1. TOP PROGRESS & STATUS BAR */}
          <div className="quiz-top-bar">
            <div className="quiz-progress-info">
              <span className="question-counter-badge">
                CÂU {currentIndex + 1} <span style={{ opacity: 0.6 }}>/ {quizData.questions.length}</span>
              </span>
              <span className="quiz-topic-pill">
                <Tag size={13} />
                <span>{quizData.topic}</span>
              </span>
              {streakCount > 1 && (
                <span className="quiz-streak-pill">
                  <Flame size={14} color="#f59e0b" />
                  <span>Combo x{streakCount} 🔥</span>
                </span>
              )}
            </div>
            <button 
              className="quiz-exit-btn"
              onClick={() => {
                if (confirm('Bạn có chắc muốn thoát bài Quiz hiện tại?')) {
                  setQuizData(null);
                }
              }}
              title="Thoát bài thi"
            >
              ✕ Thoát
            </button>
          </div>

          {/* Smooth Progress Bar */}
          <div className="quiz-progress-track">
            <div className="quiz-progress-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>

          {/* 2. QUESTION PROMPT HERO BOX */}
          <div className="quiz-question-box">
            <div className="prompt-header">
              <span className="prompt-type-badge">
                {currentQ.type === 'meaning_vi' && '🎯 Nghĩa Tiếng Việt'}
                {currentQ.type === 'reverse_en' && '🇬🇧 Tìm Từ Tiếng Anh'}
                {currentQ.type === 'cloze_blank' && '🧩 Điền Từ Vào Câu'}
                {currentQ.type === 'listening' && '🎧 Luyện Nghe & Chọn Nghĩa'}
                {currentQ.type === 'fill_clause' && '⚡ Điền Mẫu Câu / Liên Từ'}
                {currentQ.type === 'meaning_usage' && '💡 Ứng Dụng Mẫu Câu'}
                {currentQ.type === 'formula_check' && '📐 Công Thức Ngữ Pháp'}
                {currentQ.type === 'pattern_context' && '🤖 Cấu Trúc Ngữ Cảnh AI'}
              </span>
              {currentQ.promptSubtitle && (
                <span className="prompt-subtitle">{currentQ.promptSubtitle}</span>
              )}
            </div>

            <div className="question-main-content">
              {currentQ.type === 'listening' ? (
                <div className="listening-prompt-card">
                  <button 
                    className="big-speaker-btn" 
                    onClick={() => audioService.speak(currentQ.word)}
                    title="Bấm để nghe phát âm chuẩn"
                  >
                    <Volume2 size={36} />
                  </button>
                  <div className="listening-hint-box">
                    <span className="listening-hint">Nhấn nút loa để nghe phát âm</span>
                    <span className="listening-subhint">(Có thể nghe lại nhiều lần)</span>
                  </div>
                </div>
              ) : (
                <div className="text-prompt-display">
                  <h2 className="question-text">{currentQ.questionText}</h2>
                  {currentQ.formula && (
                    <div className="quiz-formula-tag">
                      {currentQ.formula}
                    </div>
                  )}
                  {currentQ.phonetic && currentQ.type !== 'reverse_en' && (
                    <div className="phonetic-audio-row">
                      <span className="phonetic-text">{currentQ.phonetic}</span>
                      <button 
                        className="mini-audio-btn" 
                        onClick={() => audioService.speak(currentQ.word)}
                        title="Nghe phát âm"
                      >
                        <Volume2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 3. PRO MAX 4 OPTIONS GRID */}
          <div className="quiz-options-grid">
            {currentQ.options.map((opt, idx) => {
              const optStr = String(opt || '');
              const correctStr = String(currentQ?.correctAnswer || '');
              const isCorrect = isAnswered && optStr.trim().toLowerCase() === correctStr.trim().toLowerCase();
              const isSelected = selectedOption === opt;
              const isWrong = isAnswered && isSelected && !isCorrect;
              const isDimmed = isAnswered && !isCorrect && !isSelected;

              let btnClass = 'quiz-option-btn';
              if (isCorrect) btnClass += ' correct-option';
              else if (isWrong) btnClass += ' incorrect-option';
              else if (isDimmed) btnClass += ' dimmed-option';
              else if (isSelected) btnClass += ' selected';

              return (
                <button
                  key={idx}
                  className={btnClass}
                  onClick={() => handleSelectOption(opt)}
                  disabled={isAnswered}
                >
                  <span className="option-key-badge">{optionLabels[idx] || idx + 1}</span>
                  <span className="option-text">{opt}</span>
                  {isCorrect && (
                    <span className="option-status-icon success">
                      <CheckCircle2 size={20} />
                    </span>
                  )}
                  {isWrong && (
                    <span className="option-status-icon danger">
                      <XCircle size={20} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 4. ANSWER FEEDBACK & NEXT ACTION BAR */}
          {isAnswered && (
            <div className={`answer-feedback-card ${String(selectedOption || '').trim().toLowerCase() === String(currentQ?.correctAnswer || '').trim().toLowerCase() ? 'feedback-correct' : 'feedback-incorrect'}`}>
              <div className="feedback-message">
                {String(selectedOption || '').trim().toLowerCase() === String(currentQ?.correctAnswer || '').trim().toLowerCase() ? (
                  <div className="feedback-inner-row">
                    <div className="feedback-icon-wrap correct">
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <div className="feedback-title correct">Chính xác tuyệt đối! 🎉</div>
                      <div className="feedback-desc">Bạn vừa củng cố vững chắc điểm nhớ của từ này.</div>
                    </div>
                  </div>
                ) : (
                  <div className="feedback-inner-row">
                    <div className="feedback-icon-wrap incorrect">
                      <XCircle size={22} />
                    </div>
                    <div>
                      <div className="feedback-title incorrect">Chưa chính xác!</div>
                      <div className="feedback-desc">
                        Đáp án đúng là: <strong className="correct-answer-highlight">{currentQ.correctAnswer}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button className="btn btn-primary next-quiz-btn" onClick={handleNextQuestion}>
                <span>{currentIndex + 1 < quizData.questions.length ? 'Câu Tiếp Theo' : 'Xem Kết Quả Tổng Kết'}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ================= 3. TOPIC SELECTION LOBBY & HISTORY =================
  const filteredHistory = quizHistory.filter(item => {
    if (historyFilter === 'vocab') return item.type === 'vocab';
    if (historyFilter === 'pattern') return item.type === 'pattern';
    if (historyFilter === 'ai') return Boolean(item.is_ai);
    return true;
  });

  return (
    <div className="quiz-center-container">
      <div className="quiz-lobby-header">
        <div className="lobby-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Target size={14} />
          <span>INTERACTIVE QUIZ HUB</span>
        </div>
        <h1>Luyện Tập Trắc Nghiệm Thông Minh</h1>
        <p>Kiểm tra và củng cố phản xạ từ vựng & cấu trúc ngữ pháp học thuật</p>
      </div>

      {/* Unified Level-1 Main Segmented Tabs */}
      <div className="quiz-main-tabs-container">
        <button
          className={`quiz-main-tab-btn tab-new ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => setActiveTab('new')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
        >
          <Sparkles size={16} />
          <span>Tạo Bộ Đề Mới</span>
        </button>
        <button
          className={`quiz-main-tab-btn tab-history ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => { setActiveTab('history'); loadQuizHistory(); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
        >
          <History size={16} />
          <span>Lịch Sử Đề & Làm Lại</span>
          {quizHistory.length > 0 && (
            <span className="tab-badge">{quizHistory.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'history' ? (
        /* ================= HISTORY LIST TAB ================= */
        <div className="quiz-setup-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.8rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={20} color="var(--accent-primary)" />
                <span>Kho Đề Thi & Bài Tập Đã Lưu</span>
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Tất cả các bộ đề AI và đề tuỳ chỉnh đã được lưu trữ an toàn. Bấm "Làm Lại" để luyện tập bất kỳ lúc nào!
              </p>
            </div>
            <button 
              className="btn btn-secondary" 
              onClick={loadQuizHistory} 
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <RefreshCw size={13} />
              <span>Làm mới</span>
            </button>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `Tất Cả (${quizHistory.length})` },
              { id: 'vocab', label: `Từ Vựng (${quizHistory.filter(q => q.type === 'vocab').length})` },
              { id: 'pattern', label: `Mẫu Câu (${quizHistory.filter(q => q.type === 'pattern').length})` },
              { id: 'ai', label: `Đề AI (${quizHistory.filter(q => q.is_ai).length})` }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setHistoryFilter(f.id)}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.82rem',
                  fontWeight: historyFilter === f.id ? 800 : 600,
                  border: historyFilter === f.id ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  background: historyFilter === f.id ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-secondary)',
                  color: historyFilter === f.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* List of Saved Quizzes */}
          {filteredHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.8rem' }}>📭</div>
              <h3 style={{ margin: '0 0 0.4rem 0' }}>Chưa có bộ đề nào trong mục này</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 1.2rem 0' }}>
                Khi bạn bấm "Tạo Bộ Đề Bằng AI" hoặc bắt đầu bài thi, hệ thống sẽ tự động lưu lại toàn bộ câu hỏi tại đây.
              </p>
              <button className="btn btn-primary" onClick={() => setActiveTab('new')}>
                ✨ Tạo Bộ Đề Mới Ngay
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.9rem' }}>
              {filteredHistory.map(item => {
                const isVocab = item.type === 'vocab';
                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderLeft: `5px solid ${item.is_ai ? '#8b5cf6' : isVocab ? 'var(--accent-primary)' : '#ec4899'}`,
                      borderRadius: 'var(--radius-lg)',
                      padding: '1rem 1.2rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      transition: 'transform 0.15s ease, border-color 0.15s ease'
                    }}
                  >
                    <div style={{ flex: '1 1 300px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{item.title}</h4>
                        {Boolean(item.is_ai) ? (
                          <span style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                            ✨ AI Đề
                          </span>
                        ) : (
                          <span style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
                            Offline
                          </span>
                        )}
                        <span style={{ background: isVocab ? 'rgba(99, 102, 241, 0.15)' : 'rgba(236, 72, 153, 0.15)', color: isVocab ? 'var(--accent-primary)' : '#ec4899', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                          {isVocab ? `📖 ${item.topic}` : `🧩 ${item.category}`}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span>📝 <b>{item.total_questions}</b> câu hỏi</span>
                        <span>•</span>
                        <span>
                          {item.best_score !== null && item.best_score !== undefined ? (
                            <span style={{ color: item.best_score >= 80 ? '#10b981' : '#f59e0b', fontWeight: 800 }}>
                              🏆 Cao nhất: {item.best_score}%
                            </span>
                          ) : (
                            <span>🌱 Chưa làm</span>
                          )}
                        </span>
                        <span>•</span>
                        <span>🎯 Đã làm <b>{item.attempts_count || 0}</b> lần</span>
                        <span>•</span>
                        <span style={{ opacity: 0.8 }}>
                          📅 {new Date(item.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleRetakeQuiz(item)}
                        disabled={loading}
                        style={{
                          padding: '0.55rem 1.1rem',
                          fontSize: '0.88rem',
                          fontWeight: 800,
                          borderRadius: 'var(--radius-md)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <RotateCcw size={14} />
                        <span>Làm Lại</span>
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={(e) => handleDeleteHistory(item.id, e)}
                        title="Xóa đề này"
                        style={{
                          padding: '0.55rem 0.8rem',
                          fontSize: '0.88rem',
                          borderRadius: 'var(--radius-md)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <XCircle size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ================= CREATE NEW QUIZ TAB ================= */
        <div className="quiz-setup-card">
          {/* Card-Integrated Category Selector */}
          <div className="quiz-category-card-selector">
            <button
              className={`category-select-card vocab ${quizCategory === 'vocab' ? 'active' : ''}`}
              onClick={() => setQuizCategory('vocab')}
            >
              <div className="cat-icon-box">
                <BookOpen size={24} color="var(--accent-primary)" />
              </div>
              <div className="cat-text-box">
                <span className="cat-title">Quiz Kho Từ Vựng</span>
                <span className="cat-desc">Nghĩa từ, ngữ cảnh & phản xạ phát âm</span>
              </div>
              <div className="cat-radio">
                {quizCategory === 'vocab' && <div className="cat-radio-inner" />}
              </div>
            </button>

            <button
              className={`category-select-card pattern ${quizCategory === 'pattern' ? 'active' : ''}`}
              onClick={() => setQuizCategory('pattern')}
            >
              <div className="cat-icon-box pattern">
                <Puzzle size={24} color="#ec4899" />
              </div>
              <div className="cat-text-box">
                <span className="cat-title">Quiz Mẫu Câu & Cấu Trúc</span>
                <span className="cat-desc">Cấu trúc câu, đảo ngữ & viết luận</span>
              </div>
              <div className="cat-radio">
                {quizCategory === 'pattern' && <div className="cat-radio-inner" />}
              </div>
            </button>
          </div>

          <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.25rem 0 0.5rem 0' }} />
            {/* Step 1: Choose Topic / Tone */}
            {quizCategory === 'vocab' ? (
              <div className="setup-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <h3 style={{ margin: 0 }}>1. Chọn Chủ Đề (Topic) - <small style={{ fontWeight: 'normal', color: 'var(--text-secondary)' }}>Có thể chọn nhiều chủ đề cùng lúc</small></h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', fontWeight: '600' }}>
                    Đã chọn: {selectedTopics.includes('All') ? 'Tất cả chủ đề' : `${selectedTopics.length} chủ đề`}
                  </span>
                </div>
                <div className="topics-chip-grid">
                  {topics.map(t => {
                    const topicKey = t.id || t.name;
                    const isSelected = selectedTopics.includes(topicKey) || (topicKey.toLowerCase() === 'all' && selectedTopics.includes('All'));
                    return (
                      <button
                        key={topicKey}
                        className={`topic-chip-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => toggleTopic(topicKey)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <span className="topic-name">{t.name}</span>
                        <span className="topic-count">{t.count} từ</span>
                        {isSelected && <span style={{ fontWeight: '900', color: '#10b981' }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="setup-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <h3 style={{ margin: 0 }}>1. Chọn Mục Đích / Chức Năng Diễn Đạt</h3>
                  <span style={{ fontSize: '0.82rem', color: '#ec4899', fontWeight: '600' }}>
                    Phân loại theo tư duy giao tiếp & viết luận
                  </span>
                </div>
                <div className="topics-chip-grid">
                  {[
                    { id: 'all', name: 'Tất cả chức năng (All)' },
                    ...(patternCategories.length > 0 ? patternCategories : [
                      { id: 'emphasis', name: 'Nhấn mạnh & Đảo ngữ' },
                      { id: 'concession', name: 'Nhượng bộ & Đối lập' },
                      { id: 'purpose', name: 'Mục đích & Kết quả' },
                      { id: 'condition', name: 'Điều kiện & Giả định' },
                      { id: 'opinion', name: 'Khẳng định Quan điểm' },
                      { id: 'sequence', name: 'Thời gian & Trình tự' },
                      { id: 'advice', name: 'Khuyên bảo & Thúc giục' }
                    ])
                  ].map(t => {
                    const isSelected = selectedPatternCategory === t.id;
                    return (
                      <button
                        key={t.id}
                        className={`topic-chip-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => setSelectedPatternCategory(t.id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderColor: isSelected ? '#ec4899' : '' }}
                      >
                        <span className="topic-name">{t.name}</span>
                        {t.patterns_count !== undefined && <span className="topic-count">{t.patterns_count} câu</span>}
                        {isSelected && <span style={{ fontWeight: '900', color: '#ec4899' }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: IELTS Level Tier */}
            <div className="setup-section" style={{ marginTop: '1.2rem' }}>
              <h3>2. Chọn Cấp Độ Khó (IELTS / CEFR)</h3>
              <div className="count-selector-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.6rem' }}>
                {[
                  { id: 'all', label: 'Mọi Cấp Độ', desc: 'Đa dạng linh hoạt (A2 - C2)' },
                  { id: 'ielts_4_5', label: 'IELTS 4.0 - 5.0', desc: 'Nền tảng (A2 - B1)' },
                  { id: 'ielts_55_60', label: 'IELTS 5.5 - 6.0', desc: 'Tiền trung cấp (B1 - B2)' },
                  { id: 'ielts_65_70', label: 'IELTS 6.5 - 7.0', desc: 'Trung cấp khá (B2 - C1)' },
                  { id: 'ielts_75_80', label: 'IELTS 7.5 - 8.0', desc: 'Cao cấp (C1 Mastery)' },
                  { id: 'ielts_85_90', label: 'IELTS 8.5 - 9.0', desc: 'Bản xứ / Chuyên gia (C2)' }
                ].map(lvl => (
                  <button
                    key={lvl.id}
                    className={`count-pill-btn ${selectedLevel === lvl.id ? 'active' : ''}`}
                    onClick={() => setSelectedLevel(lvl.id)}
                    style={{ textAlign: 'left', padding: '0.6rem 0.8rem' }}
                  >
                    <b>{lvl.label}</b>
                    <small style={{ display: 'block', marginTop: '2px', opacity: 0.85 }}>{lvl.desc}</small>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Question Count & Mode */}
            <div className="setup-grid-row">
              <div className="setup-section">
                <h3>3. Số Lượng Câu Hỏi</h3>
                <div className="count-selector-row">
                  {[5, 10, 15].map(cnt => (
                    <button
                      key={cnt}
                      className={`count-pill-btn ${questionCount === cnt ? 'active' : ''}`}
                      onClick={() => setQuestionCount(cnt)}
                    >
                      <b>{cnt} câu</b>
                      <small>{cnt === 5 ? 'Nhanh (2p)' : cnt === 10 ? 'Chuẩn (5p)' : 'Chuyên sâu (8p)'}</small>
                    </button>
                  ))}
                </div>
              </div>

              <div className="setup-section">
                <h3>4. Chế Độ Câu Hỏi</h3>
                <div className="mode-selector-row">
                  {[
                    { id: 'mixed', label: 'Hỗn Hợp (Tất cả)', icon: Shuffle },
                    { id: 'meaning_vi', label: 'Chọn Nghĩa', icon: FileText },
                    { id: 'cloze_blank', label: 'Điền Vào Câu', icon: Edit3 },
                    { id: 'listening', label: 'Luyện Nghe', icon: Headphones }
                  ].map(m => {
                    const IconComp = m.icon;
                    return (
                      <button
                        key={m.id}
                        className={`mode-pill-btn ${quizMode === m.id ? 'active' : ''}`}
                        onClick={() => setQuizMode(m.id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <IconComp size={14} />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Start Button Options */}
            <div className="lobby-submit-row" style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-primary start-quiz-big-btn"
                onClick={() => handleStartQuiz(false)}
                disabled={loading}
                style={{ flex: 1, minWidth: '220px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Zap size={18} />
                <span>{loading ? 'Đang chuẩn bị...' : 'Bắt Đầu Làm Quiz (Nhanh 0s)'}</span>
              </button>
              <button 
                className="btn btn-secondary start-quiz-big-btn"
                onClick={() => handleStartQuiz(true)}
                disabled={loading}
                style={{ flex: 1, minWidth: '220px', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Sparkles size={18} />
                <span>{loading ? 'AI đang biên soạn đề thi...' : 'Tạo Bộ Đề Bằng AI (Ngữ Cảnh Thực Tế)'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
}
