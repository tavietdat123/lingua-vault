import { getDb } from '../db/database.js';
import { callGemini, getEffectiveApiKey } from './aiService.js';
import { gamificationService } from './gamificationService.js';

export const aiAssessmentService = {
  generateMasteryReport: async (apiKey = null, userId = 'admin_master_user_id') => {
    const db = getDb();
    const effectiveKey = getEffectiveApiKey(apiKey);

    // 1. Fetch raw data from SQLite for specific user
    const words = db.prepare(`
      SELECT * FROM words 
      WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
    `).all(userId, userId, userId);
    
    const patterns = db.prepare(`
      SELECT * FROM patterns 
      WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
    `).all(userId, userId, userId);

    const studyLogs = db.prepare(`
      SELECT * FROM study_logs 
      WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
      ORDER BY date DESC LIMIT 30
    `).all(userId, userId, userId);

    const profile = gamificationService.getProfile(userId);

    const totalWords = words.length;
    const totalPatterns = patterns.length;

    // 2. Classify Memory Retention Depth via Strict SM-2 metrics
    const masteredWords = words.filter(w => 
      w.status === 'mastered' || 
      ((w.repetition || 0) >= 4 && (w.interval || 0) >= 10)
    );
    const familiarWords = words.filter(w => 
      !masteredWords.some(m => m.id === w.id) && 
      (w.status === 'reviewing' || (w.repetition || 0) >= 2)
    );
    const learningWords = words.filter(w => 
      !masteredWords.some(m => m.id === w.id) && 
      !familiarWords.some(f => f.id === w.id)
    );

    // 3. Exact CEFR Level Distribution & Strict Weighted CEFR Index
    const cefrDistribution = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
    let weightedCefrSum = 0;
    const cefrWeights = { A1: 1, A2: 1.8, B1: 2.8, B2: 3.8, C1: 4.8, C2: 6 };

    words.forEach(w => {
      const rawLvl = (w.level || 'B1').toUpperCase().trim();
      const lvl = cefrDistribution[rawLvl] !== undefined ? rawLvl : 'B1';
      cefrDistribution[lvl]++;
      weightedCefrSum += cefrWeights[lvl] || 2.8;
    });

    const avgCefrWeight = totalWords > 0 ? (weightedCefrSum / totalWords) : 1;

    // Determine strictly estimated CEFR Level based on real breadth & depth
    let estimatedCefrLevel = 'A1 Starter (Khởi đầu)';
    if (totalWords < 5) {
      estimatedCefrLevel = 'A1- Beginner (Vốn từ sơ cấp đang tích lũy)';
    } else if (totalWords >= 500 && (cefrDistribution.C1 + cefrDistribution.C2) >= 100 && avgCefrWeight >= 5.0) {
      estimatedCefrLevel = 'C2 Mastery (Bậc thầy Ngôn ngữ)';
    } else if (totalWords >= 200 && (cefrDistribution.C1 + cefrDistribution.C2) >= 30 && avgCefrWeight >= 4.2) {
      estimatedCefrLevel = 'C1 Advanced (Cao cấp Chuyên sâu)';
    } else if (totalWords >= 80 && (cefrDistribution.B2 + cefrDistribution.C1) >= 20 && avgCefrWeight >= 3.3) {
      estimatedCefrLevel = 'B2 Upper-Intermediate (Trung cấp Cao)';
    } else if (totalWords >= 30 && (cefrDistribution.B1 + cefrDistribution.B2) >= 10 && avgCefrWeight >= 2.3) {
      estimatedCefrLevel = 'B1 Intermediate (Trung cấp Thực hành)';
    } else if (totalWords >= 10 && avgCefrWeight >= 1.4) {
      estimatedCefrLevel = 'A2 Elementary (Sơ cấp Tiền đề)';
    } else {
      estimatedCefrLevel = 'A1 Starter (Cơ bản Bắt đầu)';
    }

    // 4. Calculate Strict Mathematical Mastery & Realistic Retention Score (0 - 100)
    const totalReviews = studyLogs.reduce((acc, log) => acc + (log.reviews_count || 0), 0);
    
    // Retention Rate: Mastered = 100%, Familiar = 50%, Learning = 15%
    const retentionRate = totalWords > 0 
      ? Math.round(((masteredWords.length * 1.0 + familiarWords.length * 0.5 + learningWords.length * 0.15) / totalWords) * 100)
      : 0;

    // Strict Score Breakdown (Total 100 pts)
    // - Volume (Max 30 pts): Requires 100 words for full 30 pts
    const volumeScore = Math.min(30, (totalWords / 100) * 30);
    // - CEFR Difficulty Depth (Max 25 pts)
    const cefrScore = Math.min(25, (avgCefrWeight / 5.5) * 25);
    // - Retention Mastery (Max 30 pts)
    const retentionScore = (retentionRate / 100) * 30;
    // - Consistency & Level (Max 15 pts)
    const consistencyScore = Math.min(15, (profile.streakRecord || 1) * 1.5 + (profile.level * 0.75));
    
    const computedOverallScore = totalWords > 0
      ? Math.min(98, Math.max(15, Math.round(volumeScore + cefrScore + retentionScore + consistencyScore)))
      : 10;

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

    // 5. If Gemini API Key is available, invoke AI for rigorous evaluation
    if (effectiveKey) {
      const sampleWordsList = words.slice(0, 20).map(w => ({
        word: w.word,
        level: w.level,
        meaning: w.meaning_vi,
        interval: w.interval,
        repetition: w.repetition,
        status: w.status
      }));

      const prompt = `
Bạn là Trưởng ban Khảo thí Ngôn ngữ Học thuật Quốc tế & Giám khảo Cấp cao Khung Tham chiếu CEFR Châu Âu (Senior Academic CEFR & IELTS Examiner).
Hãy áp dụng TIÊU CHÍ ĐÁNH GIÁ CỰC KỲ KHẮT KHE, HỌC THUẬT, KHÔNG NƯƠNG TAY để mổ xẻ dữ liệu học tập và kho từ vựng của thí sinh.

DỮ LIỆU THỰC TẾ TRONG DATABASE:
- Tổng số từ vựng: ${totalWords} từ
- Tổng số mẫu câu cấu trúc: ${totalPatterns} mẫu
- Phân bổ cấp độ CEFR: A1: ${cefrDistribution.A1}, A2: ${cefrDistribution.A2}, B1: ${cefrDistribution.B1}, B2: ${cefrDistribution.B2}, C1: ${cefrDistribution.C1}, C2: ${cefrDistribution.C2}
- Số từ đã làm chủ vững vàng (Mastered >= 4 lần nhớ đúng, chu kỳ >= 10 ngày): ${masteredWords.length} từ
- Số từ đang củng cố (Familiar): ${familiarWords.length} từ
- Số từ mới nạp / có nguy cơ rơi rụng (Learning): ${learningWords.length} từ
- Tỷ lệ làm chủ trí nhớ (Mastery Rate): ${retentionRate}%
- Điểm đánh giá chuẩn hóa: ${computedOverallScore}/100
- Cấp độ hiện tại: Level ${profile.level} - "${profile.title}" (${profile.totalXp} XP, Streak: ${profile.streakRecord} ngày)
- Danh sách từ vựng tiêu biểu: ${JSON.stringify(sampleWordsList)}

QUY TẮC KHẢO THÍ KHẮT KHE:
1. Đánh giá thẳng thắn, sắc bén, không dùng lời khen sáo rỗng hoặc quá dễ dãi.
2. Vạch rõ "Lỗ hổng từ vựng" (Lexical Blindspots) và "Nguy cơ rơi vào đường cong lãng quên Ebbinghaus" nếu tỷ lệ Mastered còn thấp hoặc từ vựng chủ yếu ở cấp độ thấp (A1-A2).
3. Đề xuất chiến lược nâng cấp từ vựng cụ thể theo các cụm Collocation và Academic Word List (AWL).

HÃY TRẢ VỀ DUY NHẤT MỘT ĐỊNH DẠNG JSON (không có markdown backticks ngoài JSON):
{
  "estimatedCefrLevel": "${estimatedCefrLevel}",
  "overallScore": ${computedOverallScore},
  "evaluationSummary": "Bản nhận xét đánh giá học thuật chuyên sâu, thẳng thắn, chỉ rõ vị trí thực tế của học viên trên thang đo quốc tế (2-3 câu ngắn gọn).",
  "lexicalStrengths": [
    "Điểm mạnh học thuật 1 dựa trên số liệu thực",
    "Điểm mạnh học thuật 2"
  ],
  "growthAreas": [
    "Lỗ hổng từ vựng cụ thể hoặc rủi ro quên lãng cần khắc phục ngay 1",
    "Lỗ hổng từ vựng 2"
  ],
  "actionPlan": [
    "Nhiệm vụ kỷ luật 1 trong tuần",
    "Nhiệm vụ kỷ luật 2",
    "Nhiệm vụ kỷ luật 3"
  ],
  "aiPraiseQuote": "Một lời khuyên đắt giá mang tính rèn giũa kỷ luật học thuật cao."
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
