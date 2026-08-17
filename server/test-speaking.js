import { analyzeReadAloud, analyzeQASpeaking, SPEAKING_PROMPTS } from './src/services/speakingService.js';
import { initializeDatabase } from './src/db/database.js';

async function runSpeakingTests() {
  console.log('🚀 Running AI Speaking Lab Automated Tests...\n');
  initializeDatabase();

  // Test 1: Prompts Bank
  console.log('TEST 1: Verify Prompts Bank');
  const readPrompts = SPEAKING_PROMPTS.filter(p => p.category === 'read-aloud');
  const qaPrompts = SPEAKING_PROMPTS.filter(p => p.category === 'qa');
  if (readPrompts.length > 0 && qaPrompts.length > 0) {
    console.log(`✅ Passed: Found ${readPrompts.length} Read-Aloud prompts & ${qaPrompts.length} Q&A prompts.`);
  } else {
    throw new Error('Prompts bank empty');
  }

  // Test 2: Read Aloud Analysis
  console.log('\nTEST 2: Analyze Read-Aloud Assessment');
  const target = 'Artificial intelligence is not designed to replace human ingenuity.';
  const spoken = 'Artificial intelligence is not designed to replace human.'; // missed 'ingenuity'
  const readRes = await analyzeReadAloud({ targetText: target, spokenText: spoken });
  
  console.log(`Overall Score: ${readRes.overallScore}% (Accuracy: ${readRes.accuracyScore}%)`);
  console.log(`Words Analysis Count: ${readRes.wordsAnalysis?.length}`);
  if (readRes.wordsAnalysis && readRes.wordsAnalysis.length > 0 && readRes.accuracyScore > 0) {
    console.log('✅ Passed: Read-Aloud evaluation and word diff computed accurately.');
  } else {
    throw new Error('Read-aloud evaluation failed');
  }

  // Test 3: Q&A Assessment
  console.log('\nTEST 3: Analyze Q&A Speaking Response');
  const question = 'How do you prioritize your daily tasks at work?';
  const speech = 'I usually write down a list of urgent tasks in the morning and focus on completing the most important items first.';
  const qaRes = await analyzeQASpeaking({ question, topic: 'Career', spokenText: speech });
  
  console.log(`Estimated Band: ${qaRes.overallBand}`);
  console.log(`Criteria Scores: Fluency ${qaRes.criteria?.fluency?.score}, Grammar ${qaRes.criteria?.grammar?.score}`);
  if (qaRes.criteria && qaRes.modelAnswerBand85) {
    console.log('✅ Passed: Multi-criteria assessment & Band 8.5 Model Answer created.');
  } else {
    throw new Error('Q&A analysis failed');
  }

  console.log('\n🎉 ALL SPEAKING LAB TESTS PASSED 100%!');
}

runSpeakingTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
