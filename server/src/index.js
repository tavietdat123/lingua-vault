import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { initializeDatabase } from './db/database.js';
import { seedInitialData, seedWorkProjectData } from './db/seedData.js';
import { vocabController } from './controllers/vocabController.js';
import { patternController } from './controllers/patternController.js';
import { noteController } from './controllers/noteController.js';
import { srsController } from './controllers/srsController.js';
import { aiController } from './controllers/aiController.js';
import { backupController } from './controllers/backupController.js';
import { quizController } from './controllers/quizController.js';
import { telegramController } from './controllers/telegramController.js';
import { speakingController } from './controllers/speakingController.js';
import { gamificationController } from './controllers/gamificationController.js';
import { topicController } from './controllers/topicController.js';
import { patternCategoryController } from './controllers/patternCategoryController.js';
import { authController } from './controllers/authController.js';
import { verifyToken } from './services/authService.js';
import { schedulerService } from './services/schedulerService.js';
import { telegramBotService } from './services/telegramBotService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDistPath = path.join(__dirname, '../../web/dist');
const mobileDistPath = path.join(__dirname, '../../mobile/dist');

// 1. Initialize SQLite Database & Initial Seed Data
initializeDatabase();
seedInitialData();
seedWorkProjectData();

const app = express();
const PORT = process.env.PORT || 5001;

// 2. Middlewares
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Auth Token Parser Middleware (Optional / extracts user if present)
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
});

// Serve Static Web Frontend App Build
if (fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
}

// Serve Static Mobile App Build & Expo Assets with No-Cache Headers for Instant Live Updates
if (fs.existsSync(mobileDistPath)) {
  const sendFreshMobileIndex = (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(mobileDistPath, 'index.html'));
  };

  app.get('/mobile', sendFreshMobileIndex);
  app.use('/mobile', express.static(mobileDistPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html') || filePath.endsWith('.json')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
  }));
  app.use('/_expo', express.static(path.join(mobileDistPath, '_expo'), {
    maxAge: '1h'
  }));
  app.get('/mobile/*', sendFreshMobileIndex);
}

// 3. API Routes

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'LinguaVault Backend Server',
    timestamp: new Date().toISOString()
  });
});

// Authentication & User Management Routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.post('/api/auth/guest-login', authController.guestLogin);
app.get('/api/auth/me', authController.getMe);
app.put('/api/auth/profile', authController.updateProfile);
app.post('/api/auth/logout', authController.logout);

// High-Definition Studio Audio TTS Stream
app.get('/api/audio/tts', async (req, res) => {
  try {
    const text = req.query.text || '';
    const lang = req.query.lang || 'en-US';
    if (!text.trim()) {
      return res.status(400).send('Text is required');
    }
    
    const cleanText = text.substring(0, 350).trim();
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
    
    const audioRes = await fetch(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/'
      }
    });

    if (!audioRes.ok) {
      return res.status(audioRes.status).send('TTS upstream error');
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const buffer = Buffer.from(await audioRes.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    console.error('Audio TTS error:', err.message);
    res.status(500).send(err.message);
  }
});

// Vocabulary Routes
app.get('/api/vocab', vocabController.getAllWords);
app.get('/api/vocab/lookup', vocabController.autoLookup);
app.post('/api/vocab/seed-work', (req, res) => {
  const result = seedWorkProjectData(true);
  res.json(result);
});
app.get('/api/vocab/:id', vocabController.getWordById);
app.post('/api/vocab', vocabController.createWord);
app.put('/api/vocab/:id', vocabController.updateWord);
app.delete('/api/vocab/:id', vocabController.deleteWord);

// Topics & Category Management Routes
app.get('/api/topics', topicController.getAllTopics);
app.post('/api/topics', topicController.createTopic);
app.put('/api/topics/:id', topicController.updateTopic);
app.delete('/api/topics/:id', topicController.deleteTopic);
app.post('/api/topics/assign', topicController.assignWordTopic);

// Sentence Patterns Routes
app.get('/api/patterns', patternController.getAllPatterns);
app.get('/api/patterns/:id', patternController.getPatternById);
app.post('/api/patterns', patternController.createPattern);
app.put('/api/patterns/:id', patternController.updatePattern);
app.delete('/api/patterns/:id', patternController.deletePattern);

// Sentence Pattern Categories (Communicative Functions) Routes
app.get('/api/pattern-categories', patternCategoryController.getAllCategories);
app.post('/api/pattern-categories', patternCategoryController.createCategory);
app.put('/api/pattern-categories/:id', patternCategoryController.updateCategory);
app.delete('/api/pattern-categories/:id', patternCategoryController.deleteCategory);

// Notes & Smart Reader Routes
app.get('/api/notes', noteController.getAllNotes);
app.get('/api/notes/:id', noteController.getNoteById);
app.post('/api/notes', noteController.createNote);
app.put('/api/notes/:id', noteController.updateNote);
app.delete('/api/notes/:id', noteController.deleteNote);

