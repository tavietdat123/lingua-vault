/**
 * Smart AI & Lexicon Dictionary Service
 * Powered by Google Gemini AI (0đ) + High-Yield Learner's Lexicon
 */

import { db } from '../db/database.js';
import { callGemini } from './aiService.js';

// High-Yield Curated Learner's Lexicon for Instant Accurate Fallback
const CURATED_LEXICON = {
  resilient: {
    word: 'resilient',
    phonetic: '/rɪˈzɪl.jənt/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/resilient-us.mp3',
    part_of_speech: 'adjective',
    meaning_vi: 'Kiên cường, có khả năng phục hồi nhanh chóng sau khó khăn / biến cố',
    meaning_en: 'Able to withstand or recover quickly from difficult conditions.',
    collocations: ['stay resilient', 'resilient economy', 'highly resilient', 'resilient mindset'],
    examples: [
      'The team remained remarkably resilient despite facing unexpected project delays.',
      'Developing a resilient mindset is essential for career success in tech.'
    ],
    level: 'B2'
  },
  articulate: {
    word: 'articulate',
    phonetic: '/ɑːˈtɪk.jə.lət/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/articulate-us.mp3',
    part_of_speech: 'adjective',
    meaning_vi: 'Ăn nói lưu loát, diễn đạt ý tưởng gãy gọn và mạch lạc',
    meaning_en: 'Having or showing the ability to speak fluently and coherently.',
    collocations: ['articulate speaker', 'articulate an idea', 'clear and articulate'],
    examples: [
      'She gave an articulate and persuasive presentation to the executive board.',
      'Engineers must learn to articulate technical trade-offs to business stakeholders.'
    ],
    level: 'C1'
  },
  meticulous: {
    word: 'meticulous',
    phonetic: '/məˈtɪk.jə.ləs/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/meticulous-us.mp3',
    part_of_speech: 'adjective',
    meaning_vi: 'Tỉ mỉ, cẩn trọng đến từng chi tiết nhỏ',
    meaning_en: 'Showing great attention to detail; very careful and precise.',
    collocations: ['meticulous planning', 'meticulous attention to detail', 'meticulous research'],
    examples: [
      'The database migration was executed with meticulous care without any downtime.',
      'His meticulous code reviews helped the team catch critical bugs early.'
    ],
    level: 'C1'
  },
  pragmatic: {
    word: 'pragmatic',
    phonetic: '/præɡˈmæt.ɪk/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/pragmatic-us.mp3',
    part_of_speech: 'adjective',
    meaning_vi: 'Thực tế, thực dụng (tập trung vào giải pháp hiệu quả thực tế)',
    meaning_en: 'Dealing with things sensibly and realistically based on practical considerations.',
    collocations: ['pragmatic approach', 'pragmatic solution', 'pragmatic decision'],
    examples: [
      'We took a pragmatic approach to launch the minimum viable product within two weeks.',
      'In software engineering, you often need pragmatic trade-offs over theoretical perfection.'
    ],
    level: 'C1'
  },
  leverage: {
    word: 'leverage',
    phonetic: '/ˈlev.ər.ɪdʒ/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/leverage-us.mp3',
    part_of_speech: 'verb',
    meaning_vi: 'Tận dụng, phát huy tối đa lợi thế / đòn bẩy',
    meaning_en: 'Use something to maximum advantage.',
    collocations: ['leverage AI tools', 'leverage advantages', 'gain leverage'],
    examples: [
      'We can leverage cloud infrastructure to scale our application seamlessly.',
      'The company leveraged its existing customer base to launch a new product line.'
    ],
    level: 'B2'
  },
  streamline: {
    word: 'streamline',
    phonetic: '/ˈstriːm.laɪn/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/streamline-us.mp3',
    part_of_speech: 'verb',
    meaning_vi: 'Tinh giản, tối ưu hóa quy trình để vận hành nhanh và hiệu quả hơn',
    meaning_en: 'Make a process more efficient by removing unnecessary steps.',
    collocations: ['streamline the workflow', 'streamline operations', 'streamline communication'],
    examples: [
      'The new automated CI/CD pipeline streamlined our deployment cycle significantly.',
      'We need to streamline our decision-making process to move faster.'
    ],
    level: 'B2'
  }
};

