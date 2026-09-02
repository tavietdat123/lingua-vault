import { getDb } from '../db/database.js';
import { resolveTopics, filterItemsByDate } from './quizService.js';

export function getEffectiveApiKey(apiKey = null) {
  if (apiKey && typeof apiKey === 'string' && apiKey.trim()) return apiKey.trim();
  try {
    const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get('gemini_api_key');
    if (row && row.value && row.value.trim()) return row.value.trim();
  } catch (e) {}
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    return process.env.GEMINI_API_KEY.trim();
  }
  return null;
}

export function getSelectedModel() {
  try {
    const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get('gemini_model');
    if (row && row.value && row.value.trim() && !row.value.includes('2.0') && !row.value.includes('1.5') && !row.value.includes('2.5') && row.value !== 'gemini-3.6-flash') {
      return row.value;
    }
  } catch (e) {}
  return 'gemini-flash-lite-latest';
}

export function safeParseJson(rawText) {
  if (!rawText || typeof rawText !== 'string') return {};
  let cleaned = rawText.trim();
  
  // Extract content inside ```json ... ``` block if present anywhere in the text
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    cleaned = codeBlockMatch[1].trim();
  }

  // 1. Direct standard parse
  try {
    return JSON.parse(cleaned);
  } catch (e) {}

  // 2. Extract from first { to last }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = cleaned.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch (eBrace) {}
  }

  // 3. Sanitize control characters
  try {
    const target = firstBrace !== -1 && lastBrace > firstBrace ? cleaned.substring(firstBrace, lastBrace + 1) : cleaned;
    const sanitizedControl = target.replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) => {
      if (c === '\n') return '\\n';
      if (c === '\r') return '\\r';
      if (c === '\t') return '\\t';
      return '';
    });
    return JSON.parse(sanitizedControl);
  } catch (eControl) {}

  // 4. Auto-repair cut-off / truncated JSON
  if (firstBrace !== -1) {
    let sub = cleaned.substring(firstBrace);
    let inString = false;
    for (let i = 0; i < sub.length; i++) {
      if (sub[i] === '"' && (i === 0 || sub[i - 1] !== '\\')) {
        inString = !inString;
      }
    }
    if (inString) sub += '"';

    let openCurly = 0, openSquare = 0;
    let inStr = false;
    for (let i = 0; i < sub.length; i++) {
      if (sub[i] === '"' && (i === 0 || sub[i - 1] !== '\\')) inStr = !inStr;
      if (!inStr) {
        if (sub[i] === '{') openCurly++;
        else if (sub[i] === '}') openCurly--;
        else if (sub[i] === '[') openSquare++;
        else if (sub[i] === ']') openSquare--;
      }
    }
    while (openSquare > 0) { sub += ']'; openSquare--; }
    while (openCurly > 0) { sub += '}'; openCurly--; }

    try {
      const fixed = sub.replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(fixed);
    } catch (errRepaired) {}
  }

  throw new Error(`Không thể phân tích dữ liệu phản hồi từ AI.`);
}

export function normalizeAndRandomizeQuestions(parsed, defaultPrefix = 'ai_q') {
  if (!parsed) return [];
  
  let list = [];
  if (Array.isArray(parsed)) {
    list = parsed;
  } else if (Array.isArray(parsed.questions)) {
    list = parsed.questions;
  } else if (Array.isArray(parsed.quiz)) {
    list = parsed.quiz;
  } else if (Array.isArray(parsed.data)) {
    list = parsed.data;
  } else if (Array.isArray(parsed.items)) {
    list = parsed.items;
  } else if (Array.isArray(parsed.questionList)) {
    list = parsed.questionList;
  } else if (Array.isArray(parsed.questions_list)) {
    list = parsed.questions_list;
  } else if (parsed.quiz && Array.isArray(parsed.quiz.questions)) {
    list = parsed.quiz.questions;
  } else if (parsed.data && Array.isArray(parsed.data.questions)) {
    list = parsed.data.questions;
  } else if (parsed.questions && typeof parsed.questions === 'object') {
    list = Object.values(parsed.questions);
  } else if (parsed.quiz && typeof parsed.quiz === 'object') {
    list = Object.values(parsed.quiz);
  } else if (typeof parsed === 'object') {
    const arrKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]) && parsed[k].length > 0);
    if (arrKey) {
      list = parsed[arrKey];
    }
  }

  if (!list || list.length === 0) return [];

  return list.map((q, idx) => {
    let rawOptions = [];
    if (Array.isArray(q.options)) {
      rawOptions = [...q.options];
    } else if (q.options && typeof q.options === 'object') {
      rawOptions = Object.values(q.options);
    } else if (Array.isArray(q.choices)) {
      rawOptions = [...q.choices];
    } else if (q.choices && typeof q.choices === 'object') {
      rawOptions = Object.values(q.choices);
    } else if (Array.isArray(q.answers)) {
      rawOptions = [...q.answers];
    }

    const correct = String(q.correctAnswer || q.answer || q.correct_answer || q.correct || rawOptions[0] || '').trim();

    // Ensure correct answer is in options
    if (correct && !rawOptions.some(o => String(o).trim().toLowerCase() === correct.toLowerCase())) {
      if (rawOptions.length >= 4) {
        rawOptions[0] = correct;
      } else {
        rawOptions.push(correct);
      }
    }

    let cleanOpts = rawOptions.map(o => String(o).trim()).filter(Boolean);
    if (cleanOpts.length < 2 && correct) {
      cleanOpts = [correct, 'None of the above', 'All of the above', 'Other option'];
    }

    // Fisher-Yates shuffle
    for (let i = cleanOpts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cleanOpts[i], cleanOpts[j]] = [cleanOpts[j], cleanOpts[i]];
    }

    let qDifficulty = q.difficulty || 'medium';
    if (q.level && ['A1', 'A2', 'B1'].includes(String(q.level).toUpperCase())) {
      qDifficulty = 'easy';
    } else if (q.level && ['C1', 'C2'].includes(String(q.level).toUpperCase())) {
      qDifficulty = 'hard';
    }

    return {
      id: q.id || `${defaultPrefix}_${idx + 1}`,
      type: q.type || 'cloze_blank',
      word: q.word || q.targetWord || q.term || 'Vocabulary',
      difficulty: qDifficulty,
      level: q.level || (qDifficulty === 'easy' ? 'B1' : qDifficulty === 'hard' ? 'C1' : 'B2'),
      questionText: q.questionText || q.question || q.prompt || q.text || 'Question text',
      promptSubtitle: q.promptSubtitle || q.subtitle || q.instruction || 'Chọn đáp án chính xác:',
      options: cleanOpts,
      correctAnswer: correct || cleanOpts[0],
      explanation: q.explanation || q.explain || '',
      translation: q.translation || q.vietnamese || ''
    };
  });
}

