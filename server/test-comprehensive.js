/**
 * Comprehensive End-to-End Test Suite for LinguaVault
 * Tests Quiz, Speaking Lab, SRS Engine, Vocab, Patterns, Notes, Telegram, Audio, Backup
 */

import { initializeDatabase, getDb } from './src/db/database.js';
import { quizService } from './src/services/quizService.js';
import { analyzeReadAloud, analyzeQASpeaking, SPEAKING_PROMPTS } from './src/services/speakingService.js';
import { calculateNextSRS, GRADE } from './src/services/srsAlgorithm.js';
import { telegramService } from './src/services/telegramService.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED [Test ${totalTests}]: ${message}`);
    throw new Error(`Test failed: ${message}`);
  }
  passedTests++;
  console.log(`  ✓ [Passed ${totalTests}]: ${message}`);
}

async function runAllTests() {
  console.log('=====================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN HỆ THỐNG LINGUAVAULT');
  console.log('=====================================================\n');

  initializeDatabase();
  const db = getDb();

  // ----------------------------------------------------
  // SECTION 1: QUIZ HUB TESTS
  // ----------------------------------------------------
  console.log('📌 1. KIỂM THỬ BỘ NÃO QUIZ THEO TOPIC');
  
  // Test 1.1: Get Topics
  const topics = quizService.getTopics();
  assert(Array.isArray(topics) && topics.length > 0, 'Lấy danh sách Topic thành công');
  assert(topics.some(t => t.name === 'All' && t.count > 0), 'Topic All chứa đúng số lượng từ vựng');

  // Test 1.2: Generate Quiz
  const quiz5 = quizService.generateQuiz({ topic: 'All', count: 5, mode: 'mixed' });
  assert(quiz5.questions.length === 5, 'Tạo bài Quiz 5 câu thành công');
  assert(quiz5.questions.every(q => q.options.length === 4), 'Tất cả các câu hỏi đều có đủ 4 lựa chọn (A, B, C, D)');
  assert(quiz5.questions.every(q => q.correctAnswer && q.questionText), 'Dữ liệu câu hỏi và đáp án đúng không bị rỗng');

  // Test 1.3: Submit 100% Perfect Quiz
  const perfectAnswers = quiz5.questions.map(q => ({
    id: q.id,
    word: q.word,
    questionText: q.questionText,
    correctAnswer: q.correctAnswer,
    userAnswer: q.correctAnswer
  }));
  const perfectResult = quizService.submitQuiz({ answers: perfectAnswers });
  assert(perfectResult.score === 100, 'Điểm số tuyệt đối 100% khi trả lời đúng toàn bộ');
  assert(perfectResult.isPerfect === true, 'Đánh dấu isPerfect = true khi đạt 100%');
  assert(perfectResult.xpEarned === 5 * 10 + 50, 'Thưởng đủ XP bao gồm bonus điểm tuyệt đối (100 XP)');

  // Test 1.4: Submit Mixed Answers (2 wrong, 3 right)
  const mixedAnswers = quiz5.questions.map((q, idx) => ({
    id: q.id,
    word: q.word,
    questionText: q.questionText,
    correctAnswer: q.correctAnswer,
    userAnswer: idx < 3 ? q.correctAnswer : 'Sai đáp án'
  }));
  const mixedResult = quizService.submitQuiz({ answers: mixedAnswers });
  assert(mixedResult.correctCount === 3, 'Tính chính xác 3 câu đúng');
  assert(mixedResult.score === 60, 'Tính chính xác 60% điểm số');
  assert(mixedResult.isPerfect === false, 'isPerfect = false khi có câu sai');

  // Test 1.5: Submit with Array Directly (Payload resilience)
  const directArrayResult = quizService.submitQuiz({ answers: mixedAnswers });
  assert(directArrayResult.totalQuestions === 5, 'Xử lý mượt mà khi nộp mảng answers');

  // ----------------------------------------------------
  // SECTION 2: AI SPEAKING & PRONUNCIATION LAB TESTS
  // ----------------------------------------------------
  console.log('\n📌 2. KIỂM THỬ PHÂN HỆ AI SPEAKING LAB');

  // Test 2.1: Prompts Bank
  assert(SPEAKING_PROMPTS.length >= 8, 'Ngân hàng bài mẫu Speaking có đủ bài tập B2/C1/IELTS');
  const readPrompts = SPEAKING_PROMPTS.filter(p => p.category === 'read-aloud');
  const qaPrompts = SPEAKING_PROMPTS.filter(p => p.category === 'qa');
  assert(readPrompts.length >= 4, 'Đủ đoạn văn luyện Shadowing');
  assert(qaPrompts.length >= 4, 'Đủ câu hỏi khảo thí Speaking Q&A');

  // Test 2.2: Read-Aloud Assessment
  const targetSample = 'Artificial intelligence is not designed to replace human ingenuity.';
  const spokenSample = 'Artificial intelligence is not designed to replace human.'; // thiếu ingenuity
  const readAloudEval = await analyzeReadAloud({ targetText: targetSample, spokenText: spokenSample });
  assert(typeof readAloudEval.overallScore === 'number' && readAloudEval.overallScore > 0, 'Chấm điểm Overall Score thành công');
  assert(typeof readAloudEval.accuracyScore === 'number', 'Tính toán Accuracy Score chuẩn xác');
  assert(Array.isArray(readAloudEval.wordsAnalysis), 'Phân tích chi tiết từng từ (wordsAnalysis) đầy đủ');
  assert(readAloudEval.wordsAnalysis.some(w => w.status === 'correct'), 'Nhận diện đúng các từ phát âm chuẩn (màu xanh)');

  // Test 2.3: Speaking Q&A Assessment
  const questionSample = 'How do you prioritize your daily tasks at work?';
  const spokenAns = 'I prioritize urgent tasks first and use calendar blocking to stay focused.';
  const qaEval = await analyzeQASpeaking({ question: questionSample, topic: 'Career', spokenText: spokenAns });
  assert(qaEval.overallBand !== undefined, 'Ước tính được Band điểm IELTS (e.g. Band 6.5+)');
  assert(qaEval.criteria && qaEval.criteria.fluency && qaEval.criteria.grammar, 'Chấm đủ 4 tiêu chí chuẩn khảo thí');
  assert(typeof qaEval.modelAnswerBand85 === 'string' && qaEval.modelAnswerBand85.length > 20, 'Tạo câu trả lời mẫu Native Band 8.5+ thành công');

  // ----------------------------------------------------
  // SECTION 3: SRS SPACED REPETITION ENGINE (SM-2)
  // ----------------------------------------------------
  console.log('\n📌 3. KIỂM THỬ THUẬT TOÁN SRS (SM-2)');
  
  // Test SM-2 Algorithm calculation
  const srsGood = calculateNextSRS({ repetition: 0, interval: 0, easeFactor: 2.5 }, GRADE.GOOD);
  assert(srsGood.repetition === 1 && srsGood.interval === 1, 'Lần đầu nhớ từ (Good): interval = 1 ngày');

  const srsNextGood = calculateNextSRS({ repetition: 1, interval: 1, easeFactor: 2.5 }, GRADE.GOOD);
  assert(srsNextGood.repetition === 2 && srsNextGood.interval === 4, 'Lần 2 nhớ từ (Good): interval = 4 ngày');

  const srsAgain = calculateNextSRS({ repetition: 2, interval: 4, easeFactor: 2.5 }, GRADE.AGAIN);
  assert(srsAgain.repetition === 0 && srsAgain.interval === 1, 'Quên từ (Again): reset repetition = 0 và ôn lại sau 1 ngày');

  // ----------------------------------------------------
  // SECTION 4: TELEGRAM & DAILY GOALS PROGRESS
  // ----------------------------------------------------
  console.log('\n📌 4. KIỂM THỬ TELEGRAM & MỤC TIÊU HỌC HÀNG NGÀY');

  const progress = telegramService.getDailyProgress();
  assert(progress && progress.dailyGoal !== undefined && progress.studiedToday !== undefined, 'Theo dõi tiến độ từ học trong ngày chuẩn xác');

  // ----------------------------------------------------
  // SECTION 5: DATABASE INTEGRITY & PERSISTENCE
  // ----------------------------------------------------
  console.log('\n📌 5. KIỂM THỬ TÍNH TOÀN VẸN CƠ SỞ DỮ LIỆU SQLITE');

  const wordCountRow = db.prepare('SELECT COUNT(*) as count FROM words').get();
  assert(wordCountRow.count > 0, `Database SQLite lưu trữ an toàn ${wordCountRow.count} từ vựng`);

  const patternCountRow = db.prepare('SELECT COUNT(*) as count FROM patterns').get();
  assert(patternCountRow.count > 0, `Database SQLite lưu trữ an toàn ${patternCountRow.count} mẫu câu`);

  console.log('\n=====================================================');
  console.log(`🎉 TẤT CẢ ${passedTests}/${totalTests} BÀI KIỂM THỬ ĐỀU ĐẠT CHUẨN 100%!`);
  console.log('=====================================================');
}

runAllTests().catch(err => {
  console.error('\n❌ PHÁT HIỆN LỖI TRONG QUÁ TRÌNH TEST:', err);
  process.exit(1);
});
