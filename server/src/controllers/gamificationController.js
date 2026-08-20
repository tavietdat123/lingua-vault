import { gamificationService } from '../services/gamificationService.js';
import { aiAssessmentService } from '../services/aiAssessmentService.js';

export const gamificationController = {
  getProfile: (req, res) => {
    try {
      const userId = req.user?.id || req.query.userId || 'admin_master_user_id';
      const profile = gamificationService.getProfile(userId);
      res.json({ success: true, data: profile });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  addXp: (req, res) => {
    try {
      const { amount, reason } = req.body;
      const userId = req.user?.id || req.body?.userId || 'admin_master_user_id';
      const result = gamificationService.addXp(userId, parseInt(amount, 10) || 10, reason || 'Hoạt động học tập');
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  getAIMasteryReport: async (req, res) => {
    try {
      const apiKey = req.query.apiKey || req.body?.apiKey || null;
      const userId = req.user?.id || 'admin_master_user_id';
      const report = await aiAssessmentService.generateMasteryReport(apiKey, userId);
      res.json(report);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