export async function callGemini(prompt, apiKey = null, audioData = null, customModel = null, isJson = true) {
  const key = getEffectiveApiKey(apiKey);
  if (!key) {
    throw new Error('Chưa cấu hình Gemini API Key. Vui lòng nhập API Key miễn phí trong mục Cài đặt.');
  }

  const primaryModel = customModel && customModel !== 'gemini-3.6-flash' ? customModel : getSelectedModel();
  const modelsToTry = [primaryModel, 'gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-3.5-flash'].filter(
    (m, idx, arr) => arr.indexOf(m) === idx
  );

  const parts = [];
  if (audioData && audioData.data) {
    parts.push({
      inline_data: {
        mime_type: audioData.mimeType || 'audio/webm',
        data: audioData.data
      }
    });
  }
  parts.push({ text: prompt });

  const payload = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.15,
      topK: 16,
      topP: 0.9,
      maxOutputTokens: 2500,
      ...(isJson ? { response_mime_type: 'application/json' } : {})
    }
  };

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(25000)
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return text;
      }

      const errorText = await response.text();
      lastError = new Error(`Lỗi kết nối Gemini API [${model}] (${response.status}): ${errorText}`);
      console.warn(`[Gemini Failover] Model ${model} returned ${response.status}. Trying next available model...`);
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini Failover] Error on model ${model}:`, err.message);
    }
  }

  throw lastError || new Error('Không thể kết nối đến máy chủ Gemini API.');
}

/**
 * 1. Smart Sentence Parser & Vocab Extractor
 */
export async function parseSentenceAI(sentence, apiKey = null) {
  const effectiveKey = getEffectiveApiKey(apiKey);
  if (!effectiveKey) {
    // Smart Offline Rule-based Parser Fallback
    const words = sentence
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3)
      .slice(0, 4);

    return {
      translation: `(Bản dịch mẫu) ${sentence}`,
      extracted_words: words.map(w => ({
        word: w.toLowerCase(),
        meaning_vi: 'Tra cứu thêm để cập nhật nghĩa',
        part_of_speech: 'word',
        context_usage: `Xuất hiện trong: "${sentence}"`
      })),
      patterns: [],
      grammar_notes: 'Hãy thêm Gemini API Key trong Cài đặt để AI bóc tách sâu hơn.'
    };
  }

  const prompt = `
Bạn là một chuyên gia ngôn ngữ học tiếng Anh. Hãy phân tích súc tích, chuẩn xác câu tiếng Anh sau:
"${sentence}"

Hãy trả về JSON chính xác theo định dạng:
{
  "translation": "Bản dịch tiếng Việt tự nhiên, đúng ngữ cảnh",
  "sentence_structure": "Tóm tắt cấu trúc ngữ pháp chính: [S] + [V] + [O/C] + [Mệnh đề phụ nếu có]",
  "patterns": [
    {
      "name": "Tên cấu trúc trọng tâm",
      "formula": "Công thức tổng quát",
      "explanation": "Giải thích ngắn gọn cách dùng"
    }
  ],
  "extracted_words": [
    {
      "word": "từ vựng nổi bật",
      "meaning_vi": "nghĩa tiếng Việt chuẩn",
      "part_of_speech": "noun/verb/adj/adv",
      "context_usage": "cách dùng ngắn gọn trong câu"
    }
  ],
  "grammar_notes": "Tóm tắt 1-2 điểm lưu ý ngữ pháp quan trọng nhất của câu"
}
`;

  try {
    const rawResponse = await callGemini(prompt, effectiveKey, null, null, true);
    return safeParseJson(rawResponse);
  } catch (err) {
    console.error('AI parse error:', err.message);
    throw err;
  }
}

/**
 * 2. Check and Correct User's Custom Sentence
 */
export async function checkSentenceAI({ targetItem, userSentence }, apiKey = null) {
  const effectiveKey = getEffectiveApiKey(apiKey);
  if (!effectiveKey) {
    return {
      is_correct: true,
      score: 85,
      feedback: 'Câu của bạn nghe khá ổn. Hãy thêm Gemini API Key để nhận nhận xét ngữ pháp và cách dùng từ bản xứ chuyên sâu.',
      corrections: [],
      native_alternatives: [
        `Cách diễn đạt tự nhiên hơn: ${userSentence}`
      ]
    };
  }

  const prompt = `
Người học tiếng Anh đang thực hành đặt câu với từ/cấu trúc: "${targetItem}".
Câu do người học tự viết: "${userSentence}"

