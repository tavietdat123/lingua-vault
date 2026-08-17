/**
 * AI Service for LinguaVault (Google Gemini API & Smart Fallback)
 * 100% Free Tier compatible (Gemini 1.5/2.0 Flash)
 */

export async function callGemini(prompt, apiKey = null, audioData = null) {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('Chưa cấu hình Gemini API Key. Vui lòng nhập API Key miễn phí trong mục Cài đặt.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

  const parts = [];

  // If raw audio is supplied, attach it as inline_data
  if (audioData && audioData.data) {
    parts.push({
      inline_data: {
        mime_type: audioData.mimeType || 'audio/webm',
        data: audioData.data
      }
    });
  }

  // Attach text instruction prompt
  parts.push({ text: prompt });

  const payload = {
    contents: [
      {
        parts
      }
    ],
    generationConfig: {
      temperature: 0.2, // Lower temperature for maximum precision & strict phonetic scrutiny
      topK: 32,
      topP: 0.95,
      maxOutputTokens: 2048,
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Lỗi kết nối Gemini API (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text;
}

/**
 * 1. Smart Sentence Parser & Vocab Extractor
 */
export async function parseSentenceAI(sentence, apiKey = null) {
  if (!apiKey && !process.env.GEMINI_API_KEY) {
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
Bạn là một chuyên gia ngôn ngữ học tiếng Anh hàng đầu. Hãy phân tích câu/đoạn văn tiếng Anh sau:
"${sentence}"

Hãy trả về DUY NHẤT một chuỗi JSON hợp lệ (không kèm markdown \`\`\`json) với cấu trúc sau:
{
  "translation": "Bản dịch tiếng Việt tự nhiên, chuẩn ngữ cảnh",
  "extracted_words": [
    {
      "word": "từ vựng hay/nâng cao trong câu",
      "meaning_vi": "nghĩa tiếng Việt chính xác trong ngữ cảnh này",
      "part_of_speech": "noun/verb/adj/adverb/phrasal verb",
      "context_usage": "giải thích ngắn gọn cách dùng từ này trong câu"
    }
  ],
  "patterns": [
    {
      "name": "Tên cấu trúc/mẫu câu hay (nếu có)",
      "formula": "Công thức tổng quát",
      "explanation": "Giải thích cách dùng ngắn gọn"
    }
  ],
  "grammar_notes": "Phân tích ngữ pháp hoặc điểm đáng chú ý của câu"
}
`;

  try {
    const rawResponse = await callGemini(prompt, apiKey);
    const cleaned = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('AI parse error:', err.message);
    throw err;
  }
}

/**
 * 2. Check and Correct User's Custom Sentence
 */
export async function checkSentenceAI({ targetItem, userSentence }, apiKey = null) {
  if (!apiKey && !process.env.GEMINI_API_KEY) {
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
    const rawResponse = await callGemini(prompt, apiKey);
    const cleaned = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
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

  if (!apiKey && !process.env.GEMINI_API_KEY) {
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
Trả về DUY NHẤT một chuỗi JSON hợp lệ (không kèm markdown \`\`\`json):
{
  "title": "Tiêu đề ngắn gọn của câu chuyện (tiếng Việt)",
  "story_en": "Nội dung câu chuyện bằng tiếng Anh có chứa các từ được bọc trong <b>...</b>",
  "story_vi": "Bản dịch tiếng Việt mượt mà của câu chuyện",
  "highlighted_words": ["danh sách các từ đã dùng"]
}
`;

  try {
    const rawResponse = await callGemini(prompt, apiKey);
    const cleaned = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('AI story generation error:', err.message);
    throw err;
  }
}
