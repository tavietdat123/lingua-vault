import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Layers, 
  Volume2, 
  Sparkles, 
  Tag, 
  CheckCircle2 
} from 'lucide-react';
import { playAudio } from '../../services/audioService';

export default function PatternHub({ patterns = [], onAddPattern, onEditPattern, onDeletePattern }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [toneFilter, setToneFilter] = useState('all');

  const filteredPatterns = patterns.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.formula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.meaning_vi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.explanation && p.explanation.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTone = toneFilter === 'all' || p.tone === toneFilter;

    return matchesSearch && matchesTone;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. TOP BAR */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-secondary)',
        padding: '1.25rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '450px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-control"
            placeholder="Tìm kiếm mẫu câu, công thức, giải thích..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.75rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="input-control"
            value={toneFilter}
            onChange={(e) => setToneFilter(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="all">Tất cả sắc thái</option>
            <option value="Formal">Formal (Trang trọng / Học thuật)</option>
            <option value="Daily / Business">Daily / Business (Công việc / Đời sống)</option>
            <option value="Academic / Formal">Academic (IELTS / Viết luận)</option>
            <option value="Neutral">Neutral (Trung tính)</option>
          </select>

          <button onClick={onAddPattern} className="btn-primary">
            <Plus size={18} />
            <span>Thêm Mẫu Câu Mới</span>
          </button>
        </div>
      </div>

      {/* 2. PATTERNS GRID */}
      {filteredPatterns.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-color)'
        }}>
          <Layers size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto', opacity: 0.6 }} />
          <h4 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Chưa có mẫu câu nào phù hợp</h4>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', marginBottom: '1.5rem' }}>
            Lưu các mẫu câu và công thức ngữ pháp để xây dựng phản xạ viết và nói tự nhiên.
          </p>
          <button onClick={onAddPattern} className="btn-primary">
            <Plus size={18} />
            <span>Thêm Mẫu Câu Đầu Tiên</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.25rem' }}>
          {filteredPatterns.map(p => (
            <div
              key={p.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem'
              }}
            >
              <div>
                {/* Header: Name + Tone */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-primary)' }}>
                    {p.name}
                  </h4>
                  <span className="badge badge-amber">{p.tone || 'Neutral'}</span>
                </div>

                {/* Formula Box */}
                <div style={{
                  background: 'var(--bg-tertiary)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.75rem',
                  border: '1px dashed var(--border-color)'
                }}>
                  {p.formula}
                </div>

                {/* Meaning & Explanation */}
                <p style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  {p.meaning_vi}
                </p>

                {p.explanation && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', lineHeight: 1.4 }}>
                    {p.explanation}
                  </p>
                )}

                {/* Examples with Audio */}
                {p.examples && p.examples.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Ví dụ áp dụng:
                    </span>
                    {p.examples.map((ex, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          background: 'var(--bg-secondary)',
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.85rem',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        <span style={{ fontStyle: 'italic', flex: 1 }}>"{ex}"</span>
                        <button
                          onClick={() => playAudio(ex)}
                          className="btn-icon"
                          style={{ padding: '0.15rem', color: 'var(--accent-primary)', flexShrink: 0 }}
                          title="Nghe phát âm cả câu"
                        >
                          <Volume2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer: Actions */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {p.tags?.map((t, idx) => (
                    <span key={idx} className="tag-pill" style={{ fontSize: '0.75rem' }}>
                      #{t}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    onClick={() => onEditPattern(p)}
                    className="btn-icon"
                    title="Chỉnh sửa mẫu câu"
                    style={{ padding: '0.4rem' }}
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => onDeletePattern(p.id)}
                    className="btn-icon"
                    title="Xóa mẫu câu"
                    style={{ padding: '0.4rem', color: 'var(--accent-danger)' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
