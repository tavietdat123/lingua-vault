import { gamificationService } from './server/src/services/gamificationService.js';
import { aiAssessmentService } from './server/src/services/aiAssessmentService.js';
import { getDb, initializeDatabase } from './server/src/db/database.js';

initializeDatabase();

console.log('🧪 ===================================================');
console.log('   TESTING GAMIFICATION & AI MASTERY ASSESSMENT ENGINE');
console.log('===================================================');

// Test 1: Get Initial Profile
console.log('\n🔹 [Test 1] Testing getProfile()...');
const profile = gamificationService.getProfile();
console.log('Profile:', JSON.stringify(profile, null, 2));
if (profile && profile.level >= 1 && profile.title) {
  console.log('✅ [Test 1 PASS] Initial profile loaded successfully.');
} else {
  console.error('❌ [Test 1 FAIL] Profile invalid');
  process.exit(1);
}

// Test 2: Add XP and check Level-Up
console.log('\n🔹 [Test 2] Adding +100 XP to test progression...');
const xpRes = gamificationService.addXp(100, 'Test XP addition');
console.log('Add XP Result:', JSON.stringify(xpRes, null, 2));
if (xpRes.success && xpRes.totalXp > profile.totalXp) {
  console.log('✅ [Test 2 PASS] XP added and level recalculated.');
} else {
  console.error('❌ [Test 2 FAIL] XP addition failed');
  process.exit(1);
}

// Test 3: AI Mastery Assessment Generation
console.log('\n🔹 [Test 3] Testing AI Mastery Assessment Report...');
aiAssessmentService.generateMasteryReport()
  .then(report => {
    console.log('Mastery Report Metrics:', JSON.stringify(report.metrics, null, 2));
    console.log('AI Qualitative Assessment:', JSON.stringify(report.aiAssessment, null, 2));
    
    if (report.success && report.metrics && report.aiAssessment && report.aiAssessment.estimatedCefrLevel) {
      console.log('\n✅ [Test 3 PASS] AI Mastery Assessment Report generated successfully!');
      console.log('🎉 ALL BACKEND GAMIFICATION & AI ASSESSOR TESTS PASSED 100%!');
      process.exit(0);
    } else {
      console.error('❌ [Test 3 FAIL] Report output invalid');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('❌ [Test 3 ERROR]:', err);
    process.exit(1);
  });
