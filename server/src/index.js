import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { initializeDatabase } from './db/database.js';
import { seedInitialData } from './db/seedData.js';
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
import { schedulerService } from './services/schedulerService.js';
import { telegramBotService } from './services/telegramBotService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mobileDistPath = path.join(__dirname, '../../mobile/dist');

// 1. Initialize SQLite Database & Initial Seed Data
initializeDatabase();
seedInitialData();

const app = express();
const PORT = process.env.PORT || 5001;

// 2. Middlewares
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve Static Mobile App Build & Expo Assets
if (fs.existsSync(mobileDistPath)) {
  app.use('/mobile', express.static(mobileDistPath));
  app.use('/_expo', express.static(path.join(mobileDistPath, '_expo')));
  app.get('/mobile/*', (req, res) => {
    res.sendFile(path.join(mobileDistPath, 'index.html'));
  });
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

// Vocabulary Routes
app.get('/api/vocab', vocabController.getAllWords);
app.get('/api/vocab/lookup', vocabController.autoLookup);
app.get('/api/vocab/:id', vocabController.getWordById);
app.post('/api/vocab', vocabController.createWord);
app.put('/api/vocab/:id', vocabController.updateWord);
app.delete('/api/vocab/:id', vocabController.deleteWord);

// Sentence Patterns Routes
app.get('/api/patterns', patternController.getAllPatterns);
app.get('/api/patterns/:id', patternController.getPatternById);
app.post('/api/patterns', patternController.createPattern);
app.put('/api/patterns/:id', patternController.updatePattern);
app.delete('/api/patterns/:id', patternController.deletePattern);

// Notes & Smart Reader Routes
app.get('/api/notes', noteController.getAllNotes);
app.get('/api/notes/:id', noteController.getNoteById);
app.post('/api/notes', noteController.createNote);
app.put('/api/notes/:id', noteController.updateNote);
app.delete('/api/notes/:id', noteController.deleteNote);

// SRS Spaced Repetition Routes
app.get('/api/srs/due', srsController.getDueItems);
app.post('/api/srs/review', srsController.submitReview);
app.get('/api/srs/stats', srsController.getStats);

// AI Integration Routes (Gemini 0đ)
app.post('/api/ai/parse-sentence', aiController.parseSentence);
app.post('/api/ai/check-sentence', aiController.checkSentence);
app.post('/api/ai/generate-story', aiController.generateStory);
app.get('/api/settings', aiController.getSettings);
app.post('/api/settings', aiController.saveSettings);

// Backup & Restore
app.get('/api/backup/export', backupController.exportData);
app.post('/api/backup/import', backupController.importData);

// Quiz by Topic Routes
app.get('/api/quiz/topics', quizController.getTopics);
app.post('/api/quiz/generate', quizController.generateQuiz);
app.post('/api/quiz/submit', quizController.submitQuiz);

// Telegram Bot & Daily Goal Routes
app.get('/api/telegram/settings', telegramController.getSettings);
app.post('/api/telegram/settings', telegramController.saveSettings);
app.post('/api/telegram/test', telegramController.sendTest);
app.get('/api/telegram/progress', telegramController.getProgress);
app.post('/api/telegram/trigger-reminder', telegramController.triggerReminder);
app.post('/api/telegram/trigger-alarm', telegramController.triggerAlarm);
app.post('/api/telegram/trigger-due-reminder', telegramController.triggerDueReminder);

// AI Speaking Lab & Pronunciation Assessment Routes
app.get('/api/speaking/prompts', speakingController.getPrompts);
app.post('/api/speaking/analyze-read-aloud', speakingController.analyzeReadAloud);
app.post('/api/speaking/analyze-qa', speakingController.analyzeQA);

// Gamification (EXP & Level) & AI Mastery Report Routes
app.get('/api/gamification/profile', gamificationController.getProfile);
app.post('/api/gamification/add-xp', gamificationController.addXp);
app.get('/api/ai/mastery-report', gamificationController.getAIMasteryReport);

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
