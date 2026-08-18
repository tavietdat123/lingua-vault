/**
 * Smart AI & Pedagogical Lexicon Dictionary Service
 * Powered by Google Gemini AI (0đ) + Oxford/Cambridge Learner Standards + High-Yield Curated Lexicon
 */

import { db } from '../db/database.js';
import { callGemini, getEffectiveApiKey } from './aiService.js';

// High-Yield Curated Learner's Lexicon for Instant, Flawless Results
const CURATED_LEXICON = {
  resilient: {
    word: 'resilient',
    phonetic: '/rɪˈzɪl.i.ənt/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/resilient-us.mp3',
    part_of_speech: 'adjective',
    meaning_vi: 'Kiên cường, bền bỉ (khả năng phục hồi nhanh sau khó khăn, biến cố)',
    meaning_en: 'Able to withstand or recover quickly from difficult conditions.',
    collocations: [
      'resilient mindset (tư duy kiên cường)',
      'stay resilient (giữ vững tinh thần)',
      'highly resilient (cực kỳ kiên cường)',
      'resilient economy (nền kinh tế có sức chống chịu cao)'
    ],
    examples: [
      'The team remained remarkably resilient despite facing unexpected project delays. (Cả nhóm vẫn kiên cường đáng nể dù gặp phải những trì hoãn bất ngờ trong dự án.)',
      'Developing a resilient mindset is essential for long-term career success. (Rèn luyện tư duy kiên cường là điều cốt yếu để thành công lâu dài trong sự nghiệp.)'
    ],
    level: 'B2'
  },
  articulate: {
    word: 'articulate',
    phonetic: '/ɑːrˈtɪk.jə.lət/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/articulate-us.mp3',
    part_of_speech: 'adjective',
    meaning_vi: 'Ăn nói lưu loát, diễn đạt ý tưởng gãy gọn, mạch lạc và thuyết phục',
    meaning_en: 'Able to express thoughts, ideas, and feelings clearly and effectively in speech or writing.',
    collocations: [
      'articulate speaker (người diễn thuyết lưu loát)',
      'articulate an idea (diễn đạt một ý tưởng rõ ràng)',
      'highly articulate (ăn nói rất gãy gọn)',
      'clear and articulate (rõ ràng và mạch lạc)'
    ],
    examples: [
      'She gave an articulate and persuasive presentation to the executive board. (Cô ấy đã có một bài thuyết trình lưu loát và đầy thuyết phục trước ban giám đốc.)',
      'Engineers must learn to articulate technical trade-offs to non-technical stakeholders. (Kỹ sư cần học cách diễn đạt gãy gọn các bài toán đánh đổi kỹ thuật cho các bên liên quan.)'
    ],
    level: 'C1'
  },
  meticulous: {
    word: 'meticulous',
    phonetic: '/məˈtɪk.jə.ləs/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/meticulous-us.mp3',
    part_of_speech: 'adjective',
    meaning_vi: 'Tỉ mỉ, cẩn trọng, chu đáo đến từng chi tiết nhỏ',
    meaning_en: 'Showing great attention to detail; very careful and precise.',
    collocations: [
      'meticulous planning (kế hoạch tỉ mỉ, chu toàn)',
      'meticulous attention to detail (sự chú ý tỉ mỉ đến từng chi tiết)',
      'meticulous research (nghiên cứu kỹ lưỡng)',
      'meticulous craftsmanship (tay nghề tinh xảo)'
    ],
    examples: [
      'The database migration was executed with meticulous care without any downtime. (Quá trình chuyển đổi cơ sở dữ liệu đã được thực hiện với sự cẩn trọng tỉ mỉ mà không gây gián đoạn hệ thống.)',
      'His meticulous code reviews helped the engineering team prevent critical bugs. (Những lần rà soát mã nguồn tỉ mỉ của anh ấy đã giúp đội ngũ kỹ thuật ngăn chặn các lỗi nghiêm trọng.)'
    ],
    level: 'C1'
  },
  pragmatic: {
    word: 'pragmatic',
    phonetic: '/præɡˈmæt.ɪk/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/pragmatic-us.mp3',
    part_of_speech: 'adjective',
    meaning_vi: 'Thực tế, thực dụng (tập trung vào giải pháp hiệu quả thực tế hơn là lý thuyết)',
    meaning_en: 'Solving problems in a sensible way that suits the conditions that really exist, rather than obeying fixed theories.',
    collocations: [
      'pragmatic approach (cách tiếp cận thực tế)',
      'pragmatic solution (giải pháp thực tiễn)',
      'pragmatic decision (quyết định mang tính thực tế)',
      'pragmatic mindset (tư duy thực tiễn)'
    ],
    examples: [
      'We took a pragmatic approach to launch the minimum viable product within two weeks. (Chúng tôi đã áp dụng cách tiếp cận thực tế để ra mắt sản phẩm khả dụng tối thiểu trong vòng hai tuần.)',
      'Good software architecture requires pragmatic trade-offs over academic perfection. (Kiến trúc phần mềm tốt đòi hỏi những thỏa hiệp thực tế thay vì sự hoàn hảo trên lý thuyết.)'
    ],
    level: 'C1'
  },
  leverage: {
    word: 'leverage',
    phonetic: '/ˈlev.ər.ɪdʒ/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/leverage-us.mp3',
    part_of_speech: 'verb',
    meaning_vi: 'Tận dụng, phát huy tối đa lợi thế / tiềm năng / đòn bẩy sẵn có',
    meaning_en: 'To use something to maximum advantage.',
    collocations: [
      'leverage AI tools (tận dụng các công cụ AI)',
      'leverage resources (tận dụng tối đa nguồn lực)',
      'gain leverage (có được lợi thế đòn bẩy)',
      'leverage technology (ứng dụng đòn bẩy công nghệ)'
    ],
    examples: [
      'Startups can leverage modern cloud infrastructure to scale rapidly at low cost. (Các công ty khởi nghiệp có thể tận dụng hạ tầng đám mây hiện đại để mở rộng nhanh với chi phí thấp.)',
      'The company leveraged its brand reputation to expand into international markets. (Công ty đã phát huy tối đa danh tiếng thương hiệu để mở rộng ra thị trường quốc tế.)'
    ],
    level: 'B2'
  },
  streamline: {
    word: 'streamline',
    phonetic: '/ˈstriːm.laɪn/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/streamline-us.mp3',
    part_of_speech: 'verb',
    meaning_vi: 'Tinh giản, tối ưu hóa quy trình để vận hành nhanh và hiệu quả hơn',
    meaning_en: 'To make a system, business, or process more efficient and effective by simplifying it.',
    collocations: [
      'streamline the workflow (tinh giản luồng làm việc)',
      'streamline operations (tối ưu hóa hoạt động vận hành)',
      'streamline communication (tinh giản kênh liên lạc)',
      'streamline the process (đơn giản hóa quy trình)'
    ],
    examples: [
      'The automated CI/CD pipeline streamlined our software release cycle significantly. (Quy trình tự động hóa CI/CD đã tinh giản chu kỳ phát hành phần mềm của chúng tôi một cách đáng kể.)',
      'We need to streamline customer support to resolve inquiries within minutes. (Chúng ta cần tinh giản quy trình hỗ trợ khách hàng để xử lý các yêu cầu chỉ trong vài phút.)'
    ],
    level: 'B2'
  },
  ubiquitous: {
    word: 'ubiquitous',
    phonetic: '/juːˈbɪk.wə.təs/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/ubiquitous-us.mp3',
    part_of_speech: 'adjective',
    meaning_vi: 'Phổ biến khắp nơi, có mặt ở mọi nơi (nhan nhản, thịnh hành)',
    meaning_en: 'Present, appearing, or found everywhere at the same time.',
    collocations: [
      'become ubiquitous (trở nên phổ biến khắp nơi)',
      'ubiquitous presence (sự hiện diện ở khắp mọi nơi)',
      'ubiquitous technology (công nghệ hiện diện khắp nơi)'
    ],
    examples: [
      'Smartphones have become ubiquitous in modern society. (Điện thoại thông minh đã trở nên phổ biến ở khắp mọi ngõ ngách của xã hội hiện đại.)',
      'High-speed internet is now a ubiquitous utility in urban areas. (Internet tốc độ cao giờ đây là tiện ích có mặt khắp nơi tại các khu đô thị.)'
    ],
    level: 'C1'
  },
  lucid: {
    word: 'lucid',
    phonetic: '/ˈluː.sɪd/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/lucid-us.mp3',
    part_of_speech: 'adjective',
    meaning_vi: 'Rõ ràng, minh bạch, dễ hiểu; (đầu óc) tỉnh táo, sáng suốt',
    meaning_en: 'Clearly expressed and easy to understand; able to think clearly.',
    collocations: [
      'lucid explanation (lời giải thích rõ ràng, sáng rõ)',
      'lucid style (phong cách viết mạch lạc)',
      'remain lucid (giữ đầu óc tỉnh táo)'
    ],
    examples: [
      'The author provided a lucid explanation of complex quantum physics concepts. (Tác giả đã đưa ra một lời giải thích cực kỳ sáng rõ về các khái niệm vật lý lượng tử phức tạp.)',
      'Even in stressful situations, she maintained a lucid and composed perspective. (Ngay cả trong những tình huống áp lực, cô ấy vẫn giữ được cái nhìn sáng suốt và bình tĩnh.)'
    ],
    level: 'C1'
  }
};