Hãy đánh giá và sửa bài chi tiết. Trả về DUY NHẤT một chuỗi JSON hợp lệ (không kèm markdown \`\`\`json):
{
  "is_correct": true hoặc false,
  "score": 0-100 (điểm độ chính xác và độ tự nhiên),
  "feedback": "Nhận xét súc tích bằng tiếng Việt về ngữ pháp, sắc thái từ",
  "corrections": [
    {
      "error": "phần sai (nếu có)",
      "correction": "phần sửa",
      "reason": "giải thích lý do"
    }
  ],
  "native_alternatives": [
    "Cách viết 1 chuẩn bản xứ hơn",
    "Cách viết 2 trang trọng / chuyên nghiệp hơn"
  ]
}
`;

  try {
    const rawResponse = await callGemini(prompt, effectiveKey, null, null, true);
    return safeParseJson(rawResponse);
  } catch (err) {
    console.error('AI check sentence error:', err.message);
    throw err;
  }
}

/**
 * 3. Daily Story Weaver (SRS Retention Story)
 */
export async function generateStoryAI(wordsList = [], apiKey = null) {
  if (wordsList.length === 0) {
    return {
      title: 'Hôm nay chưa có từ nào cần ôn tập',
      story_en: 'You have no words due for review right now. Keep up the good work!',
      story_vi: 'Bạn không có từ nào cần ôn lúc này. Tiếp tục phát huy nhé!',
      highlighted_words: []
    };
  }

  const wordsStr = wordsList.map(w => w.word || w).join(', ');
  const effectiveKey = getEffectiveApiKey(apiKey);

  if (!effectiveKey) {
    return {
      title: 'Câu chuyện ôn tập hàng ngày (Bản demo)',
      story_en: `Today, let's review these important words: ${wordsStr}. Using them regularly in real conversations will help you master them quickly.`,
      story_vi: `Hôm nay, hãy cùng ôn lại các từ: ${wordsStr}. Sử dụng chúng thường xuyên sẽ giúp bạn nhớ lâu. (Thêm Gemini API Key trong Cài đặt để AI tự động sáng tác truyện cực hay).`,
      highlighted_words: wordsList.map(w => w.word || w)
    };
  }

  const prompt = `
Hãy viết một đoạn văn / câu chuyện ngắn (khoảng 80-120 từ) cực kỳ tự nhiên, hấp dẫn bằng tiếng Anh lồng ghép khéo léo các từ vựng sau:
[${wordsStr}]

Hãy bọc các từ vựng này trong thẻ <b>từ_vựng</b> trong đoạn văn tiếng Anh.
Trả về JSON với cấu trúc:
{
  "title": "Tiêu đề ngắn gọn của câu chuyện (tiếng Việt)",
  "story_en": "Nội dung câu chuyện bằng tiếng Anh có chứa các từ được bọc trong <b>...</b>",
  "story_vi": "Bản dịch tiếng Việt mượt mà của câu chuyện",
  "highlighted_words": ["danh sách các từ đã dùng"]
}
`;

  try {
    const rawResponse = await callGemini(prompt, effectiveKey, null, null, true);
    return safeParseJson(rawResponse);
  } catch (err) {
    console.error('AI story generation error:', err.message);
    throw err;
  }
}

/**
 * 4. AI Paraphraser & Tone Polisher
 */
export async function paraphraseSentenceAI({ sentence, tone = 'business' }, apiKey = null) {
  const toneDescriptions = {
    business: 'Trang trọng, chuyên nghiệp, chuẩn mực đàm phán và email công việc (Business Corporate)',
    academic: 'Học thuật, từ vựng C1-C2, mệnh đề phức và liên từ cao cấp (Academic / IELTS 8.0+)',
    casual: 'Tự nhiên, đời thường, lưu loát như người bản xứ Mỹ/Anh (Natural Native Daily)',
    concise: 'Ngắn gọn, súc tích, lược bỏ từ thừa, đi thẳng vào trọng tâm (Concise & Direct)'
  };

  const selectedToneDesc = toneDescriptions[tone] || toneDescriptions.business;
  const effectiveKey = getEffectiveApiKey(apiKey);

  if (!effectiveKey) {
    return {
      original: sentence,
      tone,
      paraphrases: [
        {
          version: `(Demo Business) Regarding your request: ${sentence}`,
          explanation_vi: 'Cách diễn đạt trang trọng trong email công sở (Cần API Key để tạo bản AI chi tiết)',
          key_phrases: [{ phrase: 'Regarding your request', meaning_vi: 'Liên quan đến yêu cầu của bạn' }]
        },
        {
          version: `(Demo Native) Here is the thing: ${sentence}`,
          explanation_vi: 'Cách nói tự nhiên đời thường của người bản xứ',
          key_phrases: [{ phrase: 'Here is the thing', meaning_vi: 'Vấn đề là / Điểm mấu chốt là' }]
        }
      ]
    };
  }

  const prompt = `
Bạn là chuyên gia ngôn ngữ học tiếng Anh hàng đầu. Hãy viết lại (paraphrase) câu sau theo văn phong: "${selectedToneDesc}".
Câu gốc: "${sentence}"

Hãy cung cấp 3 phiên bản viết lại xuất sắc nhất từ tự nhiên đến nâng cao.
Trả về JSON với cấu trúc:
{
  "original": "${sentence}",
  "tone": "${tone}",
  "paraphrases": [
    {
      "version": "Câu viết lại phiên bản 1",
      "explanation_vi": "Giải thích ngắn gọn tại sao phiên bản này hay và sắc thái của nó",
      "key_phrases": [
        {
          "phrase": "cụm từ hay được nâng cấp trong câu",
          "meaning_vi": "nghĩa tiếng Việt chính xác"
        }
      ]
    },
    {
      "version": "Câu viết lại phiên bản 2",
      "explanation_vi": "Giải thích ngắn gọn",
      "key_phrases": [
        {
          "phrase": "cụm từ hay",
          "meaning_vi": "nghĩa tiếng Việt"
        }
      ]
    },
    {
      "version": "Câu viết lại phiên bản 3",
      "explanation_vi": "Giải thích ngắn gọn",
      "key_phrases": [
        {
          "phrase": "cụm từ hay",
          "meaning_vi": "nghĩa tiếng Việt"
        }
      ]
    }
  ]
}
`;

  try {
    const rawResponse = await callGemini(prompt, effectiveKey, null, null, true);
    return safeParseJson(rawResponse);
  } catch (err) {
    console.error('AI paraphrase error:', err.message);
    throw err;
  }
}

