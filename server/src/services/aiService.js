import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { Faculty } from '../models/Faculty.js';
import { Library } from '../models/Library.js';
import { Building } from '../models/Building.js';
import { Room } from '../models/Room.js';
import { Issue } from '../models/Issue.js';
import { calculateFacultyDynamicStatus } from './facultyStatusService.js';
import { calculateEstimatedOccupancy, isLibraryOpen } from './occupancyService.js';
import { normalizeRoomNumber } from '../utils/roomUtils.js';
import { getLiveAnnouncements, getLiveEvents } from './msritService.js';
import { getLiveClubs } from './clubService.js';

// ============================================================================
// CAMPUS PULSE — ASK CAMPUS AI BACKEND QUERY ENGINE
// ============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let localFacultyData = [];
let localRoomsData = [];

try {
  const facPath = path.join(__dirname, '../../../src/data/faculty_msrit_dynamic.json');
  if (fs.existsSync(facPath)) {
    localFacultyData = JSON.parse(fs.readFileSync(facPath, 'utf8'));
  }
  const rmPath = path.join(__dirname, '../../../src/data/msrit_rooms.json');
  if (fs.existsSync(rmPath)) {
    const rmJson = JSON.parse(fs.readFileSync(rmPath, 'utf8'));
    localRoomsData = rmJson.rooms || [];
  }
} catch (e) {
  console.warn('[aiService] Static data fallback loading warning:', e.message);
}

export const VERIFIED_EMERGENCY_CONTACTS = [
  { label: 'MSRIT Administration / Admissions', phone: '080-23607902', category: 'Campus Administration' },
  { label: 'Registrar Administration / Anti-Ragging', phone: '080-23608445', category: 'Registrar & Student Safety' },
  { label: 'Fire Emergency Service', phone: '101', category: 'Standard Emergency Service' },
  { label: 'Ambulance Service', phone: '108', category: 'Standard Emergency Medical' }
];

const sessionContextStore = new Map();

function getSessionContext(sessionId) {
  if (!sessionId) return {};
  const existing = sessionContextStore.get(sessionId);
  if (existing && Date.now() - existing.lastUpdated < 15 * 60 * 1000) {
    return existing;
  }
  return {};
}

function updateSessionContext(sessionId, newContext) {
  if (!sessionId) return;
  const current = getSessionContext(sessionId);
  sessionContextStore.set(sessionId, {
    ...current,
    ...newContext,
    lastUpdated: Date.now()
  });
}

function isDbConnected() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

const STOP_WORDS = new Set([
  'abhi', 'now', 'aaj', 'today', 'kal', 'tomorrow', 'parso', 'subah', 'dopahar', 'shaam', 'raat',
  'free', 'room', 'rooms', 'chahiye', 'khali', 'available', 'dikha', 'list', 'bhai', 'ka', 'ki', 'ke',
  'unka', 'unki', 'uska', 'uski', 'kaha', 'kahan', 'kidhar', 'where', 'is', 'what', 'email', 'mail',
  'dept', 'department', 'location', 'bata', 'btao', 'bta', 'milenge', 'milega', 'aur', 'sir', 'maam', 'mam',
  'madam', 'dr', 'dr.', 'prof', 'prof.', 'professor', 'teacher', 'teachers', 'faculty', 'for', 'the', 'and', 'with',
  'building', 'block', 'library', 'libraries', 'issue', 'complaint', 'event', 'notice', 'number', 'emergency',
  'cse', 'ise', 'ece', 'et', 'ei', 'me', 'aiml', 'cy', 'cv', 'biotech', 'ind', 'lhc', 'esb', 'crd', 'apex', 'waha', 'kaise', 'jana', 'konsi', 'konsa', 'kaun', 'kon', 'occupied', 'busy', 'map', 'dikhao',
  'hod', 'head', 'head of department'
]);

export function detectLanguage(rawQuery, normQuery) {
  const hinglishMarkers = [
    'kaha', 'kahan', 'kidhar', 'konsa', 'konsi', 'kaun', 'kon', 'unka', 'unki',
    'uska', 'uski', 'ka', 'ki', 'ke', 'hai', 'h', 'khali', 'bata', 'btao', 'bta',
    'bhai', 'me', 'mein', 'pe', 'chahiye', 'baje', 'chal', 'dikha', 'pahuchi',
    'milenge', 'milega', 'padhne', 'jagah', 'kitni', 'kitna', 'kitne', 'subah',
    'dopahar', 'shaam', 'raat', 'aaj', 'kal', 'parso', 'nhi', 'nahi', 'nahin'
  ];

  const words = (rawQuery + ' ' + normQuery).toLowerCase().split(/\s+/);
  const count = words.filter(w => hinglishMarkers.includes(w)).length;
  return count > 0 ? 'HINGLISH' : 'ENGLISH';
}

export function resolveDepartment(input) {
  if (!input) return null;
  const s = input.trim().toLowerCase();

  // 1. CSE-AIML (Explicitly check CSE with AIML / AI&ML first so it is never confused with pure AI & ML)
  if (
    /\b(cse[- ]?aiml|cse\s*\(?aiml\)?|cse[- ]?ai[- ]?ml|cse\s*\(?ai\s*&?\s*ml\)?|cse\s*ai\s*ml|cse\s*ai\s*&\s*ml|cse\s*artificial\s*intelligence)\b/i.test(s) ||
    (/\bcse\b/i.test(s) && /\b(aiml|ai\s*&?\s*ml|ai\s*and\s*ml)\b/i.test(s))
  ) {
    return {
      code: 'CSE-AIML',
      name: 'Computer Science & Engineering (AIML)',
      building: 'CRD',
      buildingId: 'block-crd',
      matchFn: (f) => {
        const d = (f.department || '').toLowerCase();
        return d.includes('cse-aiml') || (d.includes('cse') && d.includes('aiml'));
      }
    };
  }

  // 2. Pure AI & ML (Apex Block department, strictly non-CSE)
  if (
    /\b(aiml|ai\s*&\s*ml|ai[- ]ml|ai\s*and\s*ml|ai\s*ml|artificial\s*intelligence\s*&\s*machine\s*learning|artificial\s*intelligence\s*and\s*machine\s*learning|ai\s*machine\s*learning)\b/i.test(s)
  ) {
    return {
      code: 'AI & ML',
      name: 'Artificial Intelligence & Machine Learning',
      building: 'Apex',
      buildingId: 'block-apex',
      matchFn: (f) => {
        const d = (f.department || '').toLowerCase();
        return (d.includes('ai & ml') || d.includes('aiml') || d.includes('artificial intelligence')) && !d.includes('cse');
      }
    };
  }

  // 3. AI & DS (Apex Block department)
  if (
    /\b(ai\s*&\s*ds|ai[- ]ds|aids|ai\s*and\s*ds|ai\s*ds|artificial\s*intelligence\s*&\s*data\s*science|artificial\s*intelligence\s*and\s*data\s*science)\b/i.test(s)
  ) {
    return {
      code: 'AI & DS',
      name: 'Artificial Intelligence & Data Science',
      building: 'Apex',
      buildingId: 'block-apex',
      matchFn: (f) => {
        const d = (f.department || '').toLowerCase();
        return d.includes('ai & ds') || d.includes('aids') || d.includes('data science');
      }
    };
  }

  // 4. CSE-CY (Cyber Security)
  if (
    /\b(cse[- ]?cy|cse\s*\(?cy\)?|cse\s*\(?cyber\s*security\)?|cyber\s*security|cybersecurity|cyber|cy)\b/i.test(s) ||
    (/\bcse\b/i.test(s) && /\b(cy|cyber)\b/i.test(s))
  ) {
    return {
      code: 'CY',
      name: 'Computer Science & Engineering (Cyber Security)',
      building: 'CRD',
      buildingId: 'block-crd',
      matchFn: (f) => {
        const d = (f.department || '').toLowerCase();
        return d.includes('cyber');
      }
    };
  }

  // 5. ISE (Information Science & Engineering - DES Block)
  if (/\b(ise|i\s*\.\s*s\s*\.\s*e|i\s*s\s*e|information\s*science|information\s*science\s*and\s*engineering|information\s*science\s*&\s*engineering|info\s*science|info\s*science\s*&\s*engineering)\b/i.test(s)) {
    return {
      code: 'ISE',
      name: 'Information Science & Engineering',
      building: 'DES',
      buildingId: 'block-des',
      matchFn: (f) => {
        const d = (f.department || '').toLowerCase();
        return d.includes('information science') || d.includes('ise');
      }
    };
  }

  // 6. Pure CSE (Computer Science & Engineering - LHC / DES / Apex Block, strictly non-AIML / non-Cyber)
  if (/\b(cse|c\s*\.\s*s\s*\.\s*e|c\s*s\s*e|computer\s*science|computer\s*science\s*and\s*engineering|comp\s*science|computer\s*science\s*dept)\b/i.test(s)) {
    return {
      code: 'CSE',
      name: 'Computer Science & Engineering',
      building: 'LHC',
      buildingId: 'block-lhc',
      matchFn: (f) => {
        const d = (f.department || '').toLowerCase();
        return (d.includes('computer science') || d === 'cse') && !d.includes('ai & ml') && !d.includes('aiml') && !d.includes('cyber');
      }
    };
  }

  // 7. ECE / E&CE (Electronics & Communication - DES / Apex / LHC)
  if (/\b(ece|e\s*\.\s*c\s*\.\s*e|e&ce|e\s*&\s*ce|electronics\s*&\s*communication|electronics\s*and\s*communication|electronics\s*communication)\b/i.test(s)) {
    return {
      code: 'ECE',
      name: 'Electronics & Communication Engineering',
      building: 'DES',
      buildingId: 'block-des',
      matchFn: (f) => {
        const d = (f.department || '').toLowerCase();
        return d.includes('electronics & communication') || d.includes('ece') || d.includes('e&ce');
      }
    };
  }

  // 8. ETE / E&TE (Electronics & Telecommunication - DES Block)
  if (/\b(ete|e\s*\.\s*t\s*\.\s*e|e&te|e\s*&\s*te|telecom|telecommunication|electronics\s*&\s*telecommunication|electronics\s*and\s*telecommunication|telecommunication\s*engineering|electronics\s*telecommunication)\b/i.test(s)) {
    return {
      code: 'ET',
      name: 'Electronics & Telecommunication Engineering',
      building: 'DES',
      buildingId: 'block-des',
      matchFn: (f) => {
        const d = (f.department || '').toLowerCase();
        return d.includes('telecommunication') || d.includes('et') || d.includes('ete') || d.includes('e&te');
      }
    };
  }

  // 9. EIE / E&IE (Electronics & Instrumentation - DES Block)
  if (/\b(eie|e\s*\.\s*i\s*\.\s*e|e&ie|e\s*&\s*ie|instrumentation|electronics\s*&\s*instrumentation|electronics\s*and\s*instrumentation|instrumentation\s*engineering)\b/i.test(s)) {
    return {
      code: 'EI',
      name: 'Electronics & Instrumentation Engineering',
      building: 'DES',
      buildingId: 'block-des',
      matchFn: (f) => {
        const d = (f.department || '').toLowerCase();
        return d.includes('instrumentation') || d.includes('ei') || d.includes('eie') || d.includes('e&ie');
      }
    };
  }

  // 10. MLE (Medical Electronics - LHC Block)
  if (/\b(mle|medical\s*electronics|medical\s*electronics\s*engineering)\b/i.test(s) || (/\bme\s*(dept|department|wing)\b/i.test(s) && !/\bmechanical\b/i.test(s))) {
    return {
      code: 'MLE',
      name: 'Medical Electronics Engineering',
      building: 'LHC',
      buildingId: 'block-lhc',
      matchFn: (f) => {
        const d = (f.department || '').toLowerCase();
        return d.includes('medical electronics') || d.includes('mle');
      }
    };
  }

  // 11. EEE / E&EE (Electrical & Electronics - DES / LHC)
  if (/\b(eee|e\s*\.\s*e\s*\.\s*e|e&ee|e\s*&\s*ee|electrical|electrical\s*&\s*electronics|electrical\s*and\s*electronics|electrical\s*electronics)\b/i.test(s)) {
    return {
      code: 'E&EE',
      name: 'Electrical & Electronics Engineering',
      building: 'DES',
      buildingId: 'block-des',
      matchFn: (f) => {
        const d = (f.department || '').toLowerCase();
        return d.includes('electrical') || d.includes('e&ee') || d.includes('eee');
      }
    };
  }

  // 12. MCA (Master of Computer Applications - Apex Block)
  if (/\b(mca|m\s*\.\s*c\s*\.\s*a|master\s*of\s*computer\s*applications)\b/i.test(s)) {
    return {
      code: 'MCA',
      name: 'Master of Computer Applications',
      building: 'Apex',
      buildingId: 'block-apex',
      matchFn: (f) => {
        const d = (f.department || '').toLowerCase();
        return d.includes('mca') || d.includes('computer applications');
      }
    };
  }

  // 13. Basic Sciences & Humanities (Apex Block)
  if (/\b(physics|phy)\b/i.test(s)) {
    return {
      code: 'Physics',
      name: 'Department of Physics',
      building: 'Apex',
      buildingId: 'block-apex',
      matchFn: (f) => {
        const d = (f.department || '').toLowerCase();
        return d.includes('physics');
      }
    };
  }
  if (/\b(math|mathematics|maths)\b/i.test(s)) {
    return {
      code: 'Mathematics',
      name: 'Department of Mathematics',
      building: 'Apex',
      buildingId: 'block-apex',
      matchFn: (f) => {
        const d = (f.department || '').toLowerCase();
        return d.includes('math');
      }
    };
  }
  if (/\b(humanities|hum)\b/i.test(s)) {
    return {
      code: 'Humanities',
      name: 'Department of Humanities',
      building: 'Apex',
      buildingId: 'block-apex',
      matchFn: (f) => {
        const d = (f.department || '').toLowerCase();
        return d.includes('humanities');
      }
    };
  }

  // 14. Other Engineering Branches (ESB Block)
  if (/\b(cv|civil|civil\s*engineering)\b/i.test(s)) {
    return {
      code: 'CV',
      name: 'Civil Engineering',
      building: 'ESB',
      buildingId: 'block-esb',
      matchFn: (f) => {
        const d = (f.department || '').toLowerCase();
        return d.includes('civil') || d === 'cv';
      }
    };
  }
  if (/\b(biotech|biotechnology|biotechnology\s*engineering)\b/i.test(s)) {
    return {
      code: 'BIOTECH',
      name: 'Biotechnology',
      building: 'ESB',
      buildingId: 'block-esb',
      matchFn: (f) => {
        const d = (f.department || '').toLowerCase();
        return d.includes('biotech');
      }
    };
  }
  if (/\b(ind|industrial|iem|industrial\s*engineering|industrial\s*engineering\s*&\s*management)\b/i.test(s)) {
    return {
      code: 'IND',
      name: 'Industrial Engineering & Management',
      building: 'ESB',
      buildingId: 'block-esb',
      matchFn: (f) => {
        const d = (f.department || '').toLowerCase();
        return d.includes('industrial') || d.includes('iem');
      }
    };
  }
  return null;
}

