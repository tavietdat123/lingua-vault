import { quizService } from '../services/quizService.js';

export const quizController = {
  // GET /api/quiz/topics
  getTopics: (req, res) => {
    try {
      const topics = quizService.getTopics();
      res.json({ success: true, data: topics });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // POST /api/quiz/generate
  generateQuiz: (req, res) => {
    try {
      const { topic = 'All', count = 5, mode = 'mixed' } = req.body;
      const quiz = quizService.generateQuiz({ topic, count: parseInt(count, 10) || 5, mode });
      res.json({ success: true, data: quiz });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // POST /api/quiz/submit
  submitQuiz: (req, res) => {
    try {
      const { answers = [] } = req.body;
      const result = quizService.submitQuiz({ answers });
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
};