/**
 * 5. AI Collocation & Deep Idiom Explorer
 */
export async function exploreCollocationsAI(word, apiKey = null) {
  const effectiveKey = getEffectiveApiKey(apiKey);

  if (!effectiveKey) {
    return {
      target_word: word,
      phonetic: '/.../',
      word_type: 'noun / verb',
      core_meaning_vi: `Ý nghĩa chính của từ ${word}`,
      collocations: [
        {
          pattern: 'Verb + Noun',
          collocation: `leverage ${word}`,
          meaning_vi: `tận dụng ${word}`,
          example_en: `We must leverage our capabilities to achieve success.`,
          example_vi: `Chúng ta phải tận dụng năng lực của mình để đạt được thành công.`
        }
      ],
      idioms_and_phrasal_verbs: [
        {
          phrase: `in terms of ${word}`,
          meaning_vi: `xét về mặt ${word}`,
          example_en: `In terms of quality, this product is unmatched.`,
          example_vi: `Xét về mặt chất lượng, sản phẩm này không có đối thủ.`
        }
      ],
      common_mistakes: [
        {
          incorrect: `Dịch thô từng từ của ${word}`,
          correct: `Cách dùng tự nhiên chuẩn bản xứ`,
          explanation_vi: `Cần Gemini API Key trong Cài đặt để bóc tách sâu hơn.`
        }
      ]
    };
  }

  const prompt = `
Bạn là từ điển sống và chuyên gia khảo sát ngữ liệu tiếng Anh (Corpus Linguistics). Hãy đào sâu phân tích từ vựng: "${word}".
Bóc tách các Collocations (cụm từ cố định tự nhiên), Thành ngữ (Idioms/Phrasal Verbs) và các Lỗi sai người học Việt Nam hay mắc (Common Pitfalls).

Trả về JSON với cấu trúc:
{
  "target_word": "${word}",
  "phonetic": "Phiên âm IPA chuẩn Anh-Mỹ",
  "word_type": "noun / verb / adjective / adverb",
  "core_meaning_vi": "Nghĩa tiếng Việt chuẩn xác và sắc thái chính",
  "collocations": [
    {
      "pattern": "Verb + Noun / Adj + Noun / Preposition",
      "collocation": "cụm từ kết hợp tự nhiên (vd: tackle a problem)",
      "meaning_vi": "nghĩa tiếng Việt của cả cụm",
      "example_en": "Câu ví dụ thực tế sử dụng cụm này",
      "example_vi": "Dịch nghĩa câu ví dụ"
    },
    {
      "pattern": "Verb + Noun / Adj + Noun / Preposition",
      "collocation": "cụm từ 2",
      "meaning_vi": "nghĩa tiếng Việt",
      "example_en": "Câu ví dụ",
      "example_vi": "Dịch câu"
    },
    {
      "pattern": "Verb + Noun / Adj + Noun / Preposition",
      "collocation": "cụm từ 3",
      "meaning_vi": "nghĩa tiếng Việt",
      "example_en": "Câu ví dụ",
      "example_vi": "Dịch câu"
    }
  ],
  "idioms_and_phrasal_verbs": [
    {
      "phrase": "thành ngữ hoặc phrasal verb liên quan đến từ này",
      "meaning_vi": "nghĩa tiếng Việt",
      "example_en": "Câu ví dụ sinh động",
      "example_vi": "Dịch câu ví dụ"
    }
  ],
  "common_mistakes": [
    {
      "incorrect": "Cách diễn đạt sai mà người Việt hay dùng (Vinglish/dịch thô)",
      "correct": "Cách nói/viết chuẩn của người bản xứ",
      "explanation_vi": "Giải thích vì sao sai và sắc thái khác nhau"
    }
  ]
}
`;

  try {
    const rawResponse = await callGemini(prompt, effectiveKey, null, null, true);
    return safeParseJson(rawResponse);
  } catch (err) {
    console.error('AI collocation error:', err.message);
    throw err;
  }
}

/**
 * 6. AI Situational Dialogue & Roleplay Generator
 */
