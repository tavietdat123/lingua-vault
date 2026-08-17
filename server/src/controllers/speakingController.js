import { 
  SPEAKING_PROMPTS, 
  analyzeReadAloud, 
  analyzeQASpeaking 
} from '../services/speakingService.js';

export const speakingController = {
  // GET /api/speaking/prompts
  getPrompts: async (req, res) => {
    try {
      const { category } = req.query;
      let data = SPEAKING_PROMPTS;
      if (category) {
        data = SPEAKING_PROMPTS.filter(p => p.category === category);
      }
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // POST /api/speaking/analyze-read-aloud
  analyzeReadAloud: async (req, res) => {
    try {
      const { targetText, spokenText, duration } = req.body;
      const result = await analyzeReadAloud({ targetText, spokenText, duration });
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // POST /api/speaking/analyze-qa
  analyzeQA: async (req, res) => {
    try {
      const { question, topic, spokenText } = req.body;
      const result = await analyzeQASpeaking({ question, topic, spokenText });
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
};
