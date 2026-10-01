import { processAiQuery } from '../server/src/services/aiService.js';

async function run() {
  console.log('🧪 Testing Server aiService.js query processing...\n');

  const res1 = await processAiQuery('where is yogish sir');
  console.log('Server AI Answer:', res1.answer);
  console.log('Server AI Intent:', res1.intent);

  if (res1.success && res1.answer) {
    console.log('✅ PASS: Server AI query processing works');
  } else {
    console.error('❌ FAIL: Server AI query failed');
    process.exit(1);
  }
}

run();