export async function generateSituationalDialogueAI({ scenario = 'job_interview', userWords = [] }, apiKey = null) {
  const scenarioNames = {
    job_interview: 'Phỏng vấn xin việc vị trí cấp cao (Tech / Corporate Interview)',
    salary_negotiation: 'Đàm phán lương thưởng & quyền lợi (Salary & Compensation Negotiation)',
    tech_standup: 'Họp Agile Standup & Giải quyết sự cố kỹ thuật (Engineering Standup)',
    business_meeting: 'Họp đàm phán hợp đồng đối tác (Client Partnership Meeting)',
    daily_casual: 'Trò chuyện cafe đời thường với đồng nghiệp bản xứ (Casual Coffee Chat)',
    travel_airport: 'Check-in sân bay và xử lý sự cố chuyến bay (Airport & Travel Emergency)'
  };

  const scenarioTitle = scenarioNames[scenario] || scenario;
  const wordsStr = userWords.length > 0 ? userWords.join(', ') : 'resilient, eloquent, leverage, ubiquitous';
  const effectiveKey = getEffectiveApiKey(apiKey);

  if (!effectiveKey) {
    return {
      scenario_title: scenarioTitle,
      scenario_desc_vi: `Bối cảnh: Thực hành hội thoại trong tình huống ${scenarioTitle}`,
      roles: ['Speaker A', 'Speaker B'],
      integrated_words: ['resilient', 'leverage'],
      dialogue: [
        {
          speaker: 'Speaker A',
          text_en: `Good morning! How do you plan to leverage our current resources?`,
          text_vi: `Chào buổi sáng! Bạn dự định tận dụng các nguồn lực hiện tại của chúng ta như thế nào?`,
          highlighted_word: 'leverage'
        },
        {
          speaker: 'Speaker B',
          text_en: `We will build a resilient system that withstands high traffic.`,
          text_vi: `Chúng tôi sẽ xây dựng một hệ thống bền bỉ có khả năng chịu tải cao.`,
          highlighted_word: 'resilient'
        }
      ],
      key_takeaways: [
        { phrase: 'leverage our current resources', meaning_vi: 'tận dụng các nguồn lực hiện có' },
        { phrase: 'resilient system', meaning_vi: 'hệ thống bền bỉ, phục hồi nhanh' }
      ]
    };
  }

  const prompt = `
Bạn là biên kịch và chuyên gia giảng dạy giao tiếp tiếng Anh ứng dụng.
Hãy tạo một đoạn hội thoại 2 chiều thực tế, tự nhiên và lôi cuốn (khoảng 4-6 lượt thoại) trong tình huống: "${scenarioTitle}".
Yêu cầu ĐẶC BIỆT: Hãy khéo léo lồng ghép các từ vựng sau đây của người học vào câu thoại: [${wordsStr}].

Trả về JSON với cấu trúc:
{
  "scenario_title": "${scenarioTitle}",
  "scenario_desc_vi": "Mô tả ngắn gọn bối cảnh tình huống và vai trò của hai bên",
  "roles": ["Người hỏi / Vai 1", "Người trả lời / Vai 2"],
  "integrated_words": ["danh sách các từ trong danh sách trên đã được lồng ghép"],
  "dialogue": [
    {
      "speaker": "Tên người nói",
      "text_en": "Câu thoại tiếng Anh tự nhiên",
      "text_vi": "Bản dịch tiếng Việt tự nhiên chuẩn ngữ cảnh",
      "highlighted_word": "từ vựng được lồng ghép trong câu này (nếu có, nếu không thì null)"
    }
  ],
  "key_takeaways": [
    {
      "phrase": "cụm từ hoặc mẫu câu giao tiếp đắt giá",
      "meaning_vi": "giải thích ý nghĩa và cách áp dụng"
    }
  ]
}
`;

  try {
    const rawResponse = await callGemini(prompt, effectiveKey, null, null, true);
    return safeParseJson(rawResponse);
  } catch (err) {
    console.error('AI dialogue error:', err.message);
    throw err;
  }
}

/**
 * 8. AI Smart Contextual Quiz Generator (Biên soạn bài trắc nghiệm ngữ cảnh thực tế theo cấp độ IELTS)
 */
