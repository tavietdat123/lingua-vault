import { gamificationService } from '../services/gamificationService.js';
import { aiAssessmentService } from '../services/aiAssessmentService.js';

export const gamificationController = {
  getProfile: (req, res) => {
    try {
      const profile = gamificationService.getProfile();
      res.json({ success: true, data: profile });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  addXp: (req, res) => {
    try {
      const { amount, reason } = req.body;
      const result = gamificationService.addXp(parseInt(amount, 10) || 10, reason || 'Hoạt động học tập');
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  getAIMasteryReport: async (req, res) => {
    try {
      const report = await aiAssessmentService.generateMasteryReport();
      res.json(report);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
