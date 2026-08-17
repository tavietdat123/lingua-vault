import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import CommandPalette from './components/layout/CommandPalette';
import Toast from './components/common/Toast';
import Dashboard from './components/dashboard/Dashboard';
import VocabVault from './components/vocab/VocabVault';
import QuickAddModal from './components/vocab/QuickAddModal';
import PatternHub from './components/patterns/PatternHub';
import PatternModal from './components/patterns/PatternModal';
import SmartReader from './components/reader/SmartReader';
import SRSReviewCenter from './components/review/SRSReviewCenter';
import AILab from './components/ai/AILab';
import SettingsModal from './components/settings/SettingsModal';
import { api } from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isDark, setIsDark] = useState(true);
  const [audioSpeed, setAudioSpeed] = useState(0.9);

  // Data States
  const [words, setWords] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [notes, setNotes] = useState([]);
  const [stats, setStats] = useState(null);
  const [dueItems, setDueItems] = useState([]);

  // Modal States
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [editingWord, setEditingWord] = useState(null);

  const [isPatternModalOpen, setIsPatternModalOpen] = useState(false);
  const [editingPattern, setEditingPattern] = useState(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [aiLabSentence, setAiLabSentence] = useState('');

  // Toast notifications state
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Load Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('linguavault_theme');
    if (savedTheme === 'light') {
      setIsDark(false);
      document.body.className = 'theme-light';
    } else {
      setIsDark(true);
      document.body.className = 'theme-dark';
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    document.body.className = nextDark ? 'theme-dark' : 'theme-light';
    localStorage.setItem('linguavault_theme', nextDark ? 'dark' : 'light');
    addToast(nextDark ? 'Đã chuyển sang Giao diện Tối' : 'Đã chuyển sang Giao diện Sáng', 'info');
  };

  const toggleAudioSpeed = () => {
    const speeds = [0.75, 0.9, 1.1];
    const nextIdx = (speeds.indexOf(audioSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setAudioSpeed(nextSpeed);
    addToast(`Tốc độ phát âm: ${nextSpeed}x`, 'info');
  };

  // Load All App Data
  const refreshAllData = async () => {
    try {
      const [wordsRes, patternsRes, notesRes, statsRes, dueRes] = await Promise.all([
        api.getWords(),
        api.getPatterns(),
        api.getNotes(),
        api.getStats(),
        api.getDueItems()
      ]);

      if (wordsRes.success) setWords(wordsRes.data || []);
      if (patternsRes.success) setPatterns(patternsRes.data || []);
      if (notesRes.success) setNotes(notesRes.data || []);
      if (statsRes.success) setStats(statsRes.data || null);
      if (dueRes.success) {
        const combinedDue = [
          ...(dueRes.data?.words || []),
          ...(dueRes.data?.patterns || [])
        ];
        setDueItems(combinedDue);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Handlers for Words
  const handleAddWord = () => {
    setEditingWord(null);
    setIsQuickAddOpen(true);
  };

  const handleEditWord = (word) => {
    setEditingWord(word);
    setIsQuickAddOpen(true);
  };

  const handleDeleteWord = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa từ vựng này không?')) return;
    try {
      await api.deleteWord(id);
      addToast('Đã xóa từ vựng khỏi kho lưu trữ', 'info');
      refreshAllData();
    } catch (err) {
      addToast('Lỗi xóa từ: ' + err.message, 'error');
    }
  };

  // Handlers for Patterns
  const handleAddPattern = () => {
    setEditingPattern(null);
    setIsPatternModalOpen(true);
  };

  const handleEditPattern = (pattern) => {
    setEditingPattern(pattern);
    setIsPatternModalOpen(true);
  };

  const handleDeletePattern = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mẫu câu này không?')) return;
    try {
      await api.deletePattern(id);
      addToast('Đã xóa mẫu câu', 'info');
      refreshAllData();
    } catch (err) {
      addToast('Lỗi xóa mẫu câu: ' + err.message, 'error');
    }
  };

  // Handlers for Notes
  const handleSaveNote = async (noteData) => {
    try {
      if (noteData.id) {
        await api.updateNote(noteData.id, noteData);
        addToast('Đã cập nhật bài viết thành công');
      } else {
        await api.createNote(noteData);
        addToast('Đã tạo bài viết mới thành công');
      }
      refreshAllData();
    } catch (err) {
      addToast('Lỗi lưu bài viết: ' + err.message, 'error');
    }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài đọc/ghi chú này không?')) return;
    try {
      await api.deleteNote(id);
      addToast('Đã xóa bài viết', 'info');
      refreshAllData();
    } catch (err) {
      addToast('Lỗi: ' + err.message, 'error');
    }
  };

  // Smart Reader Highlight -> Quick Add
  const handleSaveWordFromSelection = (text) => {
    setEditingWord({ word: text });
    setIsQuickAddOpen(true);
  };

  // Smart Reader Highlight -> AI Lab
  const handleSendToAiLab = (text) => {
    setAiLabSentence(text);
    setCurrentTab('ai-lab');
  };

  // SRS Review Submit
  const handleReviewSubmit = async (id, type, rating) => {
    try {
      await api.submitReview(id, type, rating);
      const statsRes = await api.getStats();
      if (statsRes.success) setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Export backup trigger
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
      addToast('Đã xuất file sao lưu JSON thành công!');
    } catch (err) {
      addToast('Lỗi xuất dữ liệu: ' + err.message, 'error');
    }
  };

  return (
    <div className="app-container">
      {/* 1. Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        stats={stats}
        onOpenQuickAdd={handleAddWord}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* 2. Main Content Area */}
      <main className="app-main">
        <Header
          currentTab={currentTab}
          isDark={isDark}
          toggleTheme={toggleTheme}
          stats={stats}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          audioSpeed={audioSpeed}
          onToggleAudioSpeed={toggleAudioSpeed}
        />

        <div className="app-content">
          {currentTab === 'dashboard' && (
            <Dashboard
              stats={stats}
              recentWords={words}
              onStartReview={() => setCurrentTab('review')}
              onNavigate={(tab) => setCurrentTab(tab)}
              audioSpeed={audioSpeed}
            />
          )}

          {currentTab === 'vocab' && (
            <VocabVault
              words={words}
              onAddWord={handleAddWord}
              onEditWord={handleEditWord}
              onDeleteWord={handleDeleteWord}
            />
          )}

          {currentTab === 'patterns' && (
            <PatternHub
              patterns={patterns}
              onAddPattern={handleAddPattern}
              onEditPattern={handleEditPattern}
              onDeletePattern={handleDeletePattern}
            />
          )}

          {currentTab === 'reader' && (
            <SmartReader
              notes={notes}
              words={words}
              onSaveNote={handleSaveNote}
              onDeleteNote={handleDeleteNote}
              onSaveWordFromSelection={handleSaveWordFromSelection}
              onSendToAiLab={handleSendToAiLab}
            />
          )}

          {currentTab === 'review' && (
            <SRSReviewCenter
              dueItems={dueItems}
              onReviewSubmit={handleReviewSubmit}
              onFinishSession={() => {
                refreshAllData();
                setCurrentTab('dashboard');
                addToast('Chúc mừng bạn đã hoàn thành phiên ôn tập hôm nay!');
              }}
            />
          )}

          {currentTab === 'ai-lab' && (
            <AILab
              initialSentence={aiLabSentence}
              onSaveExtractedWord={(item) => {
                setEditingWord(item);
                setIsQuickAddOpen(true);
              }}
            />
          )}
        </div>
      </main>

      {/* 3. Global Command Palette (Cmd + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        words={words}
        patterns={patterns}
        notes={notes}
        onNavigate={(tab) => setCurrentTab(tab)}
        onOpenQuickAdd={handleAddWord}
        onToggleTheme={toggleTheme}
        isDark={isDark}
        onExportBackup={handleExportBackup}
      />

      {/* 4. Modals */}
      {isQuickAddOpen && (
        <QuickAddModal
          initialData={editingWord}
          onClose={() => setIsQuickAddOpen(false)}
          onSaved={() => {
            refreshAllData();
            addToast(editingWord?.id ? 'Đã cập nhật từ vựng' : 'Đã thêm từ vựng mới vào kho');
          }}
        />
      )}

      {isPatternModalOpen && (
        <PatternModal
          initialData={editingPattern}
          onClose={() => setIsPatternModalOpen(false)}
          onSaved={() => {
            refreshAllData();
            addToast(editingPattern?.id ? 'Đã cập nhật mẫu câu' : 'Đã thêm mẫu câu mới vào kho');
          }}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          onDataRestored={() => {
            refreshAllData();
            addToast('Đã khôi phục dữ liệu từ bản sao lưu!');
          }}
        />
      )}

      {/* 5. Toast Notifications */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
