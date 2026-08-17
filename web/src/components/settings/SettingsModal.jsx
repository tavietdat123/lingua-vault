import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Key, 
  Download, 
  Upload, 
  Check, 
  Loader2, 
  ExternalLink,
  ShieldCheck,
  Server
} from 'lucide-react';
import { api } from '../../services/api';

export default function SettingsModal({ onClose, onDataRestored }) {
  const [apiKey, setApiKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  useEffect(() => {
    // Load existing settings
    api.getSettings().then(res => {
      if (res.success && res.data?.gemini_api_key) {
        setApiKey(res.data.gemini_api_key);
      }
    }).catch(err => console.error(err));
  }, []);

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    setIsSavingKey(true);
    setSaveSuccess(false);

    try {
      const res = await api.saveSettings({ gemini_api_key: apiKey.trim() });
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const res = await fetch(api.exportDataUrl());
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lingua_vault_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Lỗi xuất dữ liệu: ' + err.message);
    }
  };

  const handleImportBackup = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportMessage('');

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const res = await api.importData(json.data || json);
      if (res.success) {
        setImportMessage(res.message);
        onDataRestored();
      } else {
        setImportMessage('Lỗi khôi phục: ' + res.error);
      }
    } catch (err) {
      setImportMessage('File JSON không hợp lệ: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={20} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Cài Đặt & Quản Trị Dữ Liệu</h3>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* 1. Gemini AI Key Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Key size={18} style={{ color: 'var(--accent-primary)' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Google Gemini API Key (Miễn phí 0đ)</h4>
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none' }}
              >
                <span>Lấy key miễn phí</span>
                <ExternalLink size={13} />
              </a>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Mở khóa toàn bộ tính năng AI nâng cao (Bóc tách ngữ pháp, Sửa bài viết, Viết truyện). Key được lưu an toàn 100% trên máy của bạn.
            </p>

            <form onSubmit={handleSaveApiKey} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="password"
                className="input-control"
                placeholder="Dán AI Studio Key (AIzaSy...)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                style={{ fontSize: '0.9rem' }}
              />
              <button type="submit" disabled={isSavingKey} className="btn-primary" style={{ flexShrink: 0 }}>
                {isSavingKey ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                <span>Lưu Key</span>
              </button>
            </form>

            {saveSuccess && (
              <span style={{ fontSize: '0.85rem', color: 'var(--accent-success)', fontWeight: 600 }}>
                ✓ Đã lưu API Key thành công!
              </span>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

          {/* 2. Backup & Restore Data */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} style={{ color: 'var(--accent-success)' }} />
              <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Sao Lưu & Khôi Phục Dữ Liệu Cá Nhân</h4>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Toàn bộ từ vựng, mẫu câu, ghi chú và lịch sử chu kỳ ôn tập SRS của bạn có thể được xuất ra file JSON để lưu trên Google Drive hoặc chuyển sang máy khác.
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {/* Export Button */}
              <button onClick={handleExportBackup} className="btn-secondary" style={{ padding: '0.75rem 1.25rem' }}>
                <Download size={18} style={{ color: 'var(--accent-primary)' }} />
                <span>Xuất File Sao Lưu (.JSON)</span>
              </button>

              {/* Import Button */}
              <label className="btn-secondary" style={{ padding: '0.75rem 1.25rem', cursor: 'pointer' }}>
                <Upload size={18} style={{ color: 'var(--accent-success)' }} />
                <span>{isImporting ? 'Đang nhập dữ liệu...' : 'Khôi Phục Dữ Liệu (.JSON)'}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {importMessage && (
              <div style={{
                background: 'var(--bg-tertiary)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--accent-primary)'
              }}>
                {importMessage}
              </div>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

          {/* 3. Server Info */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Server size={14} />
              <span>Backend Server: Node.js SQLite (Port 5001)</span>
            </div>
            <span>LinguaVault v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