export async function generateAIQuiz({ topic = 'All', count = 5, words = [], level = 'all', mode = 'mixed', date_scope = 'all', date = null }, apiKey = null) {
  const db = getDb();
  let candidateWords = [];
  let topicDisplay = 'Tất cả (All)';

  if (words && words.length > 0) {
    candidateWords = words;
  } else {
    const allWords = db.prepare('SELECT id, word, meaning_vi, level, topic_id, created_at FROM words').all();
    const dateFiltered = filterItemsByDate(allWords, date_scope, date);
    const resolved = resolveTopics(db, topic);
    if (!resolved.isAll) {
      topicDisplay = resolved.displayNames.join(' + ');
      candidateWords = dateFiltered.filter(w => {
        const wTopicId = (w.topic_id || '').toLowerCase();
        return resolved.targetIds.includes(wTopicId);
      });
    } else {
      candidateWords = dateFiltered;
    }
    if (candidateWords.length === 0 && dateFiltered.length > 0) {
      candidateWords = dateFiltered;
    }
  }

  if (candidateWords.length === 0) {
    candidateWords = [
      { id: 'sample_1', word: 'ubiquitous', meaning_vi: 'Có mặt ở khắp nơi', level: 'C1', topic_id: 'tech' },
      { id: 'sample_2', word: 'resilience', meaning_vi: 'Sự kiên cường, phục hồi', level: 'B2', topic_id: 'mindset' },
      { id: 'sample_3', word: 'eloquent', meaning_vi: 'Lưu loát, có tài hùng biện', level: 'C2', topic_id: 'ielts' },
      { id: 'sample_4', word: 'pragmatic', meaning_vi: 'Thực tế, thực dụng', level: 'B2', topic_id: 'work' },
      { id: 'sample_5', word: 'meticulous', meaning_vi: 'Tỉ mỉ, trau chuốt', level: 'C1', topic_id: 'work' }
    ];
  }

  // Filter candidate words by Granular IELTS tier or Easy/Medium/Hard if specified
  if (level && level !== 'all') {
    const tierMap = {
      'easy': ['A1', 'A2', 'B1'],
      'medium': ['B1', 'B2'],
      'hard': ['B2', 'C1', 'C2'],
      'ielts_4_5': ['A1', 'A2', 'B1'],
      'ielts_55_60': ['B1', 'B2'],
      'ielts_65_70': ['B2'],
      'ielts_75_80': ['B2', 'C1'],
      'ielts_85_90': ['C1', 'C2']
    };
    const allowed = tierMap[level] || [];
    const levelFiltered = candidateWords.filter(w => allowed.includes((w.level || '').toUpperCase()));
    if (levelFiltered.length > 0) {
      candidateWords = levelFiltered;
    }
  }

  const targetCount = Math.max(1, parseInt(count, 10) || 5);

  let selected = [];
  const shuffled = [...candidateWords].sort(() => 0.5 - Math.random());

  if (shuffled.length >= targetCount) {
    // 1. Số từ của topic >= targetCount -> Chọn ngẫu nhiên KHÔNG LẶP LẠI
    selected = shuffled.slice(0, targetCount);
  } else {
    // 2. Số từ của topic < targetCount -> Lặp đi lặp lại các từ đó để tạo đủ số câu hỏi
    for (let i = 0; i < targetCount; i++) {
      selected.push(shuffled[i % shuffled.length]);
    }
  }

  const ieltsRequirementMap = {
    'all': 'Đa dạng linh hoạt từ A2 đến C2',
    'easy': 'Mức độ DỄ (Cơ bản / Nền tảng A1 - B1): Ngữ cảnh giao tiếp hàng ngày thân thuộc, câu văn ngắn gọn, từ ngữ tự nhiên và dễ nắm bắt, các phương án gây nhiễu rõ ràng.',
    'medium': 'Mức độ TRUNG BÌNH (Tiêu chuẩn B1 - B2): Ngữ cảnh công việc & đời sống xã hội, câu văn ghép hoàn chỉnh, phân biệt rõ nghĩa từ.',
    'hard': 'Mức độ KHÓ (Nâng cao & Thử thách B2 - C2): Ngữ cảnh học thuật chuyên sâu, bài luận IELTS Writing Task 2, collocations học thuật đắt giá, bẫy trắc nghiệm logic và sắc thái từ tinh tế.',
    'ielts_4_5': 'Cấp độ IELTS Band 4.0 - 5.0 (CEFR A2 - B1 Nền Tảng): Ngữ cảnh giao tiếp hàng ngày thân thuộc, câu văn ngắn gọn, từ ngữ tự nhiên và dễ nắm bắt.',
    'ielts_55_60': 'Cấp độ IELTS Band 5.5 - 6.0 (CEFR B1 - B2 Tiền Trung Cấp): Ngữ cảnh công việc cơ bản & đời sống xã hội, câu văn ghép đơn giản, phân biệt rõ nghĩa từ.',
    'ielts_65_70': 'Cấp độ IELTS Band 6.5 - 7.0 (CEFR B2 - C1 Trung Cấp Khá): Ngữ cảnh bài luận học thuật, báo chí, môi trường công sở chuyên nghiệp, cấu trúc câu phức và mệnh đề quan hệ.',
    'ielts_75_80': 'Cấp độ IELTS Band 7.5 - 8.0 (CEFR C1 Nâng Cao): Ngữ cảnh học thuật chuyên sâu (IELTS Reading/Writing Task 2), collocations học thuật đắt giá, bẫy trắc nghiệm logic và sắc thái từ tinh tế.',
    'ielts_85_90': 'Cấp độ IELTS Band 8.5 - 9.0 (CEFR C2 Mastery Bản Xứ): Văn phong học thuật đỉnh cao, thuật ngữ chuyên ngành uyên bác, phân biệt các sắc thái đồng nghĩa cực kỳ tinh xảo.'
  };
  const ieltsGuideline = ieltsRequirementMap[level] || ieltsRequirementMap['all'];

  const modeInstructions = {
    'cloze_blank': `
🎯 YÊU CẦU CHẾ ĐỘ: "Điền vào câu (Cloze Blank)"
- Mọi câu hỏi đều là câu văn ngữ cảnh thực tế chứa chỗ trống "_______" tương ứng với từ mục tiêu.
- questionText: Câu tiếng Anh có chỗ trống _______
- promptSubtitle: "Điền từ vựng thích hợp vào ngữ cảnh:"
- options: 4 từ vựng tiếng Anh (1 từ đúng và 3 từ gây nhiễu cùng từ loại).
- correctAnswer: Từ vựng tiếng Anh chính xác.
- type: "cloze_blank"
`,
    'meaning_vi': `
🎯 YÊU CẦU CHẾ ĐỘ: "Chọn nghĩa tiếng Việt theo ngữ cảnh (In-context Meaning)"
- Mỗi câu hỏi đưa ra 1 câu văn tiếng Anh hoàn chỉnh có in đậm từ mục tiêu (ví dụ: "The team was exceptionally **resilient** during the crisis.").
- questionText: Câu văn tiếng Anh chứa từ mục tiêu in đậm **từ vựng**.
- promptSubtitle: "Chọn nghĩa tiếng Việt chính xác nhất của từ vựng trong câu trên:"
- options: 4 phương án nghĩa tiếng Việt (1 nghĩa đúng chuẩn xác ngữ cảnh và 3 nghĩa gây nhiễu hợp lý).
- correctAnswer: Nghĩa tiếng Việt đúng.
- type: "meaning_vi"
`,
    'reverse_en': `
🎯 YÊU CẦU CHẾ ĐỘ: "Chọn từ tiếng Anh theo định nghĩa & tình huống (Reverse English)"
- questionText: Định nghĩa hoặc tình huống mô tả chi tiết bằng tiếng Việt (tuyệt đối không ghi từ tiếng Anh vào câu hỏi).
- promptSubtitle: "Chọn từ vựng tiếng Anh chuẩn xác tương ứng với ngữ cảnh trên:"
- options: 4 từ vựng tiếng Anh.
- correctAnswer: Từ tiếng Anh chính xác.
- type: "reverse_en"
`,
    'listening': `
🎯 YÊU CẦU CHẾ ĐỘ: "Luyện phản xạ Nghe & Ngữ nghĩa (Listening Reflex)"
- questionText: Từ vựng mục tiêu cần luyện nghe.
- promptSubtitle: "Nghe phát âm và chọn nghĩa tiếng Việt chính xác:"
- options: 4 phương án nghĩa tiếng Việt.
- correctAnswer: Nghĩa tiếng Việt đúng.
- type: "listening"
`,
    'mixed': `
🎯 YÊU CẦU CHẾ ĐỘ: "Hỗn Hợp Đa Dạng (Mixed Modes)"
- Hãy đan xen luân phiên các dạng câu hỏi giữa các câu:
  + Dạng cloze_blank: Câu tiếng Anh có chỗ trống _______, options là 4 từ tiếng Anh.
  + Dạng meaning_vi: Câu tiếng Anh hoàn chỉnh in đậm **từ vựng**, options là 4 nghĩa tiếng Việt theo ngữ cảnh.
  + Dạng reverse_en: Định nghĩa tình huống bằng tiếng Việt, options là 4 từ tiếng Anh.
  + Dạng listening: Luyện nghe phát âm từ vựng, options là 4 nghĩa tiếng Việt.
- Gán trường "type" chính xác ('cloze_blank' | 'meaning_vi' | 'reverse_en' | 'listening') cho từng câu hỏi.
`
  };

  const currentModeInstruction = modeInstructions[mode] || modeInstructions['mixed'];
  const wordsInput = selected.map((w, idx) => `Câu ${idx + 1}: Mục tiêu từ "${w.word}" (nghĩa: ${w.meaning_vi || ''})`).join('\n');

  const prompt = `
Bạn là chuyên gia khảo thí tiếng Anh (IELTS/ETS). Hãy tạo đúng chính xác ${targetCount} câu hỏi trắc nghiệm tiếng Anh thông minh cho chủ đề "${topicDisplay}".
🎯 Cấp độ IELTS mục tiêu: ${ieltsGuideline}
${currentModeInstruction}

Danh sách mục tiêu từng câu:
${wordsInput}

LƯU Ý ĐẶC BIỆT:
- Nếu một từ vựng xuất hiện ở nhiều câu (do chủ đề có ít từ), hãy tạo các tình huống ngữ cảnh, cấu trúc câu và góc nhìn kiểm tra HOÀN TOÀN KHÁC NHAU để người học ghi nhớ sâu.
- Mỗi câu hỏi bắt buộc phải có giải thích ngữ pháp/ngữ nghĩa chi tiết và dịch nghĩa tiếng Việt cả câu.

Hãy trả về JSON với cấu trúc:
{
  "topic": "${topicDisplay}",
  "level": "${level}",
  "mode": "${mode}",
  "questions": [
    {
      "id": "q1",
      "type": "cloze_blank",
      "word": "từ vựng mục tiêu",
      "questionText": "Nội dung câu hỏi theo đúng chế độ",
      "promptSubtitle": "Tiêu đề hướng dẫn",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "Option đúng",
      "explanation": "Giải thích ngắn gọn lý do chọn đáp án này",
      "translation": "Bản dịch nghĩa câu tiếng Việt"
    }
  ]
}
`;

  const startTime = Date.now();
  try {
    const rawResponse = await callGemini(prompt, apiKey, null, null, true);
    const parsed = safeParseJson(rawResponse);
    const randomizedQuestions = normalizeAndRandomizeQuestions(parsed, 'ai_vocab');
    const generationTimeMs = Date.now() - startTime;

    if (randomizedQuestions && randomizedQuestions.length > 0) {
      return {
        topic: (parsed && parsed.topic) || topicDisplay || 'AI Smart Quiz',
        level: (parsed && parsed.level) || level || 'all',
        mode: (parsed && parsed.mode) || mode || 'mixed',
        isAiGenerated: true,
        generationTimeMs,
        totalQuestions: randomizedQuestions.length,
        questions: randomizedQuestions
      };
    }
    throw new Error('Dữ liệu câu hỏi từ AI không đúng cấu trúc.');
  } catch (err) {
    console.error('AI Quiz error:', err.message);
    throw err;
  }
}

