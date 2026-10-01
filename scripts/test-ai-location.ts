import { processCampusAiQuery } from '../src/data/campusAiEngine.ts';

async function run() {
  console.log('🧪 Testing Ask Campus AI faculty location queries...\n');

  // 1. Where is Yogish sir during Monday 09:30 AM (Active class in Room-101)
  const simulatedActiveClass = { enabled: true, dayOfWeek: 1, hour: 9, minute: 30 };
  const res1 = await processCampusAiQuery('where is yogish sir', simulatedActiveClass);
  console.log('--- Case 1: During Active Class (Mon 09:30) ---');
  console.log(res1?.responseText);

  if (res1?.responseText.includes('Room-101') && !res1?.responseText.startsWith('Dr. Yogish H K is currently in cabin')) {
    console.log('✅ PASS: Responds with active class room (Room-101)');
  } else {
    console.error('❌ FAIL: Did not prioritize active class room');
    process.exit(1);
  }

  // 2. Where is Yogish sir during Monday 10:30 AM (No active class -> Cabin)
  const simulatedFree = { enabled: true, dayOfWeek: 1, hour: 10, minute: 30 };
  const res2 = await processCampusAiQuery('where is yogish sir', simulatedFree);
  console.log('\n--- Case 2: Free between classes (Mon 10:30) ---');
  console.log(res2?.responseText);

  if (res2?.responseText.includes('cabin:')) {
    console.log('✅ PASS: Responds with cabin when no active class');
  } else {
    console.error('❌ FAIL: Did not respond with cabin');
    process.exit(1);
  }

  // 3. Where is Yogish sir on Sunday (Off Campus)
  const simulatedSunday = { enabled: true, dayOfWeek: 0, hour: 11, minute: 0 };
  const res3 = await processCampusAiQuery('where is yogish sir', simulatedSunday);
  console.log('\n--- Case 3: Off Campus (Sunday) ---');
  console.log(res3?.responseText);

  if (res3?.responseText.includes('off campus')) {
    console.log('✅ PASS: Responds with off campus on Sunday');
  } else {
    console.error('❌ FAIL: Did not respond with off campus');
    process.exit(1);
  }

  console.log('\n🎉 ALL AI TESTS PASSED!');
}

run();
