import { getDb } from '../db/database.js';
import { callGemini } from './aiService.js';
import { gamificationService } from './gamificationService.js';

export const aiAssessmentService = {
  generateMasteryReport: async (apiKey = null) => {
    const db = getDb();

    // 1. Fetch raw data from SQLite
    const words = db.prepare('SELECT * FROM words').all();
    const patterns = db.prepare('SELECT * FROM patterns').all();
    const studyLogs = db.prepare('SELECT * FROM study_logs ORDER BY date DESC LIMIT 30').all();
    const profile = gamificationService.getProfile();

    const totalWords = words.length;
    const totalPatterns = patterns.length;

    // 2. Classify Memory Retention Depth via SM-2 metrics
    const masteredWords = words.filter(w => (w.repetition || 0) >= 3 && (w.ease_factor || 2.5) >= 2.4 && (w.interval || 0) >= 6);
    const familiarWords = words.filter(w => (w.repetition || 0) >= 1 && !masteredWords.includes(w));
    const learningWords = words.filter(w => !masteredWords.includes(w) && !familiarWords.includes(w));

    // 3. CEFR Level Distribution
    const cefrDistribution = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
    words.forEach(w => {
      const lvl = (w.level || 'B1').toUpperCase();
      if (cefrDistribution[lvl] !== undefined) {
        cefrDistribution[lvl]++;
      } else {
        cefrDistribution['B1']++;
      }
    });

    // 4. Calculate Mathematical Mastery & Retention Score
    const totalReviews = studyLogs.reduce((acc, log) => acc + (log.reviews_count || 0), 0);
    const masteryPercentage = totalWords > 0 
      ? Math.round(((masteredWords.length * 1.0 + familiarWords.length * 0.5) / totalWords) * 100)
      : 0;

    const baseMetrics = {
      totalWords,
      totalPatterns,
      masteredCount: masteredWords.length,
      familiarCount: familiarWords.length,
      learningCount: learningWords.length,
      masteryPercentage,
      cefrDistribution,
      totalReviews,
      userLevel: profile.level,
      userTitle: profile.title,
      totalXp: profile.totalXp,
      streakRecord: profile.streakRecord
    };

    // 5. Build AI Prompt for Gemini 2.0
    const sampleWordsList = words.slice(0, 15).map(w => ({
      word: w.word,
      level: w.level,
      meaning: w.meaning_vi,
      interval: w.interval,
      repetition: w.repetition
    }));

    const prompt = `
Bạn là một Giám khảo & Chuyên gia Khảo thí Ngôn ngữ Học thuật Quốc tế (Senior CEFR Language Assessor).
Hãy phân tích dữ liệu học tập và kho từ vựng cá nhân của học viên dưới đây để xuất một bản "BÁO CÁO ĐÁNG GIÁ NĂNG LỰC TỪ VỰNG TOÀN DIỆN" (Comprehensive Lexical Mastery Report).

DỮ LIỆU THỰC TẾ TRONG DATABASE:
- Tổng số từ vựng: ${totalWords} từ
- Tổng số mẫu câu cấu trúc: ${totalPatterns} mẫu
- Phân bổ cấp độ CEFR: A1: ${cefrDistribution.A1}, A2: ${cefrDistribution.A2}, B1: ${cefrDistribution.B1}, B2: ${cefrDistribution.B2}, C1: ${cefrDistribution.C1}, C2: ${cefrDistribution.C2}
- Số từ đã làm chủ vững vàng (Mastered): ${masteredWords.length} từ
- Số từ đang ghi nhớ tốt (Familiar): ${familiarWords.length} từ
- Số từ mới nạp / cần củng cố (Learning): ${learningWords.length} từ
- Tỷ lệ làm chủ trí nhớ (Mastery Rate): ${masteryPercentage}%
- Cấp độ hiện tại: Level ${profile.level} - "${profile.title}" (${profile.totalXp} XP)
- Một số từ vựng tiêu biểu: ${JSON.stringify(sampleWordsList)}

YÊU CẦU:
Trả về kết quả dưới dạng JSON DUY NHẤT (không dùng markdown backticks ngoài JSON) theo đúng cấu trúc sau:
{
  "estimatedCefrLevel": "B2 Upper-Intermediate" (hoặc C1, B1 tùy dữ liệu),
  "overallScore": 82 (từ 0 đến 100),
  "evaluationSummary": "Nhận xét tổng quan súc tích, truyền cảm hứng về vốn từ vựng hiện tại (2-3 câu).",
  "lexicalStrengths": [
    "Điểm mạnh 1 về chất lượng từ vựng hoặc collocations",
    "Điểm mạnh 2 về cấu trúc ngữ cảnh"
  ],
  "growthAreas": [
    "Điểm cần cải thiện 1 (ví dụ: cần tăng thêm từ vựng học thuật C1 hoặc collocations)",
    "Điểm cần cải thiện 2"
  ],
  "actionPlan": [
    "Bước hành động cụ thể 1 trong 7 ngày tới",
    "Bước hành động cụ thể 2",
    "Bước hành động cụ thể 3"
  ],
  "aiPraiseQuote": "Một câu châm ngôn truyền cảm hứng học tiếng Anh cá nhân hóa dựa trên tiến độ."
}
`.trim();

    try {
      const aiResponse = await callGemini(prompt, apiKey);
      const cleaned = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsedAi = JSON.parse(cleaned);

      return {
        success: true,
        metrics: baseMetrics,
        aiAssessment: parsedAi,
        evaluatedAt: new Date().toISOString()
      };
    } catch (err) {
      // Intelligent Heuristic Fallback in case API key is missing or network issue
      console.warn('⚠️ Gemini AI Assessment fallback:', err.message);

      let estimatedLevel = 'B1 Intermediate';
      if (cefrDistribution.C1 + cefrDistribution.C2 >= 3) {
        estimatedLevel = 'C1 Advanced';
      } else if (cefrDistribution.B2 >= 3) {
        estimatedLevel = 'B2 Upper-Intermediate';
      }

      return {
        success: true,
        metrics: baseMetrics,
        aiAssessment: {
          estimatedCefrLevel: estimatedLevel,
          overallScore: Math.min(95, Math.max(60, masteryPercentage + 15)),
          evaluationSummary: `Vốn từ vựng của bạn đang phát triển rất vững chắc với ${totalWords} từ vựng và ${masteredWords.length} từ đã được ghim chặt vào trí nhớ dài hạn. Bạn có nền tảng từ vựng ${estimatedLevel} đầy tiềm năng!`,
          lexicalStrengths: [
            `Có ${masteredWords.length} từ đã đạt chu kỳ ghi nhớ dài hạn (SM-2 Interval >= 6 ngày)`,
            `Vốn từ bao phủ tốt các chủ đề học thuật và thực tiễn với ${cefrDistribution.B2 + cefrDistribution.C1} từ ở cấp độ B2-C1`
          ],
          growthAreas: [
            'Cần bổ sung thêm cụm Collocations đi kèm để diễn đạt tự nhiên hơn',
            'Tăng cường ôn tập các từ ở nhóm Learning để nâng cao tỷ lệ làm chủ'
          ],
          actionPlan: [
            'Duy trì ôn tập SRS đều đặn 10 từ mỗi ngày vào buổi sáng',
            'Luyện phát âm các từ C1 trong AI Speaking Lab',
            'Áp dụng ít nhất 3 từ vựng mới vào câu văn hoàn chỉnh'
          ],
          aiPraiseQuote: 'Consistency is the DNA of mastery. Keep building your linguistic empire!'
        },
        evaluatedAt: new Date().toISOString(),
        isFallback: true
      };
    }
  }
};