export async function lookupDictionary(word) {
  if (!word || !word.trim()) {
    throw new Error('Word is required');
  }

  const cleanWord = word.trim().toLowerCase();

  // 1. Check if word exists in Curated High-Yield Lexicon
  if (CURATED_LEXICON[cleanWord]) {
    return CURATED_LEXICON[cleanWord];
  }

  // 2. Check if Gemini API Key is configured in settings
  let geminiKey = process.env.GEMINI_API_KEY;
  try {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('gemini_api_key');
    if (row && row.value) geminiKey = row.value;
  } catch (e) {}

  // 3. If Gemini API Key exists -> Use Google Gemini 1.5 Flash (Ultra-Accurate AI)
  if (geminiKey) {
    try {
      const prompt = `
Bạn là một chuyên gia khảo thí ngôn ngữ học và từ điển học tiếng Anh cao cấp (chuẩn Cambridge/Oxford).
Hãy phân tích từ/cụm từ tiếng Anh sau dành cho người học: "${cleanWord}"

YÊU CẦU QUAN TRỌNG:
- meaning_vi: PHẢI là nghĩa tiếng Việt tự nhiên, chuẩn ngữ cảnh học tập/giao tiếp/công việc thực tế (KHÔNG dịch máy thô cứng).
- collocations: 3-4 cụm từ/collocations phổ biến nhất của từ này.
- examples: 2 câu ví dụ thực tế, tự nhiên, mang tính ứng dụng cao.
- level: Đánh giá theo khung CEFR (A1/A2/B1/B2/C1/C2).

Trả về DUY NHẤT một chuỗi JSON hợp lệ (không kèm markdown \`\`\`json):
{
  "word": "${cleanWord}",
  "phonetic": "/phiên âm IPA chuẩn/",
  "part_of_speech": "noun/verb/adjective/adverb/phrase/phrasal_verb",
  "meaning_vi": "Nghĩa tiếng Việt chuẩn ngữ cảnh tự nhiên",
  "meaning_en": "Định nghĩa bằng tiếng Anh súc tích, dễ hiểu",
  "collocations": ["cụm từ 1", "cụm từ 2", "cụm từ 3"],
  "examples": [
    "Câu ví dụ thực tế 1",
    "Câu ví dụ thực tế 2"
  ],
  "level": "B2"
}
`;
      const aiResponse = await callGemini(prompt, geminiKey);
      const cleaned = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const aiData = JSON.parse(cleaned);

      // Fetch native audio URL from Dictionary API if available
      let audioUrl = '';
      try {
        const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
        if (dictRes.ok) {
          const dictData = await dictRes.json();
          if (Array.isArray(dictData) && dictData[0]?.phonetics) {
            for (const p of dictData[0].phonetics) {
              if (p.audio && p.audio.trim()) {
                audioUrl = p.audio.startsWith('//') ? `https:${p.audio}` : p.audio;
                break;
              }
            }
          }
        }
      } catch (e) {}

      return {
        ...aiData,
        audio_url: audioUrl
      };
    } catch (err) {
      console.warn('Gemini AI lookup fallback to dictionary + translate:', err.message);
    }
  }

  // 4. Fallback (Free Dictionary API + Smart Translation)
  let phonetic = '';
  let audioUrl = '';
  let partOfSpeech = 'noun';
  let meaningEn = '';
  let examples = [];
  let collocations = [];
  let meaningVi = '';

  try {
    const dictUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`;
    const dictRes = await fetch(dictUrl);
    if (dictRes.ok) {
      const dictData = await dictRes.json();
      if (Array.isArray(dictData) && dictData.length > 0) {
        const entry = dictData[0];
        phonetic = entry.phonetic || '';

        if (entry.phonetics && Array.isArray(entry.phonetics)) {
          for (const p of entry.phonetics) {
            if (!phonetic && p.text) phonetic = p.text;
            if (p.audio && p.audio.trim()) {
              audioUrl = p.audio.startsWith('//') ? `https:${p.audio}` : p.audio;
              if (p.audio.includes('-us.mp3') || p.audio.includes('-uk.mp3')) {
                break;
              }
            }
          }
        }

        if (entry.meanings && Array.isArray(entry.meanings)) {
          if (entry.meanings.length > 0) {
            partOfSpeech = entry.meanings[0].partOfSpeech || 'noun';
          }

          for (const m of entry.meanings) {
            if (m.definitions && Array.isArray(m.definitions)) {
              for (const def of m.definitions) {
                if (!meaningEn && def.definition) {
                  meaningEn = def.definition;
                }
                if (def.example && def.example.trim()) {
                  examples.push(def.example.trim());
                }
              }
            }
            if (m.synonyms && Array.isArray(m.synonyms) && collocations.length < 3) {
              m.synonyms.slice(0, 3).forEach(s => {
                if (!collocations.includes(s)) collocations.push(s);
              });
            }
          }
        }
      }
    }
  } catch (e) {}

  // Fetch Vietnamese translation
  try {
    const transUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(cleanWord)}`;
    const transRes = await fetch(transUrl);
    if (transRes.ok) {
      const transData = await transRes.json();
      if (transData && transData[0] && transData[0][0] && transData[0][0][0]) {
        meaningVi = transData[0][0][0];
      }
    }
  } catch (e) {}

  if (examples.length === 0) {
    examples = [
      `She showed a very ${cleanWord} attitude in her work.`,
      `It is important to understand how to apply ${cleanWord} in real situations.`
    ];
  }

  let level = 'B2';
  if (cleanWord.length > 9) level = 'C1';
  else if (cleanWord.length <= 4) level = 'A2';
  else if (cleanWord.length <= 6) level = 'B1';

  return {
    word: cleanWord,
    phonetic: phonetic || `/${cleanWord}/`,
    audio_url: audioUrl,
    part_of_speech: partOfSpeech,
    meaning_vi: meaningVi ? (meaningVi.charAt(0).toUpperCase() + meaningVi.slice(1)) : '',
    meaning_en: meaningEn || `Definition of ${cleanWord}`,
    examples: examples.slice(0, 2),
    collocations: collocations.length > 0 ? collocations : [`stay ${cleanWord}`, `highly ${cleanWord}`],
    level
  };
}
