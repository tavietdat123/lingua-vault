import { getDb } from '../db/database.js';
import { gamificationService } from './gamificationService.js';

export const quizService = {
  // 1. Get all available topics / tags with counts
  getTopics: () => {
    const db = getDb();
    
    // Get all words
    const words = db.prepare('SELECT id, word, tags, level FROM words').all();
    const topicMap = {
      'All': 0,
      'IELTS': 0,
      'Business': 0,
      'Daily': 0,
      'Tech': 0,
      'Academic': 0
    };

    words.forEach(w => {
      topicMap['All'] = (topicMap['All'] || 0) + 1;
      let tags = [];
      try {
        tags = JSON.parse(w.tags || '[]');
      } catch (e) {
        tags = [];
      }

      tags.forEach(tag => {
        const normalized = tag.trim();
        if (normalized) {
          topicMap[normalized] = (topicMap[normalized] || 0) + 1;
        }
      });
    });

    return Object.entries(topicMap).map(([name, count]) => ({
      name,
      count
    }));
  },

  // 2. Generate a Quiz based on Topic and Question Count
  generateQuiz: ({ topic = 'All', count = 5, mode = 'mixed' }) => {
    const db = getDb();
    let words = db.prepare('SELECT * FROM words').all();

    if (words.length < 4) {
      throw new Error('Cần ít nhất 4 từ vựng trong kho để tạo bài Quiz!');
    }

    // Filter by topic if not 'All'
    let candidateWords = words;
    if (topic && topic !== 'All') {
      candidateWords = words.filter(w => {
        try {
          const tags = JSON.parse(w.tags || '[]');
          return tags.some(t => t.toLowerCase() === topic.toLowerCase());
        } catch (e) {
          return false;
        }
      });
      // Fallback to all words if not enough words in this topic
      if (candidateWords.length < 3) {
        candidateWords = words;
      }
    }

    // Shuffle and pick target words
    const shuffled = [...candidateWords].sort(() => 0.5 - Math.random());
    const selectedWords = shuffled.slice(0, Math.min(count, shuffled.length));

    // Question types: 'meaning_vi', 'reverse_en', 'cloze_blank', 'listening'
    const questionTypes = ['meaning_vi', 'reverse_en', 'cloze_blank', 'listening'];

    const questions = selectedWords.map((targetWord, index) => {
      const qType = mode === 'mixed' 
        ? questionTypes[index % questionTypes.length]
        : mode;

      let examples = [];
      try {
        examples = JSON.parse(targetWord.examples || '[]');
      } catch (e) {
        examples = [];
      }

      // Pick 3 distractors from the rest of the words
      const otherWords = words.filter(w => w.id !== targetWord.id);
      const shuffledOthers = [...otherWords].sort(() => 0.5 - Math.random());
      const distractors = shuffledOthers.slice(0, 3);

      let questionText = '';
      let promptSubtitle = '';
      let correctAnswer = '';
      let options = [];

      if (qType === 'meaning_vi' || qType === 'listening') {
        questionText = targetWord.word;
        promptSubtitle = qType === 'listening' 
          ? 'Nghe phát âm và chọn nghĩa tiếng Việt chính xác' 
          : 'Chọn nghĩa tiếng Việt chính xác của từ:';
        correctAnswer = targetWord.meaning_vi;

        const rawOptions = [
          targetWord.meaning_vi,
          ...distractors.map(d => d.meaning_vi)
        ];
        options = [...new Set(rawOptions)].sort(() => 0.5 - Math.random());
      } else if (qType === 'reverse_en') {
        questionText = targetWord.meaning_vi;
        promptSubtitle = 'Chọn từ tiếng Anh tương ứng với nghĩa:';
        correctAnswer = targetWord.word;

        const rawOptions = [
          targetWord.word,
          ...distractors.map(d => d.word)
        ];
        options = [...new Set(rawOptions)].sort(() => 0.5 - Math.random());
      } else if (qType === 'cloze_blank') {
        // Find or create a sentence with a blank
        if (examples.length > 0) {
          const sampleSentence = examples[0];
          // Replace word (case-insensitive) with blank _______
          const regex = new RegExp(`\\b${targetWord.word}\\b`, 'gi');
          questionText = sampleSentence.replace(regex, '_______');
          if (!questionText.includes('_______')) {
            questionText = `_______: ${targetWord.meaning_en || targetWord.meaning_vi}`;
          }
        } else {
          questionText = `_______: ${targetWord.meaning_en || '...'}`;
        }
        promptSubtitle = `Điền từ thích hợp vào chỗ trống (${targetWord.meaning_vi}):`;
        correctAnswer = targetWord.word;

        const rawOptions = [
          targetWord.word,
          ...distractors.map(d => d.word)
        ];
        options = [...new Set(rawOptions)].sort(() => 0.5 - Math.random());
      }

      // Ensure 4 options exist
      while (options.length < 4 && words.length >= 4) {
        const extra = words.find(w => !options.includes(w.word) && !options.includes(w.meaning_vi));
        if (extra) {
          options.push(qType === 'reverse_en' || qType === 'cloze_blank' ? extra.word : extra.meaning_vi);
        } else {
          break;
        }
      }

      return {
        id: targetWord.id,
        type: qType,
        word: targetWord.word,
        phonetic: targetWord.phonetic,
        level: targetWord.level || 'B2',
        meaning_vi: targetWord.meaning_vi,
        meaning_en: targetWord.meaning_en,
        examples: examples,
        questionText,
        promptSubtitle,
        correctAnswer,
        options
      };
    });

    return {
      topic,
      totalQuestions: questions.length,
      questions
    };
  },

  // 3. Submit and Grade Quiz
  submitQuiz: ({ answers = [] }) => {
    const db = getDb();
    let correctCount = 0;
    const results = [];
    const wrongWordIds = [];

    answers.forEach(item => {
      const isCorrect = item.userAnswer?.trim().toLowerCase() === item.correctAnswer?.trim().toLowerCase();
      if (isCorrect) {
        correctCount++;
      } else if (item.id) {
        wrongWordIds.push(item.id);
      }

      results.push({
        id: item.id,
        word: item.word,
        questionText: item.questionText,
        correctAnswer: item.correctAnswer,
        userAnswer: item.userAnswer,
        isCorrect
      });
    });

    const total = answers.length || 1;
    const score = Math.round((correctCount / total) * 100);
    const xpEarned = correctCount * 10 + (score === 100 ? 50 : 0);

    // If there are wrong answers, update their SRS state so user reviews them sooner
    if (wrongWordIds.length > 0) {
      const placeholders = wrongWordIds.map(() => '?').join(',');
      try {
        // Decrease interval slightly for reinforcement
        db.prepare(`
          UPDATE words 
          SET interval = CASE WHEN interval > 1 THEN interval - 1 ELSE 1 END,
              ease_factor = CASE WHEN ease_factor > 1.4 THEN ease_factor - 0.1 ELSE 1.3 END,
              updated_at = CURRENT_TIMESTAMP
          WHERE id IN (${placeholders})
        `).run(...wrongWordIds);
      } catch (e) {
        console.warn('SRS update on quiz wrong answers:', e);
      }
    }

    // Gamification: Add XP for Quiz Completion
    let xpResult = null;
    try {
      xpResult = gamificationService.addXp(xpEarned, `Quiz: Đúng ${correctCount}/${total} câu`);
    } catch (e) {}

    return {
      totalQuestions: total,
      correctCount,
      score,
      xpEarned,
      isPerfect: score === 100,
      results,
      gamification: xpResult
    };
  }
};
