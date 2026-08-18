/**
 * Telegram Bi-Directional AI Copilot & Interactive Bot Service
 * Handles Long Polling, AI Natural Language Q&A, Quick Word Capture, and Inline Quiz Challenges
 */

import { getDb } from '../db/database.js';
import { telegramService } from './telegramService.js';
import { callGemini } from './aiService.js';
import { quizService } from './quizService.js';
import { calculateNextSRS, GRADE } from './srsAlgorithm.js';
import crypto from 'node:crypto';

let isPolling = false;
let shouldStop = false;
let lastUpdateId = 0;

// User Quiz Challenge Sessions (in-memory state by chatId)
const activeQuizSessions = new Map();

export const telegramBotService = {
  // 1. Start Long Polling Daemon
  start: async () => {
    if (isPolling) return;
    isPolling = true;
    shouldStop = false;
    console.log('🤖 [Telegram Bot] Bi-directional AI Copilot & Long Polling daemon started.');

    telegramBotService.pollLoop().catch(err => {
      console.error('🤖 [Telegram Bot Poller Error]:', err);
      isPolling = false;
    });
  },

  // 2. Stop Polling
  stop: () => {
    shouldStop = true;
    isPolling = false;
    console.log('🛑 [Telegram Bot] Poller stopped.');
  },

  // 3. Long Polling Loop
  pollLoop: async () => {
    while (!shouldStop) {
      try {
        const db = getDb();
        const tokenRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_bot_token'").get();
        const botToken = tokenRow?.value;

        if (!botToken) {
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }

        const url = `https://api.telegram.org/bot${botToken}/getUpdates?offset=${lastUpdateId + 1}&timeout=20`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            lastUpdateId = update.update_id;
            await telegramBotService.handleUpdate(botToken, update);
          }
        } else if (!data.ok) {
          // If conflict or error, wait before retry
          await new Promise(r => setTimeout(r, 4000));
        }
      } catch (err) {
        // Network timeout or glitch, retry gracefully
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  },

  // 4. Handle Incoming Telegram Update (Message or Button Tap)
  handleUpdate: async (botToken, update) => {
    try {
      // Case A: Callback Query (User tapped an inline button)
      if (update.callback_query) {
        await telegramBotService.handleCallbackQuery(botToken, update.callback_query);
        return;
      }

      // Case B: Standard Text Message
      if (update.message && update.message.text) {
        await telegramBotService.handleTextMessage(botToken, update.message);
        return;
      }
    } catch (err) {
      console.error('Error handling Telegram update:', err);
    }
  },

  // 5. Handle Callback Queries (Inline Buttons: Quiz / Unlock Challenge)
  handleCallbackQuery: async (botToken, query) => {
    const chatId = query.message.chat.id;
    const data = query.data; // e.g. "quiz_ans:0:meticulous:correct" or "start_quiz_challenge"
    const messageId = query.message.message_id;

    // Acknowledge the callback immediately
    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: query.id })
    });

    if (data === 'check_status') {
      const progress = telegramService.getDailyProgress();
      const statusMsg = `
📊 <b>BÁO CÁO TIẾN ĐỘ HỌC TẬP HÔM NAY</b>

🎯 <b>Chỉ tiêu:</b> <code>${progress.studiedToday} / ${progress.dailyGoal} từ</code>
🔥 <b>Daily Streak:</b> <b>${progress.streak} ngày liên tục</b>
🧠 <b>Từ cũ cần ôn tập:</b> <b>${progress.totalDueCount} thẻ</b>
✅ <b>Trạng thái:</b> ${progress.isGoalMet ? '🎉 Đã hoàn thành chỉ tiêu hôm nay!' : `⚡ Còn thiếu ${progress.remaining} từ`}

👉 <a href="http://localhost:3000">Mở LinguaVault Web Hub</a>
      `.trim();
      await telegramService.sendMessage(botToken, chatId, statusMsg);
      return;
    }

    if (data === 'start_quiz_challenge') {
      // Start 3-Question Unlock Challenge
      const session = {
        score: 0,
        currentQuestion: 0,
        total: 3,
        questions: quizService.generateQuiz({ topic: 'All', count: 3 }).questions
      };
      activeQuizSessions.set(chatId, session);
      await telegramBotService.sendQuizChallengeQuestion(botToken, chatId, session);
      return;
    }

    if (data.startsWith('quiz_ans:')) {
      const parts = data.split(':');
      const isCorrect = parts[3] === '1';
      const word = parts[2];
      const session = activeQuizSessions.get(chatId);

      if (session) {
        if (isCorrect) session.score++;
        session.currentQuestion++;

        if (session.currentQuestion < session.total) {
          await telegramBotService.sendQuizChallengeQuestion(botToken, chatId, session);
        } else {
          // Finished Quiz Challenge
          const isPassed = session.score >= 2;
          activeQuizSessions.delete(chatId);

          if (isPassed) {
            const successMsg = `
🎉 <b>XUẤT SẮC! BẠN ĐÃ GIẢI MÃ THÀNH CÔNG NHIỆM VỤ!</b>

📊 <b>Kết quả:</b> Đúng <b>${session.score}/${session.total} câu</b>
✅ <b>Trạng thái:</b> Đã TẮT còi báo động hôm nay & Chuỗi Streak 🔥 được bảo vệ an toàn!

<i>Chúc bạn một buổi tối tuyệt vời! Hẹn gặp lại bạn vào ngày mai 🚀</i>
            `.trim();
            await telegramService.sendMessage(botToken, chatId, successMsg);
          } else {
            const retryMsg = `
❌ <b>CHƯA ĐẠT CHỈ TIÊU (Đúng ${session.score}/${session.total} câu)</b>

Báo động vẫn đang kích hoạt! Hãy bấm nút bên dưới để thử lại ngay một lượt trắc nghiệm khác:
            `.trim();
            await telegramService.sendMessageWithButtons(botToken, chatId, retryMsg, [
              [{ text: '⚡ Thử Lại Thử Thách Quiz', callback_data: 'start_quiz_challenge' }]
            ]);
          }
        }
      } else {
        // Single Quiz mode answer
        const feedback = isCorrect 
          ? `✅ <b>Chính xác!</b> Bạn đã trả lời đúng từ <b>${word.toUpperCase()}</b> (+10 XP) 🏆`
          : `❌ <b>Chưa chính xác!</b> Hãy ôn lại từ <b>${word.toUpperCase()}</b> nhé!`;
        await telegramService.sendMessage(botToken, chatId, feedback);
      }
    }
  },

  // 6. Send Next Question in Quiz Challenge
  sendQuizChallengeQuestion: async (botToken, chatId, session) => {
    const q = session.questions[session.currentQuestion];
    const qNum = session.currentQuestion + 1;

    const questionText = `
🎯 <b>CÂU HỎI THỬ THÁCH ${qNum}/${session.total}:</b>

👉 <b>${q.questionText}</b>
${q.type === 'listening' ? `🔊 <i>Nghe và chọn nghĩa của từ: "${q.word}"</i>` : ''}

<i>Hãy chọn đáp án đúng bên dưới:</i>
    `.trim();

    const buttons = q.options.map(opt => {
      const isCorrect = opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase() ? '1' : '0';
      return [{
        text: opt,
        callback_data: `quiz_ans:${qNum}:${q.word}:${isCorrect}`
      }];
    });

    await telegramService.sendMessageWithButtons(botToken, chatId, questionText, buttons);
  },

  // 7. Handle Text Message (Commands & Natural Language AI Copilot)
  handleTextMessage: async (botToken, msg) => {
    const chatId = msg.chat.id;
    const text = msg.text.trim();
    const db = getDb();

    // ----------------------------------------------------
    // 7.1: Built-in Slash Commands
    // ----------------------------------------------------
    if (text === '/start') {
      const welcome = `
👋 <b>XIN CHÀO! TÔI LÀ LINGUAVAULT AI COPILOT 🤖</b>

Tôi là trợ lý tiếng Anh cá nhân kết nối trực tiếp với <b>Kho Dữ Liệu LinguaVault</b> của bạn.

⚡ <b>Bạn có thể trò chuyện hoặc dùng các lệnh nhanh:</b>
• 📊 <code>/status</code> hoặc <code>/stats</code> : Xem tiến độ học & Streak hôm nay.
• 🧠 <code>/due</code> : Nhận danh sách các từ cũ đến hạn ôn tập.
• 🎯 <code>/quiz</code> : Làm bài trắc nghiệm nhanh ngay trong chat.
• ➕ <code>/add [từ/câu]</code> : Thêm từ mới tự động bóc tách vào kho.
• 💬 <i>Hoặc nhắn bất kỳ câu hỏi nào bằng tiếng Anh / tiếng Việt (Ví dụ: "Giải thích từ resilient", "Trong kho có từ nào level C1 không?").</i>
      `.trim();
      await telegramService.sendMessage(botToken, chatId, welcome);
      return;
    }

    if (text === '/status' || text === '/stats') {
      const progress = telegramService.getDailyProgress();
      const statusMsg = `
📊 <b>BÁO CÁO TIẾN ĐỘ HỌC TẬP HÔM NAY</b>

🎯 <b>Chỉ tiêu:</b> <code>${progress.studiedToday} / ${progress.dailyGoal} từ</code>
🔥 <b>Daily Streak:</b> <b>${progress.streak} ngày liên tục</b>
🧠 <b>Từ cũ cần ôn tập:</b> <b>${progress.totalDueCount} thẻ</b>
✅ <b>Trạng thái:</b> ${progress.isGoalMet ? '🎉 Đã hoàn thành chỉ tiêu hôm nay!' : `⚡ Còn thiếu ${progress.remaining} từ`}

👉 <a href="http://localhost:3000">Mở LinguaVault Web Hub</a>
      `.trim();
      await telegramService.sendMessage(botToken, chatId, statusMsg);
      return;
    }

    if (text === '/due') {
      await telegramService.sendDueReviewReminder(true);
      return;
    }

    if (text === '/quiz') {
      const quiz = quizService.generateQuiz({ topic: 'All', count: 1 });
      if (quiz.questions && quiz.questions.length > 0) {
        const q = quiz.questions[0];
        const qText = `
🎯 <b>CÂU HỎI TRẮC NGHIỆM FLASH QUIZ</b>

👉 <b>${q.questionText}</b>
${q.type === 'listening' ? `🔊 <i>Nghe và chọn nghĩa của: "${q.word}"</i>` : ''}

<i>Chọn 1 đáp án đúng bên dưới:</i>
        `.trim();

        const buttons = q.options.map(opt => {
          const isCorrect = opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase() ? '1' : '0';
          return [{
            text: opt,
            callback_data: `quiz_ans:1:${q.word}:${isCorrect}`
          }];
        });

        await telegramService.sendMessageWithButtons(botToken, chatId, qText, buttons);
      }
      return;
    }

    // ----------------------------------------------------
    // 7.2: Quick Capture Add Word Command (/add <word>)
    // ----------------------------------------------------
    if (text.startsWith('/add ') || text.toLowerCase().startsWith('thêm từ ')) {
      const target = text.replace(/^\/add\s+/i, '').replace(/^thêm từ\s+/i, '').trim();
      await telegramBotService.handleQuickAddWord(botToken, chatId, target);
      return;
    }

    // ----------------------------------------------------
    // 7.3: Natural Language AI Copilot with Vault Context
    // ----------------------------------------------------
    await telegramBotService.handleAIChat(botToken, chatId, text);
  },

  // 8. Quick Word Enrichment & Database Insertion
  handleQuickAddWord: async (botToken, chatId, targetInput) => {
    try {
      const db = getDb();
      await telegramService.sendMessage(botToken, chatId, `⏳ Đang bóc tách & lưu từ vựng: <b>${targetInput}</b>...`);

      let parsedData = null;

      // Try AI Enrichment with Gemini first
      try {
        const prompt = `
Phân tích từ/cụm từ tiếng Anh sau và trả về JSON thuần túy (không markdown):
Từ/Cụm từ: "${targetInput}"

Format JSON:
{
  "word": "từ tiếng anh chuẩn",
  "phonetic": "/phiên âm IPA/",
  "part_of_speech": "noun | verb | adjective | phrase",
  "meaning_vi": "nghĩa tiếng Việt súc tích, chuẩn xác",
  "meaning_en": "english definition",
  "collocations": ["collocation 1", "collocation 2"],
  "examples": ["Ví dụ thực tế tiếng Anh 1", "Ví dụ 2"],
  "level": "B1 | B2 | C1 | C2"
}
        `.trim();

        const aiRes = await callGemini(prompt);
        const cleaned = aiRes.replace(/```json/gi, '').replace(/```/g, '').trim();
        parsedData = JSON.parse(cleaned);
      } catch (aiErr) {
        // Fallback: Free Dictionary API
        try {
          const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(targetInput)}`);
          if (dictRes.ok) {
            const dictData = await dictRes.json();
            if (Array.isArray(dictData) && dictData[0]) {
              const entry = dictData[0];
              const meaningObj = entry.meanings?.[0];
              const defObj = meaningObj?.definitions?.[0];
              parsedData = {
                word: entry.word || targetInput,
                phonetic: entry.phonetic || entry.phonetics?.[0]?.text || '',
                part_of_speech: meaningObj?.partOfSpeech || 'noun',
                meaning_vi: defObj?.definition || 'Từ vựng mới thêm qua Telegram',
                meaning_en: defObj?.definition || '',
                collocations: [],
                examples: defObj?.example ? [defObj.example] : [],
                level: 'B2'
              };
            }
          }
        } catch (e) {}

        if (!parsedData) {
          parsedData = {
            word: targetInput,
            phonetic: '',
            part_of_speech: 'noun',
            meaning_vi: 'Đã lưu nhanh từ Telegram',
            meaning_en: '',
            collocations: [],
            examples: [],
            level: 'B2'
          };
        }
      }

      // Insert into SQLite words table
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const today = now.split('T')[0];

      db.prepare(`
        INSERT INTO words (
          id, word, phonetic, audio_url, part_of_speech, meaning_vi, meaning_en,
          collocations, examples, tags, level, repetition, interval, ease_factor,
          due_date, status, created_at, updated_at
        ) VALUES (
          ?, ?, ?, '', ?, ?, ?,
          ?, ?, '["Telegram", "Quick-Capture"]', ?, 0, 0, 2.5,
          ?, 'new', ?, ?
        )
      `).run(
        id,
        parsedData.word,
        parsedData.phonetic || '',
        parsedData.part_of_speech || 'noun',
        parsedData.meaning_vi,
        parsedData.meaning_en || '',
        JSON.stringify(parsedData.collocations || []),
        JSON.stringify(parsedData.examples || []),
        parsedData.level || 'B2',
        today,
        now,
        now
      );

      const successCard = `
✅ <b>ĐÃ LƯU THÀNH CÔNG VÀO KHO TỪ VỰNG!</b>

🔹 <b>${parsedData.word.toUpperCase()}</b> <code>${parsedData.phonetic || ''}</code> (${parsedData.part_of_speech})
🇻🇳 <b>Nghĩa:</b> ${parsedData.meaning_vi}
📊 <b>Level:</b> <code>${parsedData.level}</code>
${parsedData.examples && parsedData.examples.length > 0 ? `💡 <b>Ví dụ:</b> <i>"${parsedData.examples[0]}"</i>` : ''}

<i>Từ này đã được đưa vào chu kỳ ôn tập Spaced Repetition SM-2 trên LinguaVault! 🚀</i>
      `.trim();

      await telegramService.sendMessage(botToken, chatId, successCard);
    } catch (err) {
      console.error('Quick add word error:', err);
      await telegramService.sendMessage(botToken, chatId, `❌ Lỗi khi thêm từ: ${err.message}`);
    }
  },

  // 9. AI Copilot Multi-Turn Chat with Vault Context
  handleAIChat: async (botToken, chatId, userMessage) => {
    try {
      const db = getDb();

      // Retrieve full context from SQLite Vault
      const totalWordsRow = db.prepare('SELECT COUNT(*) as count FROM words').get();
      const sampleWords = db.prepare('SELECT word, meaning_vi, level, due_date FROM words ORDER BY created_at DESC LIMIT 15').all();
      const progress = telegramService.getDailyProgress();

      const vaultContext = `
Thông tin Kho Dữ Liệu LinguaVault của người dùng hiện tại:
- Tổng số từ vựng đã lưu: ${totalWordsRow.count} từ.
- Tiến độ hôm nay: Đã học ${progress.studiedToday} / ${progress.dailyGoal} từ.
- Chuỗi Streak: ${progress.streak} ngày liên tục.
- Số từ cũ đến hạn ôn tập hôm nay: ${progress.totalDueCount} từ.
- Danh sách từ vựng gần đây trong kho:
${sampleWords.map(w => `• ${w.word} (${w.level}): ${w.meaning_vi}`).join('\n')}
      `.trim();

      const systemPrompt = `
Bạn là LinguaVault AI Copilot - Trợ lý thông minh cao cấp cho người học tiếng Anh trên ứng dụng LinguaVault.
Bạn đang giao tiếp trực tiếp qua Telegram với chủ nhân của kho từ vựng.

NGỮ CẢNH HỆ THỐNG:
${vaultContext}

NHIỆM VỤ CỦA BẠN:
1. Trả lời các câu hỏi về kho từ vựng, tiến độ, gợi ý cách học Spaced Repetition hiệu quả.
2. Nếu người dùng hỏi về từ vựng (nghĩa, collocations, ngữ pháp), giải thích ngắn gọn, súc tích, trực quan, có ví dụ thực tế.
3. Nếu người dùng muốn thêm từ, hướng dẫn họ dùng cú pháp /add [từ] hoặc trả lời tự nhiên để bóc tách.
4. Giọng điệu: Thân thiện, truyền cảm hứng, chuyên nghiệp, thông minh, dùng emoji sinh động.
5. Luôn định dạng câu trả lời bằng chuẩn HTML Telegram (<b>, <i>, <code>, <a>). KHÔNG dùng markdown dạng **bold** hay ###.

Câu hỏi của người dùng: "${userMessage}"
      `.trim();

      let aiReply;
      try {
        aiReply = await callGemini(systemPrompt);
      } catch (aiErr) {
        // Safe contextual answer if Gemini API key not configured yet
        aiReply = `
🤖 <b>LinguaVault Copilot Thông Báo:</b>

Tôi đã nhận câu hỏi: <i>"${userMessage}"</i>.
📊 <b>Kho của bạn hiện có:</b> <b>${totalWordsRow.count} từ vựng</b> | Chuỗi Streak: <b>${progress.streak} ngày 🔥</b>

💡 <i>Để kích hoạt toàn bộ trí tuệ nhân tạo trả lời chuyên sâu, bạn hãy nhập Google Gemini API Key miễn phí trong mục Cài Đặt trên App nhé!</i>

👉 <b>Các lệnh nhanh bạn có thể dùng ngay:</b>
• <code>/status</code> - Xem tiến độ hôm nay
• <code>/due</code> - Xem danh sách từ cũ cần ôn
• <code>/quiz</code> - Làm bài trắc nghiệm nhanh
• <code>/add [từ]</code> - Thêm từ vựng mới vào kho
        `.trim();
      }

      await telegramService.sendMessage(botToken, chatId, aiReply);
    } catch (err) {
      console.error('Telegram AI Chat error:', err);
      await telegramService.sendMessage(botToken, chatId, `⚠️ Trợ lý AI đang bận một chút: ${err.message}`);
    }
  }
};
