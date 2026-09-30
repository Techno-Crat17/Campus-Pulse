import { processCampusAiQuery } from '../src/data/campusAiEngine';

async function test() {
  const queries = [
    'Yogish sir ka aaj schedule kya hai?',
    'YHK schedule',
    'Yogish sir Monday schedule',
    'When is Yogish teaching?',
    'Savita K Monday schedule',
    'Savita K schedule',
    'Shruti G schedule',
    'Zeenat schedule',
    'Pratima schedule',
    'ED schedule'
  ];

  for (const q of queries) {
    console.log('====================================================');
    console.log('QUERY:', q);
    const res = await processCampusAiQuery(q);
    console.log('INTENTS:', res.intents);
    console.log('MATCHED FACULTY:', res.matchedFaculty?.name, '(', res.matchedFaculty?.shortCode, ')');
    console.log('RESPONSE TEXT:\n' + res.responseText);
  }
}

test().catch(console.error);
