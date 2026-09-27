import { processCampusAiQuery } from '../src/data/campusAiEngine';
import type { CampusAiContext } from '../src/data/campusAiEngine';

const testCases = [
  { q: "Where is Dr Sumana?", note: "Faculty cabin/location" },
  { q: "What is Sumana's email?", note: "Faculty email" },
  { q: "Where can I find Yogish?", note: "Faculty search/location" },
  { q: "Is Dr Sumana available?", note: "Faculty availability" },
  { q: "Which library is for CSE?", note: "Library for branch" },
  { q: "Where is ESB library?", note: "Library location" },
  { q: "Is ESB library only for first year?", note: "Library demographic constraint" },
  { q: "Where is LHC?", note: "Campus building location" },
  { q: "Where is Apex library?", note: "Library location" },
  { q: "How crowded is LHC library?", note: "Library dynamic occupancy" },
  { q: "Where is Dr Sumana and what is her email?", note: "Multi-intent query" },
  { q: "What is her email?", followUpTo: "Where is Dr Sumana?", note: "Follow-up pronoun resolution" },
  { q: "Which library is for electronics students?", note: "Electronics library" },
  { q: "Where can first year students study?", note: "First year study spaces" },
  { q: "Who won the cricket world cup?", note: "Unknown question (strict no-hallucination)" }
];

console.log("==================================================");
console.log("CAMPUS PULSE — ASK CAMPUS AI TEST SUITE");
console.log("==================================================\n");

let context: CampusAiContext = { history: [] };

for (const test of testCases) {
  if (test.followUpTo) {
    // Run the prerequisite question first to set context
    const preResult = processCampusAiQuery(test.followUpTo, null, { history: [] });
    context = preResult.contextUpdated || context;
  } else {
    context = { history: [] };
  }

  const result = processCampusAiQuery(test.q, null, context);

  console.log(`Q: "${test.q}" [${test.note}]`);
  console.log(`Intents: ${result.intents.join(', ')}`);
  console.log(`Answer:\n${result.responseText}`);
  if (result.subText) console.log(`Subtext: ${result.subText}`);
  if (result.matchedFaculty) console.log(`Matched Faculty: ${result.matchedFaculty.name}`);
  if (result.matchedLibrary) console.log(`Matched Library: ${result.matchedLibrary.name}`);
  if (result.matchedNode) console.log(`Matched Node: ${result.matchedNode.name}`);
  console.log("--------------------------------------------------\n");
}
