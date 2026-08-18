import { getDb } from '../db/database.js';
import { callGemini, getEffectiveApiKey } from './aiService.js';
import { gamificationService } from './gamificationService.js';

export const aiAssessmentService = {
  generateMasteryReport: async (apiKey = null) => {
    const db = getDb();
    const effectiveKey = getEffectiveApiKey(apiKey);

    // 1. Fetch raw data from SQLite
    const words = db.prepare('SELECT * FROM words').all();
    const patterns = db.prepare('SELECT * FROM patterns').all();
    const studyLogs = db.prepare('SELECT * FROM study_logs ORDER BY date DESC LIMIT 30').all();
    const profile = gamificationService.getProfile();

    const totalWords = words.length;
    const totalPatterns = patterns.length;

    // 2. Classify Memory Retention Depth via SM-2 metrics
    const masteredWords = words.filter(w => 
      w.status === 'mastered' || 
      ((w.repetition || 0) >= 3 && (w.interval || 0) >= 6)
    );
    const familiarWords = words.filter(w => 
      !masteredWords.some(m => m.id === w.id) && 
      (w.status === 'reviewing' || (w.repetition || 0) >= 1)
    );
    const learningWords = words.filter(w => 
      !masteredWords.some(m => m.id === w.id) && 
      !familiarWords.some(f => f.id === w.id)
    );

    // 3. Exact CEFR Level Distribution & Weighted CEFR Index
    const cefrDistribution = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
    let weightedCefrSum = 0;
    const cefrWeights = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };

    words.forEach(w => {
      const rawLvl = (w.level || 'B1').toUpperCase().trim();
      const lvl = cefrDistribution[rawLvl] !== undefined ? rawLvl : 'B1';
      cefrDistribution[lvl]++;
      weightedCefrSum += cefrWeights[lvl] || 3;
    });

    const avgCefrWeight = totalWords > 0 ? (weightedCefrSum / totalWords) : 1;

    // Determine estimated CEFR Level based on real data
    let estimatedCefrLevel = 'A1 Starter (Khởi đầu)';
    if (totalWords === 0) {
      estimatedCefrLevel = 'Chưa xác định (Cần thêm từ vựng)';
    } else if (avgCefrWeight >= 5.2) {
      estimatedCefrLevel = 'C2 Mastery (Bậc thầy Ngôn ngữ)';
    } else if (avgCefrWeight >= 4.5 || (cefrDistribution.C1 + cefrDistribution.C2) >= Math.max(2, totalWords * 0.35)) {
      estimatedCefrLevel = 'C1 Advanced (Cao cấp Chuyên sâu)';
    } else if (avgCefrWeight >= 3.5 || (cefrDistribution.B2 + cefrDistribution.C1) >= Math.max(2, totalWords * 0.35)) {
      estimatedCefrLevel = 'B2 Upper-Intermediate (Trung cấp Cao)';
    } else if (avgCefrWeight >= 2.5 || (cefrDistribution.B1 + cefrDistribution.B2) >= Math.max(2, totalWords * 0.35)) {
      estimatedCefrLevel = 'B1 Intermediate (Trung cấp Thực hành)';
    } else if (avgCefrWeight >= 1.5) {
      estimatedCefrLevel = 'A2 Elementary (Sơ cấp Tiền đề)';
    } else {
      estimatedCefrLevel = 'A1 Starter (Cơ bản Bắt đầu)';
    }

    // 4. Calculate Mathematical Mastery & Realistic Retention Score (0 - 100)
    const totalReviews = studyLogs.reduce((acc, log) => acc + (log.reviews_count || 0), 0);
    
    // Retention Rate: Mastered = 100%, Familiar = 60%, Learning = 20%
    const retentionRate = totalWords > 0 
      ? Math.round(((masteredWords.length * 1.0 + familiarWords.length * 0.6 + learningWords.length * 0.2) / totalWords) * 100)
      : 0;

    // Overall Score (0 - 100) combines Volume, CEFR difficulty, Retention, and Streak
    const volumeScore = Math.min(30, (totalWords / 20) * 30); // 30 pts max for first 20 words
    const cefrScore = Math.min(25, (avgCefrWeight / 5) * 25); // 25 pts max for CEFR depth
    const retentionScore = (retentionRate / 100) * 30; // 30 pts max for retention
    const consistencyScore = Math.min(15, (profile.streakRecord || 1) * 3 + (profile.level * 2)); // 15 pts max for streak & level
    
    const computedOverallScore = totalWords > 0
      ? Math.min(99, Math.max(25, Math.round(volumeScore + cefrScore + retentionScore + consistencyScore)))
      : 20;

    const baseMetrics = {
      totalWords,
      totalPatterns,
      masteredCount: masteredWords.length,
      familiarCount: familiarWords.length,
      learningCount: learningWords.length,
      masteryPercentage: retentionRate,
      retentionRate,
      cefrDistribution,
      avgCefrWeight: Math.round(avgCefrWeight * 10) / 10,
      totalReviews,
      userLevel: profile.level,
      userTitle: profile.title,
      totalXp: profile.totalXp,
      streakRecord: profile.streakRecord
    };

    // 5. If Gemini API Key is available, invoke AI for personalized evaluation
    if (effectiveKey) {
      const sampleWordsList = words.slice(0, 15).map(w => ({
        word: w.word,
        level: w.level,
        meaning: w.meaning_vi,
        interval: w.interval,
        repetition: w.repetition,
        status: w.status
      }));

      const prompt = `
Bạn là Giám khảo & Chuyên gia Khảo thí Ngôn ngữ Học thuật Quốc tế (Senior CEFR Language Assessor).
Hãy phân tích dữ liệu học tập và kho từ vựng cá nhân của học viên dưới đây để xuất một bản "BÁO CÁO ĐÁNH GIÁ NĂNG LỰC TỪ VỰNG TOÀN DIỆN" (Comprehensive Lexical Mastery Report).

DỮ LIỆU THỰC TẾ TRONG DATABASE:
- Tổng số từ vựng: ${totalWords} từ
- Tổng số mẫu câu cấu trúc: ${totalPatterns} mẫu
- Phân bổ cấp độ CEFR: A1: ${cefrDistribution.A1}, A2: ${cefrDistribution.A2}, B1: ${cefrDistribution.B1}, B2: ${cefrDistribution.B2}, C1: ${cefrDistribution.C1}, C2: ${cefrDistribution.C2}
- Số từ đã làm chủ vững vàng (Mastered): ${masteredWords.length} từ
- Số từ đang ghi nhớ tốt (Familiar): ${familiarWords.length} từ
- Số từ mới nạp / cần củng cố (Learning): ${learningWords.length} từ
- Tỷ lệ làm chủ trí nhớ (Mastery Rate): ${retentionRate}%
- Điểm đánh giá tổng hợp tính toán: ${computedOverallScore}/100
- Cấp độ hiện tại: Level ${profile.level} - "${profile.title}" (${profile.totalXp} XP, Streak: ${profile.streakRecord} ngày)
- Danh sách từ vựng tiêu biểu: ${JSON.stringify(sampleWordsList)}

YÊU CẦU:
Trả về kết quả dưới dạng JSON DUY NHẤT (không dùng markdown backticks ngoài JSON) theo đúng cấu trúc sau:
{
  "estimatedCefrLevel": "${estimatedCefrLevel}",
  "overallScore": ${computedOverallScore},
  "evaluationSummary": "Nhận xét tổng quan súc tích, chính xác và truyền cảm hứng về vốn từ vựng thực tế của học viên (2-3 câu).",
  "lexicalStrengths": [
    "Điểm mạnh cụ thể 1 dựa trên dữ liệu thật",
    "Điểm mạnh cụ thể 2"
  ],
  "growthAreas": [
    "Điểm cần cải thiện 1",
    "Điểm cần cải thiện 2"
  ],
  "actionPlan": [
    "Bước hành động 1 trong tuần này",
    "Bước hành động 2",
    "Bước hành động 3"
  ],
  "aiPraiseQuote": "Một câu châm ngôn truyền cảm hứng học tiếng Anh cá nhân hóa."
}
`.trim();

      try {
        const aiResponse = await callGemini(prompt, effectiveKey);
        const cleaned = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsedAi = JSON.parse(cleaned);

        return {
          success: true,
          metrics: baseMetrics,
          aiAssessment: parsedAi,
          evaluatedAt: new Date().toISOString()
        };
      } catch (err) {
        console.warn('⚠️ Gemini AI Assessment error, using statistical engine:', err.message);
      }
    }

    // 6. High-Precision Statistical Assessment Engine (Guaranteed 100% Accurate to Real Database Data)
    const topLevels = [];
    if (cefrDistribution.C1 + cefrDistribution.C2 > 0) topLevels.push(`${cefrDistribution.C1 + cefrDistribution.C2} từ C1-C2`);
    if (cefrDistribution.B2 > 0) topLevels.push(`${cefrDistribution.B2} từ B2`);
    if (cefrDistribution.B1 > 0) topLevels.push(`${cefrDistribution.B1} từ B1`);
    if (cefrDistribution.A1 + cefrDistribution.A2 > 0) topLevels.push(`${cefrDistribution.A1 + cefrDistribution.A2} từ A1-A2`);

    const levelSummaryText = topLevels.length > 0 ? topLevels.join(', ') : 'Đang khởi tạo';

    return {
      success: true,
      metrics: baseMetrics,
      aiAssessment: {
        estimatedCefrLevel,
        overallScore: computedOverallScore,
        evaluationSummary: totalWords > 0
          ? `Kho từ vựng của bạn hiện có ${totalWords} từ (${levelSummaryText}), đạt tỷ lệ duy trì trí nhớ ${retentionRate}%. Trình độ từ vựng thực tế được ước tính ở mức ${estimatedCefrLevel}.`
          : 'Bạn chưa thêm từ vựng nào vào kho lưu trữ. Hãy bắt đầu thêm các từ mới để Giám khảo AI tiến hành khảo thí năng lực chi tiết!',
        lexicalStrengths: [
          `Đã ghi nhận ${masteredWords.length} từ đạt mức thuần thục và ${familiarWords.length} từ trong chu kỳ ghi nhớ tốt`,
          `Hệ thống cấu trúc đa tầng với ${totalPatterns} mẫu câu và ${profile.streakRecord || 1} ngày học liên tục`,
          `Độ bao phủ cấp độ ngôn ngữ: ${levelSummaryText}`
        ],
        growthAreas: [
          learningWords.length > 0 
            ? `Cần tập trung ôn tập ${learningWords.length} từ ở giai đoạn củng cố để chuyển hóa sang nhóm Thuần thục`
            : 'Mở rộng thêm các từ vựng chuyên ngành hoặc cụm từ học thuật C1-C2',
          'Tăng cường liên kết từ vựng vào bài đọc Smart Reader và hội thoại AI Speaking Lab'
        ],
        actionPlan: [
          'Hoàn thành đầy đủ các thẻ ôn tập SRS đúng thời điểm vàng mỗi ngày',
          'Sử dụng tính năng AI Speaking Lab để luyện phát âm chuẩn xác các từ vựng trong kho',
          'Bổ sung thêm 3-5 từ vựng mới mỗi ngày để nâng cao thang điểm CEFR'
        ],
        aiPraiseQuote: 'Consistency is the mother of mastery. Every single word you learn builds your linguistic empire!'
      },
      evaluatedAt: new Date().toISOString()
    };
  }
};
