import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { audioService } from '../../services/audioService';

export default function QuizCenter({ onOpenReview }) {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [questionCount, setQuestionCount] = useState(5);
  const [quizMode, setQuizMode] = useState('mixed');
  const [loading, setLoading] = useState(false);

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
  }, []);

  const loadTopics = async () => {
    const res = await api.getQuizTopics();
    if (res.success) {
      setTopics(res.data || []);
    }
  };

  const handleStartQuiz = async () => {
    setLoading(true);
    try {
      const res = await api.generateQuiz({
        topic: selectedTopic,
        count: questionCount,
        mode: quizMode
      });

      if (res.success && res.data.questions.length > 0) {
        setQuizData(res.data);
        setCurrentIndex(0);
        setUserAnswers([]);
        setSelectedOption(null);
        setIsAnswered(false);
        setStreakCount(0);
        setQuizResult(null);

        // Auto-play audio if first question is listening
        if (res.data.questions[0].type === 'listening') {
          audioService.speak(res.data.questions[0].word);
        }
      } else {
        alert(res.error || 'Không đủ từ vựng để tạo bài Quiz.');
      }
    } catch (err) {
      alert('Lỗi tạo bài quiz: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (option) => {
    if (isAnswered) return;

    setSelectedOption(option);
    setIsAnswered(true);

    const currentQ = quizData.questions[currentIndex];
    const isCorrect = option.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

    if (isCorrect) {
      setStreakCount(prev => prev + 1);
    } else {
      setStreakCount(0);
    }

    // Save answer
    const newAnswers = [
      ...userAnswers,
      {
        id: currentQ.id,
        word: currentQ.word,
        questionText: currentQ.questionText,
        correctAnswer: currentQ.correctAnswer,
        userAnswer: option
      }
    ];
    setUserAnswers(newAnswers);
  };

  const handleNextQuestion = async () => {
    if (currentIndex + 1 < quizData.questions.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSelectedOption(null);
      setIsAnswered(false);

      if (quizData.questions[nextIdx].type === 'listening') {
        audioService.speak(quizData.questions[nextIdx].word);
      }
    } else {
      // Submit Quiz
      setLoading(true);
      try {
        const res = await api.submitQuiz(userAnswers);
        if (res.success) {
          setQuizResult(res.data);
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
              {isGreat ? '🏆' : '🎯'}
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
                    {item.isCorrect ? '✅' : '❌'}
                  </div>
                  <div className="item-details">
                    <div className="item-word">
                      <b>{item.word}</b>
                      <button 
                        className="mini-audio-btn" 
                        onClick={() => audioService.speak(item.word)}
                        title="Nghe phát âm"
                      >
                        🔊
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
            <button className="btn btn-primary" onClick={handleStartQuiz}>
              🔄 Làm Lại Bài Quiz Này
            </button>
            <button className="btn btn-secondary" onClick={() => { setQuizData(null); setQuizResult(null); }}>
              📚 Chọn Topic Khác
            </button>
            {onOpenReview && (
              <button className="btn btn-secondary" onClick={onOpenReview}>
                ⚡ Vào Ôn Tập SRS
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

    return (
      <div className="quiz-center-container">
        <div className="quiz-active-card">
          {/* Progress Header */}
          <div className="quiz-top-bar">
            <div className="quiz-progress-info">
              <span className="question-counter">Câu {currentIndex + 1} / {quizData.questions.length}</span>
              <span className="quiz-topic-pill">🏷️ {quizData.topic}</span>
              {streakCount > 1 && (
                <span className="quiz-streak-pill">🔥 Combo {streakCount}</span>
              )}
            </div>
            <button 
              className="quiz-exit-btn"
              onClick={() => {
                if (confirm('Bạn có chắc muốn thoát bài Quiz hiện tại?')) {
                  setQuizData(null);
                }
              }}
            >
              ✕ Thoát
            </button>
          </div>

          <div className="quiz-progress-track">
            <div className="quiz-progress-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>

          {/* Question Box */}
          <div className="quiz-question-box">
            <div className="prompt-header">
              <span className="prompt-type-badge">
                {currentQ.type === 'meaning_vi' && '🅰️ Nghĩa Tiếng Việt'}
                {currentQ.type === 'reverse_en' && '🇬🇧 Tìm Từ Tiếng Anh'}
                {currentQ.type === 'cloze_blank' && '✍️ Điền Từ Vào Câu'}
                {currentQ.type === 'listening' && '🔊 Luyện Nghe & Chọn Nghĩa'}
              </span>
              <span className="prompt-subtitle">{currentQ.promptSubtitle}</span>
            </div>

            <div className="question-main-content">
              {currentQ.type === 'listening' ? (
                <div className="listening-prompt-card">
                  <button 
                    className="big-speaker-btn"
                    onClick={() => audioService.speak(currentQ.word)}
                    title="Bấm để nghe lại"
                  >
                    🔊
                  </button>
                  <span className="listening-hint">Nhấn nút loa để nghe phát âm</span>
                </div>
              ) : (
                <div className="text-prompt-display">
                  <h2 className="question-text">{currentQ.questionText}</h2>
                  {currentQ.phonetic && currentQ.type !== 'reverse_en' && (
                    <div className="phonetic-audio-row">
                      <span className="phonetic-text">{currentQ.phonetic}</span>
                      <button 
                        className="mini-audio-btn" 
                        onClick={() => audioService.speak(currentQ.word)}
                      >
                        🔊
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 4 Options Grid */}
          <div className="quiz-options-grid">
            {currentQ.options.map((option, idx) => {
              let optionClass = 'quiz-option-btn';
              if (isAnswered) {
                const isThisCorrect = option.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();
                const isThisSelected = option === selectedOption;

                if (isThisCorrect) {
                  optionClass += ' correct-option';
                } else if (isThisSelected) {
                  optionClass += ' incorrect-option';
                } else {
                  optionClass += ' dimmed-option';
                }
              }

              return (
                <button
                  key={idx}
                  className={optionClass}
                  onClick={() => handleSelectOption(option)}
                  disabled={isAnswered}
                >
                  <span className="option-key-badge">{idx + 1}</span>
                  <span className="option-text">{option}</span>
                  {isAnswered && option.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase() && (
                    <span className="option-check-icon">✓</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Next Button Footer */}
          {isAnswered && (
            <div className="quiz-footer-actions">
              <div className="feedback-hint">
                {selectedOption?.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase() ? (
                  <span className="text-green font-semibold">🎉 Chính xác! Bạn làm rất tốt.</span>
                ) : (
                  <span className="text-red font-semibold">
                    💡 Chưa chính xác! Đáp án đúng là: <b>{currentQ.correctAnswer}</b>
                  </span>
                )}
              </div>
              <button className="btn btn-primary next-btn" onClick={handleNextQuestion}>
                {currentIndex + 1 < quizData.questions.length ? 'Câu Tiếp Theo ➔' : 'Xem Kết Quả 📊'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ================= 3. TOPIC SELECTION LOBBY =================
  return (
    <div className="quiz-center-container">
      <div className="quiz-lobby-header">
        <div className="lobby-badge">🎯 INTERACTIVE QUIZ HUB</div>
        <h1>Luyện Tập Trắc Nghiệm Theo Topic</h1>
        <p>Kiểm tra và củng cố phản xạ từ vựng với các bộ câu hỏi thông minh</p>
      </div>

      <div className="quiz-setup-card">
        {/* Step 1: Choose Topic */}
        <div className="setup-section">
          <h3>1. Chọn Chủ Đề (Topic)</h3>
          <div className="topics-chip-grid">
            {topics.map(t => (
              <button
                key={t.name}
                className={`topic-chip-btn ${selectedTopic === t.name ? 'active' : ''}`}
                onClick={() => setSelectedTopic(t.name)}
              >
                <span className="topic-name">{t.name}</span>
                <span className="topic-count">{t.count} từ</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Question Count & Mode */}
        <div className="setup-grid-row">
          <div className="setup-section">
            <h3>2. Số Lượng Câu Hỏi</h3>
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
            <h3>3. Chế Độ Câu Hỏi</h3>
            <div className="mode-selector-row">
              {[
                { id: 'mixed', label: '🎲 Hỗn Hợp (Tất cả)' },
                { id: 'meaning_vi', label: '🅰️ Chọn Nghĩa' },
                { id: 'cloze_blank', label: '✍️ Điền Vào Câu' },
                { id: 'listening', label: '🔊 Luyện Nghe' }
              ].map(m => (
                <button
                  key={m.id}
                  className={`mode-pill-btn ${quizMode === m.id ? 'active' : ''}`}
                  onClick={() => setQuizMode(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="lobby-submit-row">
          <button 
            className="btn btn-primary start-quiz-big-btn"
            onClick={handleStartQuiz}
            disabled={loading}
          >
            {loading ? 'Đang chuẩn bị đề thi...' : '🚀 Bắt Đầu Làm Bài Quiz Ngay'}
          </button>
        </div>
      </div>
    </div>
  );
}
