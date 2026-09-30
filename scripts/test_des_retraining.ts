import { processCampusAiQuery } from '../src/data/campusAiEngine';
import { findRoomByNumber, findRoomsByName } from '../src/data/roomsData';

async function runTests() {
  console.log('=== RUNNING CAMPUS AI RETRAINING & DES REGISTRY TESTS ===\n');

  const queries = [
    // 1. DES Rooms & Floors
    'DES 208 kaha hai?',
    'DES 309 kaha hai?',
    'DES-101',
    'DES-301',
    'DES-402',
    'DES-501',
    'DES-413',
    'DES-405',
    'DES-411',
    'DES-511',
    'DES-203',
    'DES-210',
    'DES-305/303/304/311',
    'DES-413/405/411/511',

    // 2. DES Department Queries
    'DES me ISE rooms kaunse hain?',
    'DES me ETE rooms kaunse hain?',
    'DES me EEE faculty room kaha hai?',
    'DES ISE faculty room',
    'ETE lab in DES',
    'DES ke CSE labs kaunse hain?',

    // 3. Facility Name Search (Mandatory Stardust & DES facilities)
    'Stardust Lab kaha hai?',
    'Where is Stardust Lab?',
    'Stardust lab kidhar hai?',
    'S.T.A.R.D.U.S.T lab',
    'stardust',
    'Cloud & Security Lab kaha hai?',
    'Center for Antenna & Radio Frequency kaha hai?',
    'Control Systems Lab kaha hai?',
    'VLSI Lab kaha hai?',
    'DES Seminar Hall',
    'Automation Lab in DES',

    // 4. Faculty & Who Can I Meet Locations
    'ISE faculty room kaha hai?',
    'ISE ka staff room kaha hai?',
    'ISE faculty kaha baithte hain?',
    'Dr. Yogish H K',
    'Dr. Sumana Maradithaya',

    // 5. Department Libraries
    'Apex library kaha hai?',
    'First year library kaha hai?',
    'MCA library kaha hai?',
    'CSE department library',
    'ISE department library',
    'ECE department library',
    'ETE department library'
  ];

  for (const q of queries) {
    const res = await processCampusAiQuery(q);
    console.log(`\n--------------------------------------------------\nQ: "${q}"`);
    console.log(`Intent: ${res.intents.join(', ')}`);
    console.log(`ActionTargetId: ${res.actionTargetId || 'none'}`);
    console.log(`Response:\n${res.responseText}`);
  }

  // Conversational follow-up context tests
  console.log('\n=== CONVERSATIONAL CONTEXT TESTS ===');

  let ctx: any = undefined;
  const q1 = await processCampusAiQuery('LHC 212 kaha hai?', undefined, ctx);
  ctx = q1.contextUpdated;
  console.log(`\nQ1: "LHC 212 kaha hai?" ->\n${q1.responseText}`);

  const q2 = await processCampusAiQuery('iska department?', undefined, ctx);
  console.log(`\nQ2: "iska department?" ->\n${q2.responseText}`);

  let ctx2: any = undefined;
  const q3 = await processCampusAiQuery('Yogish sir kaha hai?', undefined, ctx2);
  ctx2 = q3.contextUpdated;
  console.log(`\nQ3: "Yogish sir kaha hai?" ->\n${q3.responseText}`);

  const q4 = await processCampusAiQuery('unka mail?', undefined, ctx2);
  console.log(`\nQ4: "unka mail?" ->\n${q4.responseText}`);

  let ctx3: any = undefined;
  const q5 = await processCampusAiQuery('Stardust lab kaha hai?', undefined, ctx3);
  ctx3 = q5.contextUpdated;
  console.log(`\nQ5: "Stardust lab kaha hai?" ->\n${q5.responseText}`);

  const q6 = await processCampusAiQuery('iska floor kya hai?', undefined, ctx3);
  console.log(`\nQ6: "iska floor kya hai?" ->\n${q6.responseText}`);
}

runTests().catch(console.error);
