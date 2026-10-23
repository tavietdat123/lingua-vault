import React, { useState, useEffect } from 'react';
import { 
  X, 
  Layers, 
  Plus, 
  Trash2, 
  Loader2, 
  Check, 
  Sparkles, 
  Wand2, 
  AlertCircle, 
  CheckCircle2,
  Info,
  BookOpen
} from 'lucide-react';
import { api } from '../../services/api';

export default function PatternModal({ initialData = null, onClose, onSaved }) {
  // Pattern Data States
  const [name, setName] = useState('');
  const [formula, setFormula] = useState('');
  const [explanation, setExplanation] = useState('');
  const [meaningVi, setMeaningVi] = useState('');
  const [category, setCategory] = useState('emphasis');
  const [categories, setCategories] = useState([]);
  const [tone, setTone] = useState('Formal');
  const [examples, setExamples] = useState(['']);

  // AI Analysis States
  const [sampleSentence, setSampleSentence] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState('');
  const [aiErrorMsg, setAiErrorMsg] = useState('');

  // Form Submit States
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    api.getPatternCategories().then(res => {
      if (res.success && res.data) {
        setCategories(res.data);
      }
    });

    if (initialData) {
      setName(initialData.name || '');
      setFormula(initialData.formula || '');
      setExplanation(initialData.explanation || '');
      setMeaningVi(initialData.meaning_vi || '');
      setCategory(initialData.category || 'emphasis');
      setTone(initialData.tone || 'Formal');
      setExamples(initialData.examples?.length > 0 ? initialData.examples : ['']);
    }
  }, [initialData]);

  // Handle AI Auto-Fill Analysis
  const handleAnalyzeAI = async () => {
    if (!sampleSentence.trim()) {
      setAiErrorMsg('Vui lòng nhập câu mẫu tiếng Anh trước khi bấm phân tích');
      return;
    }

    setIsAnalyzing(true);
    setAiErrorMsg('');
    setAiSuccessMsg('');

    try {
      const res = await api.analyzePattern(sampleSentence.trim());
      if (res && res.success && res.data) {
        const d = res.data;
        if (d.name) setName(d.name);
        if (d.formula) setFormula(d.formula);
        if (d.meaning_vi) setMeaningVi(d.meaning_vi);
        if (d.explanation) setExplanation(d.explanation);
        if (d.category) setCategory(d.category);
        if (d.tone) setTone(d.tone);
        if (Array.isArray(d.examples) && d.examples.length > 0) {
          setExamples(d.examples);
        } else {
          setExamples([sampleSentence.trim()]);
        }

        setAiSuccessMsg('AI đã phân tích cấu trúc thành công và tự động điền các trường bên dưới!');
      } else {
        setAiErrorMsg(res?.error || 'Không thể phân tích cấu trúc từ câu mẫu này. Vui lòng thử câu khác.');
      }
    } catch (err) {
      setAiErrorMsg(err.message || 'Lỗi kết nối máy chủ AI');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !formula.trim() || !meaningVi.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Tên cấu trúc, Công thức và Nghĩa tiếng Việt');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    const payload = {
      name: name.trim(),
      formula: formula.trim(),
      explanation: explanation.trim(),
      meaning_vi: meaningVi.trim(),
      category,
      tone,
      examples: examples.filter(ex => ex.trim() !== ''),
      tags: []
    };

    try {
      let res;
      if (initialData && initialData.id) {
        res = await api.updatePattern(initialData.id, payload);
      } else {
        res = await api.createPattern(payload);
      }

      if (res.success) {
        onSaved();
        onClose();
      } else {
        setErrorMsg(res.error || 'Có lỗi xảy ra khi lưu mẫu câu');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi kết nối tới máy chủ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          position: 'sticky',
          top: 0,
          background: 'var(--bg-card)',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15), rgba(139, 92, 246, 0.15))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)'
            }}>
              <Layers size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                {initialData?.id ? 'Chỉnh Sửa Mẫu Câu' : 'Thêm Cấu Trúc Câu / Ngữ Pháp Mới'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Hỗ trợ trích xuất thông minh từ câu ví dụ thực tế bằng AI
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.86rem',
              fontWeight: 600
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* AI SMART EXTRACTION PANEL */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(2, 132, 199, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
            border: '1.5px solid rgba(2, 132, 199, 0.35)',
            borderRadius: '16px',
            padding: '1.25rem',
            boxShadow: '0 4px 15px rgba(2, 132, 199, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
              <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Tự Động Phân Tích & Auto-fill Bằng AI
              </h4>
            </div>
            <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Nhập một câu ví dụ tiếng Anh bất kỳ. AI sẽ tự động phân tích công thức, giải thích cách dùng, dịch nghĩa tiếng Việt và điền đầy đủ các ô bên dưới.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                className="input-control"
                placeholder="Nhập câu mẫu: Ví dụ: Hardly had they arrived when it started raining..."
                value={sampleSentence}
                onChange={(e) => {
                  setSampleSentence(e.target.value);
                  setAiErrorMsg('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAnalyzeAI();
                  }
                }}
                style={{ flex: 1, minWidth: '240px', fontSize: '0.9rem' }}
              />
              <button
                type="button"
                onClick={handleAnalyzeAI}
                disabled={isAnalyzing || !sampleSentence.trim()}
                className="btn-primary"
                style={{
                  padding: '0.65rem 1.15rem',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  background: 'linear-gradient(135deg, #0284c7 0%, #7c3aed 100%)',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                  cursor: (isAnalyzing || !sampleSentence.trim()) ? 'not-allowed' : 'pointer'
                }}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Đang Phân Tích...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={16} />
                    <span>⚡ Phân Tích & Auto-Fill</span>
                  </>
                )}
              </button>
            </div>

            {aiSuccessMsg && (
              <div style={{
                marginTop: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                color: '#10b981',
                fontSize: '0.82rem',
                fontWeight: 600
              }}>
                <CheckCircle2 size={16} />
                <span>{aiSuccessMsg}</span>
              </div>
            )}

            {aiErrorMsg && (
              <div style={{
                marginTop: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                color: '#ef4444',
                fontSize: '0.82rem',
                fontWeight: 600
              }}>
                <AlertCircle size={16} />
                <span>{aiErrorMsg}</span>
              </div>
            )}
          </div>

          {/* 1. Name, Category & Tone */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Tên cấu trúc (Pattern Name) *
              </label>
              <input
                type="text"
                className="input-control"
                placeholder="Ví dụ: Đảo ngữ với Hardly ... when / It goes without saying that..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Mục đích / Chức năng *
              </label>
              <select
                className="input-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.length > 0 ? (
                  categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.emoji ? `${c.emoji} ` : ''}{c.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="emphasis">💥 Nhấn mạnh & Đảo ngữ</option>
                    <option value="cause_effect">⚡ Nguyên nhân & Hệ quả</option>
                    <option value="purpose">🎯 Mục đích & Dự định</option>
                    <option value="condition">⚠️ Điều kiện & Giả định</option>
                    <option value="concession">⚖️ Nhượng bộ & Đối lập</option>
                    <option value="comparison">🔍 So sánh & Đối chiếu</option>
                    <option value="sequence">⏳ Thời gian & Trình tự</option>
                    <option value="opinion">💬 Khẳng định Quan điểm</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Sắc thái / Văn phong
              </label>
              <select
                className="input-control"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                <option value="Formal">Trang trọng (Formal)</option>
                <option value="Academic">Học thuật (Academic)</option>
                <option value="Neutral">Trung tính (Neutral)</option>
                <option value="Informal">Thân mật (Informal)</option>
                <option value="Casual">Giao tiếp thường ngày (Casual)</option>
                <option value="Literary">Văn chương (Literary)</option>
              </select>
            </div>
          </div>

          {/* 2. Formula */}
          <div>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Công thức tổng quát (Formula) *
            </label>
            <input
              type="text"
              className="input-control"
              placeholder="Ví dụ: Hardly + had + S + V3/ed + when + S + V2/ed"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}
              required
            />
          </div>

          {/* 3. Meaning VI */}
          <div>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Nghĩa tiếng Việt tự nhiên *
            </label>
            <input
              type="text"
              className="input-control"
              placeholder="Ví dụ: Vừa mới... thì đã... / Ngay khi việc này xảy ra thì..."
              value={meaningVi}
              onChange={(e) => setMeaningVi(e.target.value)}
              required
            />
          </div>

          {/* 4. Detailed Explanation */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.84rem', fontWeight: 700 }}>
                Giải thích chi tiết & Dễ hiểu (Cách dùng, Bối cảnh & Bẫy ngữ pháp)
              </label>
            </div>
            <textarea
              className="input-control"
              rows={4}
              placeholder="1. Bối cảnh dùng thực tế; 2. Quy tắc chia động từ / vị trí từ; 3. Lưu ý bẫy ngữ pháp hay gặp và mẹo nhớ nhanh..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              style={{ lineHeight: 1.55 }}
            />
          </div>

          {/* 5. Examples */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <label style={{ fontSize: '0.84rem', fontWeight: 700 }}>
                Câu ví dụ thực tế minh họa
              </label>
              <button
                type="button"
                onClick={() => setExamples([...examples, ''])}
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--accent-primary)',
                  fontWeight: 700,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}
              >
                <Plus size={14} />
                <span>Thêm ví dụ</span>
              </button>
            </div>
            {examples.map((ex, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.45rem' }}>
                <input
                  type="text"
                  className="input-control"
                  placeholder={`Ví dụ ${idx + 1} (English) - Bản dịch tiếng Việt...`}
                  value={ex}
                  onChange={(e) => {
                    const updated = [...examples];
                    updated[idx] = e.target.value;
                    setExamples(updated);
                  }}
                  style={{ fontSize: '0.88rem' }}
                />
                {examples.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setExamples(examples.filter((_, i) => i !== idx))}
                    className="btn-icon"
                    style={{ color: 'var(--accent-danger)' }}
                    title="Xóa ví dụ này"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Modal Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color)',
            marginTop: '0.5rem'
          }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Hủy bỏ
            </button>
            <button type="submit" disabled={isSaving} className="btn-primary" style={{ padding: '0.65rem 1.4rem' }}>
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              <span>{initialData?.id ? 'Lưu Thay Đổi' : 'Lưu Mẫu Câu'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