// SRS Spaced Repetition & Dashboard Stats Routes
app.get('/api/srs/due', srsController.getDueItems);
app.post('/api/srs/review', srsController.submitReview);
app.get('/api/srs/stats', srsController.getStats);
app.get('/api/dashboard/stats', srsController.getStats);
app.get('/api/vocab/stats/overview', srsController.getStats);
app.get('/api/stats', srsController.getStats);

// AI Integration Routes (Gemini 0đ)
app.post('/api/ai/parse-sentence', aiController.parseSentence);
app.post('/api/ai/check-sentence', aiController.checkSentence);
app.post('/api/ai/generate-story', aiController.generateStory);
app.post('/api/ai/paraphrase', aiController.paraphraseSentence);
app.post('/api/ai/collocations', aiController.exploreCollocations);
app.post('/api/ai/dialogue', aiController.generateDialogue);
app.post('/api/ai/translate-in-context', aiController.translateInContext);
app.get('/api/settings', aiController.getSettings);
app.post('/api/settings', aiController.saveSettings);

// Backup & Restore
app.get('/api/backup/export', backupController.exportData);
app.post('/api/backup/import', backupController.importData);

// Quiz by Topic & Patterns Routes
app.get('/api/quiz/topics', quizController.getTopics);
app.post('/api/quiz/generate', quizController.generateQuiz);
app.post('/api/quiz/generate-ai', quizController.generateAIQuiz);
app.post('/api/quiz/generate-pattern', quizController.generatePatternQuiz);
app.post('/api/quiz/generate-pattern-ai', quizController.generateAIPatternQuiz);
app.post('/api/quiz/submit', quizController.submitQuiz);
app.get('/api/quiz/history', quizController.getHistory);
app.get('/api/quiz/history/:id', quizController.getQuizHistoryById);
app.delete('/api/quiz/history/:id', quizController.deleteQuizHistory);

// Telegram Bot & Daily Goal Routes
app.get('/api/telegram/settings', telegramController.getSettings);
app.post('/api/telegram/settings', telegramController.saveSettings);
app.post('/api/telegram/test', telegramController.sendTest);
app.get('/api/telegram/progress', telegramController.getProgress);
app.post('/api/telegram/trigger-reminder', telegramController.triggerReminder);
app.post('/api/telegram/trigger-alarm', telegramController.triggerAlarm);
app.post('/api/telegram/trigger-due-reminder', telegramController.triggerDueReminder);
app.post('/api/telegram/trigger-streak-saver', telegramController.triggerStreakSaver);
app.post('/api/telegram/trigger-word-of-day', telegramController.triggerWordOfDay);
app.post('/api/telegram/trigger-weekly-digest', telegramController.triggerWeeklyDigest);
app.post('/api/telegram/trigger-leech-alert', telegramController.triggerLeechAlert);

// AI Speaking Lab & Pronunciation Assessment Routes
app.get('/api/speaking/prompts', speakingController.getPrompts);
app.post('/api/speaking/analyze-read-aloud', speakingController.analyzeReadAloud);
app.post('/api/speaking/analyze-qa', speakingController.analyzeQA);

// Gamification (EXP & Level) & AI Mastery Report Routes
app.get('/api/gamification/profile', gamificationController.getProfile);
app.post('/api/gamification/add-xp', gamificationController.addXp);
app.get('/api/ai/mastery-report', gamificationController.getAIMasteryReport);

// OS-Level Hardcore System Alarm Routes (Continuous Ringing & Quiz Lockdown)
import { systemAlarmService } from './services/systemAlarmService.js';
app.post('/api/alarm/trigger', (req, res) => {
  systemAlarmService.startAlarm();
  res.json({ success: true, message: 'Đã kích hoạt chuông báo thức hệ thống!' });
});
app.post('/api/alarm/stop', (req, res) => {
  systemAlarmService.stopAlarm();
  res.json({ success: true, message: 'Đã tắt chuông báo thức hệ thống!' });
});
app.get('/api/alarm/status', (req, res) => {
  res.json({ success: true, data: systemAlarmService.getStatus() });
});

// SPA Web Client Fallback Route
if (fs.existsSync(webDistPath)) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/mobile') || req.path.startsWith('/_expo')) {
      return next();
    }
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
}

// 4. Start Server, Schedulers & Telegram AI Copilot Poller
schedulerService.start();
telegramBotService.start();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 ===================================================
   LINGUAVAULT SERVER API RUNNING SUCCESSFULLY!
   • Local URL:            http://localhost:${PORT}
   • Health Check:         http://localhost:${PORT}/api/health
   • Spaced Repetition:    Enabled (SuperMemo SM-2)
   • Telegram AI Copilot:  Active (Two-Way Bi-Directional)
   • Hardcore Alarm Mode:  Ready
===================================================
  `);
});
