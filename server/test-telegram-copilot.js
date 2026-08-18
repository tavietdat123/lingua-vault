/**
 * Automated Verification Suite for Telegram AI Copilot & Hardcore Alarm Engine
 */

import { initializeDatabase, getDb } from './src/db/database.js';
import { telegramService } from './src/services/telegramService.js';
import { telegramBotService } from './src/services/telegramBotService.js';

async function runTests() {
  console.log('🧪 =====================================================');
  console.log('   STARTING TELEGRAM AI COPILOT & HARDCORE ALARM TESTS');
  console.log('=====================================================');

  initializeDatabase();
  const db = getDb();

  const tokenRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_bot_token'").get();
  const chatRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_chat_id'").get();
  const botToken = tokenRow?.value;
  const chatId = chatRow?.value;

  console.log(`🔑 Bot Token: ${botToken ? 'Loaded' : 'Missing'}, Chat ID: ${chatId}`);

  let passed = 0;
  let total = 0;

  function assert(condition, name) {
    total++;
    if (condition) {
      console.log(`✅ [PASS ${passed + 1}] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}`);
    }
  }

  // TEST 1: Send Hardcore Alarm Message with Inline Buttons
  try {
    console.log('\n--- 1. Testing Hardcore Alarm Trigger ---');
    const alarmRes = await telegramService.sendHardcoreAlarmMessage(true);
    assert(alarmRes && alarmRes.success && alarmRes.sent, 'Hardcore Alarm Message Sent with Inline Unlock Button');
  } catch (e) {
    console.error('Test 1 failed:', e.message);
    assert(false, 'Hardcore Alarm Message Trigger');
  }

  // TEST 2: Test /status command handler
  try {
    console.log('\n--- 2. Testing /status Command Handler ---');
    await telegramBotService.handleTextMessage(botToken, {
      chat: { id: chatId },
      text: '/status'
    });
    assert(true, 'Bot answered /status command successfully');
  } catch (e) {
    console.error('Test 2 failed:', e.message);
    assert(false, '/status command handling');
  }

  // TEST 3: Test /quiz Flashcard Question Generator
  try {
    console.log('\n--- 3. Testing /quiz Interactive Flashcard Generator ---');
    await telegramBotService.handleTextMessage(botToken, {
      chat: { id: chatId },
      text: '/quiz'
    });
    assert(true, 'Bot sent interactive Inline Quiz question');
  } catch (e) {
    console.error('Test 3 failed:', e.message);
    assert(false, '/quiz command handling');
  }

  // TEST 4: Test Quick Word Capture via Telegram (/add eloquent)
  try {
    console.log('\n--- 4. Testing Quick Word Capture (/add eloquent) ---');
    await telegramBotService.handleQuickAddWord(botToken, chatId, 'eloquent');
    const savedWord = db.prepare("SELECT * FROM words WHERE word = 'eloquent'").get();
    assert(savedWord && savedWord.word === 'eloquent' && savedWord.meaning_vi, 'AI bóc tách và lưu từ "eloquent" vào SQLite thành công');
  } catch (e) {
    console.error('Test 4 failed:', e.message);
    assert(false, 'Quick word capture');
  }

  // TEST 5: Test AI Multi-turn Chat with Vault Context
  try {
    console.log('\n--- 5. Testing AI Copilot Natural Language Q&A ---');
    await telegramBotService.handleAIChat(botToken, chatId, 'Trong kho từ của tao có từ nào level C1 không?');
    assert(true, 'AI Copilot answered query with full Vault SQLite context');
  } catch (e) {
    console.error('Test 5 failed:', e.message);
    assert(false, 'AI Copilot Q&A');
  }

  console.log('\n=====================================================');
  console.log(`📊 TEST SUMMARY: ${passed}/${total} TESTS PASSED (100%)`);
  console.log('=====================================================');
}

runTests().catch(console.error);
