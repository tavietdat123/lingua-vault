import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db/database.js';
import { seedInitialData } from './db/seedData.js';
import { vocabController } from './controllers/vocabController.js';
import { patternController } from './controllers/patternController.js';
import { noteController } from './controllers/noteController.js';
import { srsController } from './controllers/srsController.js';
import { aiController } from './controllers/aiController.js';
import { backupController } from './controllers/backupController.js';

dotenv.config();

// 1. Initialize SQLite Database & Initial Seed Data
initializeDatabase();
seedInitialData();

const app = express();
const PORT = process.env.PORT || 5001;

// 2. Middlewares
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

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

// 4. Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 ===================================================
   LINGUAVAULT SERVER API RUNNING SUCCESSFULLY!
   • Local URL:    http://localhost:${PORT}
   • Health Check: http://localhost:${PORT}/api/health
   • Spaced Repetition (SM-2): Enabled
   • Database:     Native Node SQLite (Local-First)
===================================================
  `);
});
