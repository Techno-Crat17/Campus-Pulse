import { processCampusAiQuery } from '../src/data/campusAiEngine';
import type { CampusAiContext } from '../src/data/campusAiEngine';

async function runTests() {
  console.log('=== STARTING UNIFIED ASK CAMPUS INTELLIGENCE TESTS ===\n');

  const testQueries = [
    // 1. ISE Faculty Room Variations
    'Where is ISE faculty room?',
    'ISE faculty room kaha hai?',
    'ISE ka staff room kidhar hai?',
    'information science faculty lounge',
    'teachers room of ISE',
    'ISE professors room',

    // 2. Department Aliases & Room Types
    'E&TE faculty room',
    'ETE lab',
    'E and TE faculty room',
    'Electronics Telecommunication lab',
    'EEE faculty room',
    'E&EE faculty room',
    'E&IE lab',
    'MLE faculty room',
    'AI & ML lab',
    'CSE AIML faculty room',
    'CSE (AIML) faculty room',
    'AI & DS faculty room',
    'MCA faculty room',

    // 3. Library Intelligence
    'Apex library',
    'first year library',
    'Apex first year lib',
    'where is Apex library',
    'Apex library room',
    'MCA library',
    'MCA dept library',
    'where is MCA library',
    'LHC library',

    // 4. Hard Constraints & Distinct Entities
    'CRD CSE AIML faculty room',
    'LHC EEE faculty room',
    'CSE AIML LHC 212', // MUST BE ZERO RESULTS
    'LHC AI ML faculty room', // MUST BE ZERO RESULTS

    // 5. Typo Tolerance
    'libary',
    'librery',
    'faculity room',
    'departmnt of ise',
    'buidling lhc',
    'rom 212',
    'laboratry ete',
    'enginnering chemistry',
    'informaton science faculty',
    'cseaiml faculty room',
    'cse-aiml faculty room',

    // 6. Natural Language / Hinglish
    'Apex library kaha milega?',
    'ETE ka lab kaha hai?',
    'CSE AIML wale faculty room?',
    'MCA library kis floor pe hai?'
  ];

  for (const q of testQueries) {
    const res = await processCampusAiQuery(q);
    console.log(`--------------------------------------------------`);
    console.log(`Q: "${q}"`);
    console.log(`Intent: ${res.intents.join(', ')}`);
    console.log(`ActionTargetId: ${res.actionTargetId || 'none'}`);
    console.log(`Response:\n${res.responseText}`);
  }

  // 7. Conversational Context & Pronoun Follow-up Tests
  console.log(`\n=== CONVERSATIONAL CONTEXT TESTS ===\n`);

  // Test 7a: Faculty Context (Yogish -> unka mail?)
  console.log(`[Context Test 1: Yogish -> unka mail?]`);
  const r1 = await processCampusAiQuery('Yogish sir kaha hai?');
  console.log(`Q1: "Yogish sir kaha hai?" ->\n${r1.responseText}`);
  const ctx1: CampusAiContext = r1.contextUpdated || {};
  const r2 = await processCampusAiQuery('unka mail?', ctx1);
  console.log(`Q2: "unka mail?" ->\n${r2.responseText}`);

  // Test 7b: Room Context (LHC 212 -> iska department?)
  console.log(`\n[Context Test 2: LHC 212 -> iska department?]`);
  const r3 = await processCampusAiQuery('LHC 212 kaha hai?');
  console.log(`Q3: "LHC 212 kaha hai?" ->\n${r3.responseText}`);
  const ctx2: CampusAiContext = r3.contextUpdated || {};
  const r4 = await processCampusAiQuery('iska department?', ctx2);
  console.log(`Q4: "iska department?" ->\n${r4.responseText}`);

  // Test 7c: Library Context (Apex library -> kis floor pe hai?)
  console.log(`\n[Context Test 3: Apex library -> kis floor pe hai?]`);
  const r5 = await processCampusAiQuery('Apex library');
  console.log(`Q5: "Apex library" ->\n${r5.responseText}`);
  const ctx3: CampusAiContext = r5.contextUpdated || {};
  const r6 = await processCampusAiQuery('kis floor pe hai?', ctx3);
  console.log(`Q6: "kis floor pe hai?" ->\n${r6.responseText}`);
}

runTests().catch(console.error);