export async function lookupDictionary(word) {
  if (!word || !word.trim()) {
    throw new Error('Vui lòng nhập từ hoặc cụm từ cần tra cứu');
  }

  const cleanWord = word.trim().toLowerCase();

  // 1. Check if word exists in Curated High-Yield Lexicon
  if (CURATED_LEXICON[cleanWord]) {
    return CURATED_LEXICON[cleanWord];
  }

  // 2. Check if Gemini API Key is configured
  const geminiKey = getEffectiveApiKey();

  // 3. If Gemini API Key exists -> Use Google Gemini AI (Pedagogical Excellence)
  if (geminiKey) {
    try {
      const prompt = `
Bạn là một Chuyên gia Khảo thí Ngôn ngữ Học thuật Quốc tế và Từ điển học Tiếng Anh cao cấp (theo chuẩn Cambridge & Oxford Advanced Learner's Dictionary).
Hãy biên soạn phân tích từ vựng CHUẨN MỰC, DỄ HIỂU NHẤT dành cho người học tiếng Anh đối với từ/cụm từ: "${cleanWord}".

YÊU CẦU BIÊN SOẠN CHUẨN XÁC:
1. "meaning_vi": Nghĩa tiếng Việt PHẢI chuẩn xác, súc tích, tự nhiên, truyền tải đúng sắc thái cốt lõi của từ (kèm giải thích ngắn trong ngoặc nếu cần làm rõ ngữ cảnh). KHÔNG dịch máy thô sơ.
2. "meaning_en": Định nghĩa bằng tiếng Anh súc tích, dễ hiểu theo phong cách Oxford/Cambridge Learner (dùng từ vựng giải thích đơn giản, rõ ràng).
3. "phonetic": Phiên âm chuẩn quốc tế IPA (Anh - Mỹ) có đánh dấu trọng âm chuẩn (ví dụ: /ˈæp.əl/ hoặc /rɪˈzɪl.i.ənt/).
4. "part_of_speech": Từ loại chuẩn (noun / verb / adjective / adverb / phrasal_verb / idiom / phrase).
5. "collocations": 3-4 cụm từ / collocation tự nhiên, phổ biến nhất đi kèm với từ này. MỖI CỤM PHẢI KÈM NGHĨA TIẾNG VIỆT TRONG NGOẶC (Ví dụ: "resilient mindset (tư duy kiên cường)").
6. "examples": Đúng 2 câu ví dụ thực tế trong đời sống/công việc/học thuật. MỖI CÂU VÍ DỤ PHẢI KÈM BẢN DỊCH TIẾNG VIỆT TỰ NHIÊN TRONG NGOẶC ĐƠN (Ví dụ: "She gave a lucid explanation. (Cô ấy đã đưa ra một lời giải thích sáng rõ.)").
7. "level": Đánh giá cấp độ CEFR chuẩn xác (A1, A2, B1, B2, C1, hoặc C2).

Trả về DUY NHẤT một chuỗi JSON hợp lệ (không kèm markdown \`\`\`json ngoài JSON):
{
  "word": "${cleanWord}",
  "phonetic": "/.../",
  "part_of_speech": "noun/verb/adjective/adverb/phrasal_verb",
  "meaning_vi": "Nghĩa tiếng Việt chuẩn, tự nhiên và dễ nhớ",
  "meaning_en": "Clear and learner-friendly English definition",
  "collocations": [
    "cụm 1 (nghĩa tiếng Việt)",
    "cụm 2 (nghĩa tiếng Việt)",
    "cụm 3 (nghĩa tiếng Việt)"
  ],
  "examples": [
    "English sentence 1. (Dịch nghĩa tiếng Việt 1.)",
    "English sentence 2. (Dịch nghĩa tiếng Việt 2.)"
  ],
  "level": "B2"
}
`.trim();

      const aiResponse = await callGemini(prompt, geminiKey);
      const cleaned = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
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
                if (p.audio.includes('-us.mp3') || p.audio.includes('-uk.mp3')) {
                  break;
                }
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
      console.warn('⚠️ Gemini AI lookup fallback to dictionary:', err.message);
    }
  }

  // 4. Robust Fallback (Free Dictionary API + Smart Translation + Authentic Contextual Synthesis)
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
                if (def.example && def.example.trim() && examples.length < 2) {
                  examples.push(def.example.trim());
                }
              }
            }
            if (m.synonyms && Array.isArray(m.synonyms) && collocations.length < 3) {
              m.synonyms.slice(0, 3).forEach(s => {
                const phrase = `${cleanWord} and ${s}`;
                if (!collocations.includes(phrase)) collocations.push(phrase);
              });
            }
          }
        }
      }
    }
  } catch (e) {}

  // Fetch Vietnamese translation via Google GTX
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

  // Translate example sentences to Vietnamese if present
  const formattedExamples = [];
  if (examples.length > 0) {
    for (const ex of examples) {
      try {
        const transUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(ex)}`;
        const transRes = await fetch(transUrl);
        if (transRes.ok) {
          const transData = await transRes.json();
          const transVi = transData?.[0]?.[0]?.[0] || '';
          if (transVi) {
            formattedExamples.push(`${ex} (${transVi})`);
            continue;
          }
        }
      } catch (e) {}
      formattedExamples.push(ex);
    }
  } else {
    // Generate clean grammatical example matching part of speech
    if (partOfSpeech === 'verb') {
      formattedExamples.push(`They decided to ${cleanWord} the whole project. (Họ quyết định thực hiện ${cleanWord} toàn bộ dự án.)`);
      formattedExamples.push(`Learning how to ${cleanWord} effectively takes practice. (Học cách ${cleanWord} hiệu quả đòi hỏi sự luyện tập.)`);
    } else if (partOfSpeech === 'adjective') {
      formattedExamples.push(`The presentation was very ${cleanWord} and clear. (Bài thuyết trình rất ${cleanWord} và rõ ràng.)`);
      formattedExamples.push(`He maintained a ${cleanWord} attitude throughout the day. (Anh ấy giữ một thái độ ${cleanWord} suốt cả ngày.)`);
    } else {
      formattedExamples.push(`The importance of ${cleanWord} cannot be overstated. (Tầm quan trọng của ${cleanWord} là không thể bàn cãi.)`);
      formattedExamples.push(`This is a prominent example of ${cleanWord} in practice. (Đây là một ví dụ nổi bật về ${cleanWord} trong thực tế.)`);
    }
  }

  // Realistic CEFR Level Estimation based on vocabulary complexity
  let level = 'B1';
  const a1Words = ['apple', 'book', 'car', 'dog', 'eat', 'friend', 'good', 'happy', 'house', 'water', 'time', 'work', 'day', 'man', 'life'];
  const a2Words = ['travel', 'simple', 'decide', 'family', 'future', 'health', 'money', 'reason', 'season', 'weather', 'information'];
  const c1Words = ['meticulous', 'articulate', 'pragmatic', 'ubiquitous', 'lucid', 'scrutiny', 'paradigm', 'ephemeral', 'cogent', 'esoteric'];

  if (a1Words.includes(cleanWord)) level = 'A1';
  else if (a2Words.includes(cleanWord)) level = 'A2';
  else if (c1Words.includes(cleanWord) || cleanWord.endsWith('tion') && cleanWord.length > 10 || cleanWord.endsWith('ous') || cleanWord.endsWith('ic')) level = 'B2';
  if (cleanWord.length >= 11) level = 'C1';

  return {
    word: cleanWord,
    phonetic: phonetic || `/${cleanWord}/`,
    audio_url: audioUrl,
    part_of_speech: partOfSpeech,
    meaning_vi: meaningVi ? (meaningVi.charAt(0).toUpperCase() + meaningVi.slice(1)) : 'Tra cứu thêm để cập nhật nghĩa',
    meaning_en: meaningEn || `Definition and common usage of ${cleanWord}`,
    examples: formattedExamples.slice(0, 2),
    collocations: collocations.length > 0 ? collocations : [`use ${cleanWord}`, `apply ${cleanWord}`],
    level
  };
}
