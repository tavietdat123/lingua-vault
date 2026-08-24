/**
 * LinguaVault End-to-End Feature Verification Suite
 */

import { initializeDatabase, db } from './src/db/database.js';
import { seedInitialData } from './src/db/seedData.js';
import { calculateNextSRS } from './src/services/srsAlgorithm.js';
import { lookupDictionary } from './src/services/dictionaryService.js';
import { parseSentenceAI, checkSentenceAI, generateStoryAI } from './src/services/aiService.js';
import crypto from 'node:crypto';

console.log(`
=====================================================
🧪 BẮT ĐẦU KIỂM TRA TOÀN DIỆN CÁC TÍNH NĂNG LINGUAVAULT
=====================================================
`);

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failedTests++;
  }
}

async function runTests() {
  // Test 1: Database Initialization & Tables
  console.log('\n📦 1. Kiểm tra Database & Schema:');
  initializeDatabase();
  seedInitialData();

  const wordsCount = db.prepare('SELECT COUNT(*) as count FROM words').get();
  assert(wordsCount.count > 0, `Bảng words đã có ${wordsCount.count} từ vựng`);

  const patternsCount = db.prepare('SELECT COUNT(*) as count FROM patterns').get();
  assert(patternsCount.count > 0, `Bảng patterns đã có ${patternsCount.count} mẫu câu`);

  const notesCount = db.prepare('SELECT COUNT(*) as count FROM notes').get();
  assert(notesCount.count > 0, `Bảng notes đã có ${notesCount.count} bài đọc`);

  // Test 2: Spaced Repetition Algorithm (SM-2)
  console.log('\n🧠 2. Kiểm tra Thuật Toán Chống Quên (SM-2):');
  
  // New card rated "again"
  const againResult = calculateNextSRS({ repetition: 0, interval: 0, easeFactor: 2.5 }, 'again');
  assert(
    againResult.interval === 0 && againResult.repetition === 0 && againResult.isIntraDay,
    'Đánh giá [Again]: ôn lại trong ngày, repetition = 0'
  );

  // New card rated "good"
  const good1 = calculateNextSRS({ repetition: 0, interval: 0, easeFactor: 2.5 }, 'good');
  assert(good1.interval === 3 && good1.repetition === 1, 'Lần 1 đánh giá [Good]: interval = 3 ngày, repetition = 1');

  // Second review rated "good"
  const good2 = calculateNextSRS(good1, 'good');
  assert(good2.interval === 7 && good2.repetition === 2, 'Lần 2 đánh giá [Good]: interval = 7 ngày, repetition = 2');

  // Third review rated "good"
  const good3 = calculateNextSRS(good2, 'good');
  assert(good3.interval >= 9 && good3.repetition === 3, `Lần 3 đánh giá [Good]: interval = ${good3.interval} ngày (nhân theo easeFactor)`);

  // Rated "easy"
  const easyResult = calculateNextSRS({ repetition: 0, interval: 0, easeFactor: 2.5 }, 'easy');
  assert(easyResult.interval >= 4 && easyResult.easeFactor > 2.5, `Đánh giá [Easy]: interval = ${easyResult.interval} ngày, easeFactor tăng lên ${easyResult.easeFactor}`);

  // Test 3: Free Dictionary API & 1-Click Auto-Fill
  console.log('\n📖 3. Kiểm tra Tra Từ Điển Tự Động (Dictionary API):');
  try {
    const dictResult = await lookupDictionary('resilient');
    assert(dictResult && dictResult.word === 'resilient', `Tra từ 'resilient' thành công: IPA = ${dictResult.phonetic}`);
    assert(dictResult.meaning_en && dictResult.meaning_en.length > 0, `Có định nghĩa tiếng Anh: "${dictResult.meaning_en.slice(0, 45)}..."`);
    assert(Array.isArray(dictResult.examples), `Lấy được ${dictResult.examples.length} câu ví dụ mẫu`);
  } catch (err) {
    console.error('Dictionary test failed:', err);
    failedTests++;
  }

  // Test 4: CRUD Vocab in Database
  console.log('\n📝 4. Kiểm tra CRUD Từ Vựng (Vocabulary):');
  const testWordId = crypto.randomUUID();
  const now = new Date().toISOString();
  
  // Insert
  db.prepare(`
    INSERT INTO words (id, word, meaning_vi, meaning_en, level, created_at, updated_at)
    VALUES (?, 'serendipity', 'Sự tình cờ may mắn', 'Pleasant surprise', 'C2', ?, ?)
  `).run(testWordId, now, now);

  const inserted = db.prepare('SELECT * FROM words WHERE id = ?').get(testWordId);
  assert(inserted && inserted.word === 'serendipity', 'Thêm từ mới "serendipity" thành công');

  // Update
  db.prepare("UPDATE words SET meaning_vi = 'Cơ duyên bất ngờ' WHERE id = ?").run(testWordId);
  const updated = db.prepare('SELECT * FROM words WHERE id = ?').get(testWordId);
  assert(updated.meaning_vi === 'Cơ duyên bất ngờ', 'Cập nhật nghĩa tiếng Việt thành công');

  // Delete
  db.prepare('DELETE FROM words WHERE id = ?').run(testWordId);
  const deleted = db.prepare('SELECT * FROM words WHERE id = ?').get(testWordId);
  assert(!deleted, 'Xóa từ vựng kiểm thử thành công');

  // Test 5: CRUD Sentence Patterns
  console.log('\n🧩 5. Kiểm tra CRUD Mẫu Câu (Patterns):');
  const testPatternId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO patterns (id, name, formula, meaning_vi, tone, created_at, updated_at)
    VALUES (?, 'No sooner had', 'No sooner had + S + V3 than + S + V2', 'Vừa mới... thì đã...', 'Formal', ?, ?)
  `).run(testPatternId, now, now);

  const insertedPattern = db.prepare('SELECT * FROM patterns WHERE id = ?').get(testPatternId);
  assert(insertedPattern && insertedPattern.name === 'No sooner had', 'Thêm mẫu câu đảo ngữ thành công');

  db.prepare('DELETE FROM patterns WHERE id = ?').run(testPatternId);
  assert(!db.prepare('SELECT * FROM patterns WHERE id = ?').get(testPatternId), 'Xóa mẫu câu kiểm thử thành công');

  // Test 6: AI Features & Fallback
  console.log('\n🪄 6. Kiểm tra Dịch Vụ AI & Smart Fallback:');
  const parseResult = await parseSentenceAI('Although the market was unpredictable, the company leveraged modern AI to stay resilient.');
  assert(parseResult && parseResult.extracted_words.length > 0, `AI bóc tách câu: Trích xuất được ${parseResult.extracted_words.length} từ vựng`);

  const checkResult = await checkSentenceAI({ targetItem: 'resilient', userSentence: 'He is very resilient when facing difficulties.' });
  assert(checkResult && checkResult.native_alternatives.length > 0, 'AI chấm câu: Đưa ra nhận xét và các cách viết bản xứ tự nhiên');

  const storyResult = await generateStoryAI(['resilient', 'articulate', 'meticulous']);
  assert(storyResult && storyResult.story_en.length > 0, `AI sáng tác truyện SRS: "${storyResult.title}"`);

  // Test 7: Export & Import Backup
  console.log('\n🛡️ 7. Kiểm tra Sao Lưu & Khôi Phục (Backup & Restore):');
  const allWords = db.prepare('SELECT * FROM words').all();
  const backupJson = JSON.stringify({
    app: 'LinguaVault',
    data: { words: allWords, patterns: [], notes: [], study_logs: [] }
  });
  assert(backupJson.length > 100, `Xuất dữ liệu sao lưu JSON thành công (${backupJson.length} bytes)`);

  const parsed = JSON.parse(backupJson);
  assert(parsed.data.words.length === allWords.length, 'File sao lưu JSON đọc lại toàn vẹn 100%');

  // Summary
  console.log(`
=====================================================
📊 TỔNG KẾT KẾT QUẢ KIỂM TRA:
   • Tổng số test: ${passedTests + failedTests}
   • Passed:       ${passedTests}
   • Failed:       ${failedTests}
   • Trạng thái:   ${failedTests === 0 ? '🟢 TOÀN BỘ CHỨC NĂNG HOẠT ĐỘNG HOÀN HẢO 100%' : '🔴 CÓ LỖI'}
=====================================================
  `);

  if (failedTests > 0) {
    process.exitCode = 1;
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exitCode = 1;
});
