import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  Volume2, 
  Sparkles, 
  BookPlus, 
  BrainCircuit, 
  Check, 
  X,
  Search,
  Tag,
  Clock,
  BookOpen
} from 'lucide-react';
import { api } from '../../services/api';
import { playAudio } from '../../services/audioService';

export default function SmartReader({ 
  notes = [], 
  words = [], 
  onSaveNote, 
  onDeleteNote, 
  onSaveWordFromSelection, 
  onSendToAiLab 
}) {
  const [selectedNoteId, setSelectedNoteId] = useState(notes[0]?.id || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTopic, setEditTopic] = useState('General');
  const [searchTerm, setSearchTerm] = useState('');

  // Floating Selection Popup State
  const [selectionPopup, setSelectionPopup] = useState({
    visible: false,
    text: '',
    x: 0,
    y: 0
  });

  const contentRef = useRef(null);

  const selectedNote = notes.find(n => n.id === selectedNoteId) || notes[0];

  useEffect(() => {
    if (selectedNote && !isEditing) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
      setEditTopic(selectedNote.topic || 'General');
    }
  }, [selectedNote, isEditing]);

  // Handle Text Selection Popup
  const handleMouseUp = () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text && text.length > 0 && text.length < 300) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelectionPopup({
        visible: true,
        text,
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
    } else {
      setSelectionPopup(prev => ({ ...prev, visible: false }));
    }
  };

  const handleStartNewNote = () => {
    setIsEditing(true);
    setSelectedNoteId(null);
    setEditTitle('');
    setEditContent('');
    setEditTopic('General');
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) return;

    await onSaveNote({
      id: selectedNoteId,
      title: editTitle.trim(),
      content: editContent.trim(),
      topic: editTopic.trim()
    });

    setIsEditing(false);
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (n.topic && n.topic.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate reading stats
  const wordCount = selectedNote?.content ? selectedNote.content.split(/\s+/).filter(w => w.length > 0).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 180));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', minHeight: '700px' }}>
      {/* 1. LEFT COLUMN: NOTES LIST */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Header & Add Button */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BookOpen size={18} style={{ color: 'var(--accent-primary)' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Tài Liệu & Bài Đọc</h4>
            </div>
            <button onClick={handleStartNewNote} className="btn-primary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}>
              <Plus size={16} />
              <span>Bài mới</span>
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-control"
              placeholder="Tìm tài liệu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem', fontSize: '0.85rem', padding: '0.55rem 0.85rem 0.55rem 2.5rem' }}
            />
          </div>
        </div>

        {/* Notes Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {filteredNotes.map(n => {
            const isSelected = n.id === selectedNoteId;
            return (
              <div
                key={n.id}
                onClick={() => {
                  setSelectedNoteId(n.id);
                  setIsEditing(false);
                }}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--accent-primary-light)' : 'transparent',
                  border: isSelected ? '1px solid var(--accent-primary)' : '1px solid transparent',
                  transition: 'all var(--transition-fast)'
                }}
                className="glow-hover"
              >
                <h5 style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                  marginBottom: '0.3rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {n.title}
                </h5>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span className="badge badge-blue" style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem' }}>
                    {n.topic || 'General'}
                  </span>
                  <span>{n.created_at?.split('T')[0]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. RIGHT COLUMN: INTERACTIVE READER / EDITOR */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-color)',
        padding: '2.25rem',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {isEditing ? (
          /* Editor View */
          <form onSubmit={handleSaveNote} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                {selectedNoteId ? 'Chỉnh Sửa Bài Viết' : 'Tạo Bài Đọc / Tài Liệu Mới'}
              </h3>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary">
                  <X size={16} />
                  <span>Hủy</span>
                </button>
                <button type="submit" className="btn-primary">
                  <Check size={16} />
                  <span>Lưu bài viết</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.85rem' }}>
              <input
                type="text"
                className="input-control"
                placeholder="Tiêu đề bài viết / tài liệu..."
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                style={{ fontSize: '1.15rem', fontWeight: 700 }}
                required
              />
              <input
                type="text"
                className="input-control"
                placeholder="Chủ đề (ví dụ: Tech, IELTS, Podcast...)"
                value={editTopic}
                onChange={(e) => setEditTopic(e.target.value)}
              />
            </div>

            <textarea
              className="input-control"
              placeholder="Dán hoặc viết nội dung bài báo, tài liệu học tiếng Anh tại đây..."
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              style={{ flex: 1, minHeight: '450px', resize: 'vertical', lineHeight: 1.8, fontSize: '1.05rem' }}
              required
            />
          </form>
        ) : selectedNote ? (
          /* Reader View with Smart Text Highlighter */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              paddingBottom: '1.25rem',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                  <span className="badge badge-blue">{selectedNote.topic || 'General'}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <Clock size={14} />
                    <span>~{readingTime} phút đọc ({wordCount} từ)</span>
                  </div>
                </div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {selectedNote.title}
                </h3>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-secondary"
                  style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
                >
                  <Edit3 size={15} />
                  <span>Sửa bài</span>
                </button>
                <button
                  onClick={() => onDeleteNote(selectedNote.id)}
                  className="btn-icon"
                  style={{ color: 'var(--accent-danger)' }}
                  title="Xóa tài liệu"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Smart Highlight Hint Pro Max */}
            <div style={{
              background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-card) 100%)',
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius-lg)',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              border: '1px solid var(--border-color)'
            }}>
              <Sparkles size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <span>
                💡 <b>Smart Highlighter Pro</b>: Bôi đen bất kỳ từ hoặc câu nào trong văn bản dưới đây để phát âm, lưu nhanh vào kho từ hoặc gửi AI phân tích!
              </span>
            </div>

            {/* Article Content Area */}
            <div
              ref={contentRef}
              onMouseUp={handleMouseUp}
              style={{
                fontSize: '1.15rem',
                lineHeight: 1.85,
                color: 'var(--text-primary)',
                whiteSpace: 'pre-line',
                flex: 1,
                userSelect: 'text'
              }}
            >
              {selectedNote.content}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', margin: 'auto', padding: '3rem' }}>
            <FileText size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto' }} />
            <h4 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Chưa chọn tài liệu nào</h4>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', marginBottom: '1.25rem' }}>
              Hãy chọn một bài đọc từ danh sách bên trái hoặc tạo bài viết mới.
            </p>
            <button onClick={handleStartNewNote} className="btn-primary">
              <Plus size={16} />
              <span>Tạo Bài Đầu Tiên</span>
            </button>
          </div>
        )}

        {/* 3. FLOATING POPUP TOOLBAR ON TEXT SELECTION PRO MAX */}
        {selectionPopup.visible && (
          <div
            style={{
              position: 'fixed',
              top: `${selectionPopup.y}px`,
              left: `${selectionPopup.x}px`,
              transform: 'translate(-50%, -100%)',
              background: 'var(--bg-card)',
              border: '1px solid var(--accent-primary)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: '0 12px 30px rgba(0,0,0,0.4), var(--shadow-glow)',
              padding: '0.45rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              zIndex: 1000,
              backdropFilter: 'blur(16px)',
              animation: 'modalPop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {/* Pronounce audio button */}
            <button
              onClick={() => playAudio(selectionPopup.text)}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
              title="Phát âm từ được chọn"
            >
              <Volume2 size={15} style={{ color: 'var(--accent-primary)' }} />
              <span>Đọc</span>
            </button>

            {/* Save to Vocab Vault */}
            <button
              onClick={() => {
                onSaveWordFromSelection(selectionPopup.text);
                setSelectionPopup(prev => ({ ...prev, visible: false }));
              }}
              className="btn-primary"
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
            >
              <BookPlus size={15} />
              <span>Lưu vào Kho Từ</span>
            </button>

            {/* Send to AI Lab */}
            <button
              onClick={() => {
                onSendToAiLab(selectionPopup.text);
                setSelectionPopup(prev => ({ ...prev, visible: false }));
              }}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
              title="Bóc tách phân tích câu bằng AI"
            >
              <BrainCircuit size={15} style={{ color: '#a855f7' }} />
              <span>AI Bóc Tách</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
