import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  BookPlus, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Volume2, 
  BookOpen, 
  Feather,
  Copy,
  Check
} from 'lucide-react';
import { api } from '../../services/api';
import { playAudio } from '../../services/audioService';

export default function AILab({ initialSentence = '', onSaveExtractedWord }) {
  const [activeTab, setActiveTab] = useState('parser'); // 'parser' | 'writer' | 'story'

  // Tab 1: Parser State
  const [sentenceInput, setSentenceInput] = useState(initialSentence || '');
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState(null);
  const [savedWordIndex, setSavedWordIndex] = useState({});

  // Tab 2: Writer State
  const [targetItem, setTargetItem] = useState('resilient');
  const [userSentence, setUserSentence] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null);

  // Tab 3: Story Weaver State
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [storyResult, setStoryResult] = useState(null);

  useEffect(() => {
    if (initialSentence) {
      setSentenceInput(initialSentence);
      setActiveTab('parser');
    }
  }, [initialSentence]);

  // Handle Parse Sentence
  const handleParseSentence = async (e) => {
    e.preventDefault();
    if (!sentenceInput.trim()) return;

    setIsParsing(true);
    setParseResult(null);

    try {
      const res = await api.parseSentenceAI(sentenceInput.trim());
      if (res.success && res.data) {
        setParseResult(res.data);
      }
    } catch (err) {
      console.error('Parse error:', err);
    } finally {
      setIsParsing(false);
    }
  };

  // Handle Check User's Sentence
  const handleCheckSentence = async (e) => {
    e.preventDefault();
    if (!targetItem.trim() || !userSentence.trim()) return;

    setIsChecking(true);
    setCheckResult(null);

    try {
      const res = await api.checkSentenceAI(targetItem.trim(), userSentence.trim());
      if (res.success && res.data) {
        setCheckResult(res.data);
      }
    } catch (err) {
      console.error('Check sentence error:', err);
    } finally {
      setIsChecking(false);
    }
  };

  // Handle Generate Story
  const handleGenerateStory = async () => {
    setIsGeneratingStory(true);
    setStoryResult(null);

    try {
      const res = await api.generateStoryAI();
      if (res.success && res.data) {
        setStoryResult(res.data);
      }
    } catch (err) {
      console.error('Story generation error:', err);
    } finally {
      setIsGeneratingStory(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. TOP TAB SELECTOR */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        background: 'var(--bg-secondary)',
        padding: '0.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveTab('parser')}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: '0.9rem',
            background: activeTab === 'parser' ? 'var(--accent-primary-light)' : 'transparent',
            color: activeTab === 'parser' ? 'var(--accent-primary)' : 'var(--text-secondary)'
          }}
        >
          <Sparkles size={16} />
          <span>1. Bóc Tách Câu & Trích Xuất Từ Vựng</span>
        </button>

        <button
          onClick={() => setActiveTab('writer')}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: '0.9rem',
            background: activeTab === 'writer' ? 'var(--accent-primary-light)' : 'transparent',
            color: activeTab === 'writer' ? 'var(--accent-primary)' : 'var(--text-secondary)'
          }}
        >
          <Feather size={16} />
          <span>2. Chấm & Sửa Câu Tự Đặt</span>
        </button>

        <button
          onClick={() => setActiveTab('story')}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: '0.9rem',
            background: activeTab === 'story' ? 'var(--accent-primary-light)' : 'transparent',
            color: activeTab === 'story' ? 'var(--accent-primary)' : 'var(--text-secondary)'
          }}
        >
          <BookOpen size={16} />
          <span>3. Sáng Tác Truyện Chống Quên (SRS Story)</span>
        </button>
      </div>

      {/* 2. TAB 1: PARSER */}
      {activeTab === 'parser' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Dán câu tiếng Anh phức tạp hoặc đoạn văn bạn muốn phân tích
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              AI sẽ bóc tách từ vựng hay, nhận diện cấu trúc ngữ pháp và dịch nghĩa tự nhiên theo đúng ngữ cảnh.
            </p>

            <form onSubmit={handleParseSentence} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <textarea
                className="input-control"
                rows={3}
                placeholder="Ví dụ: Although the startup faced unprecedented headwinds, the team remained resilient and successfully articulated their vision to investors."
                value={sentenceInput}
                onChange={(e) => setSentenceInput(e.target.value)}
                style={{ fontSize: '1rem', lineHeight: 1.6 }}
                required
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={isParsing || !sentenceInput.trim()} className="btn-primary">
                  {isParsing ? <Loader2 size={18} className="animate-spin" /> : <BrainCircuit size={18} />}
                  <span>Phân Tích Bằng AI</span>
                </button>
              </div>
            </form>
          </div>

          {/* Parse Results */}
          {parseResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Natural Translation */}
              <div className="card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                  Bản dịch tiếng Việt chuẩn ngữ cảnh:
                </span>
                <p style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '0.35rem', color: 'var(--text-primary)' }}>
                  {parseResult.translation}
                </p>
              </div>

              {/* Extracted Words */}
              {parseResult.extracted_words && parseResult.extracted_words.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                    Từ Vựng & Cụm Từ Nổi Bật Được Trích Xuất:
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {parseResult.extracted_words.map((item, idx) => (
                      <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <h5 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{item.word}</h5>
                              <button onClick={() => playAudio(item.word)} className="btn-icon" style={{ padding: '0.2rem', color: 'var(--accent-primary)' }}>
                                <Volume2 size={16} />
                              </button>
                            </div>
                            <span className="badge badge-blue">{item.part_of_speech || 'word'}</span>
                          </div>

                          <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                            {item.meaning_vi}
                          </p>

                          {item.context_usage && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem', fontStyle: 'italic' }}>
                              {item.context_usage}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            onSaveExtractedWord({
                              word: item.word,
                              meaning_vi: item.meaning_vi,
                              part_of_speech: item.part_of_speech || 'noun',
                              examples: [sentenceInput]
                            });
                            setSavedWordIndex(prev => ({ ...prev, [idx]: true }));
                          }}
                          disabled={savedWordIndex[idx]}
                          className={savedWordIndex[idx] ? 'btn-secondary' : 'btn-primary'}
                          style={{ width: '100%', justifyContent: 'center', padding: '0.5rem', fontSize: '0.85rem' }}
                        >
                          {savedWordIndex[idx] ? (
                            <>
                              <Check size={16} style={{ color: 'var(--accent-success)' }} />
                              <span>Đã Lưu Vào Kho</span>
                            </>
                          ) : (
                            <>
                              <BookPlus size={16} />
                              <span>Lưu Từ Này Vào Kho</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grammar Notes & Patterns */}
              {parseResult.grammar_notes && (
                <div className="card" style={{ background: 'var(--bg-tertiary)' }}>
                  <h5 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    💡 Phân tích Ngữ pháp & Điểm lưu ý:
                  </h5>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {parseResult.grammar_notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. TAB 2: WRITING CHECKER */}
      {activeTab === 'writer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Luyện Viết & Đặt Câu Cá Nhân Hóa
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Tự đặt câu với từ vựng bạn đang học. AI sẽ chấm độ tự nhiên, phát hiện lỗi ngữ pháp và gợi ý câu chuẩn người bản xứ.
            </p>

            <form onSubmit={handleCheckSentence} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Từ vựng hoặc Cấu trúc muốn luyện tập
                </label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Ví dụ: articulate, resilient, take for granted..."
                  value={targetItem}
                  onChange={(e) => setTargetItem(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Câu tiếng Anh do bạn tự viết
                </label>
                <textarea
                  className="input-control"
                  rows={3}
                  placeholder="Ví dụ: She is very articulate when she talk with her boss in the meeting."
                  value={userSentence}
                  onChange={(e) => setUserSentence(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={isChecking || !userSentence.trim()} className="btn-primary">
                  {isChecking ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  <span>Chấm & Sửa Câu</span>
                </button>
              </div>
            </form>
          </div>

          {/* Check Results */}
          {checkResult && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {checkResult.is_correct ? (
                    <CheckCircle2 size={24} style={{ color: 'var(--accent-success)' }} />
                  ) : (
                    <AlertCircle size={24} style={{ color: 'var(--accent-warning)' }} />
                  )}
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                    {checkResult.is_correct ? 'Câu Ngữ Pháp Chính Xác!' : 'Có Một Số Điểm Cần Cải Thiện'}
                  </h4>
                </div>

                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                  Điểm: {checkResult.score || 80}/100
                </span>
              </div>

              <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {checkResult.feedback}
              </p>

              {/* Native Alternatives */}
              {checkResult.native_alternatives && checkResult.native_alternatives.length > 0 && (
                <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                    Cách diễn đạt chuẩn bản xứ tự nhiên hơn (Native Alternatives):
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {checkResult.native_alternatives.map((alt, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>"{alt}"</span>
                        <button onClick={() => playAudio(alt)} className="btn-icon" style={{ color: 'var(--accent-primary)', padding: '0.2rem' }}>
                          <Volume2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 3: STORY WEAVER */}
      {activeTab === 'story' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
            <Sparkles size={40} style={{ color: 'var(--accent-primary)', margin: '0 auto 0.75rem auto' }} />
            <h4 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
              Sáng Tác Truyện Ngắn Chống Quên (Story Weaver)
            </h4>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '550px', margin: '0.5rem auto 1.5rem auto', fontSize: '0.95rem' }}>
              AI sẽ tự động gom các từ vựng bạn sắp quên trong ngày hôm nay và viết thành một câu chuyện ngắn lôi cuốn trong 1 phút để bạn ghi nhớ toàn bộ trong ngữ cảnh.
            </p>

            <button
              onClick={handleGenerateStory}
              disabled={isGeneratingStory}
              className="btn-primary"
              style={{ padding: '0.85rem 1.75rem', fontSize: '1rem', margin: '0 auto' }}
            >
              {isGeneratingStory ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              <span>{isGeneratingStory ? 'AI Đang Sáng Tác...' : 'Sáng Tác Câu Chuyện Ngay'}</span>
            </button>
          </div>

          {/* Story Result */}
          {storyResult && (
            <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                  📖 {storyResult.title}
                </h4>
                <button onClick={() => playAudio(storyResult.story_en)} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                  <Volume2 size={16} />
                  <span>Nghe Đọc Truyện</span>
                </button>
              </div>

              <div
                style={{
                  fontSize: '1.1rem',
                  lineHeight: 1.8,
                  color: 'var(--text-primary)',
                  background: 'var(--bg-tertiary)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  borderLeft: '4px solid var(--accent-primary)'
                }}
                dangerouslySetInnerHTML={{ __html: storyResult.story_en }}
              />

              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Bản dịch tiếng Việt:
                </span>
                <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.6 }}>
                  {storyResult.story_vi}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
