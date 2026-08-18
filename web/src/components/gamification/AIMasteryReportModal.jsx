import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Award, TrendingUp, CheckCircle2, AlertCircle, RefreshCw, X, Shield, ArrowRight, BookOpen } from 'lucide-react';
import { api } from '../../services/api.js';

export default function AIMasteryReportModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAIMasteryReport();
      if (res && res.success) {
        setReport(res);
      } else {
        setError(res?.error || 'Không thể tải báo cáo từ AI');
      }
    } catch (err) {
      setError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReport();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const m = report?.metrics;
  const ai = report?.aiAssessment;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.25rem',
      zIndex: 9999
    }}>
      <div style={{
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '24px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'var(--accent-primary-light)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Brain size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                Báo Cáo Đánh Giá Năng Lực Từ Vựng Theo AI
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Khảo thí theo chuẩn CEFR & Thuật toán Trí nhớ ngắt quãng Spaced Repetition (SM-2)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={fetchReport}
              disabled={loading}
              className="btn-icon"
              title="Phân tích lại dữ liệu mới nhất"
              style={{ padding: '0.45rem' }}
            >
              <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="btn-icon"
              style={{ padding: '0.45rem' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', border: '3px solid var(--accent-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>
                Giám khảo AI đang phân tích toàn bộ kho từ vựng và chu kỳ trí nhớ của bạn...
              </p>
            </div>
          ) : error ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
              <AlertCircle size={36} style={{ margin: '0 auto 0.5rem auto' }} />
              <p>{error}</p>
              <button onClick={fetchReport} className="btn-secondary" style={{ marginTop: '1rem' }}>Thử lại</button>
            </div>
          ) : report && (
            <>
              {/* 1. Score & CEFR Level Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
                border: '1.5px solid rgba(2, 132, 199, 0.25)',
                borderRadius: '20px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    TRÌNH ĐỘ TỔNG QUAN ƯỚC TÍNH (CEFR)
                  </span>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.2rem 0', color: 'var(--text-primary)' }}>
                    {ai?.estimatedCefrLevel || 'B2 Upper-Intermediate'}
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Đạt <b>{m?.totalWords} từ vựng</b> • Level {m?.userLevel} ({m?.userTitle})
                  </p>
                </div>

                <div style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '3px solid var(--accent-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)'
                }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-primary)', lineHeight: 1 }}>
                    {ai?.overallScore || 80}
                  </span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    ĐIỂM AI
                  </span>
                </div>
              </div>

              {/* 2. Memory Stability Breakdown (SM-2) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  padding: '1rem',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>
                    💎 MASTERED
                  </span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.2rem 0', color: 'var(--text-primary)' }}>
                    {m?.masteredCount} từ
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Thuộc sâu (trên 6 ngày)
                  </span>
                </div>

                <div style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  padding: '1rem',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                    🌿 FAMILIAR
                  </span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.2rem 0', color: 'var(--text-primary)' }}>
                    {m?.familiarCount} từ
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Đang nhớ tốt
                  </span>
                </div>

                <div style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  padding: '1rem',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>
                    🌱 LEARNING
                  </span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.2rem 0', color: 'var(--text-primary)' }}>
                    {m?.learningCount} từ
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Cần củng cố thêm
                  </span>
                </div>
              </div>

              {/* 3. AI Assessment Summary */}
              <div style={{
                backgroundColor: 'var(--bg-tertiary)',
                padding: '1.25rem',
                borderRadius: '18px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-primary)' }}>
                  <Sparkles size={16} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    NHẬN XÉT ĐỊNH TÍNH TỪ GIÁM KHẢO AI
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.5, fontStyle: 'italic' }}>
                  "{ai?.evaluationSummary}"
                </p>
              </div>

              {/* 4. Strengths & Action Plan */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Strengths */}
                <div style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.06)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '16px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>
                    💪 THẾ MẠNH TỪ VỰNG
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {ai?.lexicalStrengths?.map((s, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                        <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Action Plan */}
                <div style={{
                  backgroundColor: 'rgba(2, 132, 199, 0.06)',
                  border: '1px solid rgba(2, 132, 199, 0.2)',
                  borderRadius: '16px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                    🚀 LỘ TRÌNH 3 BƯỚC TIẾP THEO
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {ai?.actionPlan?.map((step, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                        <span style={{
                          backgroundColor: 'var(--accent-primary)',
                          color: '#ffffff',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          flexShrink: 0,
                          marginTop: '2px'
                        }}>
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1rem 1.75rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-tertiary)'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Được đánh giá tự động bởi Google Gemini 2.0 AI Engine
          </span>
          <button
            onClick={onClose}
            className="btn-primary"
            style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
