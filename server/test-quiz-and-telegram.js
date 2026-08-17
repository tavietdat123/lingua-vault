import { quizService } from './src/services/quizService.js';
import { telegramService } from './src/services/telegramService.js';
import { initializeDatabase } from './src/db/database.js';
import { seedInitialData } from './src/db/seedData.js';

async function runTests() {
  console.log('🧪 ================= STARTING QUIZ & TELEGRAM TESTS =================');
  
  initializeDatabase();
  seedInitialData();

  // Test 1: Topics retrieval
  console.log('\n--- TEST 1: Get Topics ---');
  const topics = quizService.getTopics();
  console.log('✅ Topics found:', topics);
  if (!Array.isArray(topics) || topics.length === 0) {
    throw new Error('Topics test failed');
  }

  // Test 2: Quiz Generation
  console.log('\n--- TEST 2: Generate Quiz (Topic: All, Count: 5) ---');
  const quiz = quizService.generateQuiz({ topic: 'All', count: 5, mode: 'mixed' });
  console.log(`✅ Generated ${quiz.questions.length} questions for topic '${quiz.topic}'`);
  quiz.questions.forEach((q, idx) => {
    console.log(`  Q${idx + 1} [${q.type}]: ${q.promptSubtitle} -> "${q.questionText}"`);
    console.log(`    Options: ${JSON.stringify(q.options)}`);
    console.log(`    Correct: "${q.correctAnswer}"`);
    if (q.options.length < 2) throw new Error('Question must have at least 2 options');
    if (!q.options.includes(q.correctAnswer)) throw new Error('Correct answer missing from options');
  });

  // Test 3: Quiz Submission & Grading
  console.log('\n--- TEST 3: Submit and Grade Quiz ---');
  const mockAnswers = quiz.questions.map((q, idx) => ({
    id: q.id,
    word: q.word,
    questionText: q.questionText,
    correctAnswer: q.correctAnswer,
    userAnswer: idx === 0 ? 'wrong_answer_test' : q.correctAnswer
  }));

  const gradeResult = quizService.submitQuiz({ answers: mockAnswers });
  console.log('✅ Grading Result:');
  console.log(`   Score: ${gradeResult.score}% (${gradeResult.correctCount}/${gradeResult.totalQuestions})`);
  console.log(`   XP Earned: +${gradeResult.xpEarned} XP`);
  if (gradeResult.correctCount !== quiz.questions.length - 1) {
    throw new Error('Grading calculation mismatch');
  }

  // Test 4: Daily Goal & Telegram Progress
  console.log('\n--- TEST 4: Daily Goal Progress Check ---');
  const progress = telegramService.getDailyProgress();
  console.log('✅ Today Progress:', progress);
  if (typeof progress.dailyGoal !== 'number' || typeof progress.studiedToday !== 'number') {
    throw new Error('Daily progress format invalid');
  }

  console.log('\n🎉 ================= ALL QUIZ & TELEGRAM TESTS PASSED! =================\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