/**
 * 9. AI Smart Pattern Quiz Generator (Biên soạn bài trắc nghiệm mẫu câu & cấu trúc chuyên sâu bằng AI)
 */
export async function generateAIPatternQuiz({ category = 'all', tone = 'all', count = 5, level = 'all', mode = 'mixed', date_scope = 'all', date = null }, apiKey = null) {
  const db = getDb();
  let patterns = db.prepare('SELECT id, name, formula, explanation, meaning_vi, category, tone, examples, created_at FROM patterns').all();

  if (patterns.length === 0) {
    throw new Error('Kho mẫu câu đang trống. Vui lòng thêm mẫu câu trước khi tạo Quiz AI!');
  }

  patterns = filterItemsByDate(patterns, date_scope, date);
  if (patterns.length === 0) {
    throw new Error('Không có mẫu câu nào trong phạm vi ngày đã chọn!');
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

  let selected = [];
  const shuffled = [...candidatePatterns].sort(() => 0.5 - Math.random());
  if (shuffled.length >= targetCount) {
    selected = shuffled.slice(0, targetCount);
  } else {
    for (let i = 0; i < targetCount; i++) {
      selected.push(shuffled[i % shuffled.length]);
    }
  }

  const patternsInput = selected.map((p, idx) => `Câu ${idx + 1}: Mẫu câu "${p.name}" (Công thức: ${p.formula} | Nghĩa: ${p.meaning_vi} | Chức năng: ${p.category})`).join('\n');

  const prompt = `
Bạn là chuyên gia luyện thi ngữ pháp & viết luận tiếng Anh (IELTS Academic / GRE / Cambridge).
Hãy tạo đúng chính xác ${targetCount} câu hỏi trắc nghiệm chuyên sâu về MẪU CÂU & CẤU TRÚC NGỮ PHÁP (Sentence Patterns & Advanced Grammar Structures).
🎯 Cấp độ IELTS / CEFR: ${level || 'all'}

Danh sách mẫu câu mục tiêu từng câu:
${patternsInput}

YÊU CẦU ĐẶC BIỆT:
1. Mỗi câu hỏi kiểm tra cách ứng dụng thực tế của mẫu câu trong câu văn hoàn chỉnh (IELTS Writing Task 2, Bài luận học thuật, Thư công việc trang trọng).
2. Tạo chỗ trống "_______" ở vị trí vế đảo ngữ / từ nối / liên từ / dạng chia động từ đặc trưng của mẫu câu.
3. Cung cấp 4 lựa chọn (options): 1 đáp án chuẩn ngữ pháp và 3 đáp án gây nhiễu chứa các lỗi ngữ pháp hay gặp (ví dụ: quên đảo trợ từ, chia sai thì, dùng sai liên từ đi kèm).
4. Cung cấp giải thích chi tiết quy tắc ngữ pháp của mẫu câu và dịch nghĩa cả câu sang tiếng Việt.

Hãy trả về JSON với cấu trúc:
{
  "topic": "🧩 Quiz Cấu Trúc Câu Chuyên Sâu (AI)",
  "isPatternQuiz": true,
  "level": "${level}",
  "questions": [
    {
      "id": "pq1",
      "type": "pattern_context",
      "isPattern": true,
      "word": "Tên mẫu câu",
      "questionText": "Câu văn tiếng Anh học thuật có chỗ trống _______",
      "promptSubtitle": "Điền cấu trúc ngữ pháp chuẩn xác vào ngữ cảnh:",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "Option đúng",
      "explanation": "Giải thích chi tiết quy tắc ngữ pháp của cấu trúc này",
      "translation": "Bản dịch tiếng Việt"
    }
  ]
}
`;

  const startTime = Date.now();
  try {
    const rawResponse = await callGemini(prompt, apiKey, null, null, true);
    const parsed = safeParseJson(rawResponse);
    const randomizedQuestions = normalizeAndRandomizeQuestions(parsed, 'ai_pattern');
    const generationTimeMs = Date.now() - startTime;

    if (randomizedQuestions && randomizedQuestions.length > 0) {
      return {
        topic: (parsed && parsed.topic) || '🧩 Quiz Cấu Trúc Câu Chuyên Sâu (AI)',
        isPatternQuiz: true,
        level: (parsed && parsed.level) || level || 'all',
        mode: (parsed && parsed.mode) || mode || 'mixed',
        isAiGenerated: true,
        generationTimeMs,
        totalQuestions: randomizedQuestions.length,
        questions: randomizedQuestions
      };
    }
    throw new Error('Dữ liệu câu hỏi cấu trúc từ AI không đúng cấu trúc.');
  } catch (err) {
    console.error('AI Pattern Quiz error:', err.message);
    throw err;
  }
}

// High-Speed In-Memory Cache for Contextual Translations (0ms instant hits)
const contextTranslationCache = new Map();
const MAX_CONTEXT_CACHE_SIZE = 2000;

export async function translateInContextAI({ text, contextSentence = '', articleTitle = '', articleTopic = 'General' }, apiKey = null) {
  const cleanWord = (text || '').trim();
  const cleanSentence = (contextSentence || '').trim();
  const cacheKey = `${cleanWord.toLowerCase()}:::${cleanSentence.toLowerCase()}:::${(articleTopic || '').toLowerCase()}`;

  // 1. Check in-memory cache for 0ms instant response
  if (contextTranslationCache.has(cacheKey)) {
    return contextTranslationCache.get(cacheKey);
  }

  const prompt = `Dịch và phân tích từ "${cleanWord}" THEO NGỮ CẢNH CÂU VĂN:
Câu chứa từ: "${cleanSentence || cleanWord}"
Chủ đề bài: "${articleTopic || 'General'}" - "${articleTitle || ''}"

Trả về JSON ngắn gọn chuẩn xác:
{
  "targetText": "${cleanWord}",
  "phonetic": "/.../",
  "partOfSpeech": "verb | noun | adjective | adverb | idiom | phrase",
  "contextualMeaningVi": "Nghĩa tiếng Việt chuẩn xác trong câu này",
  "contextExplanation": "Giải thích ngắn gọn sắc thái hoặc ngữ cảnh (1 câu)",
  "overallSentenceVi": "Bản dịch tiếng Việt tự nhiên của cả câu chứa từ",
  "collocations": ["cụm từ 1", "cụm từ 2"],
  "synonyms": ["từ đồng nghĩa 1", "từ đồng nghĩa 2"],
  "level": "B2 | C1 | C2"
}`;

  try {
    // Use fastest flash model with lightweight tokens for sub-second generation
    const rawResponse = await callGemini(prompt, apiKey, null, 'gemini-2.5-flash', true);
    const parsed = safeParseJson(rawResponse);
    if (parsed && (parsed.contextualMeaningVi || parsed.meaning_vi || parsed.overallSentenceVi)) {
      const result = {
        targetText: parsed.targetText || cleanWord,
        phonetic: parsed.phonetic || '',
        partOfSpeech: parsed.partOfSpeech || parsed.part_of_speech || 'noun',
        contextualMeaningVi: parsed.contextualMeaningVi || parsed.meaning_vi || 'Nghĩa theo ngữ cảnh bài đọc',
        contextExplanation: parsed.contextExplanation || parsed.explanation || '',
        overallSentenceVi: parsed.overallSentenceVi || parsed.sentence_vi || '',
        collocations: parsed.collocations || [],
        synonyms: parsed.synonyms || [],
        level: parsed.level || 'B2'
      };

      // Store in memory cache
      if (contextTranslationCache.size >= MAX_CONTEXT_CACHE_SIZE) {
        const firstKey = contextTranslationCache.keys().next().value;
        contextTranslationCache.delete(firstKey);
      }
      contextTranslationCache.set(cacheKey, result);

      return result;
    }
    throw new Error('Không thể phân tích ngữ cảnh từ');
  } catch (err) {
    console.error('Translate In Context AI Error:', err.message);
    throw err;
  }
}



