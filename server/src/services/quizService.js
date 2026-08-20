import { getDb } from '../db/database.js';
import { gamificationService } from './gamificationService.js';

// Helper to resolve single or multiple topics
export function resolveTopics(db, topicInput) {
  let list = [];
  if (Array.isArray(topicInput)) {
    list = topicInput;
  } else if (typeof topicInput === 'string') {
    list = topicInput.split(',').map(s => s.trim()).filter(Boolean);
  }

  const isAll = list.length === 0 || list.some(t => t.toLowerCase() === 'all');
  if (isAll) {
    return { isAll: true, targetIds: [], displayNames: ['Tất cả (All)'] };
  }

  let masterTopics = [];
  try {
    masterTopics = db.prepare('SELECT * FROM topics').all();
  } catch (e) {
    masterTopics = [];
  }

  const targetIds = [];
  const displayNames = [];

  list.forEach(item => {
    const matched = masterTopics.find(mt => 
      mt.id.toLowerCase() === item.toLowerCase() || 
      mt.name.toLowerCase() === item.toLowerCase()
    );
    if (matched) {
      if (!targetIds.includes(matched.id.toLowerCase())) {
        targetIds.push(matched.id.toLowerCase());
        displayNames.push(`${matched.emoji || '🏷️'} ${matched.name}`);
      }
    } else {
      if (!targetIds.includes(item.toLowerCase())) {
        targetIds.push(item.toLowerCase());
        displayNames.push(item);
      }
    }
  });

  return {
    isAll: false,
    targetIds,
    displayNames
  };
}

const HIGH_QUALITY_DISTRACTORS = [
  { word: 'resilient', meaning_vi: 'Kiên cường, có khả năng phục hồi nhanh' },
  { word: 'articulate', meaning_vi: 'Ăn nói lưu loát, diễn đạt mạch lạc rõ ràng' },
  { word: 'meticulous', meaning_vi: 'Tỉ mỉ, cẩn thận từng chi tiết nhỏ' },
  { word: 'leverage', meaning_vi: 'Tận dụng, phát huy tối đa lợi thế / thế mạnh' },
  { word: 'innovative', meaning_vi: 'Đổi mới, có tính sáng tạo và đột phá' },
  { word: 'adaptable', meaning_vi: 'Thích ứng linh hoạt với mọi hoàn cảnh' },
  { word: 'proactive', meaning_vi: 'Chủ động tiên phong trong công việc' },
  { word: 'ubiquitous', meaning_vi: 'Phổ biến, có mặt ở khắp mọi nơi' },
  { word: 'sustainable', meaning_vi: 'Bền vững, có khả năng duy trì lâu dài' },
  { word: 'comprehensive', meaning_vi: 'Toàn diện, bao quát mọi khía cạnh' },
  { word: 'pragmatic', meaning_vi: 'Thực tế, coi trọng tính hiệu quả ứng dụng' },
  { word: 'collaborative', meaning_vi: 'Có tinh thần hợp tác, làm việc nhóm' }
];

const CORE_VOCABULARY_DICTIONARY = {
  love: 'Tình cảm yêu thương, sự yêu mến gắn bó sâu sắc',
  pain: 'Nỗi đau đớn, sự tổn thương về thể xác hoặc tinh thần',
  hope: 'Niềm hy vọng, sự trông đợi vào điều tốt đẹp',
  life: 'Cuộc sống, sự sinh tồn và trải nghiệm nhân sinh',
  work: 'Công việc, nhiệm vụ hoặc hoạt động lao động',
  time: 'Thời gian, khoảnh khắc diễn ra sự việc',
  dream: 'Ước mơ, hoài bão hoặc giấc chiêm bao',
  peace: 'Sự bình yên, hòa bình và thanh thản trong tâm hồn',
  focus: 'Sự tập trung, chú ý cao độ vào mục tiêu',
  habit: 'Thói quen, hành vi lặp đi lặp lại thường nhật',
  truth: 'Sự thật, chân lý khách quan',
  courage: 'Lòng dũng cảm, sự can đảm đối mặt thử thách',
  freedom: 'Sự tự do, quyền tự quyết không bị ràng buộc',
  wisdom: 'Sự thông thái, trí tuệ và hiểu biết sâu rộng'
};