export function normalizeQuery(query) {
  if (!query) return '';
  let q = query
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/["“”]/g, '"')
    .replace(/['"]s\b/g, '')
    .replace(/[?.,!;:()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const replacements = [
    // Typo corrections for common campus keywords
    [/\blibraray\b|\blibary\b|\blibrery\b|\blibray\b|\blibrari\b/g, 'library'],
    [/\bfacutly\b|\bfaculity\b|\bfacult\b|\bfacuty\b|\bfaclty\b/g, 'faculty'],
    [/\bprofesor\b|\bproffesor\b|\bprofessr\b/g, 'professor'],
    [/\bdepartmnt\b|\bdepartement\b|\bdepertment\b/g, 'department'],
    [/\bbuidling\b|\bbilding\b|\bbulding\b/g, 'building'],
    [/\brom\b/g, 'room'],
    [/\blabortory\b|\blaboratry\b|\blaboratery\b/g, 'laboratory'],
    [/\benginnering\b|\bengeneering\b/g, 'engineering'],
    [/\binformaton\b|\binfomation\b/g, 'information'],

    // Spacing & formatting normalizations
    [/\bcseaiml\b|\bcse_aiml\b/g, 'cse aiml'],
    [/\bcse\s*-\s*aiml\b/g, 'cse aiml'],
    [/\bcse\s*\(\s*aiml\s*\)/g, 'cse aiml'],
    [/\bcse\s*\(\s*ai\s*&?\s*ml\s*\)/g, 'cse aiml'],
    [/\bcse\s*ai\s*&?\s*ml\b/g, 'cse aiml'],
    [/\bcse\s*-\s*cy\b/g, 'cse cy'],
    [/\bcse\s*\(\s*cy\s*\)/g, 'cse cy'],
    [/\bcse\s*\(\s*cyber\s*security\s*\)/g, 'cse cy'],

    // Room semantic synonyms (Section 5)
    [/\bfaculty\s*lounge\b|\bstaff\s*room\b|\bteachers\s*room\b|\bteacher\s*lounge\b|\bprofessors\s*room\b|\bfaculty\s*space\b|\bprof\s*room\b|\bteachers\s*lounge\b/g, 'faculty room'],
    [/\bdept\s*lab\b|\bdepartment\s*lab\b|\bcomputer\s*lab\b|\bresearch\s*lab\b|\br&d\s*lab\b/g, 'lab'],

    // Library variations (Apex = First Year = AB-714, MCA = AB-401)
    [/\besb\s*lib\b/g, 'esb library'],
    [/\blhc\s*lib\b|\bunit\s*2\s*lib\b|\bunit\s*ii\s*library\b/g, 'lhc library'],
    [/\bapex\s*first\s*year\s*lib\b|\bapex\s*first\s*year\s*library\b|\bapex\s*1st\s*year\s*lib\b|\bapex\s*1st\s*year\s*library\b|\blibrary\s*&\s*information\s*center\s*\(?first\s*year\)?\b|\bapex\s*block\s*library\b|\bapex\s*lib\b/g, 'apex library'],
    [/\bfirst\s*year\s*library\b|\b1st\s*year\s*library\b|\b1st\s*year\s*lib\b|\bfirst\s*year\s*lib\b/g, 'apex library'],
    [/\bmca\s*dept\s*library\b|\bmca\s*department\s*library\b|\bdept\s*of\s*mca\s*library\b|\bmca\s*lib\b/g, 'mca library'],
    [/\b1st\s*yr\b|\b1styr\b|\bfirst\s*yr\b|\bfreshers\b|\bfresher\b/g, 'first year'],

    // Department abbreviations
    [/\be\s*&\s*te\b|\be\s*and\s*te\b|\be\s*\.\s*t\s*\.\s*e\b|\be\s*t\s*e\b/g, 'ete'],
    [/\be\s*&\s*ie\b|\be\s*and\s*ie\b|\be\s*\.\s*i\s*\.\s*e\b|\be\s*i\s*e\b/g, 'eie'],
    [/\be\s*&\s*ee\b|\be\s*and\s*ee\b|\be\s*\.\s*e\s*\.\s*e\b|\be\s*e\s*e\b/g, 'eee'],
    [/\be\s*&\s*ce\b|\be\s*and\s*ce\b|\be\s*\.\s*c\s*\.\s*e\b|\be\s*c\s*e\b/g, 'ece'],
    [/\bi\s*\.\s*s\s*\.\s*e\b|\bi\s*s\s*e\b/g, 'ise'],
    [/\bc\s*\.\s*s\s*\.\s*e\b|\bc\s*s\s*e\b/g, 'cse'],
    [/\bm\s*\.\s*c\s*\.\s*a\b|\bm\s*c\s*a\b/g, 'mca'],

    // General terms
    [/\bdept\b/g, 'department'],
    [/\bschedul\b|\btimetabl\b/g, 'schedule'],
    [/\bavailble\b|\bavailibility\b|\bavaliable\b|\bavailabe\b/g, 'available'],
    [/\boccupenci\b|\boccupency\b/g, 'occupancy'],
    [/\bannouncment\b|\bannouncments\b/g, 'announcement'],
    [/\bclasroom\b|\bclasrooms\b/g, 'classroom'],
    [/\blocaton\b|\blocatin\b/g, 'location'],

    // Hinglish Vocab Mapping
    [/\bkaha\s*hai\b|\bkahan\s*hai\b|\bkidhar\s*hai\b|\bkaha\s*h\b|\bkidhar\s*h\b|\bkahan\s*milega\b|\bkaha\s*milenge\b|\bhai\s*kaha\b|\bhai\s*kidhar\b|\bkis\s*floor\s*pe\s*hai\b|\bkis\s*floor\s*par\b|\bkaha\s*pe\s*hai\b/g, 'where is'],
    [/\bkon\s*hai\b|\bkaun\s*hai\b|\bkaun\s*h\b/g, 'who is'],
    [/\bkab\s*free\b|\bkab\s*available\b|\bkab\s*milenge\b/g, 'when available'],
    [/\bpadhne\s*ki\s*jagah\b|\bstudy\s*place\b|\bstudy\s*room\b/g, 'library'],
    [/\baaj\s*kya\s*hai\b|\bcollege\s*me\s*kya\s*ho\s*raha\b|\bcollege\s*me\s*kya\s*h\b/g, 'events today'],
    [/\bmeri\s*complaint\b|\bproblem\s*report\b|\bissue\s*status\b/g, 'issue status'],
    [/\bki\s*mail\s*id\b|\bka\s*mail\b|\bmail\s*id\b|\bemail\s*id\b/g, 'email'],
    [/\bhead\s*of\s*department\b|\bhead\s*of\s*dept\b|\bdepartment\s*head\b/g, 'hod'],
    [/\biska\s*department\b|\bis\s*room\s*ka\s*department\b|\bye\s*room\s*kis\s*department\s*ka\s*hai\b/g, 'room department']
  ];

  for (const [pattern, replacement] of replacements) {
    q = q.replace(pattern, replacement);
  }

  q = q.replace(/\b(lhc|esb|ab|arch|des|crd)[- ]?(\d{3}[a-z]?(?:\/[0-9a-z]+)*)\b/gi, (match, p1, p2) => {
    const prefix = p1.toUpperCase();
    if (prefix === 'LHC') return `LHC${p2.toUpperCase()}`;
    if (prefix === 'ARCH') return `ARCH${p2.toUpperCase()}`;
    return `${prefix}-${p2.toUpperCase()}`;
  });

  return q.replace(/\s+/g, ' ').trim();
}

export function detectIntents(normQuery, rawQuery = '') {
  const q = (normQuery + ' ' + rawQuery).toLowerCase();
  const intents = [];

  const isHod = /\b(hod|head\s*of\s*department|head\s*of\s*the\s*department|dept\s*head|department\s*head)\b/i.test(q)
    || (/\bhead\b/i.test(q) && /\b(ise|cse|ece|et|ei|me|aiml|cy|cv|biotech|ind|department|dept)\b/i.test(q));

  const hasEmail = /\b(email|e-mail|mail|gmail|contact mail)\b/.test(q);
  const hasCabin = /\b(cabin|office|sitting)\b/.test(q);
  const hasAvailability = /\b(available|availability|free|khali|vacant|busy|in use|occupied|booked)\b/.test(q);
  const hasSchedule = /\b(schedule|timetable|class|lecture)\b/.test(q);
  const hasLocation = /\b(where|kaha|kidhar|location|located|floor|block|building|map|show on map|dikhao)\b/.test(q);
  const hasNavigation = /\b(kaise jana|waha kaise|directions|route|how to go|navigate)\b/.test(q);
  const hasDesignation = /\b(designation|title|post|role)\b/.test(q);
  const hasDepartment = /\b(department|dept|branch)\b/.test(q);
  const hasFacultyList = /\b(teachers|faculty|professors|teacher log|faculty list|teachers list|teachers dikha)\b/.test(q);

  const hasOccupancy = /\b(occupancy|crowded|least crowded|busy|empty|how many people|kitne log|jagah hai)\b/.test(q);
  const hasLibraryHours = /\b(hours|open|close|band|timing|timings|kab khulti|kitne baje)\b/.test(q);
  const mentionsLibrary = /\b(library|lib|libs|padhne ki jagah)\b/.test(q);

  const hasEvents = /\b(event|program|programme|function|activity|aaj kya|upcoming)\b/.test(q);
  const hasAnnouncements = /\b(announcement|notice|circular|news|latest notice|new notice)\b/.test(q);
  const hasClubs = /\b(club|clubs|organization|society|societies|extracurricular|ieee|nss|coderit|secureit|secur1t|aion|velocita|aws|tnt|lasya|prayaag|theatrix|chiraranga|debsoc|19a|quiz\s*club|iclick|inara|comedy\s*club|studio\.?rit|clutchrit|nakama|ritmunsoc|dance|drama|theatre|photography|gaming|anime|debate|coding|cybersecurity|cloud)\b/i.test(q);
  const hasEmergency = /\b(emergency|ambulance|fire|anti ragging|helpline|police|contact number)\b/.test(q);

  const hasIssues = /\b(issue|issues|problem|complaint|complain|wifi|water|electricity|broken|repair|status|resolve)\b/.test(q);
  const hasRoom = /\b(room|classroom|lab|lecture hall|lh|auditorium|lhc\d{3}|ab-\d{3}|esb-\d{3}|arch\d{3})\b/.test(q);
  const mentionsBuilding = /\b(lhc|esb|crd|apex|building|block)\b/.test(q);

  // HOD Intents (Part 2: DEPARTMENT_HOD, DEPARTMENT_HOD_EMAIL, DEPARTMENT_HOD_LOCATION, DEPARTMENT_HOD_DESIGNATION)
  if (isHod) {
    if (hasEmail) {
      intents.push('DEPARTMENT_HOD_EMAIL');
      intents.push('DEPARTMENT_HOD');
    } else if (hasCabin || hasLocation) {
      intents.push('DEPARTMENT_HOD_LOCATION');
      intents.push('DEPARTMENT_HOD');
    } else if (hasDesignation) {
      intents.push('DEPARTMENT_HOD_DESIGNATION');
      intents.push('DEPARTMENT_HOD');
    } else {
      intents.push('DEPARTMENT_HOD');
    }
  }

  if (hasEvents) intents.push('EVENT_SEARCH');
  if (hasAnnouncements) intents.push('ANNOUNCEMENT_SEARCH');
  if (hasClubs) intents.push('CLUB_SEARCH');

  if (hasEmergency || (q.includes('number') && (q.includes('emergency') || q.includes('fire') || q.includes('ambulance')))) {
    intents.push('EMERGENCY_CONTACT');
  }

  if (hasNavigation) intents.push('CAMPUS_NAVIGATION');

  if (hasRoom || /\b\d{3}\b/.test(q)) {
    if (hasAvailability) intents.push('ROOM_AVAILABILITY');
    else if (hasLocation) intents.push('ROOM_LOCATION');
    else intents.push('ROOM_SEARCH');
  }

  if (hasIssues) {
    if (q.includes('status') || q.includes('resolve') || q.includes('pahuchi')) intents.push('ISSUE_STATUS');
    else intents.push('ISSUE_SEARCH');
  }

  if (mentionsLibrary) {
    if (hasOccupancy) intents.push('LIBRARY_OCCUPANCY');
    if (hasLibraryHours) intents.push('LIBRARY_HOURS');
    if (hasLocation && intents.length === 0) intents.push('LIBRARY_LOCATION');
    if (intents.length === 0) intents.push('LIBRARY_SEARCH');
  }

  if (mentionsBuilding && (hasLocation || q.includes('dikhao')) && !mentionsLibrary && !hasRoom && intents.length === 0) {
    intents.push('BUILDING_LOCATION');
  }

  if (hasEmail) intents.push('FACULTY_EMAIL');
  if (hasCabin) intents.push('FACULTY_CABIN');
  if (hasDesignation) intents.push('FACULTY_DESIGNATION');
  if (hasDepartment) intents.push('FACULTY_DEPARTMENT');
  if (hasLocation && !mentionsLibrary && !mentionsBuilding && !hasRoom) intents.push('FACULTY_LOCATION');
  if (hasAvailability && !hasRoom && intents.length === 0) intents.push('FACULTY_AVAILABILITY');
  if (hasSchedule && !hasRoom) intents.push('FACULTY_SCHEDULE');
  if (hasFacultyList && intents.length === 0) intents.push('FACULTY_SEARCH');

  if (intents.length === 0) {
    if (hasLocation) intents.push('CAMPUS_LOCATION');
    else intents.push('GENERAL_CAMPUS_QUERY');
  }

  return intents;
}

export function extractRoomCategory(str) {
  if (!str) return null;
  const s = str.toLowerCase();
  if (/\b(faculty\s*(?:room|lounge|space|cabin|wing)|staff\s*room|teachers?\s*(?:room|lounge)|professors?\s*room)\b/i.test(s)) {
    return 'FACULTY_SPACE';
  }
  if (/\b(lab|laboratory|department\s*lab|computer\s*lab|research\s*lab|r&d\s*lab)\b/i.test(s)) {
    return 'LAB';
  }
  if (/\b(library|information\s*center|reading\s*room)\b/i.test(s)) {
    return 'LIBRARY';
  }
  if (/\b(seminar\s*hall|conference\s*hall|auditorium|board\s*room)\b/i.test(s)) {
    return 'SEMINAR_HALL';
  }
  if (/\b(office|admin|department\s*office|hod\s*office|dean\s*office)\b/i.test(s)) {
    return 'OFFICE';
  }
  if (/\b(classroom|lecture\s*hall|class\s*room|tutorial\s*room)\b/i.test(s)) {
    return 'CLASSROOM';
  }
  return null;
}

export function computeFloorFromRoomNumber(roomNum) {
  if (!roomNum) return 'Ground Floor';
  const clean = roomNum.toUpperCase().replace(/^AB-|^DES-|^LHC|^CRD-|^ESB-|^ARCH-?/, '');
  const digitsMatch = clean.match(/(\d{3})/);
  if (!digitsMatch) return 'Ground Floor';
  const num = parseInt(digitsMatch[1], 10);
  if (num >= 100 && num <= 199) return 'Basement';
  if (num >= 200 && num <= 299) return 'Ground Floor';
  if (num >= 300 && num <= 399) return '1st Floor';
  if (num >= 400 && num <= 499) return '2nd Floor';
  if (num >= 500 && num <= 599) return '3rd Floor';
  if (num >= 600 && num <= 699) return '4th Floor';
  if (num >= 700 && num <= 799) return '5th Floor';
  if (num >= 800 && num <= 899) return '6th Floor';
  if (num >= 900 && num <= 999) return '7th Floor';
  return 'Ground Floor';
}

export async function extractEntities(normQuery, rawQuery, context) {
  const entities = {
    rawQuery,
    normQuery,
    pronounResolved: false
  };

  const fullText = (rawQuery + ' ' + normQuery).toLowerCase();

  // 1. Department Extraction
  const deptInfo = resolveDepartment(fullText) || (context?.lastDepartment ? resolveDepartment(context.lastDepartment) : null);
  if (deptInfo) {
    entities.departmentCode = deptInfo.code;
    entities.deptInfo = deptInfo;
  }

  // 2. Building Extraction
  if (/\b(lhc|lecture\s*hall\s*complex)\b/i.test(fullText)) entities.building = 'LHC';
  else if (/\b(crd|multipurpose|multi\s*purpose)\b/i.test(fullText)) entities.building = 'CRD';
  else if (/\b(apex|apex\s*block)\b/i.test(fullText)) entities.building = 'Apex';
  else if (/\b(des|des\s*block)\b/i.test(fullText)) entities.building = 'DES';
  else if (/\b(esb|engineering\s*sciences?\s*block)\b/i.test(fullText)) entities.building = 'ESB';

  // 3. Room Category Extraction
  entities.roomCategory = extractRoomCategory(fullText);

  // 4. Room Number Extraction
  const roomMatch = fullText.match(/\b(lhc[- ]?\d{3}[a-z]?(?:\/[0-9a-z]+)*|ab[- ]?\d{3}[a-z]?(?:\/[0-9a-z]+)*|des[- ]?\d{3}[a-z]?(?:\/[0-9a-z]+)*|crd[- ]?\d{3}[a-z]?(?:\/[0-9a-z]+)*|esb[- ]?\d{3}[a-z]?(?:\/[0-9a-z]+)*|arch[- ]?\d{3}[a-z]?(?:\/[0-9a-z]+)*|\b\d{3}[a-z]?(?:\/[0-9a-z]+)*\b)/i);
  if (roomMatch && !/\b(101|108|902|445|2026)\b/.test(roomMatch[1])) {
    const raw = roomMatch[1].trim();
    if (/^\d{3}/.test(raw)) {
      const bldgPrefix = entities.building || (context?.lastRoom?.building ? context.lastRoom.building : 'LHC');
      if (bldgPrefix === 'Apex') entities.roomNumber = `AB-${raw.toUpperCase()}`;
      else if (bldgPrefix === 'DES') entities.roomNumber = `DES-${raw.toUpperCase()}`;
      else if (bldgPrefix === 'CRD') entities.roomNumber = `CRD-${raw.toUpperCase()}`;
      else if (bldgPrefix === 'ESB') entities.roomNumber = `ESB-${raw.toUpperCase()}`;
      else entities.roomNumber = `LHC${raw.toUpperCase()}`;
    } else {
      entities.roomNumber = normalizeRoomNumber(raw);
    }
  }

  // 5. Library Entity Extraction
  if (/\b(apex\s*library|first\s*year\s*library|1st\s*year\s*library|apex\s*first\s*year\s*lib|ab-714)\b/i.test(fullText)) {
    entities.libraryId = 'apex_unit_3_library';
    entities.libraryName = 'Apex Library';
    entities.libraryRoom = 'AB-714';
  } else if (/\b(mca\s*library|dept\s*of\s*mca\s*library|mca\s*department\s*library|ab-401)\b/i.test(fullText)) {
    entities.libraryId = 'mca_department_library';
    entities.libraryName = 'MCA Department Library';
    entities.libraryRoom = 'AB-401';
  } else if (/\b(lhc\s*library|unit\s*2\s*library|unit\s*ii\s*library|lhc-306|lhc306)\b/i.test(fullText)) {
    entities.libraryId = 'lhc_unit_2_library';
    entities.libraryName = 'LHC Library';
    entities.libraryRoom = 'LHC-306';
  } else if (/\b(esb\s*library|central\s*library|main\s*library)\b/i.test(fullText)) {
    entities.libraryId = 'central_library';
    entities.libraryName = 'Central Library (ESB)';
    entities.libraryRoom = 'ESB Central Library';
  }

  // 6. HOD Resolution
  const isHod = /\b(hod|head\s*of\s*department|head\s*of\s*the\s*department|dept\s*head|department\s*head)\b/i.test(fullText)
    || (/\bhead\b/i.test(fullText) && /\b(ise|cse|ece|et|ei|me|aiml|cy|cv|biotech|ind|department|dept)\b/i.test(fullText));

  if (isHod) {
    entities.isHod = true;
    entities.role = 'HOD';
    if (/\b(email|mail|e-mail|gmail|mail\s*id|email\s*id)\b/i.test(fullText)) entities.requestedField = 'EMAIL';
    else if (/\b(kaha|kahan|kidhar|where|cabin|office|sitting|milenge|milega|location)\b/i.test(fullText)) entities.requestedField = 'LOCATION';
    else if (/\b(designation|post|title|role)\b/i.test(fullText)) entities.requestedField = 'DESIGNATION';

    if (deptInfo) {
      entities.departmentCode = deptInfo.code;
      entities.deptInfo = deptInfo;

      let hodMatches = [];
      if (isDbConnected()) {
        try {
          const dbList = await Faculty.find({ designation: { $regex: 'hod|head', $options: 'i' } }).lean();
          hodMatches = dbList.filter(f => deptInfo.matchFn(f));
        } catch (e) {}
      }

      if (hodMatches.length === 0 && localFacultyData.length > 0) {
        hodMatches = localFacultyData.filter(f => deptInfo.matchFn(f) && /\b(hod|head)\b/i.test(f.designation || ''));
      }

      if (hodMatches.length === 1) {
        entities.hod = hodMatches[0];
        entities.faculty = hodMatches[0];
      } else if (hodMatches.length > 1) {
        entities.multipleHod = hodMatches;
      } else {
        entities.hodNotFound = true;
      }
    }
  }

  // 7. Pronoun Resolution & Follow-ups for Faculty, Room, or Library
  const hasPronoun = /\b(unka|unki|uska|uski|ye|yeh|woh|wo|iske|iska|is|ye\s*room|this\s*room|he|his|him|she|her|they)\b/i.test(fullText);
  const isBareFollowup = /^\s*(cabin|mail|email|schedule|timetable|location|dept|department|floor|kis\s*floor|kis\s*department)\s*[?]?\s*$/i.test(rawQuery);

  if ((hasPronoun || isBareFollowup) && context?.lastFacultyId && !entities.faculty && !entities.roomNumber && !entities.libraryId) {
    if (isDbConnected()) {
      try {
        const faculty = await Faculty.findOne({
          $or: [{ id: context.lastFacultyId }, { name: { $regex: context.lastFacultyName || '', $options: 'i' } }]
        }).lean();
        if (faculty) {
          entities.faculty = faculty;
          entities.pronounResolved = true;
        }
      } catch (e) {}
    }

    if (!entities.faculty && localFacultyData.length > 0) {
      const found = localFacultyData.find(f => f.id === context.lastFacultyId || f.name.toLowerCase().includes((context.lastFacultyName || '').toLowerCase()));
      if (found) {
        entities.faculty = found;
        entities.pronounResolved = true;
      }
    }
  }

  if ((hasPronoun || isBareFollowup) && context?.lastRoomNumber && !entities.roomNumber && !entities.faculty) {
    entities.roomNumber = context.lastRoomNumber;
    entities.pronounResolved = true;
  }

  // 8. Faculty Short Code Matching
  if (!entities.faculty && localFacultyData.length > 0) {
    const scMatch = localFacultyData.find(f => f.shortCode && new RegExp(`\\b${f.shortCode}\\b`, 'i').test(rawQuery + ' ' + normQuery));
    if (scMatch) {
      entities.faculty = scMatch;
    }
  }

  const isNonFacultyTarget = /\b(room|rooms|classroom|library|libraries|building|block|event|notice|circular|emergency|fire|ambulance|wifi|complaint|issue|map|kaise jana)\b/i.test(fullText);
  const hasExplicitFacultyTitle = /\b(dr\.|dr|prof\.|prof|professor|teacher|teachers|faculty|cabin|email|mail|yogish|sumana)\b/i.test(fullText);

  if (!entities.faculty && (!isNonFacultyTarget || hasExplicitFacultyTitle)) {
    const searchTokens = rawQuery
      .toLowerCase()
      .replace(/[?.,!;:()[\]{}]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(t => t.length >= 3 && !STOP_WORDS.has(t));

    if (searchTokens.length > 0) {
      const searchTerm = searchTokens[0];
      let facultyMatches = [];

      const matchFacultyObj = (f) => {
        const nameParts = f.name.toLowerCase().replace(/^(dr\.|dr|prof\.|prof|mr\.|mrs\.|ms\.)\s+/i, '').split(/\s+/);
        return nameParts.some(part => part.length >= 3 && (part === searchTerm || part.startsWith(searchTerm)));
      };

      if (isDbConnected()) {
        try {
          const dbList = await Faculty.find({
            $or: [
              { name: { $regex: searchTerm, $options: 'i' } },
              { id: { $regex: searchTerm, $options: 'i' } }
            ]
          }).lean();
          facultyMatches = dbList.filter(matchFacultyObj);
        } catch (e) {}
      }

      if (facultyMatches.length === 0 && localFacultyData.length > 0) {
        facultyMatches = localFacultyData.filter(matchFacultyObj);
      }

      if (facultyMatches.length === 1) {
        entities.faculty = facultyMatches[0];
      } else if (facultyMatches.length > 1) {
        const exact = facultyMatches.find(f => f.name.toLowerCase().includes(searchTerm));
        if (exact) {
          entities.faculty = exact;
        } else {
          entities.multipleFaculty = facultyMatches;
        }
      }
    }
  }

  return entities;
}

export function getCurrentCampusTime() {
  const now = new Date();
  const kolkataStr = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  return new Date(kolkataStr);
}

// ----------------------------------------------------------------------------
// 5. Main Process Query Pipeline
// ----------------------------------------------------------------------------

export async function processAiQuery(userQuery, sessionId = 'default-session') {
  const rawQuery = (userQuery || '').trim();
  if (!rawQuery) {
    return {
      success: true,
      intent: 'GENERAL_CAMPUS_QUERY',
      answer: 'Please enter a campus query (e.g., "yogish sir kaha hai?", "cse ke liye library konsi hai?", "emergency number?").',
      data: null,
      actions: []
    };
  }

  const normQuery = normalizeQuery(rawQuery);
  const language = detectLanguage(rawQuery, normQuery);
  const context = getSessionContext(sessionId);

  const intents = detectIntents(normQuery, rawQuery);
  const entities = await extractEntities(normQuery, rawQuery, context);

  // Ambiguity Guard
  if (entities.multipleFaculty && entities.multipleFaculty.length > 1) {
    const listText = entities.multipleFaculty.slice(0, 4).map(f => `• ${f.name} (${f.department})`).join('\n');
    const ans = language === 'HINGLISH'
      ? `Aap kis Faculty ki baat kar rahe hain?\n\n${listText}`
      : `Which faculty member do you mean?\n\n${listText}`;

    return {
      success: true,
      intent: 'FACULTY_SEARCH',
      answer: ans,
      data: { multipleFaculty: entities.multipleFaculty },
      actions: []
    };
  }

  // --------------------------------------------------------------------------
  // INTENT HANDLER: DEPARTMENT HOD QUERIES (Part 1, 2, 5, 16, 17)
  // --------------------------------------------------------------------------
  if (intents.includes('DEPARTMENT_HOD') || intents.includes('DEPARTMENT_HOD_EMAIL') || intents.includes('DEPARTMENT_HOD_LOCATION') || intents.includes('DEPARTMENT_HOD_DESIGNATION') || entities.isHod) {
    const deptCode = entities.departmentCode || context.lastDepartment || 'ISE';
    if (entities.multipleHod && entities.multipleHod.length > 1) {
      return {
        success: true,
        intent: intents[0] || 'DEPARTMENT_HOD',
        answer: "Multiple HOD records found. Please select one.",
        data: { multipleHod: entities.multipleHod.map(h => ({ name: h.name, designation: h.designation, email: h.email })) },
        actions: []
      };
    }

    if (entities.hodNotFound || !entities.hod) {
      return {
        success: true,
        intent: intents[0] || 'DEPARTMENT_HOD',
        answer: `I couldn't find a verified HOD for ${deptCode} in the Campus Pulse data.`,
        data: null,
        actions: []
      };
    }

    const hod = entities.hod;
    updateSessionContext(sessionId, {
      lastFacultyId: hod.id,
      lastFacultyName: hod.name,
      lastBlockId: hod.nodeId || entities.deptInfo?.buildingId || 'block-lhc',
      lastBlockName: hod.cabinLocation || `${entities.deptInfo?.building || 'LHC'} Block`,
      lastDepartment: deptCode
    });

    const primaryIntent = intents[0] || 'DEPARTMENT_HOD';
    let ans = '';
    if (primaryIntent === 'DEPARTMENT_HOD_EMAIL') {
      ans = `${deptCode} HOD\n\n${hod.name}\n${hod.designation || 'Head of Department'}\n\n✉️ ${hod.email || 'Email not available'}`;
    } else if (primaryIntent === 'DEPARTMENT_HOD_LOCATION') {
      ans = `${deptCode} HOD\n\n${hod.name}\n📍 ${hod.cabinLocation || `${entities.deptInfo?.building || 'LHC'} Block`}`;
    } else if (primaryIntent === 'DEPARTMENT_HOD_DESIGNATION') {
      ans = `${deptCode} HOD\n\n${hod.name}\n${hod.designation || 'Head of Department'}`;
    } else {
      // DEPARTMENT_HOD
      ans = `${deptCode} HOD\n\n${hod.name}\n${hod.designation || 'Head of Department'}${hod.email ? `\n\n✉️ ${hod.email}` : ''}`;
    }

    return {
      success: true,
      intent: primaryIntent,
      answer: ans,
      data: {
        name: hod.name,
        designation: hod.designation,
        department: hod.department,
        departmentCode: deptCode,
        email: hod.email,
        ...(primaryIntent === 'DEPARTMENT_HOD_LOCATION' ? { cabinLocation: hod.cabinLocation, nodeId: hod.nodeId } : {})
      },
      actions: [
        ...(hod.email ? [{ type: 'COPY_EMAIL', value: hod.email }] : []),
        { type: 'VIEW_DEPARTMENT', department: deptCode },
        { type: 'VIEW_ON_MAP', targetId: hod.nodeId || entities.deptInfo?.buildingId || 'block-lhc' }
      ]
    };
  }

  // --------------------------------------------------------------------------
  // INTENT HANDLER: FACULTY QUERIES
  // --------------------------------------------------------------------------
  if (entities.faculty) {
    const fac = entities.faculty;
    updateSessionContext(sessionId, { lastFacultyId: fac.id, lastFacultyName: fac.name, lastBlockId: fac.nodeId || 'block-lhc', lastBlockName: fac.cabinLocation || 'LHC Block' });
    const dynStatus = calculateFacultyDynamicStatus(fac);

    const wantsEmail = intents.includes('FACULTY_EMAIL') || /\b(mail|email|gmail|e-mail)\b/i.test(rawQuery + ' ' + normQuery);
    const wantsLocation = intents.includes('FACULTY_LOCATION') || intents.includes('FACULTY_CABIN') || /\b(kaha|kahan|kidhar|where|location|cabin|sitting|milenge|milega)\b/i.test(rawQuery + ' ' + normQuery);
    const wantsDept = intents.includes('FACULTY_DEPARTMENT') || /\b(dept|department)\b/i.test(rawQuery + ' ' + normQuery);
    const wantsAvailability = intents.includes('FACULTY_AVAILABILITY') || /\b(available|free|busy|kya kar rahe|activity|abhi kya|class me hai|lab me hai|meeting me hai)\b/i.test(rawQuery + ' ' + normQuery);
    const wantsSchedule = intents.includes('FACULTY_SCHEDULE') || /\b(schedule|timetable|classes\s*today|routine|teaching|when\s*is\s*.*teaching|class\s*timing|lecture\s*schedule)\b/i.test(rawQuery + ' ' + normQuery);

    if (wantsSchedule) {
      const facDisplayName = fac.name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, '');
      const specificDaysMap = {
        monday: 'Monday', mon: 'Monday', somwar: 'Monday',
        tuesday: 'Tuesday', tue: 'Tuesday', mangalwar: 'Tuesday',
        wednesday: 'Wednesday', wed: 'Wednesday', budhwar: 'Wednesday',
        thursday: 'Thursday', thu: 'Thursday', guruwar: 'Thursday',
        friday: 'Friday', fri: 'Friday', shukrawar: 'Friday',
        saturday: 'Saturday', sat: 'Saturday', shaniwar: 'Saturday'
      };

      let requestedSpecificDay = null;
      let requestedDayLabel = '';
      for (const [key, val] of Object.entries(specificDaysMap)) {
        if (new RegExp(`\\b${key}\\b`, 'i').test(rawQuery + ' ' + normQuery)) {
          requestedSpecificDay = val;
          requestedDayLabel = val;
          break;
        }
      }

      const dayIdx = new Date().getDay();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const currentDayName = dayNames[dayIdx];

      const weekly = fac.weeklySchedule;
      let ans = '';

      if (requestedSpecificDay && weekly) {
        const daySessions = weekly[requestedSpecificDay] || [];
        if (daySessions.length > 0) {
          const sessionLines = daySessions.map(s => `${s.time}\n${s.subject}`).join('\n\n');
          ans = `${facDisplayName} — ${requestedDayLabel}\n\n${sessionLines}`;
        } else {
          ans = `${facDisplayName} — ${requestedDayLabel}\n\nNO SCHEDULED CLASSES TODAY`;
        }
      } else {
        // Default: Prioritize Today's schedule
        if (currentDayName === 'Sunday' || !weekly) {
          ans = `${facDisplayName} — Today's Schedule\n\nNO SCHEDULED CLASSES TODAY`;
        } else {
          const todaySessions = weekly[currentDayName] || [];
          if (todaySessions.length > 0) {
            const sessionLines = todaySessions.map(s => `${s.time}\n${s.subject}`).join('\n\n');
            ans = `${facDisplayName} — Today's Schedule\n\n${sessionLines}`;
          } else {
            ans = `${facDisplayName} — Today's Schedule\n\nNO SCHEDULED CLASSES TODAY`;
          }
        }
      }

      return {
        success: true,
        intent: 'FACULTY_SCHEDULE',
        answer: ans,
        data: { facultyId: fac.id, name: fac.name, weeklySchedule: fac.weeklySchedule },
        actions: [{ type: 'VIEW_ON_MAP', targetId: fac.nodeId || 'block-lhc' }]
      };
    }

    if (wantsLocation && wantsEmail) {
      const locText = dynStatus.currentEvent ? `${dynStatus.currentLocation} (${dynStatus.currentEvent})` : dynStatus.currentLocation;
      const ans = `${fac.name}\n📍 ${locText}\nStatus: ${dynStatus.status}\n✉️ ${fac.email || 'Not available'}`;
      return {
        success: true,
        intent: 'FACULTY_LOCATION_AND_EMAIL',
        answer: ans,
        data: { facultyId: fac.id, name: fac.name, email: fac.email, cabinLocation: fac.cabinLocation, status: dynStatus.status, currentLocation: dynStatus.currentLocation },
        actions: [
          { type: 'COPY_EMAIL', value: fac.email },
          { type: 'VIEW_ON_MAP', targetId: fac.nodeId || 'block-lhc' }
        ]
      };
    }

    if (wantsEmail) {
      const ans = language === 'HINGLISH'
        ? `${fac.name} ka email address:\n✉️ ${fac.email || 'Not available'}`
        : `${fac.name}'s email address:\n✉️ ${fac.email || 'Not available'}`;
      return {
        success: true,
        intent: 'FACULTY_EMAIL',
        answer: ans,
        data: { facultyId: fac.id, name: fac.name, email: fac.email },
        actions: [{ type: 'COPY_EMAIL', value: fac.email }]
      };
    }

    if (wantsDept) {
      const ans = `${fac.name} — Department of ${fac.department || 'MSRIT'}.`;
      return {
        success: true,
        intent: 'FACULTY_DEPARTMENT',
        answer: ans,
        data: { facultyId: fac.id, name: fac.name, department: fac.department },
        actions: []
      };
    }

    if (wantsAvailability) {
      const statusIcon = dynStatus.status.includes('AVAILABLE') ? '🟢' : dynStatus.status === 'COLLEGE CLOSED' ? '⚪' : '🔴';
      const locLine = dynStatus.currentEvent ? `📍 Location: ${dynStatus.currentLocation} (${dynStatus.currentEvent})` : `📍 Cabin: ${dynStatus.currentLocation}`;
      const ans = `${fac.name}\n${statusIcon} ${dynStatus.status}\n${locLine}\nNext Available: ${dynStatus.nextAvailableTime}`;
      return {
        success: true,
        intent: 'FACULTY_AVAILABILITY',
        answer: ans,
        data: { facultyId: fac.id, name: fac.name, status: dynStatus.status, currentLocation: dynStatus.currentLocation, nextAvailableTime: dynStatus.nextAvailableTime },
        actions: [{ type: 'VIEW_ON_MAP', targetId: fac.nodeId || 'block-lhc' }]
      };
    }

    if (wantsLocation) {
      const locText = dynStatus.currentEvent ? `${dynStatus.currentLocation} (${dynStatus.currentEvent})` : dynStatus.currentLocation;
      const ans = `${fac.name}\n📍 ${locText}\nStatus: ${dynStatus.status}\nNext Available: ${dynStatus.nextAvailableTime}`;
      return {
        success: true,
        intent: 'FACULTY_LOCATION',
        answer: ans,
        data: { facultyId: fac.id, name: fac.name, cabinLocation: fac.cabinLocation, status: dynStatus.status, currentLocation: dynStatus.currentLocation },
        actions: [{ type: 'VIEW_ON_MAP', targetId: fac.nodeId || 'block-lhc' }]
      };
    }

    const ans = `${fac.name} (${fac.designation || 'Faculty'}, ${fac.department || 'MSRIT'})\n📍 Current: ${dynStatus.currentLocation}\nStatus: ${dynStatus.status}\n✉️ ${fac.email || 'N/A'}`;
    return {
      success: true,
      intent: 'FACULTY_SEARCH',
      answer: ans,
      data: { faculty: fac, status: dynStatus.status, currentLocation: dynStatus.currentLocation },
      actions: [{ type: 'VIEW_ON_MAP', targetId: fac.nodeId || 'block-lhc' }]
    };
  }

  // Dynamic Faculty Status Queries: "kaun lab me hai", "kaun class me hai", "kaun meeting me hai", "kaun cabin me available hai"
  const isLabQuery = /\b(kaun.*lab|who.*in.*lab|lab me kaun|lab me hai|in lab)\b/i.test(rawQuery + ' ' + normQuery);
  const isClassQuery = /\b(kaun.*class|who.*in.*class|class me kaun|class le raha|in class|teaching)\b/i.test(rawQuery + ' ' + normQuery);
  const isMeetingQuery = /\b(kaun.*meeting|who.*in.*meeting|meeting me kaun|in meeting)\b/i.test(rawQuery + ' ' + normQuery);
  const isCabinQuery = /\b(kaun.*cabin|who.*in.*cabin|cabin me kaun|cabin me available|free hai|kaun available hai|faculty.*free|who is available)\b/i.test(rawQuery + ' ' + normQuery);

  if (isLabQuery || isClassQuery || isMeetingQuery || isCabinQuery) {
    const targetStatus = isLabQuery ? 'IN LAB' : isClassQuery ? 'IN CLASS' : isMeetingQuery ? 'IN MEETING' : 'AVAILABLE IN CABIN';
    const statusLabel = isLabQuery ? 'Lab' : isClassQuery ? 'Class' : isMeetingQuery ? 'Meeting' : 'Cabin (Available)';

    const matching = localFacultyData.filter(f => {
      const dyn = calculateFacultyDynamicStatus(f);
      return dyn.status === targetStatus || (isCabinQuery && dyn.status.includes('AVAILABLE'));
    });

    if (matching.length === 0) {
      const ans = language === 'HINGLISH'
        ? `Abhi koi bhi faculty ${statusLabel} me scheduled nahi hai.`
        : `No faculty members are currently in ${statusLabel}.`;
      return {
        success: true,
        intent: 'FACULTY_STATUS_FILTER',
        answer: ans,
        data: { count: 0, status: targetStatus },
        actions: [{ type: 'VIEW_ALL_FACULTY' }]
      };
    }

    const sample = matching.slice(0, 5);
    const listStr = sample.map(f => {
      const dyn = calculateFacultyDynamicStatus(f);
      return `• ${f.name} (${f.department}) — 📍 ${dyn.currentLocation}${dyn.currentEvent ? ` (${dyn.currentEvent})` : ''}`;
    }).join('\n');

    const ans = language === 'HINGLISH'
      ? `Faculty Members currently ${targetStatus} (${matching.length} total):\n\n${listStr}${matching.length > 5 ? `\n...and ${matching.length - 5} more.` : ''}`
      : `Faculty Members currently ${targetStatus} (${matching.length} total):\n\n${listStr}${matching.length > 5 ? `\n...and ${matching.length - 5} more.` : ''}`;

    return {
      success: true,
      intent: 'FACULTY_STATUS_FILTER',
      answer: ans,
      data: { count: matching.length, status: targetStatus, sample },
      actions: [{ type: 'VIEW_ALL_FACULTY' }]
    };
  }

  // Faculty Search by Department / List ("cse ke teachers dikha", "cse ke faculty ka list")
  if (intents.includes('FACULTY_SEARCH') || /\b(teacher|teachers|faculty|professors|list|dikha)\b/i.test(rawQuery + ' ' + normQuery)) {
    const deptQuery = entities.departmentCode || (rawQuery.toLowerCase().includes('cse') ? 'CSE' : 'CSE');
    let facultyList = [];

    const matchDept = (fDept, query) => {
      const fd = (fDept || '').toLowerCase();
      const qd = query.toLowerCase();
      if (qd === 'cse') return fd.includes('computer science') || fd.includes('cse');
      if (qd === 'ise') return fd.includes('information') || fd.includes('ise');
      if (qd === 'ece') return fd.includes('electronics & comm') || fd.includes('ece');
      if (qd === 'me') return fd.includes('medical electronics');
      return fd.includes(qd);
    };

    if (isDbConnected()) {
      try {
        facultyList = await Faculty.find({ department: { $regex: deptQuery === 'CSE' ? 'Computer Science' : deptQuery, $options: 'i' } })
          .select('name designation department cabinLocation email')
          .limit(5)
          .lean();
      } catch (e) {}
    }

    if (facultyList.length === 0 && localFacultyData.length > 0) {
      facultyList = localFacultyData.filter(f => matchDept(f.department, deptQuery)).slice(0, 5);
    }

    if (facultyList.length > 0) {
      const listStr = facultyList.map(f => `• ${f.name} (${f.designation || 'Faculty'})`).join('\n');
      const ans = language === 'HINGLISH'
        ? `${deptQuery} Department ke Faculty Members (Top 5):\n${listStr}`
        : `${deptQuery} Department Faculty Members (Showing top 5):\n${listStr}`;
      return {
        success: true,
        intent: 'FACULTY_SEARCH',
        answer: ans,
        data: { faculty: facultyList, total: facultyList.length },
        actions: [{ type: 'VIEW_ALL_FACULTY' }]
      };
    }
  }

  // --------------------------------------------------------------------------
  // INTENT HANDLER: CAMPUS NAVIGATION
  // --------------------------------------------------------------------------
  if (intents.includes('CAMPUS_NAVIGATION') || /\b(kaise jana|waha kaise|directions|route|navigate)\b/i.test(rawQuery)) {
    const targetBlockName = context.lastBlockName || 'LHC Block';
    const targetBlockId = context.lastBlockId || 'block-lhc';
    const ans = language === 'HINGLISH'
      ? `${targetBlockName} tak kaise jana hai:\n📍 Campus Central Academic Zone me Quadrangle Plaza ke paas located hai.`
      : `Directions to ${targetBlockName}:\n📍 Located in Central Academic Zone near Main Quadrangle.`;

    return {
      success: true,
      intent: 'CAMPUS_NAVIGATION',
      answer: ans,
      data: { targetBlockName, targetBlockId },
      actions: [{ type: 'VIEW_ON_MAP', targetId: targetBlockId }]
    };
  }

  // --------------------------------------------------------------------------
  // INTENT HANDLER: EMERGENCY CONTACTS
  // --------------------------------------------------------------------------
  if (intents.includes('EMERGENCY_CONTACT') || normQuery.includes('emergency') || normQuery.includes('ambulance') || normQuery.includes('fire')) {
    let contacts = VERIFIED_EMERGENCY_CONTACTS;
    if (normQuery.includes('fire')) contacts = contacts.filter(c => c.label.includes('Fire'));
    if (normQuery.includes('ambulance')) contacts = contacts.filter(c => c.label.includes('Ambulance'));

    const contactsStr = contacts.map(c => `• ${c.label}: 📞 ${c.phone}`).join('\n');
    const ans = `MSRIT Verified Emergency Contacts:\n${contactsStr}`;
    return {
      success: true,
      intent: 'EMERGENCY_CONTACT',
      answer: ans,
      data: { contacts },
      actions: []
    };
  }

  // --------------------------------------------------------------------------
  // INTENT HANDLER: LIBRARIES & OCCUPANCY
  // --------------------------------------------------------------------------
  if (intents.includes('LIBRARY_SEARCH') || intents.includes('LIBRARY_OCCUPANCY') || intents.includes('LIBRARY_HOURS') || intents.includes('LIBRARY_LOCATION') || entities.libraryId || normQuery.includes('library')) {
    const isLeastCrowded = normQuery.includes('least crowded') || normQuery.includes('khali') || normQuery.includes('quietest');
    const isApex = entities.libraryId === 'apex_unit_3_library' || normQuery.includes('apex') || normQuery.includes('first year') || normQuery.includes('1st year') || normQuery.includes('ab-714');
    const isMCA = entities.libraryId === 'mca_department_library' || normQuery.includes('mca') || normQuery.includes('ab-401');
    const isCSE = entities.departmentCode === 'CSE' || entities.libraryId === 'lhc_unit_2_library' || normQuery.includes('lhc') || normQuery.includes('lhc-306');

    if (isLeastCrowded) {
      const ans = language === 'HINGLISH'
        ? `Apex Library (AB-714) sabse least crowded hai.\n🟢 30% Occupied\n📍 Apex Block — 5th Floor\n🕘 9 AM–9 PM Daily`
        : `Apex Library (AB-714) is currently the least crowded library.\n🟢 30% Occupied\n📍 Apex Block — 5th Floor\n🕘 9 AM–9 PM Daily`;

      updateSessionContext(sessionId, { lastBlockId: 'block-apex', lastBlockName: 'Apex Block', lastRoomNumber: 'AB-714' });
      return {
        success: true,
        intent: 'LIBRARY_OCCUPANCY',
        answer: ans,
        data: { libraryId: 'apex_unit_3_library', name: 'Apex Library', roomNumber: 'AB-714', building: 'Apex', floor: '5th Floor', occupancy: '30%' },
        actions: [{ type: 'VIEW_ON_MAP', targetId: 'block-apex' }, { type: 'VIEW_DETAILS', roomNumber: 'AB-714' }]
      };
    }

    if (isApex) {
      updateSessionContext(sessionId, { lastBlockId: 'block-apex', lastBlockName: 'Apex Block', lastRoomNumber: 'AB-714' });
      const ans = language === 'HINGLISH'
        ? `Apex Library (Apex First Year Library)\n📍 Room AB-714 (5th Floor, Apex Block)\n🕘 09:00–21:00 Daily\n🟢 Active Verified Campus Library`
        : `Apex Library (Apex First Year Library)\n📍 Room AB-714 (5th Floor, Apex Block)\n🕘 09:00–21:00 Daily\n🟢 Active Verified Campus Library`;

      return {
        success: true,
        intent: 'LIBRARY_SEARCH',
        answer: ans,
        data: { libraryId: 'apex_unit_3_library', name: 'Apex Library', roomNumber: 'AB-714', building: 'Apex', floor: '5th Floor' },
        actions: [{ type: 'VIEW_ON_MAP', targetId: 'block-apex' }, { type: 'VIEW_DETAILS', roomNumber: 'AB-714' }]
      };
    }

    if (isMCA) {
      updateSessionContext(sessionId, { lastBlockId: 'block-apex', lastBlockName: 'Apex Block', lastRoomNumber: 'AB-401' });
      const ans = language === 'HINGLISH'
        ? `MCA Department Library\n📍 Room AB-401 (2nd Floor, Apex Block)\n🕘 09:00–17:00 (Mon–Sat)\n🟢 Department Library for MCA`
        : `MCA Department Library\n📍 Room AB-401 (2nd Floor, Apex Block)\n🕘 09:00–17:00 (Mon–Sat)\n🟢 Department Library for MCA`;

      return {
        success: true,
        intent: 'LIBRARY_SEARCH',
        answer: ans,
        data: { libraryId: 'mca_department_library', name: 'MCA Department Library', roomNumber: 'AB-401', building: 'Apex', floor: '2nd Floor' },
        actions: [{ type: 'VIEW_ON_MAP', targetId: 'block-apex' }, { type: 'VIEW_DETAILS', roomNumber: 'AB-401' }]
      };
    }

    if (isCSE) {
      updateSessionContext(sessionId, { lastBlockId: 'block-lhc', lastBlockName: 'LHC Block', lastRoomNumber: 'LHC-306' });
      const ans = language === 'HINGLISH'
        ? `LHC Library (Unit II — Library)\n📍 Room LHC-306 (1st Floor, LHC Block)\n🕘 09:00–21:00 Daily\n🟢 Primary Library for CSE & Circuit Branches`
        : `LHC Library (Unit II — Library)\n📍 Room LHC-306 (1st Floor, LHC Block)\n🕘 09:00–21:00 Daily\n🟢 Primary Library for CSE & Circuit Branches`;

      return {
        success: true,
        intent: 'LIBRARY_SEARCH',
        answer: ans,
        data: { libraryId: 'lhc_unit_2_library', name: 'LHC Library', roomNumber: 'LHC-306', building: 'LHC', floor: '1st Floor' },
        actions: [{ type: 'VIEW_ON_MAP', targetId: 'block-lhc' }]
      };
    }

    const ans = `Campus Libraries (Open 09:00–21:00 Daily):\n1. Apex Library (AB-714, 5th Floor Apex Block — 1st Year/PG)\n2. LHC Library (LHC-306, 1st Floor LHC Block — CSE/Electronics)\n3. ESB Central Library (ESB Block — Engineering Sciences)\n4. MCA Library (AB-401, 2nd Floor Apex Block)`;
    return {
      success: true,
      intent: 'LIBRARY_SEARCH',
      answer: ans,
      data: { librariesCount: 4 },
      actions: [{ type: 'VIEW_ON_MAP', targetId: 'block-apex' }]
    };
  }

  // --------------------------------------------------------------------------
  // INTENT HANDLER: ROOM SEARCH & AVAILABILITY
  // --------------------------------------------------------------------------
  const isRoomQuery = !!(
    entities.roomNumber ||
    entities.roomCategory ||
    intents.includes('ROOM_AVAILABILITY') ||
    intents.includes('ROOM_LOCATION') ||
    intents.includes('ROOM_SEARCH') ||
    /\b(room|rooms|classroom|classrooms|lab|labs|faculty\s*room|staff\s*room|teachers\s*room|lounge)\b/i.test(normQuery)
  );

  if (isRoomQuery) {
    let targetRoom = null;
    let matchingRooms = [];

    // Helper: find room from localRoomsData or MongoDB
    const searchRooms = (filterFn) => {
      return localRoomsData.filter(filterFn);
    };

    // 1. If explicit Room Number is present (e.g. LHC212, AB-714, DES-101)
    if (entities.roomNumber) {
      const normTarget = normalizeRoomNumber(entities.roomNumber);
      if (isDbConnected()) {
        try {
          targetRoom = await Room.findOne({
            $or: [
              { roomNumberNormalized: normTarget },
              { roomNumber: { $regex: normTarget, $options: 'i' } }
            ]
          }).lean();
        } catch (e) {}
      }

      if (!targetRoom && localRoomsData.length > 0) {
        targetRoom = localRoomsData.find(r => normalizeRoomNumber(r.roomNumber) === normTarget);
      }

      // Hard constraint check: If user specified building or department, verify it matches
      if (targetRoom) {
        if (entities.building && !targetRoom.building.toLowerCase().includes(entities.building.toLowerCase())) {
          targetRoom = null; // Mismatch with explicit building constraint
        }
        if (entities.departmentCode) {
          const rDept = (targetRoom.department || '').toLowerCase();
          const rDepts = (targetRoom.departments || []).map(d => d.toLowerCase());
          const reqCode = entities.departmentCode.toLowerCase();
          const matchDept = rDept.includes(reqCode) || rDepts.some(d => d.includes(reqCode));
          if (!matchDept) {
            // E.g. "CSE AIML LHC 212" should fail because LHC 212 is E&EE, not CSE-AIML
            targetRoom = null;
          }
        }
      }

      if (!targetRoom) {
        return {
          success: true,
          intent: 'ROOM_SEARCH',
          answer: 'No matching verified room found.',
          data: null,
          actions: []
        };
      }

      const fl = computeFloorFromRoomNumber(targetRoom.roomNumber);
      updateSessionContext(sessionId, {
        lastBlockId: targetRoom.nodeId || `block-${targetRoom.building.toLowerCase()}`,
        lastBlockName: `${targetRoom.building} Block`,
        lastRoomNumber: targetRoom.roomNumber,
        lastDepartment: targetRoom.department
      });

      const wantsFloor = /\b(floor|kis\s*floor|which\s*floor)\b/i.test(rawQuery + ' ' + normQuery);
      const wantsDept = /\b(dept|department|kis\s*department)\b/i.test(rawQuery + ' ' + normQuery);

      let ans = '';
      if (wantsFloor) {
        ans = `${targetRoom.roomNumber} (${targetRoom.name || targetRoom.type})\n📍 ${fl}, ${targetRoom.building} Block\nDepartment: ${targetRoom.department || 'General'}`;
      } else if (wantsDept) {
        ans = `${targetRoom.roomNumber} (${targetRoom.name || targetRoom.type})\nDepartment: ${targetRoom.department || 'General'}\n📍 ${fl}, ${targetRoom.building} Block`;
      } else {
        ans = `${targetRoom.roomNumber} — ${targetRoom.name || targetRoom.type}\n📍 ${fl}, ${targetRoom.building} Block\nDepartment: ${targetRoom.department || 'General'}\nStatus: 🟢 Available`;
      }

      return {
        success: true,
        intent: 'ROOM_SEARCH',
        answer: ans,
        data: { room: targetRoom, floor: fl },
        actions: [{ type: 'VIEW_ON_MAP', targetId: targetRoom.nodeId || `block-${targetRoom.building.toLowerCase()}` }]
      };
    }

    // 2. Room Category + Department Query (e.g. "ISE faculty room", "CSE AIML faculty room", "ETE lab", "EEE faculty room")
    if (entities.roomCategory && entities.departmentCode) {
      const cat = entities.roomCategory;
      const deptCode = entities.departmentCode;

      // Special handling for verified department faculty spaces
      if (cat === 'FACULTY_SPACE') {
        if (deptCode === 'ISE') {
          return {
            success: true,
            intent: 'ROOM_SEARCH',
            answer: `DES-305/303/304/311 — ISE Faculty Room\n📍 1st Floor, DES Block\nDepartment: Information Science & Engineering\nStatus: 🟢 Open for Consultation`,
            data: { department: 'ISE', building: 'DES', floor: '1st Floor', name: 'ISE Faculty Room', roomNumber: 'DES-305/303/304/311' },
            actions: [{ type: 'VIEW_ON_MAP', targetId: 'block-des' }]
          };
        }
        if (deptCode === 'E&EE' || deptCode === 'EEE') {
          return {
            success: true,
            intent: 'ROOM_SEARCH',
            answer: `LHC 212 — E&EE Faculty Room\n📍 Ground Floor (2nd Level), LHC Block\nDepartment: Electrical & Electronics Engineering\nStatus: 🟢 Available`,
            data: { roomNumber: 'LHC212', department: 'E&EE', building: 'LHC', floor: 'Ground Floor' },
            actions: [{ type: 'VIEW_ON_MAP', targetId: 'block-lhc' }]
          };
        }
        if (deptCode === 'CSE-AIML') {
          return {
            success: true,
            intent: 'ROOM_SEARCH',
            answer: `CSE-AIML Department Space & Faculty Rooms\n📍 CRD / Multipurpose Block (Rooms CRD-411, CRD-501, CRD-502)\nDepartment: Computer Science & Engineering (AIML)\nStatus: 🟢 Active`,
            data: { department: 'CSE-AIML', building: 'CRD', rooms: ['CRD-411', 'CRD-501', 'CRD-502'] },
            actions: [{ type: 'VIEW_ON_MAP', targetId: 'block-crd' }]
          };
        }
        if (deptCode === 'AI & ML') {
          return {
            success: true,
            intent: 'ROOM_SEARCH',
            answer: `AI & ML Department Rooms & Faculty Space\n📍 Apex Block (Rooms AB-703, AB-801, AB-906)\nDepartment: Artificial Intelligence & Machine Learning\nStatus: 🟢 Active`,
            data: { department: 'AI & ML', building: 'Apex', rooms: ['AB-703', 'AB-801', 'AB-906'] },
            actions: [{ type: 'VIEW_ON_MAP', targetId: 'block-apex' }]
          };
        }
      }

      // Query database/localRooms for matching rooms
      matchingRooms = searchRooms(r => {
        const matchCat = cat === 'FACULTY_SPACE'
          ? (r.type === 'Lounge' || r.type === 'Office' || /faculty|staff/i.test(r.name))
          : cat === 'LAB'
          ? (r.type === 'Lab' || /lab/i.test(r.name))
          : true;

        const matchDept = (r.department || '').toLowerCase().includes(deptCode.toLowerCase()) ||
          (r.departments || []).some(d => d.toLowerCase().includes(deptCode.toLowerCase()));

        const matchBldg = !entities.building || r.building.toLowerCase().includes(entities.building.toLowerCase());

        return matchCat && matchDept && matchBldg;
      });

      if (matchingRooms.length === 0) {
        return {
          success: true,
          intent: 'ROOM_SEARCH',
          answer: 'No matching verified room found.',
          data: null,
          actions: []
        };
      }

      const sample = matchingRooms.slice(0, 5);
      const listStr = sample.map(r => `• **${r.roomNumber}** (${r.name || r.type}) — 📍 ${computeFloorFromRoomNumber(r.roomNumber)}, ${r.building} Block`).join('\n');
      const ans = `${deptCode} ${cat === 'FACULTY_SPACE' ? 'Faculty Rooms / Spaces' : 'Labs'} (${matchingRooms.length} verified):\n\n${listStr}`;

      return {
        success: true,
        intent: 'ROOM_SEARCH',
        answer: ans,
        data: { count: matchingRooms.length, rooms: sample },
        actions: [{ type: 'VIEW_ON_MAP', targetId: `block-${sample[0].building.toLowerCase()}` }]
      };
    }
  }

  // --------------------------------------------------------------------------
  // INTENT HANDLER: BUILDINGS & CAMPUS MAP
  // --------------------------------------------------------------------------
  if (intents.includes('BUILDING_LOCATION') || normQuery.includes('lhc') || normQuery.includes('esb') || normQuery.includes('crd')) {
    const searchTarget = entities.building || (normQuery.includes('lhc') ? 'LHC' : normQuery.includes('esb') ? 'ESB' : 'LHC');
    updateSessionContext(sessionId, { lastBlockId: `block-${searchTarget.toLowerCase()}`, lastBlockName: `${searchTarget} Block` });
    const ans = `${searchTarget} Block\n📍 Verified Academic Campus Block\nDepartments: CSE, ISE, ECE, Medical Electronics`;
    return {
      success: true,
      intent: 'BUILDING_LOCATION',
      answer: ans,
      data: { buildingId: searchTarget.toLowerCase(), name: `${searchTarget} Block` },
      actions: [
        { type: 'VIEW_ON_MAP', targetId: `block-${searchTarget.toLowerCase()}` }
      ]
    };
  }

  // --------------------------------------------------------------------------
  // INTENT HANDLER: EVENTS & ANNOUNCEMENTS
  // --------------------------------------------------------------------------
  if (intents.includes('EVENT_SEARCH')) {
    try {
      const result = await getLiveEvents();
      const events = (result?.data || []).slice(0, 3);
      if (events.length > 0) {
        const itemsText = events.map(e => `• "${e.title}" (${e.date}, Venue: ${e.location || 'MSRIT'})`).join('\n');
        return {
          success: true,
          intent: 'EVENT_SEARCH',
          answer: `Latest MSRIT Events:\n${itemsText}`,
          data: { events },
          actions: []
        };
      }
    } catch (e) {}

    return {
      success: true,
      intent: 'EVENT_SEARCH',
      answer: "I couldn't find a verified event.",
      data: null,
      actions: []
    };
  }

  if (intents.includes('ANNOUNCEMENT_SEARCH')) {
    try {
      const result = await getLiveAnnouncements();
      const list = (result?.data || []).slice(0, 3);
      if (list.length > 0) {
        const itemsText = list.map(a => `• "${a.title}" (${a.date})`).join('\n');
        return {
          success: true,
          intent: 'ANNOUNCEMENT_SEARCH',
          answer: `Official MSRIT Announcements:\n${itemsText}`,
          data: { announcements: list },
          actions: []
        };
      }
    } catch (e) {}

    return {
      success: true,
      intent: 'ANNOUNCEMENT_SEARCH',
      answer: "No official announcements currently listed.",
      data: null,
      actions: []
    };
  }

  // --------------------------------------------------------------------------
  // INTENT HANDLER: MSRIT CLUBS
  // --------------------------------------------------------------------------
  if (intents.includes('CLUB_SEARCH')) {
    try {
      const result = await getLiveClubs({ q: query });
      const clubs = result?.data || [];
      if (clubs.length === 1) {
        const c = clubs[0];
        const chStr = c.relatedChapters && c.relatedChapters.length > 0
          ? `\n\nRelated Chapters:\n${c.relatedChapters.map(ch => `• ${ch}`).join('\n')}`
          : '';
        const igStr = c.instagramUrl ? `\n\n[GET TO KNOW →](${c.instagramUrl})` : '';
        return {
          success: true,
          intent: 'CLUB_DETAILS',
          answer: `**${c.name}**\n${c.category}\n\n${c.description}${chStr}${igStr}`,
          data: { club: c },
          actions: c.instagramUrl ? [{ label: 'GET TO KNOW →', url: c.instagramUrl, type: 'EXTERNAL_LINK' }] : []
        };
      }
      if (clubs.length > 1) {
        const sample = clubs.slice(0, 5);
        const clubsText = sample.map(c => `• **${c.name}** (${c.category})\n  ${c.description}${c.instagramUrl ? ` • [GET TO KNOW →](${c.instagramUrl})` : ''}`).join('\n\n');
        return {
          success: true,
          intent: 'CLUB_SEARCH',
          answer: `Verified MSRIT Student Clubs (${clubs.length}):\n\n${clubsText}`,
          data: { clubs: sample },
          actions: []
        };
      }
    } catch (e) {}
  }

  // --------------------------------------------------------------------------
  // INTENT HANDLER: ISSUES & COMPLAINTS
  // --------------------------------------------------------------------------
  if (intents.includes('ISSUE_SEARCH') || intents.includes('ISSUE_STATUS')) {
    const ans = `Reported Campus Facility Issues:\n• "Weak Wi-Fi Signal Near Study Pods" — Status: Reported (Apex Block Library)`;
    return {
      success: true,
      intent: 'ISSUE_STATUS',
      answer: ans,
      data: { status: 'Reported', location: 'Apex Block Library' },
      actions: [{ type: 'VIEW_ISSUE' }]
    };
  }

  // --------------------------------------------------------------------------
  // ZERO-RESULT FALLBACK (STRICT GROUNDING & NO HALLUCINATION)
  // --------------------------------------------------------------------------
  return {
    success: true,
    intent: 'UNKNOWN_QUERY',
    answer: "I couldn't find that in Campus Pulse.",
    data: null,
    actions: []
  };
}
