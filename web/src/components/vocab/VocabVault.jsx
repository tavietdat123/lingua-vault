import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Volume2, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Tag, 
  Calendar,
  Layers,
  Filter
} from 'lucide-react';
import { playAudio } from '../../services/audioService';

export default function VocabVault({ words = [], onAddWord, onEditWord, onDeleteWord }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');

  // Collect all unique tags
  const allTags = Array.from(new Set(words.flatMap(w => w.tags || [])));

  // Filter words
  const filteredWords = words.filter(w => {
    const matchesSearch = 
      w.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.meaning_vi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.meaning_en && w.meaning_en.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    const matchesLevel = levelFilter === 'all' || w.level === levelFilter;
    const matchesTag = selectedTag === 'all' || (w.tags && w.tags.includes(selectedTag));

    return matchesSearch && matchesStatus && matchesLevel && matchesTag;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'mastered':
        return <span className="badge badge-green">Mastered</span>;
      case 'reviewing':
        return <span className="badge badge-blue">Reviewing</span>;
      case 'learning':
        return <span className="badge badge-amber">Learning</span>;
      default:
        return <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>New</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. TOP BAR: SEARCH & FILTERS & ADD BUTTON */}
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
        {/* Search Box */}
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '450px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-control"
            placeholder="Tìm kiếm theo từ vựng, nghĩa tiếng Việt, định nghĩa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.75rem' }}
          />
        </div>

        {/* Filter Dropdowns */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          {/* Status Filter */}
          <select
            className="input-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 'auto', padding: '0.65rem 0.85rem' }}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="new">Mới (New)</option>
            <option value="learning">Đang học (Learning)</option>
            <option value="reviewing">Đang ôn tập (Reviewing)</option>
            <option value="mastered">Đã nhớ tốt (Mastered)</option>
          </select>

          {/* Level Filter */}
          <select
            className="input-control"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            style={{ width: 'auto', padding: '0.65rem 0.85rem' }}
          >
            <option value="all">Mọi trình độ</option>
            <option value="A1">A1 - Sơ cấp</option>
            <option value="A2">A2 - Cơ bản</option>
            <option value="B1">B1 - Trung cấp</option>
            <option value="B2">B2 - Khá</option>
            <option value="C1">C1 - Cao cấp</option>
            <option value="C2">C2 - Bản ngữ</option>
          </select>

          {/* Add Word Button */}
          <button onClick={onAddWord} className="btn-primary">
            <Plus size={18} />
            <span>Thêm Từ Mới</span>
          </button>
        </div>
      </div>

      {/* 2. TAGS PILLS FILTER */}
      {allTags.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          whiteSpace: 'nowrap',
          flexWrap: 'nowrap',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', flexShrink: 0, paddingRight: '0.2rem' }}>
            <Tag size={15} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tags:</span>
          </div>

          <button
            onClick={() => setSelectedTag('all')}
            style={{
              flexShrink: 0,
              whiteSpace: 'nowrap',
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 700,
              border: selectedTag === 'all' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
              background: selectedTag === 'all' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
              color: selectedTag === 'all' ? '#ffffff' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: selectedTag === 'all' ? '0 2px 8px rgba(2, 132, 199, 0.25)' : 'none'
            }}
          >
            Tất cả thẻ ({words.length})
          </button>

          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              style={{
                flexShrink: 0,
                whiteSpace: 'nowrap',
                padding: '0.35rem 0.8rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: selectedTag === tag ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                background: selectedTag === tag ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: selectedTag === tag ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: selectedTag === tag ? '0 2px 8px rgba(2, 132, 199, 0.25)' : 'none'
              }}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* 3. WORDS LIST GRID */}
      {filteredWords.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-color)'
        }}>
          <Layers size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto', opacity: 0.6 }} />
          <h4 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Không tìm thấy từ vựng nào</h4>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', marginBottom: '1.5rem' }}>
            Hãy thử tìm kiếm với từ khóa khác hoặc bấm nút dưới đây để thêm từ mới.
          </p>
          <button onClick={onAddWord} className="btn-primary">
            <Plus size={18} />
            <span>Thêm Từ Đầu Tiên</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {filteredWords.map(w => (
            <div
              key={w.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
                position: 'relative'
              }}
            >
              <div>
                {/* Header: Word + IPA + Audio + Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h4 style={{ fontSize: '1.35rem', fontWeight: '800', letterSpacing: '-0.02em' }}>{w.word}</h4>
                      <button
                        onClick={() => playAudio(w.word, w.audio_url)}
                        className="btn-icon"
                        style={{ color: 'var(--accent-primary)', padding: '0.25rem' }}
                        title="Nghe phát âm chuẩn"
                      >
                        <Volume2 size={18} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.1rem' }}>
                      {w.phonetic && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {w.phonetic}
                        </span>
                      )}
                      {w.part_of_speech && (
                        <span style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                          • {w.part_of_speech}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="badge badge-blue">{w.level || 'B2'}</span>
                    {getStatusBadge(w.status)}
                  </div>
                </div>

                {/* Meaning VI & EN */}
                <p style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  {w.meaning_vi}
                </p>

                {w.meaning_en && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                    {w.meaning_en}
                  </p>
                )}

                {/* Collocations */}
                {w.collocations && w.collocations.length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Collocations / Cụm từ:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
                      {w.collocations.map((c, i) => (
                        <span key={i} className="tag-pill" style={{ background: 'var(--accent-primary-light)', color: 'var(--accent-primary)' }}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Examples */}
                {w.examples && w.examples.length > 0 && (
                  <div style={{
                    background: 'var(--bg-tertiary)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic',
                    borderLeft: '3px solid var(--accent-primary)'
                  }}>
                    "{w.examples[0]}"
                  </div>
                )}
              </div>

              {/* Footer: Tags & Due Date & Actions */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <Calendar size={14} />
                  <span>Ôn lại: {w.due_date || 'Hôm nay'}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    onClick={() => onEditWord(w)}
                    className="btn-icon"
                    title="Chỉnh sửa từ"
                    style={{ padding: '0.4rem' }}
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => onDeleteWord(w.id)}
                    className="btn-icon"
                    title="Xóa từ"
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