const cleanMeaningText = (meaningVi, meaningEn, word) => {
  const wKey = (word || '').toLowerCase().trim();
  if (CORE_VOCABULARY_DICTIONARY[wKey]) {
    return CORE_VOCABULARY_DICTIONARY[wKey];
  }
  if (!meaningVi || typeof meaningVi !== 'string' || meaningVi.includes('Tra cứu thêm')) {
    if (meaningEn && typeof meaningEn === 'string' && !meaningEn.includes('Definition and') && !meaningEn.includes('Definition of')) {
      return meaningEn.trim();
    }
    const found = HIGH_QUALITY_DISTRACTORS.find(d => d.word.toLowerCase() === wKey);
    if (found) return found.meaning_vi;
    return 'Khái niệm, trạng thái hoặc hành động này';
  }
  return meaningVi.trim();
};

export const quizService = {
  // 1. Get all available topics / tags with counts from master data topics table for specific user
  getTopics: (userId = 'admin_master_user_id') => {
    const db = getDb();
    const allWords = db.prepare(`
      SELECT id, word, topic_id, tags, level FROM words 
      WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
    `).all(userId, userId, userId);
    const totalWords = allWords.length;

    let masterTopics = [];
    try {
      masterTopics = db.prepare('SELECT * FROM topics ORDER BY created_at ASC').all();
    } catch (e) {
      masterTopics = [];
    }

    const topicItems = [
      {
        id: 'All',
        name: 'Tất cả (All)',
        emoji: '📚',
        color: '#6366f1',
        count: totalWords
      }
    ];

    masterTopics.forEach(t => {
      const matchedWords = allWords.filter(w => {
        return w.topic_id && (w.topic_id.toLowerCase() === t.id.toLowerCase() || w.topic_id.toLowerCase() === t.name.toLowerCase());
      });

      topicItems.push({
        id: t.id,
        name: t.name,
        emoji: t.emoji || '📁',
        color: t.color || '#0284c7',
        description: t.description || '',
        count: matchedWords.length
      });
    });

    return topicItems;
  },

  // 2. Generate a Quiz based on Single/Multiple Topics, Question Count and IELTS Level for specific user
  generateQuiz: ({ topic = 'All', count = 5, mode = 'mixed', level = 'all', userId = 'admin_master_user_id' }) => {
    const db = getDb();
    let words = db.prepare(`
      SELECT * FROM words 
      WHERE (user_id = ? OR user_id IS NULL OR user_id = 'admin_master_user_id')
    `).all(userId);

    if (words.length === 0) {
      throw new Error('Kho từ vựng đang trống. Vui lòng thêm từ vựng trước khi tạo bài Quiz!');
    }

    const targetCount = Math.max(1, parseInt(count, 10) || 5);

    // 1. Filter by Single or Multiple Topics
    let candidateWords = words;
    let topicDisplay = 'Tất cả (All)';

    const resolved = resolveTopics(db, topic);
    if (!resolved.isAll) {
      topicDisplay = resolved.displayNames.join(' + ');
      candidateWords = words.filter(w => {
        const wTopicId = (w.topic_id || '').toLowerCase();
        return resolved.targetIds.includes(wTopicId);
      });

      if (candidateWords.length === 0) {
        throw new Error(`Các chủ đề đã chọn (${topicDisplay}) chưa có từ vựng nào trong kho từ. Vui lòng thêm từ hoặc chọn chủ đề khác!`);
      }
    }

    // 2. Filter by Granular IELTS Level Tier if specified
    if (level && level !== 'all') {
      const tierMap = {
        'ielts_4_5': ['A1', 'A2', 'B1'],
        'ielts_55_60': ['B1', 'B2'],
        'ielts_65_70': ['B2'],
        'ielts_75_80': ['B2', 'C1'],
        'ielts_85_90': ['C1', 'C2']
      };
      const allowedLevels = tierMap[level] || [];
      const levelFiltered = candidateWords.filter(w => allowedLevels.includes((w.level || '').toUpperCase()));
      if (levelFiltered.length > 0) {
        candidateWords = levelFiltered;
      }
    }

    // 3. Quy tắc chọn từ mục tiêu:
    // - Nếu số từ candidate >= targetCount -> Chọn ngẫu nhiên KHÔNG LẶP LẠI
    // - Nếu số từ candidate < targetCount -> Lặp đi lặp lại các từ đó để tạo đủ số câu hỏi
    let selectedWords = [];
    const shuffledCandidates = [...candidateWords].sort(() => 0.5 - Math.random());

    if (shuffledCandidates.length >= targetCount) {
      selectedWords = shuffledCandidates.slice(0, targetCount);
    } else {
      for (let i = 0; i < targetCount; i++) {
        selectedWords.push(shuffledCandidates[i % shuffledCandidates.length]);
      }
    }

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

      const validTargetMeaning = cleanMeaningText(targetWord.meaning_vi, targetWord.meaning_en, targetWord.word);

      // Distractor pool: Filter out current word and extract valid meanings
      const otherValidWords = words.filter(w => 
        w.id !== targetWord.id && 
        w.word.toLowerCase() !== targetWord.word.toLowerCase() &&
        w.meaning_vi && !w.meaning_vi.includes('Tra cứu thêm')
      );
      const shuffledOthers = [...otherValidWords].sort(() => 0.5 - Math.random());
      let distractors = shuffledOthers.slice(0, 3);

      if (distractors.length < 3) {
        const fallbacks = HIGH_QUALITY_DISTRACTORS.filter(f => 
          f.word.toLowerCase() !== targetWord.word.toLowerCase()
        );
        distractors = [...distractors, ...fallbacks].slice(0, 3);
      }

      let questionText = '';
      let promptSubtitle = '';
      let correctAnswer = '';
      let options = [];

      if (qType === 'meaning_vi' || qType === 'listening') {
        questionText = targetWord.word;
        promptSubtitle = qType === 'listening' 
          ? 'Nghe phát âm và chọn nghĩa tiếng Việt chính xác:' 
          : 'Chọn nghĩa tiếng Việt chính xác của từ vựng:';
        correctAnswer = validTargetMeaning;

        const rawOptions = [
          validTargetMeaning,
          ...distractors.map(d => cleanMeaningText(d.meaning_vi, d.meaning_en, d.word))
        ];
        options = [...new Set(rawOptions)].sort(() => 0.5 - Math.random());
      } else if (qType === 'reverse_en') {
        // Sanitize definition so it never mentions the English word
        let cleanDef = validTargetMeaning;
        if (targetWord.word && cleanDef) {
          const regex = new RegExp(`\\b${targetWord.word}\\b`, 'gi');
          cleanDef = cleanDef.replace(regex, '_______');
        }
        questionText = cleanDef;
        promptSubtitle = 'Chọn từ vựng tiếng Anh tương ứng với nghĩa trên:';
        correctAnswer = targetWord.word;

        const rawOptions = [
          targetWord.word,
          ...distractors.map(d => d.word)
        ];
        options = [...new Set(rawOptions)].sort(() => 0.5 - Math.random());
      } else if (qType === 'cloze_blank') {
        // Find clean sentence with word
        let cleanSentence = '';
        if (examples.length > 0) {
          for (const ex of examples) {
            const str = typeof ex === 'string' ? ex : (ex?.en || ex?.sentence || '');
            if (str && new RegExp(`\\b${targetWord.word}\\b`, 'i').test(str)) {
              // Strip attached Vietnamese translation in parens if any
              const englishOnly = str.replace(/\s*\([^)]*\)\s*$/, '').trim();
              cleanSentence = englishOnly.replace(new RegExp(`\\b${targetWord.word}\\b`, 'gi'), '_______');
              break;
            }
          }
        }

        if (!cleanSentence) {
          const templates = [
            `The company is seeking a team member who is _______ in their work.`,
            `It is crucial to understand how to _______ available resources effectively.`,
            `Her _______ approach to problem-solving received great admiration from everyone.`,
            `Leaders must maintain a _______ attitude when overcoming market challenges.`,
            `He made a conscious effort to be _______ during the entire presentation.`
          ];
          cleanSentence = templates[index % templates.length];
        }

        let cleanSubtitleDef = validTargetMeaning;
        if (targetWord.word && cleanSubtitleDef) {
          const regex = new RegExp(`\\b${targetWord.word}\\b`, 'gi');
          cleanSubtitleDef = cleanSubtitleDef.replace(regex, '...');
        }

        questionText = cleanSentence;
        promptSubtitle = `Điền từ vựng thích hợp vào chỗ trống (${cleanSubtitleDef}):`;
        correctAnswer = targetWord.word;

        const rawOptions = [
          targetWord.word,
          ...distractors.map(d => d.word)
        ];
        options = [...new Set(rawOptions)].sort(() => 0.5 - Math.random());
      }

      // Ensure 4 distinct options always exist
      const extraPool = [...HIGH_QUALITY_DISTRACTORS, ...words];
      while (options.length < 4) {
        const extra = extraPool.find(e => 
          !options.includes(e.word) && 
          !options.includes(e.meaning_vi)
        );
        if (extra) {
          options.push(qType === 'reverse_en' || qType === 'cloze_blank' ? extra.word : extra.meaning_vi);
        } else {
          options.push(`Lựa chọn bổ sung ${options.length + 1}`);
        }
      }

      return {
        id: `${targetWord.id}_q${index + 1}`,
        type: qType,
        word: targetWord.word,
        phonetic: targetWord.phonetic,
        level: targetWord.level || 'B2',
        meaning_vi: validTargetMeaning,
        meaning_en: targetWord.meaning_en,
        questionText,
        promptSubtitle,
        correctAnswer,
        options,
        audio_url: targetWord.audio_url,
        examples
      };
    });

    return {
      topic: topicDisplay,
      mode,
      totalQuestions: questions.length,
      questions
    };
  },

  // 3. Submit and Grade Quiz
  submitQuiz: ({ answers = [], userId = 'admin_master_user_id' }) => {
    const db = getDb();
    if (!Array.isArray(answers) || answers.length === 0) {
      return {
        totalQuestions: 0,
        correctCount: 0,
        score: 0,
        xpEarned: 0,
        isPerfect: false,
        results: [],
        gamification: null
      };
    }

    let correctCount = 0;
    const results = [];
    const wrongWordIds = [];

    for (const item of answers) {
      const isCorrect = String(item.userAnswer || '').trim().toLowerCase() === String(item.correctAnswer || '').trim().toLowerCase();
      if (isCorrect) {
        correctCount++;
      } else if (item.wordId) {
        wrongWordIds.push(item.wordId);
      }

      results.push({
        id: item.id || item.wordId,
        questionText: item.questionText,
        userAnswer: item.userAnswer,
        correctAnswer: item.correctAnswer,
        isCorrect,
        explanation: item.explanation,
        translation: item.translation
      });
    }

    const total = answers.length;
    const score = Math.round((correctCount / total) * 100);
    // Base 5 XP per correct answer + 10 XP bonus for perfect score
    const xpEarned = (correctCount * 5) + (score === 100 ? 10 : 0);

    // If there are wrong words, update their SRS state in DB (demote slightly for review)
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
      xpResult = gamificationService.addXp(userId, xpEarned, `Quiz: Đúng ${correctCount}/${total} câu`);
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
  },

  // 4. Generate Sentence Pattern Quiz
  generatePatternQuiz: ({ category = 'all', tone = 'all', count = 5, mode = 'mixed', level = 'all', userId = 'admin_master_user_id' }) => {
    const db = getDb();
    let patterns = db.prepare(`
      SELECT * FROM patterns 
      WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
    `).all(userId, userId, userId);

    if (patterns.length === 0) {
      throw new Error('Kho mẫu câu & cấu trúc đang trống. Vui lòng thêm mẫu câu trước khi tạo Quiz!');
    }

    const targetCount = Math.max(1, parseInt(count, 10) || 5);

    const filterTarget = (category && category !== 'all') ? category : tone;
    let candidatePatterns = patterns;
    if (filterTarget && filterTarget !== 'all') {
      const filtered = patterns.filter(p => 
        (p.category || '').toLowerCase() === filterTarget.toLowerCase() ||
        (p.tone || '').toLowerCase().includes(filterTarget.toLowerCase())
      );
      if (filtered.length > 0) candidatePatterns = filtered;
    }

    let selectedPatterns = [];
    const shuffled = [...candidatePatterns].sort(() => 0.5 - Math.random());
    if (shuffled.length >= targetCount) {
      selectedPatterns = shuffled.slice(0, targetCount);
    } else {
      for (let i = 0; i < targetCount; i++) {
        selectedPatterns.push(shuffled[i % shuffled.length]);
      }
    }

    const questions = selectedPatterns.map((pat, idx) => {
      let examples = [];
      try {
        examples = JSON.parse(pat.examples || '[]');
      } catch (e) { examples = []; }

      let cleanEx = examples[0] || `It is essential to understand how to apply ${pat.name} in writing.`;
      const keyPhrase = pat.name.split('(')[0].split('+')[0].trim();

      const pTypes = ['fill_clause', 'meaning_usage', 'formula_check'];
      const qType = pTypes[idx % pTypes.length];

      const otherPatterns = patterns.filter(p => p.id !== pat.id);
      const shuffledOthers = [...otherPatterns].sort(() => 0.5 - Math.random());

      let questionText = '';
      let promptSubtitle = '';
      let correctAnswer = '';
      let options = [];
      let explanation = pat.explanation || `Cấu trúc: ${pat.formula} - Nghĩa: ${pat.meaning_vi}`;

      if (qType === 'fill_clause' && cleanEx) {
        let clozeSentence = cleanEx;
        if (new RegExp(keyPhrase, 'i').test(cleanEx)) {
          clozeSentence = cleanEx.replace(new RegExp(keyPhrase, 'gi'), '_______');
        } else {
          clozeSentence = `_______, ${cleanEx.replace(/^[^,]+,\s*/, '')}`;
        }
        questionText = clozeSentence;
        promptSubtitle = `Điền mẫu câu / cấu trúc thích hợp vào ngữ cảnh (${pat.meaning_vi}):`;
        correctAnswer = keyPhrase;

        const rawOptions = [
          keyPhrase,
          ...shuffledOthers.slice(0, 3).map(p => p.name.split('(')[0].split('+')[0].trim())
        ];
        options = [...new Set(rawOptions)].sort(() => 0.5 - Math.random());
      } else if (qType === 'meaning_usage') {
        questionText = `Mẫu câu / cấu trúc nào sau đây dùng để diễn tả: "${pat.meaning_vi}"?`;
        promptSubtitle = `Chọn cấu trúc ngữ pháp có nghĩa và sắc thái phù hợp:`;
        correctAnswer = pat.name;

        const rawOptions = [
          pat.name,
          ...shuffledOthers.slice(0, 3).map(p => p.name)
        ];
        options = [...new Set(rawOptions)].sort(() => 0.5 - Math.random());
      } else {
        questionText = `Công thức ngữ pháp chuẩn xác của mẫu câu "${pat.name}" là gì?`;
        promptSubtitle = `Chọn công thức cấu trúc câu chính xác:`;
        correctAnswer = pat.formula;

        const rawOptions = [
          pat.formula,
          ...shuffledOthers.slice(0, 3).map(p => p.formula)
        ];
        options = [...new Set(rawOptions)].sort(() => 0.5 - Math.random());
      }

      while (options.length < 4) {
        const fallbacks = [
          'Regardless of + Noun / V-ing',
          'Not only... but also (Inversion)',
          'It is high time + S + V2/ed',
          'Had it not been for + Noun'
        ];
        for (const fb of fallbacks) {
          if (!options.includes(fb)) {
            options.push(fb);
            if (options.length === 4) break;
          }
        }
      }

      return {
        id: `pq-${idx + 1}`,
        type: qType,
        isPattern: true,
        word: pat.name,
        formula: pat.formula,
        tone: pat.tone,
        questionText,
        promptSubtitle,
        options,
        correctAnswer,
        explanation
      };
    });

    return {
      topic: '🧩 Mẫu Câu & Cấu Trúc Ngữ Pháp',
      isPatternQuiz: true,
      totalQuestions: questions.length,
      questions
    };
  }
};
