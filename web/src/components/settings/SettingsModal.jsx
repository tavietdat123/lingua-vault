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
  Server,
  Bell,
  Target,
  Send,
  HelpCircle
} from 'lucide-react';
import { api } from '../../services/api';

export default function SettingsModal({ onClose, onDataRestored }) {
  const [apiKey, setApiKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  // Telegram & Daily Goal State
  const [dailyGoal, setDailyGoal] = useState(10);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [telegramSaveSuccess, setTelegramSaveSuccess] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [showTelegramGuide, setShowTelegramGuide] = useState(false);

  useEffect(() => {
    // Load existing Gemini settings
    api.getSettings().then(res => {
      if (res.success && res.data?.gemini_api_key) {
        setApiKey(res.data.gemini_api_key);
      }
    }).catch(err => console.error(err));

    // Load Telegram & Goal settings
    api.getTelegramSettings().then(res => {
      if (res.success && res.data) {
        setDailyGoal(res.data.daily_word_goal || 10);
        setReminderTime(res.data.telegram_reminder_time || '20:00');
        setBotToken(res.data.telegram_bot_token || '');
        setChatId(res.data.telegram_chat_id || '');
        setTelegramEnabled(Boolean(res.data.telegram_enabled));
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

  const handleSaveTelegram = async (e) => {
    e.preventDefault();
    setIsSavingTelegram(true);
    setTelegramSaveSuccess(false);
    setTestResult('');

    try {
      const res = await api.saveTelegramSettings({
        daily_word_goal: parseInt(dailyGoal, 10) || 10,
        telegram_reminder_time: reminderTime,
        telegram_bot_token: botToken.trim(),
        telegram_chat_id: chatId.trim(),
        telegram_enabled: telegramEnabled
      });

      if (res.success) {
        setTelegramSaveSuccess(true);
        setTimeout(() => setTelegramSaveSuccess(false), 3000);
      }
    } catch (err) {
      alert('Lỗi lưu cấu hình: ' + err.message);
    } finally {
      setIsSavingTelegram(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!botToken || !chatId) {
      alert('Vui lòng nhập đầy đủ Telegram Bot Token và Chat ID trước khi test!');
      return;
    }

    setIsTestingTelegram(true);
    setTestResult('');

    try {
      const res = await api.sendTelegramTest({
        telegram_bot_token: botToken.trim(),
        telegram_chat_id: chatId.trim()
      });

      if (res.success) {
        setTestResult('success');
      } else {
        setTestResult('error: ' + (res.error || 'Không gửi được tin nhắn'));
      }
    } catch (err) {
      setTestResult('error: ' + err.message);
    } finally {
      setIsTestingTelegram(false);
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
      <div className="modal-content" style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          position: 'sticky',
          top: 0,
          background: 'var(--bg-secondary)',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={20} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Cài Đặt & Thông Báo Học Tập</h3>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* 1. Daily Goal & Telegram Notification Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={18} style={{ color: 'var(--accent-primary)' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Mục Tiêu Mỗi Ngày & Bot Telegram Cảnh Báo</h4>
              </div>
              <button 
                type="button"
                onClick={() => setShowTelegramGuide(!showTelegramGuide)}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                <HelpCircle size={14} />
                <span>Cách tạo Bot Telegram</span>
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Cài đặt số lượng từ tối thiểu phải học mỗi ngày. Nếu đến giờ hẹn chưa đạt chỉ tiêu, Bot Telegram sẽ tự động gửi tin nhắn nhắc nhở bảo vệ chuỗi Streak!
            </p>

            {/* Step-by-step Guide Accordion */}
            {showTelegramGuide && (
              <div style={{
                background: 'var(--bg-tertiary)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                lineHeight: 1.6,
                border: '1px solid var(--border-color)'
              }}>
                <b>📌 Cách lấy Token & Chat ID trong 1 phút:</b>
                <ol style={{ paddingLeft: '1.2rem', margin: '0.5rem 0' }}>
                  <li>Mở Telegram, tìm <b>@BotFather</b> ➔ Nhắn <code>/newbot</code> và làm theo hướng dẫn để nhận <b>Bot Token</b>.</li>
                  <li>Tìm <b>@userinfobot</b> ➔ Bấm <b>Start</b> để lấy số <b>Id (Chat ID)</b> của bạn.</li>
                  <li>Nhắn cho con Bot bạn vừa tạo 1 tin nhắn bất kỳ (ví dụ: <i>"Hello"</i>) để kích hoạt cuộc trò chuyện!</li>
                </ol>
              </div>
            )}

            <form onSubmit={handleSaveTelegram} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Daily Goal & Reminder Time Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    🎯 Mục tiêu từ/ngày:
                  </label>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {[5, 10, 15, 20].map(cnt => (
                      <button
                        type="button"
                        key={cnt}
                        onClick={() => setDailyGoal(cnt)}
                        style={{
                          flex: 1,
                          padding: '0.4rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-color)',
                          background: dailyGoal === cnt ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                          color: dailyGoal === cnt ? '#ffffff' : 'var(--text-primary)',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {cnt} từ
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    ⏰ Giờ nhắc nhở mỗi ngày:
                  </label>
                  <input
                    type="time"
                    className="input-control"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    style={{ padding: '0.45rem', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              {/* Bot Token & Chat ID */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    🔑 Telegram Bot Token:
                  </label>
                  <input
                    type="password"
                    className="input-control"
                    placeholder="123456789:ABCdef..."
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    💬 Telegram Chat ID:
                  </label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="VD: 987654321"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Enable Toggle & Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={telegramEnabled}
                    onChange={(e) => setTelegramEnabled(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                  />
                  <span>Bật thông báo tự động qua Telegram</span>
                </label>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleTestTelegram}
                    disabled={isTestingTelegram}
                    className="btn-secondary"
                    style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
                  >
                    {isTestingTelegram ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    <span>Gửi Test Thử</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingTelegram}
                    className="btn-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  >
                    {isSavingTelegram ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    <span>Lưu Cài Đặt</span>
                  </button>
                </div>
              </div>

              {/* Feedback messages */}
              {telegramSaveSuccess && (
                <span style={{ fontSize: '0.85rem', color: 'var(--accent-success)', fontWeight: 600 }}>
                  ✓ Đã lưu cấu hình Mục tiêu & Telegram thành công!
                </span>
              )}
              {testResult === 'success' && (
                <span style={{ fontSize: '0.85rem', color: 'var(--accent-success)', fontWeight: 600 }}>
                  ✓ Đã gửi tin nhắn thử nghiệm tới Telegram của bạn! Hãy kiểm tra app Telegram.
                </span>
              )}
              {testResult.startsWith('error') && (
                <span style={{ fontSize: '0.85rem', color: 'var(--accent-danger)', fontWeight: 600 }}>
                  ✕ {testResult}
                </span>
              )}
            </form>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

          {/* 2. Gemini AI Key Settings */}
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

          {/* 3. Backup & Restore Data */}
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

          {/* 4. Server Info */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Server size={14} />
              <span>Backend Server: Node.js SQLite (Port 5001)</span>
            </div>
            <span>LinguaVault v1.1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

