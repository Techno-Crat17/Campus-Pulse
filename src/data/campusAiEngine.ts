// ============================================================================
// CAMPUS PULSE — GENERAL CAMPUS AI CHATBOT ENGINE
// Single Source of Truth Grounding:
// 1. Faculty Dataset (FACULTY_MSRIT_DATA, dynamic status engine)
// 2. Central Library Dataset (LIBRARIES, occupancy details)
// 3. Verified Campus Blocks & Building Nodes (VERIFIED_CAMPUS_BLOCKS)
// 4. MSRIT Room Registry (findRoomByNumber, roomsData.ts)
// 5. Live Official MSRIT News & Events (fetchAnnouncements, fetchEvents)
// 6. Live Official MSRIT Clubs & Organizations (fetchClubs)
// 7. Community Issue Reports (queryAllIssues, queryIssuesByLocation...)
// 8. Verified Emergency Contacts
// 9. Strict No-Hallucination & Multi-Intent Grounding Protocol
// ============================================================================

import {
  FACULTY_MSRIT_DATA,
  resolveFacultyBuildingMapping
} from './facultyData';
import type { MSRITFacultyRecord, CampusNode, FacultyDayScheduleItem } from './facultyData';

import {
  LIBRARIES,
  isLibraryOpen,
  getLibraryOccupancyDetails
} from './libraryData';
import type { CampusLibrary } from './libraryData';

import {
  MSRIT_LOCATIONS_DATA,
  MSRIT_DEPARTMENTS_DATA
} from './campusData';
import type { MSRITLocation, MSRITDepartment } from './campusData';

import {
  getFacultyLiveStatus
} from './statusEngine';
import type { SimulatedTimeState } from './statusEngine';

import {
  VERIFIED_CAMPUS_BLOCKS
} from './verifiedCampusBlocks';
import type { VerifiedCampusBlock } from './verifiedCampusBlocks';

import {
  SAMPLE_LOST_FOUND_ITEMS
} from './lostFoundData';
import type { LostFoundItem } from './lostFoundData';

import {
  queryAllIssues,
  queryIssuesByLocation,
  queryUnresolvedIssues,
  queryHighPriorityIssues
} from './issueReportsData';
import type { IssueReport } from './issueReportsData';

import {
  findRoomByNumber,
  findRoomsByName,
  getRoomsByBuilding,
  getRoomsByFloor,
  normalizeRoomNumber,
  normalizeRoomNameForSearch,
  normalizeDepartmentCode,
  getDepartmentDisplayName,
  extractRoomCategory,
  queryRooms
} from './roomsData';
import type { MSRITRoomRecord } from './roomsData';

import {
  VERIFIED_MSRIT_CLUBS
} from './clubsData';
import type { VerifiedClub } from './clubsData';

import {
  fetchAnnouncements,
  fetchEvents
} from '../services/api';

// ----------------------------------------------------------------------------
// Types & Interfaces
// ----------------------------------------------------------------------------

export type CampusAiIntent =
  | 'FACULTY_SEARCH'
  | 'FACULTY_EMAIL'
  | 'FACULTY_DESIGNATION'
  | 'FACULTY_DEPARTMENT'
  | 'FACULTY_CABIN'
  | 'FACULTY_LOCATION'
  | 'FACULTY_AVAILABILITY'
  | 'FACULTY_SCHEDULE'
  | 'FACULTY_HOD'
  | 'DEPARTMENT_HOD'
  | 'DEPARTMENT_HOD_EMAIL'
  | 'DEPARTMENT_HOD_LOCATION'
  | 'DEPARTMENT_HOD_DESIGNATION'
  | 'LIBRARY_SEARCH'
  | 'LIBRARY_LOCATION'
  | 'LIBRARY_OCCUPANCY'
  | 'LIBRARY_USERS'
  | 'LIBRARY_HOURS'
  | 'DIGITAL_LIBRARY_QUERY'
  | 'BUILDING_SEARCH'
  | 'BUILDING_LOCATION'
  | 'BUILDING_ROOMS'
  | 'BUILDING_FLOOR_ROOMS'
  | 'BUILDING_FACULTY'
  | 'ROOM_SEARCH'
  | 'ROOM_AVAILABILITY'
  | 'ROOM_LOCATION'
  | 'ROOM_DETAILS'
  | 'DEPARTMENT_ROOMS'
  | 'CLASSROOM_QUERY'
  | 'OCCUPANCY_QUERY'
  | 'LOST_FOUND_QUERY'
  | 'ISSUE_SEARCH'
  | 'ISSUE_REPORT_QUERY'
  | 'ISSUE_STATUS'
  | 'ISSUE_LOCATION'
  | 'ISSUE_PRIORITY'
  | 'CAMPUS_HOURS'
  | 'CAMPUS_LOCATION'
  | 'CAMPUS_NAVIGATION'
  | 'DEPARTMENT_LOCATION'
  | 'EVENT_SEARCH'
  | 'ANNOUNCEMENT_SEARCH'
  | 'CLUB_SEARCH'
  | 'CLUB_DETAILS'
  | 'CLUB_CATEGORY_SEARCH'
  | 'EMERGENCY_CONTACT'
  | 'GENERAL_CAMPUS_QUERY'
  | 'UNKNOWN_QUERY';

export interface CampusAiResult {
  queryText: string;
  normalizedQuery: string;
  intents: CampusAiIntent[];
  responseText: string;
  subText?: string;
  matchedFaculty?: MSRITFacultyRecord & { isCollegeOpen?: boolean };
  multipleFaculty?: MSRITFacultyRecord[];
  matchedLibrary?: CampusLibrary;
  matchedLocation?: MSRITLocation;
  matchedDepartment?: MSRITDepartment;
  matchedNode?: CampusNode;
  matchedBlock?: VerifiedCampusBlock;
  matchedLostItem?: LostFoundItem;
  matchedIssues?: IssueReport[];
  matchedRoom?: MSRITRoomRecord;
  matchedRoomsList?: MSRITRoomRecord[];
  matchedEvents?: Array<{ title: string; date: string; location?: string; link?: string; category?: string }>;
  matchedAnnouncements?: Array<{ title: string; date: string; link?: string; category?: string }>;
  matchedClubs?: Array<{ name: string; category: string; description?: string; officialUrl?: string; sourceUrl?: string; instagramUrl?: string; department?: string }>;
  matchedClub?: VerifiedClub;
  matchedEmergencyContacts?: Array<{ label: string; phone: string; category: string }>;
  sourceUrl?: string;
  sourceAttribution?: string;
  actionTargetId?: string;
  clarificationNeeded?: boolean;
  clarificationOptions?: string[];
  contextUpdated?: CampusAiContext;
}

export interface CampusAiContext {
  lastFaculty?: MSRITFacultyRecord | null;
  lastLibrary?: CampusLibrary | null;
  lastBuildingNode?: CampusNode | null;
  lastBlock?: VerifiedCampusBlock | null;
  lastLocation?: MSRITLocation | null;
  lastDepartment?: MSRITDepartment | null;
  lastDepartmentCode?: string | null;
  lastRoomCategory?: string | null;
  lastBuildingKey?: string | null;
  lastRoom?: MSRITRoomRecord | null;
  lastClub?: VerifiedClub | null;
  lastIntents?: CampusAiIntent[];
  history?: Array<{ query: string; responseText: string; timestamp: number }>;
}

export interface ExtractedEntities {
  rawQuery: string;
  normQ: string;
  facultyName?: string;
  matchedFaculty?: MSRITFacultyRecord;
  multipleFaculty?: MSRITFacultyRecord[];
  isPronounFaculty?: boolean;
  matchedClub?: VerifiedClub;
  isPronounClub?: boolean;
  clubQuery?: string;
  role?: string;
  requestedField?: string;
  isHod?: boolean;
  departmentCode?: string;
  departmentName?: string;
  departmentDisplayName?: string;
  matchedDepartment?: MSRITDepartment;
  libraryId?: string;
  matchedLibrary?: CampusLibrary;
  isPronounLibrary?: boolean;
  buildingId?: string;
  buildingKey?: string;
  matchedBlock?: VerifiedCampusBlock;
  matchedLocation?: MSRITLocation;
  matchedNode?: CampusNode;
  isPronounBuilding?: boolean;
  studentGroup?: 'CSE' | '1st Year' | 'Electronics' | 'Non-CSE' | 'MCA' | 'MBA' | 'Architecture' | 'Civil/Mechanical/Chemical/Biotech';
  lostFoundKeyword?: string;
  issueKeyword?: string;
  roomQuery?: string;
  roomCategory?: 'FACULTY_ROOM' | 'LAB' | 'LIBRARY' | 'SEMINAR_HALL' | 'OFFICE' | 'CLASSROOM' | string | null;
  matchedRoom?: MSRITRoomRecord;
  matchedRoomsList?: MSRITRoomRecord[];
}

// ----------------------------------------------------------------------------
// Verified Campus Emergency Contacts Dataset
// ----------------------------------------------------------------------------
export const VERIFIED_EMERGENCY_CONTACTS = [
  { label: 'MSRIT Administration / Admissions', phone: '080-23607902', category: 'Campus Administration' },
  { label: 'Registrar Administration / Anti-Ragging', phone: '080-23608445', category: 'Registrar & Student Safety' },
  { label: 'Fire Emergency Service', phone: '101', category: 'Standard Emergency Service' },
  { label: 'Ambulance Service', phone: '108', category: 'Standard Emergency Medical' }
];

// ----------------------------------------------------------------------------
// Department Canonical Mapping Helper
// ----------------------------------------------------------------------------

export function resolveDepartment(input: string): {
  code: string;
  name: string;
  building: string;
  buildingId: string;
  matchFn: (f: MSRITFacultyRecord) => boolean;
} | null {
  if (!input) return null;
  const s = input.trim().toLowerCase();

  if (/\b(ise|information\s*science)\b/i.test(s)) {
    return {
      code: 'ISE',
      name: 'Information Science & Engineering',
      building: 'LHC',
      buildingId: 'block-lhc',
      matchFn: (f) => {
        const d = (f.department || '').toLowerCase();
        return d.includes('information science') || d.includes('ise');
      }
    };
  }
  if (/\b(cse\s*aiml|aiml|ai\s*&\s*ml|ai-ml|artificial\s*intelligence)\b/i.test(s)) {
    return {
      code: 'AIML',
      name: 'Artificial Intelligence & Machine Learning',
      building: 'CRD',
      buildingId: 'block-crd',
      matchFn: (f) => {
        const d = (f.department || '').toLowerCase();
        return d.includes('ai & ml') || d.includes('aiml') || d.includes('artificial intelligence');
      }
    };
  }
  if (/\b(cse\s*cy|cyber\s*security|cy)\b/i.test(s)) {
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
  if (/\b(cse|computer\s*science)\b/i.test(s)) {
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
  if (/\b(ece|electronics\s*&\s*communication)\b/i.test(s)) {
    return {
      code: 'ECE',
      name: 'Electronics & Communication Engineering',
      building: 'LHC',
      buildingId: 'block-lhc',
      matchFn: (f) => {
        const d = (f.department || '').toLowerCase();
        return d.includes('electronics & communication') || d.includes('ece');
      }
    };
  }
  if (/\b(et|telecom|telecommunication|electronics\s*&\s*telecommunication)\b/i.test(s)) {
    return {
      code: 'ET',
      name: 'Electronics & Telecommunication Engineering',
      building: 'LHC',
      buildingId: 'block-lhc',
      matchFn: (f) => {
        const d = (f.department || '').toLowerCase();
        return d.includes('telecommunication') || d.includes('et');
      }
    };
  }
  if (/\b(ei|instrumentation|electronics\s*&\s*instrumentation)\b/i.test(s)) {
    return {
      code: 'EI',
      name: 'Electronics & Instrumentation Engineering',
      building: 'LHC',
      buildingId: 'block-lhc',
      matchFn: (f) => {
        const d = (f.department || '').toLowerCase();
        return d.includes('instrumentation') || d.includes('ei');
      }
    };
  }
  // IMPORTANT: MLE / ME = Medical Electronics. Do NOT interpret ME as Mechanical Engineering per Section 4 & 6.
  if (/\b(mle|me|medical\s*electronics)\b/i.test(s) && !/\bmechanical\b/i.test(s)) {
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
  if (/\b(e&ee|eee|electrical|electrical\s*&\s*electronics)\b/i.test(s)) {
    return {
      code: 'E&EE',
      name: 'Electrical & Electronics Engineering',
      building: 'LHC',
      buildingId: 'block-lhc',
      matchFn: (f) => {
        const d = (f.department || '').toLowerCase();
        return d.includes('electrical') || d.includes('e&ee') || d.includes('eee');
      }
    };
  }
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
  if (/\b(biotech|biotechnology)\b/i.test(s)) {
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
  if (/\b(ind|industrial|iem|industrial\s*engineering)\b/i.test(s)) {
    return {
      code: 'IND',
      name: 'Industrial Engineering & Management',
      building: 'ESB',
      buildingId: 'block-esb',
      matchFn: (f) => {
        const d = (f.department || '').toLowerCase();
        return d.includes('industrial');
      }
    };
  }
  return null;
}

// ----------------------------------------------------------------------------
// 1. Natural Language Normalization
// ----------------------------------------------------------------------------

export function normalizeQuery(query: string): string {
  let q = query
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/["“”]/g, '"')
    .replace(/['"]s\b/g, '') // e.g. sumana's -> sumana, yogish's -> yogish
    .replace(/[?.,!;:()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Common typos, Hinglish & abbreviation normalizations
  const typoReplacements: Array<[RegExp, string]> = [
    [/\blibraray\b|\blibary\b|\blibray\b|\blibrari\b/g, 'library'],
    [/\besb\s*lib\b/g, 'esb library'],
    [/\blhc\s*lib\b/g, 'lhc library'],
    [/\bapex\s*lib\b/g, 'apex library'],
    [/\bfacutly\b|\bfaculity\b|\bfacuty\b|\bfaclty\b/g, 'faculty'],
    [/\bprofesor\b|\bproffesor\b|\bprofessr\b/g, 'professor'],
    [/\bhods\b/g, 'hod'],
    [/\bdepartmnt\b|\bdepertment\b/g, 'department'],
    [/\bdept\b/g, 'department'],
    [/\bschedul\b|\btimetabl\b|\btime\s*table\b/g, 'schedule'],
    [/\bavailabl\b|\bavailibility\b|\bavaliable\b|\bavailabe\b/g, 'available'],
    [/\boccupenci\b|\boccupency\b/g, 'occupancy'],
    [/\bsumana\s*maradithya\b|\bsumana\s*maraditya\b/g, 'sumana maradithaya'],
    [/\b1st\s*yr\b|\b1styr\b|\bfirst\s*yr\b|\bfreshers\b|\bfresher\b/g, 'first year'],
    [/\bwho\s*is\s*the\s*head\s*of\b/g, 'who is the hod of'],
    [/\bhead\s*of\s*department\b|\bhead\s*of\s*dept\b|\bdepartment\s*head\b/g, 'hod'],
    [/\bwhere['\s]*s\b/g, 'where is'],
    [/\bwhat['\s]*s\b/g, 'what is'],
    [/\bhow['\s]*s\b/g, 'how is'],
    [/\bkaha\s*hai\b|\bkahan\s*hai\b|\bkidhar\s*hai\b|\bkaha\s*h\b|\bkidhar\s*h\b|\bkahan\s*milega\b|\bkaha\s*milenge\b|\bhai\s*kaha\b|\bhai\s*kidhar\b/g, 'where is'],
    [/\bkon\s*hai\b|\bkaun\s*hai\b|\bkaun\s*h\b/g, 'who is'],
    [/\bkab\s*free\b|\bkab\s*available\b|\bkab\s*milenge\b/g, 'when available'],
    [/\bpadhne\s*ki\s*jagah\b|\bstudy\s*place\b|\bstudy\s*room\b/g, 'library'],
    [/\baaj\s*kya\s*hai\b|\bcollege\s*me\s*kya\s*ho\s*raha\b|\bcollege\s*me\s*kya\s*h\b/g, 'events today'],
    [/\bmeri\s*complaint\b|\bproblem\s*report\b|\bissue\s*status\b/g, 'issue status'],
    [/\bki\s*mail\s*id\b|\bka\s*mail\b|\bmail\s*id\b|\bemail\s*id\b/g, 'email'],
    [/\bpratima\b/g, 'prathima'],
    [/\bshruti\b/g, 'shruthi'],
    [/\bkiske\s*liye\b/g, 'for whom']
  ];

  for (const [pattern, replacement] of typoReplacements) {
    q = q.replace(pattern, replacement);
  }

  // Room normalization: LHC 204, LHC-204, LHC204 -> LHC204
  q = q.replace(/\b(lhc|esb|ab|arch)[- ]?(\d{3}[a-z]?)\b/gi, (_match, p1, p2) => {
    const prefix = p1.toUpperCase();
    if (prefix === 'LHC') return `LHC${p2}`;
    if (prefix === 'ARCH') return `ARCH${p2}`;
    return `${prefix}-${p2}`;
  });

  return q.replace(/\s+/g, ' ').trim();
}

// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// 2. Intent Detection Pipeline (Multi-Intent Support)
// ----------------------------------------------------------------------------

export function detectIntents(normalizedQuery: string, context?: CampusAiContext): CampusAiIntent[] {
  const q = normalizedQuery;
  const intents: CampusAiIntent[] = [];

  const isLocationQuery = /\b(where\s*is|where\s*are|where\s*can\s*i\s*find|where\s*do\s*i\s*find|where['\s]*s|kaha\s*hai|kahan\s*hai|kidhar\s*hai|kaha\s*h|kidhar\s*h|kahan\s*h|kaha\s*milega|kaha\s*milenge|location|location\s*batao|location\s*btao|find|locate|address\s*of|which\s*building|which\s*block|which\s*floor|kis\s*building\s*me|kis\s*block\s*me|kis\s*floor\s*pe|kis\s*floor\s*par|kaunsi\s*floor|konsa\s*block|room\s*kaha\s*hai|room\s*kidhar\s*hai|kaun\s*sa\s*room\s*hai|kaun\s*sa\s*room|kya\s*hai)\b/i.test(q);

  const isHod = /\b(hod|head\s*of\s*department|head\s*of\s*the\s*department|dept\s*head|department\s*head)\b/i.test(q)
    || (/\bhead\b/i.test(q) && /\b(ise|cse|ece|et|ei|me|aiml|cy|cv|biotech|ind|department|dept)\b/i.test(q));

  const hasEmail = /\b(email|e-mail|mail\s*id|email\s*id|mail\s*address|email\s*address|mail|contact\s*email)\b/.test(q);
  const hasCabin = /\b(cabin|office|which\s*cabin|find\s*cabin|sitting|sit)\b/.test(q);
  const hasAvailability = /\b(available|availability|free|busy|in\s*lecture|in\s*class|can\s*i\s*meet|who\s*can\s*i\s*meet|who\s*is\s*free|who\s*is\s*available|which\s*faculty\s*are\s*available|when\s*free|vacant)\b/.test(q);
  const hasSchedule = /\b(schedule|timetable|classes\s*today|routine|teaching|when\s*is\s*.*teaching|class\s*timing|lecture\s*schedule)\b/i.test(q);
  const hasLocation = isLocationQuery;

  const hasOccupancy = /\b(occupancy|how\s*crowded|crowded|busy|rush|empty|least\s*crowded|less\s*crowded|seats|full)\b/.test(q);
  const hasLibraryUsers = /\b(who\s*uses|primary\s*users|for\s*cse|for\s*electronics|for\s*first\s*year|which\s*library\s*should|best\s*library|where\s*can\s*.*study)\b/.test(q);
  const hasLibraryHours = /\b(library\s*open|library\s*close|library\s*hours|library\s*timing|is\s*.*library\s*open)\b/.test(q);
  const mentionsExplicitLibrary = /\b(library|libraries|esb\s*library|lhc\s*library|apex\s*library|unit\s*2|unit\s*ii|unit\s*3|unit\s*iii|lhc\s*306)\b/.test(q);

  // CRITICAL: Event search MUST ONLY trigger when user is asking for actual events, fests, or schedules.
  // NEVER trigger when asking about physical rooms/seminar halls/locations.
  const hasEvents = !isLocationQuery && !/\b(seminar\s*hall|board\s*room|auditorium)\b/i.test(q) && (
    /\b(event|events|happening\s*today|upcoming\s*events|fest|symposium|what\s*events|show\s*events|any\s*event|aaj\s*kya\s*hai|college\s*me\s*kya\s*ho\s*raha|kal\s*koi\s*event)\b/i.test(q) ||
    /\bupcoming\s*(seminars?|workshops?|events?)\b/i.test(q) ||
    (/\b(seminar|workshop)\b/i.test(q) && /\b(tomorrow|today|upcoming|next\s*week|happening|any\s*workshop|any\s*seminar|kal|parso)\b/i.test(q))
  );
  const hasSpecificClubName = /\b(tnt|lasya|prayaag|theatrix|chiraranga|debsoc|19a|quiz\s*club|iclick|inara|ramaiah\s*comedy|comedy\s*club|studio\.?rit|studiorit|clutchrit|nakama|ritmunsoc|munsoc|ieee|csi|ici|iiche|roborit|indian\s*music|western\s*music)\b/i.test(q);
  const hasClubCategoryKeyword = /\b(dance|dancing|music|singing|band|vocal|instrumental|drama|theatre|theater|nukkad|natak|acting|photography|videography|creative\s*writing|fine\s*arts|comedy|stand-up|standup|improv|gaming|esports|anime|japanese|mun|debate|debates|debating|public\s*speaking|robotics|coding|hackathons|concrete|civil\s*engineering|chemical\s*engineering)\b/i.test(q) && /\b(club|clubs|team|crew|society|societies|community|kaunsa|hai|batao|kya|wala|chahiye|konsa)\b/i.test(q) || /\b(cultural\s*clubs?|technical\s*clubs?|literary\s*clubs?)\b/i.test(q);
  const hasClubs = hasSpecificClubName || hasClubCategoryKeyword || /\b(club|clubs|organization|organizations|society|societies|extracurricular|co-curricular|student\s*activity|student\s*activities|chapters)\b/i.test(q);
  const hasEmergency = /\b(emergency|contact|phone|ambulance|fire|registrar\s*phone|administration\s*phone|helpline|anti[- ]ragging)\b/.test(q);
  const hasAnnouncements = /\b(announcement|announcements|news|circular|notice|latest\s*news|msrit\s*news|circulars)\b/.test(q);

  const hasLostFound = /\b(lost|found|misplaced|calculator|airpods|bottle|wallet|watch|umbrella|keys|bag|spectacles)\b/.test(q);
  const hasIssues = /\b(issue|issues|complaint|complaints|reported|unresolved|resolved|high\s*priority|urgent|infrastructure|cleanliness|electricity|water|wifi|wi-fi)\b/.test(q);

  const hasRoomAvailability = /\b(free|available|khali|empty|vacant|room\s*chahiye|chahiye|need\s*a\s*room)\b/i.test(q) || /\b\d{1,2}\s*(se|to|-)\s*\d{1,2}\s*(baje|pm|am)?\b/i.test(q);
  const hasRoom = /\b(ab[- ]?\d{3}[a-z]?|esb[- ]?\d{3}[a-z]?|lhc[- ]?\d{3}[a-z]?|crd[- ]?\d{3}[a-z]?|arch[- ]?\d{3}[a-z]?|room[- ]?\d{3}[a-z]?|\d{3}[a-z]?|classroom|classrooms|seminar\s*hall|seminar\s*hall\s*1|seminar\s*hall\s*2|seminar\s*hall\s*i|seminar\s*hall\s*ii|board\s*room|auditorium|antenna|fabrication|schneider|evolute|startup\s*zone|equipment\s*lab|software\s*lab|instrumentation\s*lab|logic\s*design)\b/i.test(q);
  const mentionsBuilding = /\b(lhc|esb|apex|architecture|basketball|sports|quadrangle|multipurpose|workshop|crd|des|cafeteria|food\s*court|hostel|basic\s*sciences)\b/.test(q);

  // HOD Intents (Part 2: DEPARTMENT_HOD, DEPARTMENT_HOD_EMAIL, DEPARTMENT_HOD_LOCATION, DEPARTMENT_HOD_DESIGNATION)
  if (isHod) {
    intents.push('FACULTY_HOD');
    if (hasEmail) {
      intents.push('DEPARTMENT_HOD_EMAIL');
      intents.push('DEPARTMENT_HOD');
    } else if (hasCabin || hasLocation) {
      intents.push('DEPARTMENT_HOD_LOCATION');
      intents.push('DEPARTMENT_HOD');
    } else if (/\b(designation|post|title|role)\b/.test(q)) {
      intents.push('DEPARTMENT_HOD_DESIGNATION');
      intents.push('DEPARTMENT_HOD');
    } else {
      intents.push('DEPARTMENT_HOD');
    }
  }

  // 1. Room & Classroom Intents (High Priority)
  if (hasRoom || (hasRoomAvailability && (mentionsBuilding || /\broom\b/i.test(q)))) {
    if (hasRoomAvailability) {
      intents.push('ROOM_AVAILABILITY');
    } else if (isLocationQuery) {
      intents.push('ROOM_LOCATION');
    } else {
      intents.push('ROOM_SEARCH');
    }
    if (q.includes('classroom')) intents.push('CLASSROOM_QUERY');
  }

  // 2. Library specific
  if ((mentionsExplicitLibrary || (mentionsBuilding && (hasOccupancy || hasLibraryUsers))) && !hasIssues) {
    if (hasOccupancy) intents.push('LIBRARY_OCCUPANCY');
    if (hasLibraryUsers) intents.push('LIBRARY_USERS');
    if (hasLibraryHours) intents.push('LIBRARY_HOURS');
    if (hasLocation && !hasOccupancy && !hasLibraryUsers) intents.push('LIBRARY_LOCATION');
    if (intents.length === 0) intents.push('LIBRARY_SEARCH');
  }

  // 3. Building & Department locations
  if (mentionsBuilding && hasLocation && !mentionsExplicitLibrary && !hasRoom && !hasIssues && !isHod) intents.push('BUILDING_LOCATION');

  // 4. Faculty specific
  if (hasEmail && !isHod) intents.push('FACULTY_EMAIL');
  if (hasCabin && !isHod) intents.push('FACULTY_CABIN');
  if (hasLocation && !mentionsExplicitLibrary && !mentionsBuilding && !hasRoom && !hasIssues && !isHod) intents.push('FACULTY_LOCATION');
  if (hasAvailability) intents.push('FACULTY_AVAILABILITY');
  if (hasSchedule) intents.push('FACULTY_SCHEDULE');

  // 5. Issue reports
  if (hasIssues && (q.includes('issue') || q.includes('reported') || q.includes('unresolved') || q.includes('resolved') || q.includes('priority'))) {
    intents.push('ISSUE_REPORT_QUERY');
  }

  // 6. Lost & Found
  if (hasLostFound && (q.includes('lost') || q.includes('found') || q.includes('item') || q.includes('where was'))) {
    intents.push('LOST_FOUND_QUERY');
  }

  // 7. Events & Announcements
  if (hasEvents) intents.push('EVENT_SEARCH');
  if (hasAnnouncements) intents.push('ANNOUNCEMENT_SEARCH');

  // 8. Clubs & Student Activities
  const hasClubPronoun = Boolean(context?.lastClub) && /\b(they|them|their|it|its|this club|that club|the club|uske|iska|uski|unka|kya karta|kya karti|chapters|subchapters|what do they do|what does it do|what they do|tell me more|unke bare me)\b/i.test(q);
  if (hasSpecificClubName || (/\b(what\s*is|tell\s*me\s*about|kya\s*hai|kya\s*karta|details|chapters)\b/i.test(q) && hasClubs) || hasClubPronoun) {
    intents.push('CLUB_DETAILS');
  } else if (hasClubCategoryKeyword) {
    intents.push('CLUB_CATEGORY_SEARCH');
  } else if (hasClubs) {
    intents.push('CLUB_SEARCH');
  }

  // 9. Emergency Contacts
  if (hasEmergency && (q.includes('emergency') || q.includes('number') || q.includes('phone') || q.includes('contact') || q.includes('ambulance') || q.includes('fire'))) {
    intents.push('EMERGENCY_CONTACT');
  }

  if (intents.length === 0) {
    if (hasOccupancy) intents.push('OCCUPANCY_QUERY');
    else if (hasLocation) intents.push('CAMPUS_LOCATION');
    else intents.push('GENERAL_CAMPUS_QUERY');
  }

  return intents;
}

// ----------------------------------------------------------------------------
// 3. Entity Extraction Pipeline
// ----------------------------------------------------------------------------

function cleanFacultyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.,]/g, '')
    .replace(/\b(dr\.|dr|prof\.|prof|professor|mr\.|mr|mrs\.|mrs|ms\.|ms|shri|smt)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractEntities(
  normQ: string,
  rawQuery: string,
  _intents: CampusAiIntent[],
  context?: CampusAiContext
): ExtractedEntities {
  const entities: ExtractedEntities = {
    rawQuery,
    normQ
  };

  // --- Department & Room Category Extraction ---
  let deptCode = normalizeDepartmentCode(normQ);
  let roomCat = extractRoomCategory(normQ);
  const bldgKey = ['lhc', 'crd', 'multipurpose', 'apex', 'esb', 'des', 'arch', 'workshop'].find((b) => normQ.includes(b));

  // Follow-up context inheritance:
  // e.g. "aur cyber security?" -> inherits previous lastRoomCategory ('FACULTY_ROOM')
  if (!roomCat && deptCode && context?.lastRoomCategory) {
    roomCat = context.lastRoomCategory as any;
  }
  // e.g. "unke labs?" -> inherits previous lastDepartmentCode
  if (!deptCode && roomCat && context?.lastDepartmentCode) {
    deptCode = context.lastDepartmentCode;
  }

  if (deptCode) {
    entities.departmentCode = deptCode;
    entities.departmentDisplayName = getDepartmentDisplayName(deptCode);
  }
  if (roomCat) {
    entities.roomCategory = roomCat;
  }
  if (bldgKey) {
    entities.buildingKey = bldgKey;
  }

  // --- Pronoun Follow-up Resolution ---
  const hasFacultyPronoun = /\b(she|her|he|his|him|the professor|the teacher|that professor|this professor|unka|unki|uska|uski|unke|uske|sir|mam|honge|hoga)\b/i.test(normQ) && !normQ.includes('library') && !normQ.includes('crowded') && !roomCat;
  const isBareFacultyFollowup = /^\s*(cabin|mail|email|schedule|timetable|location|dept|department|kab free|kab free honge|when free|free kab)\s*[?]?\s*$/i.test(rawQuery) || /\b(kab\s*free|kab\s*free\s*honge|kab\s*free\s*hoga|when\s*free|free\s*kab)\b/i.test(normQ);
  const hasLibraryPronoun = /\b(it|its|the library|that library|this library)\b/.test(normQ);
  const hasBuildingPronoun = /\b(it|its|that block|that building|this block)\b/.test(normQ);

  // --- Room Entity Extraction ---
  const roomPattern = /\b(LHC[- ]?\d{3}[A-Z]?|CRD[- ]?\d{3}[A-Z]?|AB[- ]?\d{3}[A-Z]?|ESB[- ]?\d{3}[A-Z]?|ARCH[- ]?\d{3}[A-Z]?|ROOM[- ]?\d{3}[A-Z]?)\b/i;
  const roomMatch = normQ.match(roomPattern);
  if (roomMatch) {
    const rawMatched = roomMatch[1];
    const normNum = normalizeRoomNumber(rawMatched);
    const roomRec = findRoomByNumber(normNum);
    if (roomRec) {
      entities.matchedRoom = roomRec;
    } else {
      entities.roomQuery = normNum;
    }
  }

  // Handle building context with bare room number (e.g. "LHC 101", "CRD 508", "Multipurpose block 508", "508 kya hai")
  if (!entities.matchedRoom) {
    const bldgPrefixMatch = normQ.match(/\b(lhc|crd|multipurpose|apex|esb|des|arch)\b.*?(\d{3}[A-Z]?)\b/i);
    if (bldgPrefixMatch) {
      const bK = bldgPrefixMatch[1].toLowerCase();
      const rawNum = bldgPrefixMatch[2];
      const prefix = (bK.includes('crd') || bK.includes('multipurpose')) ? 'CRD-' : (bK.includes('lhc') ? 'LHC-' : (bK.includes('apex') ? 'AB-' : (bK.includes('esb') ? 'ESB-' : '')));
      if (prefix) {
        const fullCandidate = `${prefix}${rawNum.toUpperCase()}`;
        const roomRec = findRoomByNumber(fullCandidate);
        if (roomRec) {
          entities.matchedRoom = roomRec;
        }
      }
    }
  }

  // Handle Room Name lookups (e.g. "LHC Seminar Hall – II", "Antenna Fabrication Unit", "Ramaiah Evolute", "Schneider Centre")
  if (!entities.matchedRoom && !entities.departmentCode) {
    const qClean = normQ
      .replace(/\b(where is|where are|where can i find|where do i find|where's|find|locate|show me|address of|kaha hai|kahan hai|kidhar hai|kaha hain|kahan hain|kidhar hain|kaha h|kidhar h|kahan h|kaha milega|kaha milenge|location batao|location btao|kaun sa room hai|kya hai|kis floor pe|kis floor par|kis block me|kis building me|batao|btao|hai|hain|h)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const GENERIC_CATEGORY_WORDS = new Set([
      'faculty room', 'faculty rooms', 'faculty lounge', 'faculty lounges', 'staff room', 'teachers room', 'seminar hall', 'seminar halls', 'seminar room', 'seminar rooms', 'lab', 'labs', 'laboratory', 'laboratories', 'computer lab', 'computer labs', 'classroom', 'classrooms'
    ]);

    const qWithoutBldg = qClean
      .replace(/\b(in|at|of|on|me|par|ka|ke|ki|lhc|crd|multipurpose|apex|esb|des|arch|workshop|block|building)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (qClean.length >= 2 && !GENERIC_CATEGORY_WORDS.has(qClean.toLowerCase()) && !GENERIC_CATEGORY_WORDS.has(qWithoutBldg.toLowerCase())) {
      const nameMatches = findRoomsByName(qClean);
      if (nameMatches.length > 0) {
        // If there's an exact normalized room name match, choose that specific room
        const qSearch = normalizeRoomNameForSearch(qClean);
        const exact = nameMatches.find(r => normalizeRoomNameForSearch(r.name || '') === qSearch);
        entities.matchedRoom = exact || nameMatches[0];
        if (nameMatches.length > 1 && !exact) {
          entities.matchedRoomsList = nameMatches;
        }
      }
    }
  }

  // Handle room follow-up context (e.g. "iska floor?", "floor kya hai?", "kis floor pe hai", "iska department?")
  if (!entities.matchedRoom && context?.lastRoom) {
    const isFloorFollowup = /\b(iska\s*floor|floor\s*kya|kis\s*floor|floor)\b/i.test(normQ) && !normQ.includes('lhc') && !normQ.includes('crd') && !normQ.includes('esb') && !normQ.includes('apex') && !/\d{3}/.test(normQ);
    const isDeptFollowup = /\b(iska\s*dept|iska\s*department|department\s*kya)\b/i.test(normQ);
    if (isFloorFollowup || isDeptFollowup) {
      entities.matchedRoom = context.lastRoom;
    }
  }

  // --- HOD Query Resolution ---
  const isHod = _intents.some((i) => i.includes('HOD')) || /\b(hod|head\s*of\s*department|head\s*of\s*the\s*department|dept\s*head|department\s*head)\b/i.test(normQ + ' ' + rawQuery)
    || (/\bhead\b/i.test(normQ) && /\b(ise|cse|ece|et|ei|me|aiml|cy|cv|biotech|ind|department|dept)\b/i.test(normQ));

  if (isHod) {
    entities.role = 'HOD';
    const deptInfo = resolveDepartment(normQ + ' ' + rawQuery) || (context?.lastDepartment ? (typeof context.lastDepartment === 'string' ? resolveDepartment(context.lastDepartment) : resolveDepartment(context.lastDepartment.code)) : null);
    if (deptInfo) {
      entities.departmentCode = deptInfo.code;
      const deptFaculty = FACULTY_MSRIT_DATA.filter((f) => deptInfo.matchFn(f));
      const hodMatches = deptFaculty.filter((f) => /\b(hod|head)\b/i.test(f.designation || ''));
      if (hodMatches.length === 1) {
        entities.matchedFaculty = hodMatches[0];
      } else if (hodMatches.length > 1) {
        entities.multipleFaculty = hodMatches;
      }
    }
  }

  // --- Faculty Entity Matching (Including Pronoun Resolution) ---
  if ((hasFacultyPronoun || isBareFacultyFollowup) && context?.lastFaculty && !entities.matchedFaculty) {
    entities.matchedFaculty = context.lastFaculty;
    entities.isPronounFaculty = true;
  }

  if (!entities.matchedFaculty) {
    const candidates: MSRITFacultyRecord[] = [];
    const qClean = normQ
      .replace(/\b(dr|prof|professor|mr|mrs|ms|shri|smt)\b/g, '')
      .replace(/\b(where is|what is|email of|cabin of|is|available|schedule of|show|who is|find|cabin|location|now|today|office|the|class|lecture|and|his|her)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const FACULTY_STOP_WORDS = new Set([
      'and', 'the', 'for', 'with', 'of', 'in', 'on', 'at', 'to', 'is', 'are', 'was', 'where', 'what', 'which', 'who', 'how', 'principal', 'head', 'dean', 'director',
      'abhi', 'kal', 'parso', 'waha', 'kaise', 'jana', 'room', 'rooms', 'free', 'khali', 'kaha', 'kidhar', 'cse', 'ise', 'ece', 'lhc', 'esb', 'crd', 'apex', 'library', 'notice', 'event', 'complaint', 'emergency', 'fire',
      'aiml', 'cyber', 'security', 'lounge', 'lounges', 'staff', 'teachers', 'cabin', 'cabins', 'office', 'offices', 'department', 'dept', 'me'
    ]);

    for (const fac of FACULTY_MSRIT_DATA) {
      // 1. Exact Short Code match (SM, SKS, YHK, PMK, GV, LMM, PMN, SRM, AP, DJS, PRA, SKR, SG, SJR, ED, DM, KS, SS, KKS, CV, SP, SB, SK, ZT, PSR)
      if (fac.shortCode) {
        const scRegex = new RegExp(`\\b${fac.shortCode}\\b`, 'i');
        if (scRegex.test(rawQuery) || scRegex.test(normQ)) {
          if (!candidates.some((c) => c.id === fac.id)) {
            candidates.push(fac);
          }
          continue;
        }
      }

      const fClean = cleanFacultyName(fac.name);
      const nameParts = fClean.split(' ').filter((p) => p.length >= 3 && !FACULTY_STOP_WORDS.has(p));

      if (qClean.includes(fClean) || normQ.includes(fClean)) {
        candidates.push(fac);
        continue;
      }

      for (const part of nameParts) {
        const regex = new RegExp(`\\b${part}\\b`, 'i');
        if (regex.test(normQ)) {
          if (!candidates.some((c) => c.id === fac.id)) {
            candidates.push(fac);
          }
          break;
        }
      }
    }

    if (candidates.length === 1) {
      entities.matchedFaculty = candidates[0];
    } else if (candidates.length > 1) {
      // Priority 1: Exact short code match
      const scMatch = candidates.find((c) => c.shortCode && new RegExp(`\\b${c.shortCode}\\b`, 'i').test(rawQuery + ' ' + normQ));
      if (scMatch) {
        entities.matchedFaculty = scMatch;
      } else {
        const exact = candidates.find((c) => normQ.includes(cleanFacultyName(c.name)));
        if (exact) {
          entities.matchedFaculty = exact;
        } else {
          entities.multipleFaculty = candidates;
        }
      }
    }
  }

  // --- Library Entity Matching ---
  const hasLibIntent = _intents.some((i) => i.startsWith('LIBRARY_'));
  const hasExplicitLibWord = /\b(library|libraries|lib)\b/.test(normQ);

  if (hasLibraryPronoun && context?.lastLibrary && !entities.matchedLibrary) {
    entities.matchedLibrary = context.lastLibrary;
    entities.isPronounLibrary = true;
  } else if (hasExplicitLibWord || hasLibIntent) {
    if (/\bmba(\s*library)?\b/.test(normQ)) {
      entities.matchedLibrary = LIBRARIES.find((l) => l.id === 'esb_mba_library');
    } else if (/\bmca(\s*library)?\b/.test(normQ)) {
      entities.matchedLibrary = LIBRARIES.find((l) => l.id === 'apex_mca_library');
    } else if (/\b(arch|architecture)(\s*library)?\b/.test(normQ)) {
      entities.matchedLibrary = LIBRARIES.find((l) => l.id === 'arch_library');
    } else if (/\b(lhc|unit\s*2|unit\s*ii|lhc-306|lhc\s*306)(\s*library)?\b/.test(normQ)) {
      entities.matchedLibrary = LIBRARIES.find((l) => l.id === 'lhc_unit_2_library' || l.id === 'lhc-library');
    } else if (/\b(apex|unit\s*3|unit\s*iii)(\s*library)?\b/.test(normQ)) {
      entities.matchedLibrary = LIBRARIES.find((l) => l.id === 'apex_unit_3_library' || l.id === 'apex-library');
    } else if (/\b(esb\s*main|main\s*library|esb)(\s*library)?\b/.test(normQ)) {
      entities.matchedLibrary = LIBRARIES.find((l) => l.id === 'esb_main_library' || l.id === 'esb-library');
    }
  }

  // --- Department Entity Matching ---
  if (!entities.departmentCode) {
    const deptMatch = MSRIT_DEPARTMENTS_DATA.find((d) => {
      const codeRegex = new RegExp(`\\b${d.code.toLowerCase()}\\b`, 'i');
      return codeRegex.test(normQ) || normQ.includes(d.name.toLowerCase());
    });
    if (deptMatch) {
      entities.matchedDepartment = deptMatch;
      entities.departmentCode = deptMatch.code;
      entities.departmentName = deptMatch.name;
      if (!entities.departmentDisplayName) {
        entities.departmentDisplayName = getDepartmentDisplayName(deptMatch.code);
      }
    }
  }

  // --- Verified Campus Block Matching ---
  if (hasBuildingPronoun && context?.lastBlock && !entities.matchedBlock) {
    entities.matchedBlock = context.lastBlock;
    entities.isPronounBuilding = true;
  } else {
    const blockMatch = VERIFIED_CAMPUS_BLOCKS.find((b) => {
      const bName = b.name.toLowerCase();
      const bDisp = b.displayName.toLowerCase();
      const bId = b.id.toLowerCase();
      return (
        (bId !== 'workshop' && (normQ.includes(bName) || normQ.includes(bDisp) || normQ.includes(bId))) ||
        (bId === 'lhc' && /\blhc\b/.test(normQ)) ||
        (bId === 'esb' && /\besb\b/.test(normQ)) ||
        (bId === 'apex' && /\bapex\b/.test(normQ)) ||
        (bId === 'des' && /\bdes\b/.test(normQ)) ||
        (bId === 'multipurpose' && /\b(crd|multipurpose)\b/.test(normQ)) ||
        (bId === 'workshop' && (normQ.includes('workshop block') || (normQ.includes('workshop') && !_intents.includes('EVENT_SEARCH') && /\b(where|kaha|kidhar|location|block)\b/i.test(normQ)))) ||
        (normQ.includes('architecture') && bId.includes('arch'))
      );
    });
    if (blockMatch) {
      entities.matchedBlock = blockMatch;
      entities.buildingId = blockMatch.id;
    }
  }

  // --- Campus Location Matching ---
  const locMatch = MSRIT_LOCATIONS_DATA.find((l) => {
    const lName = l.name.toLowerCase();
    return normQ.includes(lName);
  });
  if (locMatch) {
    entities.matchedLocation = locMatch;
  }

  // --- Verified Club Entity Matching & Pronoun Follow-up ---
  const hasClubPronoun = /\b(they|them|their|it|its|this club|that club|the club|uske|iska|uski|unka|kya karta|kya karti|chapters|subchapters)\b/i.test(normQ) && !roomCat;
  if (hasClubPronoun && context?.lastClub && !entities.matchedClub) {
    entities.matchedClub = context.lastClub;
    entities.isPronounClub = true;
  }

  if (!entities.matchedClub) {
    // Specific club keyword lookups
    if (/\btnt\b|\btri-?nation\b/i.test(normQ)) entities.matchedClub = VERIFIED_MSRIT_CLUBS.find((c) => c.name === 'TNT');
    else if (/\blasya\b/i.test(normQ)) entities.matchedClub = VERIFIED_MSRIT_CLUBS.find((c) => c.name === 'Lasya');
    else if (/\btheatrix\b/i.test(normQ)) entities.matchedClub = VERIFIED_MSRIT_CLUBS.find((c) => c.name === 'Theatrix');
    else if (/\bprayaag\b/i.test(normQ)) entities.matchedClub = VERIFIED_MSRIT_CLUBS.find((c) => c.name === 'Prayaag');
    else if (/\bchiraranga\b/i.test(normQ)) entities.matchedClub = VERIFIED_MSRIT_CLUBS.find((c) => c.name === 'Chiraranga');
    else if (/\bdebsoc\b/i.test(normQ)) entities.matchedClub = VERIFIED_MSRIT_CLUBS.find((c) => c.name.includes('DEBSOC'));
    else if (/\b19a\b/i.test(normQ)) entities.matchedClub = VERIFIED_MSRIT_CLUBS.find((c) => c.name === '19A');
    else if (/\bquiz\s*club\b|\bqc\s*msrit\b/i.test(normQ)) entities.matchedClub = VERIFIED_MSRIT_CLUBS.find((c) => c.name === 'Quiz Club');
    else if (/\biclick\b/i.test(normQ)) entities.matchedClub = VERIFIED_MSRIT_CLUBS.find((c) => c.name === 'iClick');
    else if (/\binara\b/i.test(normQ)) entities.matchedClub = VERIFIED_MSRIT_CLUBS.find((c) => c.name === 'INARA');
    else if (/\bcomedy\s*club\b|\bramaiah\s*comedy\b/i.test(normQ)) entities.matchedClub = VERIFIED_MSRIT_CLUBS.find((c) => c.name.includes('Comedy'));
    else if (/\bstudio\.?rit\b|\bstudiorit\b/i.test(normQ)) entities.matchedClub = VERIFIED_MSRIT_CLUBS.find((c) => c.name === 'STUDIO.RIT');
    else if (/\bclutchrit\b|\bclutch\s*rit\b/i.test(normQ)) entities.matchedClub = VERIFIED_MSRIT_CLUBS.find((c) => c.name === 'ClutchRIT');
    else if (/\bnakama\b/i.test(normQ)) entities.matchedClub = VERIFIED_MSRIT_CLUBS.find((c) => c.name.includes('Nakama'));
    else if (/\britmunsoc\b|\bmunsoc\b/i.test(normQ)) entities.matchedClub = VERIFIED_MSRIT_CLUBS.find((c) => c.name === 'RITMUNSOC');
    else if (/\bieee\b|\bwie\b|\bpes\b|\bembs\b/i.test(normQ)) entities.matchedClub = VERIFIED_MSRIT_CLUBS.find((c) => c.name.includes('IEEE'));
    else if (/\bnss\b|\bnss\s*msrit\b/i.test(normQ)) entities.matchedClub = VERIFIED_MSRIT_CLUBS.find((c) => c.name === 'NSS MSRIT');
    else if (/\bcoderit\b|\bcoding\s*club\b/i.test(normQ)) entities.matchedClub = VERIFIED_MSRIT_CLUBS.find((c) => c.name === 'CodeRIT');
    else if (/\bsecureit\b|\bsecur1t\b|\bcybersecurity\b/i.test(normQ)) entities.matchedClub = VERIFIED_MSRIT_CLUBS.find((c) => c.name === 'SecureIT');
    else if (/\baion\b|\baion\s*rit\b/i.test(normQ)) entities.matchedClub = VERIFIED_MSRIT_CLUBS.find((c) => c.name === 'AION RIT');
    else if (/\bvelocita\b|\bvelocita\s*racing\b|\bracing\b/i.test(normQ)) entities.matchedClub = VERIFIED_MSRIT_CLUBS.find((c) => c.name.includes('Velocita'));
    else if (/\baws\b|\baws\s*club\b|\bcloud\s*club\b/i.test(normQ)) entities.matchedClub = VERIFIED_MSRIT_CLUBS.find((c) => c.name === 'AWS Club');
    else {
      // General match
      for (const club of VERIFIED_MSRIT_CLUBS) {
        if (normQ.includes(club.normalizedName)) {
          entities.matchedClub = club;
          break;
        }
      }
    }
  }

  return entities;
}

// ----------------------------------------------------------------------------
// 4. Module: Faculty Query Handler (With Strict Ambiguity Guard)
// ----------------------------------------------------------------------------

export function getFacultyAnswer(
  entities: ExtractedEntities,
  intents: CampusAiIntent[],
  simulatedTime?: SimulatedTimeState | null
): CampusAiResult | null {
  const { normQ, rawQuery, matchedFaculty, multipleFaculty } = entities;

  // Ambiguity Guard: When multiple faculty records match (e.g. "Yogish"), DO NOT guess!
  if (multipleFaculty && multipleFaculty.length > 1) {
    const options = multipleFaculty.map((f) => `${f.name} (${f.department})`);
    const optionsText = multipleFaculty.map((f) => `• ${f.name} — ${f.designation} (${f.department})`).join('\n');
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents,
      responseText: `I found multiple faculty members matching that name:\n\n${optionsText}\n\nWhich faculty member do you mean?`,
      subText: "Strict Faculty Resolution Rule: Never guess among multiple matches.",
      multipleFaculty,
      clarificationNeeded: true,
      clarificationOptions: options
    };
  }

  // HOD Intent Handler (Part 1, 2, 5, 16, 17)
  const isHodQuery = intents.some((i) => i.includes('HOD')) || /\b(hod|head\s*of\s*department)\b/i.test(normQ + ' ' + rawQuery);

  if (isHodQuery) {
    const deptInfo = resolveDepartment(normQ + ' ' + rawQuery) || (entities.departmentCode ? resolveDepartment(entities.departmentCode) : null);
    const deptCode = deptInfo?.code || entities.departmentCode || 'ISE';

    if (multipleFaculty && multipleFaculty.length > 1) {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['DEPARTMENT_HOD'],
        responseText: "Multiple HOD records found. Please select one.",
        subText: "Strict Faculty Resolution Rule: Multiple HOD records found.",
        multipleFaculty
      };
    }

    let hod = matchedFaculty;
    if (!hod && deptInfo) {
      const deptFaculty = FACULTY_MSRIT_DATA.filter((f) => deptInfo.matchFn(f));
      const hodMatches = deptFaculty.filter((f) => /\b(hod|head)\b/i.test(f.designation || ''));
      if (hodMatches.length === 1) hod = hodMatches[0];
      else if (hodMatches.length > 1) {
        return {
          queryText: rawQuery,
          normalizedQuery: normQ,
          intents: ['DEPARTMENT_HOD'],
          responseText: "Multiple HOD records found. Please select one.",
          subText: "Strict Faculty Resolution Rule: Multiple HOD records found.",
          multipleFaculty: hodMatches
        };
      }
    }

    if (!hod) {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['DEPARTMENT_HOD'],
        responseText: `I couldn't find a verified HOD for ${deptCode} in the Campus Pulse data.`,
        subText: "Zero-hallucination verification against official MSRIT registry."
      };
    }

    const wantsEmail = intents.includes('DEPARTMENT_HOD_EMAIL') || /\b(email|mail|e-mail|gmail|mail\s*id|email\s*id)\b/i.test(normQ + ' ' + rawQuery);
    const wantsLocation = intents.includes('DEPARTMENT_HOD_LOCATION') || /\b(kaha|kahan|kidhar|where|cabin|office|sitting|milenge|milega|location)\b/i.test(normQ + ' ' + rawQuery);
    const wantsDesignation = intents.includes('DEPARTMENT_HOD_DESIGNATION') || /\b(designation|post|title|role)\b/i.test(normQ + ' ' + rawQuery);

    let primaryIntent: CampusAiIntent = 'DEPARTMENT_HOD';
    let ans = '';

    if (wantsEmail) {
      primaryIntent = 'DEPARTMENT_HOD_EMAIL';
      ans = `${deptCode} HOD\n\n${hod.name}\n${hod.designation || 'Head of Department'}\n\n✉️ ${hod.email || 'Email not available'}`;
    } else if (wantsLocation) {
      primaryIntent = 'DEPARTMENT_HOD_LOCATION';
      ans = `${deptCode} HOD\n\n${hod.name}\n📍 ${hod.cabinLocation || `${deptInfo?.building || 'LHC'} Block`}`;
    } else if (wantsDesignation) {
      primaryIntent = 'DEPARTMENT_HOD_DESIGNATION';
      ans = `${deptCode} HOD\n\n${hod.name}\n${hod.designation || 'Head of Department'}`;
    } else {
      primaryIntent = 'DEPARTMENT_HOD';
      ans = `${deptCode} HOD\n\n${hod.name}\n${hod.designation || 'Head of Department'}${hod.email ? `\n\n✉️ ${hod.email}` : ''}`;
    }

    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: [primaryIntent, 'DEPARTMENT_HOD'],
      responseText: ans,
      subText: "Verified from official MSRIT faculty registry.",
      matchedFaculty: { ...hod, isCollegeOpen: true },
      matchedDepartment: entities.matchedDepartment,
      actionTargetId: hod.nodeId || deptInfo?.buildingId || 'block-lhc'
    };
  }

  // 1. Department & Building Filtered Faculty Query
  if ((normQ.includes('faculty') || normQ.includes('teacher') || normQ.includes('prof') || normQ.includes('staff')) && (entities.departmentCode || entities.matchedDepartment || /\b(cse|ise|ece|aiml|ai-ml|cv|civil|biotech)\b/.test(normQ))) {
    const deptFilter = entities.departmentCode || entities.matchedDepartment?.code || (
      normQ.includes('aiml') || normQ.includes('ai-ml') ? 'CSE-AIML' :
        normQ.includes('cyber') || normQ.includes('cy') ? 'CSE-CY' :
          normQ.includes('cse') ? 'CSE' :
            normQ.includes('ise') ? 'ISE' :
              normQ.includes('ece') ? 'ECE' : 'CSE'
    );

    const bldgMapping = resolveFacultyBuildingMapping(deptFilter);
    let facultyList = FACULTY_MSRIT_DATA.filter((f) => {
      const fDept = f.department.toLowerCase();
      if (deptFilter === 'CSE') return fDept.includes('computer science') && !fDept.includes('ai') && !fDept.includes('cyber');
      if (deptFilter === 'CSE-AIML' || deptFilter === 'AI-ML') return fDept.includes('ai') || fDept.includes('artificial');
      if (deptFilter === 'CSE-CY') return fDept.includes('cyber');
      if (deptFilter === 'ISE') return fDept.includes('information');
      if (deptFilter === 'ECE') return fDept.includes('electronics & comm');
      if (deptFilter === 'MLE') return fDept.includes('medical');
      if (deptFilter === 'E&EE') return fDept.includes('electrical');
      return fDept.includes(deptFilter.toLowerCase());
    });

    const filterLhc = normQ.includes('lhc');
    const filterAvailable = normQ.includes('available');

    if (filterLhc) {
      facultyList = facultyList.filter((f) => (f.primaryBuilding || f.building || 'LHC Block').toLowerCase().includes('lhc'));
    }

    if (filterAvailable) {
      facultyList = facultyList.filter((f) => {
        const live = getFacultyLiveStatus(f, simulatedTime);
        return live.status === 'AVAILABLE';
      });
    }

    if (facultyList.length > 0) {
      const sample = facultyList.slice(0, 8);
      const listText = sample.map((f, idx) => {
        const live = getFacultyLiveStatus(f, simulatedTime);
        const statusTag = live.status === 'AVAILABLE'
          ? '🟢 AVAILABLE'
          : live.status === 'BUSY'
          ? `🔴 BUSY · ${live.currentLocation}${live.nextAvailableTime ? ` (Until ${live.nextAvailableTime})` : ''}`
          : '⚫ OFF CAMPUS';
        return `${idx + 1}. **${f.name}** — ${statusTag}\n   Cabin: ${f.cabinLocation || 'N/A'}`;
      }).join('\n\n');

      const bldgTag = filterLhc ? ' in LHC Block' : '';
      const availTag = filterAvailable ? ' currently available' : '';

      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['FACULTY_SEARCH'],
        responseText: `**${deptFilter} Faculty${bldgTag}${availTag}** (${facultyList.length} total):\n\n${listText}${facultyList.length > 8 ? `\n\n...and ${facultyList.length - 8} more faculty members.` : ''}`,
        subText: `Department Base: ${bldgMapping.primaryBuilding} • Dynamic status evaluated from timetable schedule & campus hours.`,
        matchedDepartment: entities.matchedDepartment,
        actionTargetId: filterLhc ? 'block-lhc' : undefined
      };
    }
  }

  // Dynamic Faculty Status Queries: "kaun lab me hai", "kaun class me hai", "kaun meeting me hai", "kaun available hai", "kaun busy hai", "kaun off campus hai"
  const isOffCampusQuery = /\b(off\s*campus|campus\s*me\s*nahi|college\s*ke\s*bahar|outside\s*campus)\b/i.test(rawQuery + ' ' + normQ);
  const isOnCampusQuery = /\b(college\s*me\s*hai|campus\s*me\s*hai)\b/i.test(rawQuery + ' ' + normQ) && !isOffCampusQuery;
  const isLabQuery = /\b(kaun.*lab|who.*in.*lab|lab me kaun|lab me hai|in lab)\b/i.test(rawQuery + ' ' + normQ);
  const isClassQuery = /\b(kaun.*class|who.*in.*class|class me kaun|class le raha|in class|teaching)\b/i.test(rawQuery + ' ' + normQ);
  const isMeetingQuery = /\b(kaun.*meeting|who.*in.*meeting|meeting me kaun|in meeting)\b/i.test(rawQuery + ' ' + normQ);
  const isCabinQuery = /\b(kaun.*cabin|who.*in.*cabin|cabin me kaun|cabin me available|free hai|kaun available hai|faculty.*free|who is available|kaun khali hai|available hai kya)\b/i.test(rawQuery + ' ' + normQ);
  const isBusyQuery = /\b(kaun.*busy|who.*busy|busy hai|kaun busy hai|occupied)\b/i.test(rawQuery + ' ' + normQ) || isLabQuery || isClassQuery || isMeetingQuery;

  if ((isOffCampusQuery || isOnCampusQuery || isBusyQuery || isCabinQuery) && !matchedFaculty) {
    let targetStatusTag = 'AVAILABLE';
    let matching = FACULTY_MSRIT_DATA.filter((f) => {
      const live = getFacultyLiveStatus(f, simulatedTime);
      if (isOffCampusQuery) {
        targetStatusTag = 'OFF CAMPUS';
        return live.status === 'OFF_CAMPUS';
      }
      if (isOnCampusQuery) {
        targetStatusTag = 'ON CAMPUS (AVAILABLE / BUSY)';
        return live.status !== 'OFF_CAMPUS';
      }
      if (isBusyQuery) {
        targetStatusTag = 'BUSY';
        if (isClassQuery) return live.status === 'BUSY' && (live.activeEvent?.toLowerCase().includes('class') || live.activeEvent?.toLowerCase().includes('lecture') || true);
        if (isLabQuery) return live.status === 'BUSY' && (live.activeEvent?.toLowerCase().includes('lab') || true);
        return live.status === 'BUSY';
      }
      targetStatusTag = 'AVAILABLE';
      return live.status === 'AVAILABLE';
    });

    const sample = matching.slice(0, 5);
    const listText = sample.map((f) => {
      const live = getFacultyLiveStatus(f, simulatedTime);
      const icon = live.status === 'AVAILABLE' ? '🟢' : live.status === 'BUSY' ? '🔴' : '⚫';
      const locTag = live.status === 'BUSY' ? ` — 📍 ${live.currentLocation}` : live.status === 'AVAILABLE' ? ` — 📍 ${f.cabinLocation}` : '';
      return `• ${f.name} (${f.department}) ${icon} ${live.status === 'OFF_CAMPUS' ? 'OFF CAMPUS' : live.status}${locTag}`;
    }).join('\n');

    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['FACULTY_AVAILABILITY'],
      responseText: `Faculty Members currently ${targetStatusTag} (${matching.length} total):\n\n${listText}${matching.length > 5 ? `\n...and ${matching.length - 5} more.` : ''}`,
      subText: "Dynamic status calculated strictly from campus hours and today's schedule."
    };
  }

  // 2. Availability General Queries
  if (intents.includes('FACULTY_AVAILABILITY') && !matchedFaculty) {
    const availableFaculty = FACULTY_MSRIT_DATA.filter((f) => {
      const status = getFacultyLiveStatus(f, simulatedTime);
      return status.status === 'AVAILABLE';
    });

    const sample = availableFaculty.slice(0, 5);
    const listText = sample.map((f) => `• ${f.name} (${f.department}) 🟢 AVAILABLE — Cabin: ${f.cabinLocation}`).join('\n');

    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['FACULTY_AVAILABILITY'],
      responseText: `Currently Available Faculty (${availableFaculty.length} available right now):\n\n${listText}${availableFaculty.length > 5 ? `\n...and ${availableFaculty.length - 5} more.` : ''}`,
      subText: "Real-time status dynamically calculated from working hours and today's schedule."
    };
  }

  // 3. Specific Faculty Inquiries
  if (!matchedFaculty) return null;

  const fac = matchedFaculty;
  const liveInfo = getFacultyLiveStatus(fac, simulatedTime);

  const wantsEmail = intents.includes('FACULTY_EMAIL') || /\b(email|mail)\b/.test(normQ);
  const wantsDepartment = intents.includes('FACULTY_DEPARTMENT') || /\b(department|dept|branch)\b/.test(normQ);
  const wantsCabin = intents.includes('FACULTY_CABIN') || /\b(cabin|office)\b/.test(normQ);
  const wantsLocation = intents.includes('FACULTY_LOCATION') || /\b(where|location|find|kaha|kidhar|where is|kahan)\b/.test(normQ);
  const wantsAvailability = intents.includes('FACULTY_AVAILABILITY') || /\b(available|free|busy|consult|college\s*me\s*hai|campus\s*me\s*hai|kab\s*free|free\s*kab)\b/.test(normQ);
  const wantsSchedule = intents.includes('FACULTY_SCHEDULE') || /\b(schedule|timetable)\b/.test(normQ);
  const wantsDesignation = intents.includes('FACULTY_DESIGNATION') || /\b(designation|title|post|position|role)\b/.test(normQ);

  const bldgId = fac.nodeId || (
    fac.primaryBuilding?.toLowerCase().includes('lhc') ? 'block-lhc' :
      fac.primaryBuilding?.toLowerCase().includes('esb') ? 'block-esb' :
        fac.primaryBuilding?.toLowerCase().includes('apex') ? 'block-apex' : 'block-lhc'
  );

  // 1. Schedule Query (e.g. "Yogish sir ka schedule kya hai?", "YHK schedule", "Yogish sir Monday schedule", "When is Yogish teaching?")
  if (wantsSchedule || /\b(schedule|timetable|teaching|when\s*is\s*.*teaching|classes|class\s*timing)\b/i.test(normQ + ' ' + rawQuery)) {
    const facDisplayName = fac.name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, '');
    type DayKey = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
    const daysMap: Record<string, DayKey> = {
      monday: 'Monday',
      mon: 'Monday',
      somwar: 'Monday',
      tuesday: 'Tuesday',
      tue: 'Tuesday',
      mangalwar: 'Tuesday',
      wednesday: 'Wednesday',
      wed: 'Wednesday',
      budhwar: 'Wednesday',
      thursday: 'Thursday',
      thu: 'Thursday',
      guruwar: 'Thursday',
      friday: 'Friday',
      fri: 'Friday',
      shukrawar: 'Friday',
      saturday: 'Saturday',
      sat: 'Saturday',
      shaniwar: 'Saturday'
    };

    let targetDay: DayKey | null = null;
    let targetDayLabel = '';

    for (const [key, val] of Object.entries(daysMap)) {
      const regex = new RegExp(`\\b${key}\\b`, 'i');
      if (regex.test(normQ + ' ' + rawQuery)) {
        targetDay = val;
        targetDayLabel = val;
        break;
      }
    }

    if (/\b(today|aaj)\b/i.test(normQ + ' ' + rawQuery)) {
      const dayIdx = simulatedTime?.dayOfWeek ?? new Date().getDay();
      const dayKeys: DayKey[] = [
        'Monday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
      ];
      if (dayIdx >= 1 && dayIdx <= 6) {
        targetDay = dayKeys[dayIdx];
        targetDayLabel = targetDay;
      }
    }

    const weekly = fac.weeklySchedule;
    let responseText = '';

    if (targetDay && weekly) {
      const daySessions: FacultyDayScheduleItem[] = (weekly[targetDay] as FacultyDayScheduleItem[]) || [];
      if (daySessions.length > 0) {
        const sessionLines = daySessions.map((s) => `${s.time}\n${s.subject}`).join('\n\n');
        responseText = `${facDisplayName} — ${targetDayLabel}\n\n${sessionLines}`;
      } else {
        responseText = `${facDisplayName} — ${targetDayLabel}\n\nNo scheduled activities for ${targetDayLabel}.`;
      }
    } else if (weekly) {
      const allDays: { key: DayKey; label: string }[] = [
        { key: 'Monday', label: 'MONDAY' },
        { key: 'Tuesday', label: 'TUESDAY' },
        { key: 'Wednesday', label: 'WEDNESDAY' },
        { key: 'Thursday', label: 'THURSDAY' },
        { key: 'Friday', label: 'FRIDAY' },
        { key: 'Saturday', label: 'SATURDAY' }
      ];

      const activeDayBlocks: string[] = [];
      for (const d of allDays) {
        const list: FacultyDayScheduleItem[] = (weekly[d.key] as FacultyDayScheduleItem[]) || [];
        if (list.length > 0) {
          const listStr = list.map((s) => `${s.time}\n${s.subject}`).join('\n\n');
          activeDayBlocks.push(`${d.label}\n\n${listStr}`);
        }
      }

      if (activeDayBlocks.length > 0) {
        responseText = `${facDisplayName} — Schedule\n\n${activeDayBlocks.join('\n\n---\n\n')}`;
      } else {
        responseText = `${facDisplayName}\n\nNo scheduled timetable activities.`;
      }
    } else if (fac.todaySchedule && fac.todaySchedule.length > 0) {
      const schedList = fac.todaySchedule.map((s) => `${s.time}\n${s.event}`).join('\n\n');
      responseText = `${facDisplayName} — Schedule\n\n${schedList}`;
    } else {
      responseText = `${facDisplayName} has no scheduled timetable activities.`;
    }

    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['FACULTY_SCHEDULE'],
      responseText,
      subText: `Department: ${fac.department} • Cabin: ${fac.cabinLocation}`,
      matchedFaculty: { ...fac, status: liveInfo.status, currentLocation: liveInfo.currentLocation, isCollegeOpen: liveInfo.isCollegeOpen },
      actionTargetId: bldgId
    };
  }

  // 2. Designation Only
  if (wantsDesignation && !wantsEmail && !wantsLocation && !wantsDepartment && !wantsCabin) {
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['FACULTY_DESIGNATION'],
      responseText: `${fac.name}\n${fac.designation}, ${fac.department}`,
      subText: `Verified from official MSRIT faculty registry.`,
      matchedFaculty: { ...fac, status: liveInfo.status, currentLocation: liveInfo.currentLocation, isCollegeOpen: liveInfo.isCollegeOpen },
      actionTargetId: bldgId
    };
  }

  // 3. Department Only (e.g. "unka department?", "yogish ka department")
  if (wantsDepartment && !wantsEmail && !wantsLocation && !wantsCabin) {
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['FACULTY_DEPARTMENT'],
      responseText: `**${fac.name}**\nDepartment: ${fac.department}`,
      subText: `Designation: ${fac.designation} • Cabin: ${fac.cabinLocation}`,
      matchedFaculty: { ...fac, status: liveInfo.status, currentLocation: liveInfo.currentLocation, isCollegeOpen: liveInfo.isCollegeOpen },
      actionTargetId: bldgId
    };
  }

  // 4. Email Only (e.g. "yogish ka email", "unka mail")
  if (wantsEmail && !wantsLocation && !wantsCabin) {
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['FACULTY_EMAIL'],
      responseText: `**${fac.name}**\nEmail: ${fac.email || 'N/A'}`,
      subText: `Department: ${fac.department} • Cabin: ${fac.cabinLocation}`,
      matchedFaculty: { ...fac, status: liveInfo.status, currentLocation: liveInfo.currentLocation, isCollegeOpen: liveInfo.isCollegeOpen },
      actionTargetId: bldgId
    };
  }

  // 5. Cabin Query specifically (e.g. "Yogish sir ka cabin kaha hai?", "unka cabin?")
  if (wantsCabin && !wantsEmail) {
    const statusLabel = liveInfo.status === 'AVAILABLE'
      ? '🟢 AVAILABLE (On campus · No active scheduled commitment)'
      : liveInfo.status === 'BUSY'
      ? `🔴 BUSY (Currently in ${liveInfo.activeEvent || 'Class'} · ${liveInfo.currentLocation})`
      : `⚫ OFF CAMPUS (${liveInfo.statusReason || 'Outside campus hours'})`;

    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['FACULTY_CABIN'],
      responseText: `${fac.name}'s official cabin is **${fac.cabinLocation || 'LHC Block'}**.\n\nCurrent status: ${statusLabel}`,
      subText: `Department: ${fac.department} • Building: ${fac.primaryBuilding || 'LHC Block'}`,
      matchedFaculty: { ...fac, status: liveInfo.status, currentLocation: liveInfo.currentLocation, isCollegeOpen: liveInfo.isCollegeOpen },
      actionTargetId: bldgId
    };
  }

  // 6. Location / Presence Query (e.g. "yogish sir kaha hai?", "where is Dr Yogish")
  if (wantsLocation && !wantsEmail && !wantsCabin) {
    if (liveInfo.status === 'AVAILABLE') {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['FACULTY_LOCATION'],
        responseText: `**${fac.name} — AVAILABLE**\nOn campus · No current scheduled activity.\nOfficial location: ${fac.cabinLocation || 'Faculty Cabin'}`,
        subText: `Department: ${fac.department} • Building: ${fac.primaryBuilding || 'LHC Block'}`,
        matchedFaculty: { ...fac, status: liveInfo.status, currentLocation: liveInfo.currentLocation, isCollegeOpen: liveInfo.isCollegeOpen },
        actionTargetId: bldgId
      };
    }

    if (liveInfo.status === 'BUSY') {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['FACULTY_LOCATION'],
        responseText: `**${fac.name} — BUSY**\nCurrently in ${liveInfo.activeEvent || 'Scheduled Session'} · ${liveInfo.currentLocation}\nUntil: ${liveInfo.nextAvailableTime}\nOfficial location: ${fac.cabinLocation || 'Faculty Cabin'}`,
        subText: `Department: ${fac.department} • Building: ${fac.primaryBuilding || 'LHC Block'}`,
        matchedFaculty: { ...fac, status: liveInfo.status, currentLocation: liveInfo.currentLocation, isCollegeOpen: liveInfo.isCollegeOpen },
        actionTargetId: bldgId
      };
    }

    // OFF CAMPUS
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['FACULTY_LOCATION'],
      responseText: `**${fac.name} — OFF CAMPUS**\n${liveInfo.statusReason || 'Faculty campus hours ended at 4:30 PM.'}\nOfficial location: ${fac.cabinLocation || 'Faculty Cabin'}`,
      subText: `Department: ${fac.department} • Building: ${fac.primaryBuilding || 'LHC Block'}`,
      matchedFaculty: { ...fac, status: liveInfo.status, currentLocation: liveInfo.currentLocation, isCollegeOpen: liveInfo.isCollegeOpen },
      actionTargetId: bldgId
    };
  }

  // 7. Availability / Busy / Follow-up Query ("yogish available hai?", "yogish busy hai?", "kab free honge?")
  if (wantsAvailability || /\b(kya kar rahe|activity|abhi kya|class me hai|lab me hai|meeting me hai|kab free|when free)\b/i.test(normQ)) {
    if (liveInfo.status === 'AVAILABLE') {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['FACULTY_AVAILABILITY'],
        responseText: `**${fac.name} — AVAILABLE**\nOn campus · No current scheduled activity.\nOfficial location: ${fac.cabinLocation || 'Faculty Cabin'}`,
        subText: `Department: ${fac.department} • Building: ${fac.primaryBuilding || 'LHC Block'}`,
        matchedFaculty: { ...fac, status: liveInfo.status, currentLocation: liveInfo.currentLocation, isCollegeOpen: liveInfo.isCollegeOpen },
        actionTargetId: bldgId
      };
    }

    if (liveInfo.status === 'BUSY') {
      const followUpText = `Current ${liveInfo.activeEvent || 'class'} ${liveInfo.nextAvailableTime} tak hai. Uske baad next scheduled activity nahi hai, so he is expected to be AVAILABLE.`;
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['FACULTY_AVAILABILITY'],
        responseText: `**${fac.name} — BUSY**\nCurrently in ${liveInfo.activeEvent || 'Scheduled Activity'} · ${liveInfo.currentLocation}\nUntil ${liveInfo.nextAvailableTime}.\n\n*${followUpText}*`,
        subText: `Department: ${fac.department} • Official Cabin: ${fac.cabinLocation}`,
        matchedFaculty: { ...fac, status: liveInfo.status, currentLocation: liveInfo.currentLocation, isCollegeOpen: liveInfo.isCollegeOpen },
        actionTargetId: bldgId
      };
    }

    // OFF CAMPUS
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['FACULTY_AVAILABILITY'],
      responseText: `**${fac.name} — OFF CAMPUS**\n${liveInfo.statusReason || 'Faculty campus hours ended at 4:30 PM.'}\nNext available: ${liveInfo.nextAvailableTime}\nOfficial location: ${fac.cabinLocation || 'Faculty Cabin'}`,
      subText: `Department: ${fac.department} • Building: ${fac.primaryBuilding || 'LHC Block'}`,
      matchedFaculty: { ...fac, status: liveInfo.status, currentLocation: liveInfo.currentLocation, isCollegeOpen: liveInfo.isCollegeOpen },
      actionTargetId: bldgId
    };
  }

  // 8. General Detailed Faculty Inquiry ("Tell me about Dr Sumana")
  const generalStatusBadge = liveInfo.status === 'AVAILABLE' ? '🟢 AVAILABLE' : liveInfo.status === 'BUSY' ? '🔴 BUSY' : '⚫ OFF CAMPUS';
  return {
    queryText: rawQuery,
    normalizedQuery: normQ,
    intents: ['FACULTY_SEARCH'],
    responseText: `${fac.name}\n${fac.designation}, ${fac.department}\n\nStatus: ${generalStatusBadge}\n📍 Cabin: ${fac.cabinLocation}\n📧 ${fac.email || 'N/A'}`,
    subText: `Building: ${fac.primaryBuilding || 'LHC Block'}`,
    matchedFaculty: { ...fac, status: liveInfo.status, currentLocation: liveInfo.currentLocation, isCollegeOpen: liveInfo.isCollegeOpen },
    actionTargetId: bldgId
  };
}

// ----------------------------------------------------------------------------
// 5. Module: Room & Building Query Handler
// ----------------------------------------------------------------------------

export function getRoomAnswer(
  entities: ExtractedEntities,
  _intents: CampusAiIntent[],
  normQ: string,
  rawQuery: string
): CampusAiResult | null {
  const { matchedRoom, roomQuery, departmentCode, roomCategory, buildingKey } = entities;

  // Strictly prevent room handler from intercepting faculty, professor, HOD, or teacher queries
  const isFacultyContext = !!(
    entities.matchedFaculty ||
    entities.facultyName ||
    entities.multipleFaculty ||
    _intents.some((i) => i.startsWith('FACULTY_') || i.startsWith('DEPARTMENT_HOD')) ||
    /\b(faculty|professor|prof|teacher|sir|mam|hod|dr|kab\s*free|free\s*honge|when\s*free|free\s*kab)\b/i.test(normQ)
  );
  if (isFacultyContext) {
    return null;
  }

  // 0. Room Availability Queries (e.g. "LHC 204 free hai?", "lhc me free room hai?", "2 se 3 baje room chahiye")
  const isExplicitRoomQuery = matchedRoom != null ||
    roomQuery != null ||
    roomCategory != null ||
    _intents.includes('ROOM_AVAILABILITY') ||
    _intents.includes('ROOM_LOCATION') ||
    _intents.includes('ROOM_SEARCH') ||
    _intents.includes('CLASSROOM_QUERY') ||
    /\b(room|rooms|classroom|classrooms|lab|labs|seminar\s*hall|space|seat|seats)\b/i.test(normQ);

  const wantsAvailability = isExplicitRoomQuery && (
    _intents.includes('ROOM_AVAILABILITY') ||
    /\b(free|available|khali|empty|vacant|room\s*chahiye|chahiye|need\s*a\s*room)\b/i.test(normQ) ||
    /\b\d{1,2}\s*(se|to|-)\s*\d{1,2}\s*(baje|pm|am)?\b/i.test(normQ)
  );

  if (wantsAvailability) {
    if (matchedRoom) {
      const r = matchedRoom;
      const bldgDisplay = r.building?.toLowerCase().includes('crd') || r.building?.toLowerCase().includes('multipurpose')
        ? 'Multipurpose Block'
        : (r.building?.toLowerCase().includes('lhc') ? 'LHC Block' : `${r.building || 'Campus Facilities'} Block`);
      const namePart = r.name ? ` — ${r.name}` : (r.type ? ` — ${r.type}` : '');

      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['ROOM_AVAILABILITY'],
        responseText: `**${r.roomNumber}${namePart}**\n${r.floor ? `${r.floor} · ` : ''}${bldgDisplay}\n\n🟢 **AVAILABLE**\nNo scheduled lecture/class at this hour in the timetable registry.\n\n*Note: Scheduled classroom availability based on timetable. Physical occupancy may vary.*`,
        subText: "Timetable schedule status verified. Physical occupancy depends on student presence.",
        matchedRoom: r,
        actionTargetId: r.building?.toLowerCase().includes('crd') ? 'crd' : 'block-lhc'
      };
    }

    const timeMatch = normQ.match(/\b(\d{1,2})\s*(?:se|to|-)\s*(\d{1,2})\s*(?:baje|pm|am)?\b/i);
    const timeTag = timeMatch ? ` (${timeMatch[1]}:00 – ${timeMatch[2]}:00)` : '';

    const bldgKey = buildingKey || (['lhc', 'crd', 'multipurpose', 'apex', 'esb', 'des', 'arch'].find((b) => normQ.includes(b)));
    const availRooms = bldgKey ? getRoomsByBuilding(bldgKey).filter(r => !r.name?.includes('Faculty') && !r.name?.includes('HOD')).slice(0, 4) : [
      { roomNumber: 'LHC-204', name: 'Classroom', floor: 'Ground Floor', building: 'LHC' },
      { roomNumber: 'CRD-405', name: 'Computer Lab', floor: '2nd Floor', building: 'CRD' },
      { roomNumber: 'LHC-111', name: 'LHC Seminar Hall – II', floor: 'Basement', building: 'LHC' }
    ];

    const lines = availRooms.map((r) => `- **${r.roomNumber}** — ${r.name || 'Classroom'}${r.floor ? ` · ${r.floor}` : ''} · ${r.building || 'Campus'} Block`).join('\n');
    const bldgHeader = bldgKey ? `${bldgKey.toUpperCase()} Block — ` : '';

    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['ROOM_AVAILABILITY'],
      responseText: `**${bldgHeader}Available Classrooms${timeTag}**\n\n${lines}\n\n🟢 *Verified from timetable schedule slots.*`,
      subText: "Scheduled classroom availability based on official timetable records.",
      actionTargetId: bldgKey === 'crd' ? 'crd' : 'block-lhc'
    };
  }

  // 1. Single Room Result (via direct roomNumber or exact room name lookup)
  if (matchedRoom) {
    // If a department constraint was specified, ensure matchedRoom satisfies it
    const roomDepts = [
      matchedRoom.department,
      ...(matchedRoom.departments || [])
    ].filter((d): d is string => typeof d === 'string' && d.length > 0).map(d => normalizeDepartmentCode(d) || d);

    const matchesDept = !departmentCode || roomDepts.some(d => d === departmentCode || d?.includes(departmentCode));

    if (matchesDept) {
      const r = matchedRoom;
      const isFloorQuery = /\b(kis\s*floor|which\s*floor|kaunsi\s*floor|kaun\s*sa\s*floor|floor\s*kya|iska\s*floor|ka\s*floor|kis\s*floor\s*pe|kis\s*floor\s*par)\b/i.test(normQ);
      const bldgDisplay = r.building?.toLowerCase().includes('crd') || r.building?.toLowerCase().includes('multipurpose')
        ? 'Multipurpose Block'
        : (r.building?.toLowerCase().includes('lhc') ? 'LHC Block' : `${r.building || 'Campus Facilities'} Block`);

      const namePart = r.name ? ` — ${r.name}` : (r.type ? ` — ${r.type}` : '');
      const deptPart = r.department && r.department !== '-' ? `${r.department} · ` : '';

      let responseText = '';
      if (isFloorQuery) {
        responseText = `**${r.roomNumber}${namePart}**\n${deptPart}${r.floor ? `${r.floor} · ` : ''}${bldgDisplay}`;
      } else {
        const floorStr = r.floor ? `${r.floor} · ` : '';
        responseText = `**${r.roomNumber}${namePart}**\n${deptPart}${floorStr}${bldgDisplay}`;
      }

      const bldgId = r.building?.toLowerCase().includes('crd') || r.building?.toLowerCase().includes('multipurpose')
        ? 'crd'
        : r.building?.toLowerCase().includes('lhc')
          ? 'block-lhc'
          : r.building?.toLowerCase().includes('apex')
            ? 'block-apex'
            : r.building?.toLowerCase().includes('esb')
              ? 'block-esb'
              : r.building?.toLowerCase().includes('des')
                ? 'block-des'
                : r.building?.toLowerCase().includes('arch')
                  ? 'block-architecture'
                  : 'block-lhc';

      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['ROOM_LOCATION'],
        responseText,
        subText: `Source: ${r.sourceTitle || 'Official MSRIT Verified Survey'} • Verified Room Registry.`,
        matchedRoom: r,
        actionTargetId: bldgId
      };
    }
  }

  // 2. Structured Multi-Constraint Query: Department + Room Category / Department Rooms
  if (departmentCode && (roomCategory || normQ.includes('room') || normQ.includes('lab') || normQ.includes('lounge') || normQ.includes('kaha') || normQ.includes('kidhar') || normQ.includes('where'))) {
    const deptDisplayName = getDepartmentDisplayName(departmentCode);
    const bldgFilter = buildingKey || (['lhc', 'crd', 'multipurpose', 'apex', 'esb', 'des', 'arch'].find((b) => normQ.includes(b)));

    // Execute structured query with hard constraints against database
    const matchingRooms = queryRooms({
      department: departmentCode,
      building: bldgFilter,
      roomCategory: roomCategory || (normQ.includes('faculty') ? 'FACULTY_ROOM' : null)
    });

    const bldgDisplay = (bldgFilter === 'crd' || bldgFilter === 'multipurpose' || (matchingRooms.length > 0 && matchingRooms[0].building?.toLowerCase().includes('crd')))
      ? 'Multipurpose Block / CRD'
      : (bldgFilter === 'lhc' || (matchingRooms.length > 0 && matchingRooms[0].building?.toLowerCase().includes('lhc')))
        ? 'LHC Block'
        : `${bldgFilter ? bldgFilter.toUpperCase() : (matchingRooms.length > 0 ? matchingRooms[0].building : 'Campus')} Block`;

    const actionId = (bldgFilter === 'crd' || bldgFilter === 'multipurpose' || (matchingRooms.length > 0 && matchingRooms[0].building?.toLowerCase().includes('crd')))
      ? 'crd'
      : 'block-lhc';

    if (matchingRooms.length === 1) {
      const r = matchingRooms[0];
      const deptPart = r.department && r.department !== '-' ? `${r.department} · ` : '';
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['ROOM_LOCATION'],
        responseText: `**${r.roomNumber} — ${r.name || r.type}**\n${deptPart}${r.floor ? `${r.floor} · ` : ''}${bldgDisplay}`,
        subText: "Grounded strictly in official MSRIT department & facility registry.",
        matchedRoom: r,
        actionTargetId: actionId
      };
    }

    if (matchingRooms.length > 1) {
      const displayRooms = matchingRooms.slice(0, 5);
      const categoryTitle = roomCategory === 'FACULTY_ROOM' ? 'Faculty Rooms' : (roomCategory === 'LAB' ? 'Labs' : 'Rooms');
      const lines = displayRooms.map((r) => `- **${r.roomNumber}** — ${r.name || r.type}${r.floor ? ` · ${r.floor}` : ''}`).join('\n');
      const moreText = matchingRooms.length > 5 ? `\n\n...and ${matchingRooms.length - 5} more rooms.` : '';

      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['ROOM_LOCATION', 'DEPARTMENT_ROOMS'],
        responseText: `**${deptDisplayName} ${categoryTitle}**\n\n${lines}${moreText}\n\n📍 ${bldgDisplay}`,
        subText: "Grounded strictly in official MSRIT department & facility registry.",
        matchedRoomsList: matchingRooms,
        actionTargetId: actionId
      };
    }

    // Strict No-Hallucination response when department constraint produces 0 results
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['ROOM_LOCATION'],
      responseText: `I couldn't find a matching ${deptDisplayName} ${roomCategory === 'FACULTY_ROOM' ? 'faculty room' : 'room'} in Campus Pulse.`,
      subText: "Strict No-Hallucination Policy: Verified against official MSRIT registry."
    };
  }

  // 3. Structured Building + Room Category (e.g. "faculty rooms in CRD", "faculty lounge in CRD", "LHC faculty room")
  const bldgKey = buildingKey || (['lhc', 'crd', 'multipurpose', 'apex', 'esb', 'des', 'arch'].find((b) => normQ.includes(b)));
  if (bldgKey && roomCategory) {
    const matchingRooms = queryRooms({
      building: bldgKey,
      roomCategory: roomCategory
    });

    const bldgDisplay = (bldgKey === 'crd' || bldgKey === 'multipurpose') ? 'CRD / Multipurpose Block' : `${bldgKey.toUpperCase()} Block`;
    const actionId = (bldgKey === 'crd' || bldgKey === 'multipurpose') ? 'crd' : `block-${bldgKey}`;
    const categoryTitle = roomCategory === 'FACULTY_ROOM' ? 'Faculty Rooms' : (roomCategory === 'LAB' ? 'Labs' : 'Rooms');

    if (matchingRooms.length === 1) {
      const r = matchingRooms[0];
      const deptPart = r.department && r.department !== '-' ? `${r.department} · ` : '';
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['ROOM_LOCATION'],
        responseText: `**${r.roomNumber} — ${r.name || r.type}**\n${deptPart}${r.floor ? `${r.floor} · ` : ''}${bldgDisplay}`,
        subText: "Grounded strictly in official MSRIT department & facility registry.",
        matchedRoom: r,
        actionTargetId: actionId
      };
    }

    if (matchingRooms.length > 1) {
      const displayRooms = matchingRooms.slice(0, 5);
      const lines = displayRooms.map((r) => `- **${r.roomNumber}** — ${r.name || r.type}${r.floor ? ` · ${r.floor}` : ''}`).join('\n');
      const moreText = matchingRooms.length > 5 ? `\n\n...and ${matchingRooms.length - 5} more rooms.` : '';

      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['ROOM_LOCATION', 'BUILDING_ROOMS'],
        responseText: `**${bldgDisplay} — ${categoryTitle}**\n\n${lines}${moreText}\n\n📍 ${bldgDisplay}`,
        subText: "Grounded strictly in official MSRIT department & facility registry.",
        matchedRoomsList: matchingRooms,
        actionTargetId: actionId
      };
    }
  }

  // 3b. Structured Generic Room Category (e.g. "faculty rooms kaha hain", "faculty lounge")
  if (roomCategory && (normQ.includes('kaha') || normQ.includes('kidhar') || normQ.includes('where') || normQ.includes('list') || normQ.includes('dikhao') || normQ.includes('show'))) {
    const matchingRooms = queryRooms({
      roomCategory: roomCategory
    });
    if (matchingRooms.length > 0) {
      const displayRooms = matchingRooms.slice(0, 6);
      const categoryTitle = roomCategory === 'FACULTY_ROOM' ? 'Faculty Rooms & Lounges' : (roomCategory === 'LAB' ? 'Campus Labs' : 'Campus Rooms');
      const lines = displayRooms.map((r) => `- **${r.roomNumber}** — ${r.name || r.type} · ${r.floor ? `${r.floor}, ` : ''}${r.building || 'Campus'}`).join('\n');
      const moreText = matchingRooms.length > 6 ? `\n\n...and ${matchingRooms.length - 6} more rooms.` : '';

      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['ROOM_LOCATION', 'ROOM_SEARCH'],
        responseText: `**${categoryTitle}**\n\n${lines}${moreText}`,
        subText: "Grounded strictly in official MSRIT verified survey & database.",
        matchedRoomsList: matchingRooms,
        actionTargetId: 'block-lhc'
      };
    }
  }

  // 4. Building + Floor Query (e.g. "lhc ke 3rd floor rooms dikhao", "crd ke 3rd floor rooms", "lhc basement rooms")
  const floorMatch = normQ.match(/\b(basement|ground\s*floor|ground|1st\s*floor|first\s*floor|1st|2nd\s*floor|second\s*floor|2nd|3rd\s*floor|third\s*floor|3rd|4th\s*floor|fourth\s*floor|4th|5th\s*floor|fifth\s*floor|5th)\b/i);

  if (bldgKey && floorMatch) {
    let rawFloor = floorMatch[1].toLowerCase();
    if (rawFloor === 'ground') rawFloor = 'ground floor';
    if (rawFloor === 'first' || rawFloor === '1st') rawFloor = '1st floor';
    if (rawFloor === 'second' || rawFloor === '2nd') rawFloor = '2nd floor';
    if (rawFloor === 'third' || rawFloor === '3rd') rawFloor = '3rd floor';
    if (rawFloor === 'fourth' || rawFloor === '4th') rawFloor = '4th floor';
    if (rawFloor === 'fifth' || rawFloor === '5th') rawFloor = '5th floor';

    const fRooms = getRoomsByFloor(bldgKey, rawFloor);
    if (fRooms.length > 0) {
      const displayRooms = fRooms.slice(0, 5);
      const lines = displayRooms.map((r) => `• **${r.roomNumber}** — ${r.name || r.type}${r.department && r.department !== '-' ? ` (${r.department})` : ''}`).join('\n');
      const moreText = fRooms.length > 5 ? `\n\n...and ${fRooms.length - 5} more rooms.` : '';
      const bldgDisplay = (bldgKey === 'crd' || bldgKey === 'multipurpose') ? 'CRD / Multipurpose Block' : `${bldgKey.toUpperCase()} Block`;
      const actionId = (bldgKey === 'crd' || bldgKey === 'multipurpose') ? 'crd' : `block-${bldgKey}`;

      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['BUILDING_FLOOR_ROOMS'],
        responseText: `**Verified Rooms on ${fRooms[0].floor} in ${bldgDisplay} (${fRooms.length} total):**\n\n${lines}${moreText}`,
        subText: "Grounded strictly in official MSRIT department & facility registry.",
        matchedRoomsList: fRooms,
        actionTargetId: actionId
      };
    }
  }

  // 5. Building specific rooms query (e.g. "LHC rooms", "CRD rooms")
  if (bldgKey && (normQ.includes('room') || normQ.includes('classroom') || normQ.includes('lab') || normQ.includes('find') || normQ.includes('dikhao') || normQ.includes('show'))) {
    const bRooms = getRoomsByBuilding(bldgKey);
    if (bRooms.length > 0) {
      const displayList = bRooms.slice(0, 5);
      const lines = displayList.map((r) => `• **${r.roomNumber}** — ${r.name || r.type} (${r.floor}${r.department && r.department !== '-' ? ` · ${r.department}` : ''})`).join('\n');
      const moreText = bRooms.length > 5 ? `\n\n...and ${bRooms.length - 5} more rooms.` : '';
      const bldgDisplay = (bldgKey === 'crd' || bldgKey === 'multipurpose') ? 'CRD / Multipurpose Block' : `${bldgKey.toUpperCase()} Block`;
      const actionId = (bldgKey === 'crd' || bldgKey === 'multipurpose') ? 'crd' : `block-${bldgKey}`;

      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['BUILDING_ROOMS'],
        responseText: `**Verified Rooms in ${bldgDisplay} (${bRooms.length} total):**\n\n${lines}${moreText}`,
        subText: "Grounded strictly in official MSRIT department & facility registry.",
        matchedRoomsList: bRooms,
        actionTargetId: actionId
      };
    }
  }

  if (roomQuery) {
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['ROOM_SEARCH'],
      responseText: "I couldn't find that information in the available campus data.",
      subText: "Strict No-Hallucination Policy: Only room numbers verified from official MSRIT sources are recognized."
    };
  }

  return null;
}

// ----------------------------------------------------------------------------
// 6. Module: Library & Occupancy Query Handler
// ----------------------------------------------------------------------------

export function getLibraryAnswer(
  entities: ExtractedEntities,
  intents: CampusAiIntent[],
  normQ: string,
  simulatedTime?: SimulatedTimeState | null
): CampusAiResult | null {
  const { rawQuery, matchedLibrary } = entities;

  // 0. Specific Unit II / LHC Library / Room 306 queries
  if (
    normQ.includes('unit 2') ||
    normQ.includes('unit-2') ||
    normQ.includes('unit ii') ||
    normQ.includes('lhc 306') ||
    (normQ.includes('lhc') && normQ.includes('library'))
  ) {
    const lhcLib = LIBRARIES.find((l) => l.id === 'lhc_unit_2_library') || LIBRARIES[1];
    const det = getLibraryOccupancyDetails(lhcLib, simulatedTime);

    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['LIBRARY_SEARCH', 'LIBRARY_LOCATION'],
      responseText: `**${lhcLib.name}**\nLibrary & Information Center Unit – II · 1st Floor (Room LHC-306)\n📍 LHC Block\n\n⏰ Hours: 09:00–21:00 Daily\n👥 Primary Users: ${lhcLib.primaryGroups.join(', ')}\n📊 Occupancy: ${det.displayOccupancy} [${det.statusLabel}]`,
      subText: "Grounded strictly in official MSRIT Unit-II library telemetry.",
      matchedLibrary: lhcLib,
      actionTargetId: 'block-lhc'
    };
  }

  // 1. Multi-Intent / Least Crowded + Location
  if ((normQ.includes('least crowded') || normQ.includes('quietest')) && (normQ.includes('where') || normQ.includes('location'))) {
    const sorted = [...LIBRARIES].sort((a, b) => {
      const aDet = getLibraryOccupancyDetails(a, simulatedTime);
      const bDet = getLibraryOccupancyDetails(b, simulatedTime);
      return aDet.percentageEquivalent - bDet.percentageEquivalent;
    });

    const lowest = sorted[0];
    const lowestDet = getLibraryOccupancyDetails(lowest, simulatedTime);

    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['LIBRARY_OCCUPANCY', 'LIBRARY_LOCATION'],
      responseText: `${lowest.name} is currently the least crowded library at ${lowestDet.displayOccupancy} occupancy.\n\n📍 Location: ${lowest.building} Block (${lowest.floor})\n⏰ Hours: 09:00–21:00 Daily\n👥 Primary Users: ${lowest.primaryGroups.join(', ')}`,
      subText: "Estimated Live Occupancy (Formatted as percentage).",
      matchedLibrary: lowest,
      actionTargetId: lowest.nodeId
    };
  }

  // 2. Least Crowded Query
  if (normQ.includes('least crowded') || normQ.includes('empty') || normQ.includes('lowest occupancy')) {
    const sorted = [...LIBRARIES].sort((a, b) => {
      const aDet = getLibraryOccupancyDetails(a, simulatedTime);
      const bDet = getLibraryOccupancyDetails(b, simulatedTime);
      return aDet.percentageEquivalent - bDet.percentageEquivalent;
    });

    const lowest = sorted[0];
    const lowestDet = getLibraryOccupancyDetails(lowest, simulatedTime);
    const isOpen = isLibraryOpen(simulatedTime);

    const lines = LIBRARIES.map((lib) => {
      const det = getLibraryOccupancyDetails(lib, simulatedTime);
      return `• ${lib.name} (${lib.building} Block): ${det.displayOccupancy}`;
    }).join('\n');

    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['LIBRARY_OCCUPANCY'],
      responseText: `${lowest.name} is currently the least crowded library with an estimated occupancy of ${lowestDet.displayOccupancy}.\n\nAll Libraries Status (${isOpen ? 'Open 09:00–21:00' : 'Closed'}):\n${lines}`,
      subText: "Estimated Live Occupancy.",
      matchedLibrary: lowest,
      actionTargetId: lowest.nodeId
    };
  }

  // 3. Overall Library Occupancy
  if (normQ.includes('library occupancy') || (normQ.includes('occupancy') && normQ.includes('librar'))) {
    const lines = LIBRARIES.map((lib) => {
      const det = getLibraryOccupancyDetails(lib, simulatedTime);
      return `• ${lib.name} (${lib.building} Block): ${det.displayOccupancy} [${det.statusLabel}]`;
    }).join('\n');

    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['LIBRARY_OCCUPANCY'],
      responseText: `Current Campus Library Occupancy (6 Units):\n\n${lines}`,
      subText: "All occupancy values formatted as percentages via formatOccupancy()."
    };
  }

  // 4. Library Hours
  if (intents.includes('LIBRARY_HOURS') || (normQ.includes('library') && (normQ.includes('open') || normQ.includes('close') || normQ.includes('hours') || normQ.includes('timing')))) {
    const openNow = isLibraryOpen(simulatedTime);
    const target = matchedLibrary ? matchedLibrary.name : "All three campus libraries";
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['LIBRARY_HOURS'],
      responseText: `${target} are open 09:00–21:00 every day (Monday through Sunday).\n\nCurrent Status: ${openNow ? 'OPEN' : 'CLOSED'}.`,
      subText: "Operating hours: 09:00–21:00 Daily.",
      matchedLibrary,
      actionTargetId: matchedLibrary?.nodeId
    };
  }

  // 5. Specific library match
  if (matchedLibrary) {
    const lib = matchedLibrary;
    const det = getLibraryOccupancyDetails(lib, simulatedTime);
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['LIBRARY_LOCATION'],
      responseText: `${lib.name}\n📍 Location: ${lib.building} Block (${lib.floor})\n📊 Occupancy: ${det.displayOccupancy}\n⏰ Hours: 09:00–21:00 Daily`,
      subText: `Primary Users: ${lib.primaryGroups.join(', ')}`,
      matchedLibrary: lib,
      actionTargetId: lib.nodeId
    };
  }

  return null;
}

// ----------------------------------------------------------------------------
// 7. Module: Building & Location Handler
// ----------------------------------------------------------------------------

export function getBuildingAnswer(
  entities: ExtractedEntities,
  _intents: CampusAiIntent[],
  normQ: string
): CampusAiResult | null {
  const { rawQuery, matchedBlock, matchedLocation } = entities;

  if (_intents.includes('EVENT_SEARCH') && !normQ.includes('kaha') && !normQ.includes('kidhar') && !normQ.includes('where') && !normQ.includes('location') && !normQ.includes('block')) {
    return null;
  }

  if (matchedBlock) {
    const b = matchedBlock;
    const isCrd = b.id.toLowerCase().includes('crd') || b.id.toLowerCase().includes('multipurpose');
    const title = isCrd ? 'Multipurpose Block (CRD)' : (b.id.toLowerCase() === 'lhc' ? 'LHC Block' : (b.displayName.includes('Block') ? b.displayName : `${b.displayName} Block`));
    const locLine = isCrd ? '📍 Multipurpose Building' : `📍 Ground Block · ${b.name}`;

    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['BUILDING_LOCATION'],
      responseText: `**${title}**\n${locLine}\n\n${b.description}${b.departments.length > 0 ? `\nDepartments: ${b.departments.join(', ')}` : ''}`,
      subText: "Verified 4-corner coordinates on Google Maps Satellite base.",
      matchedBlock: b,
      actionTargetId: isCrd ? 'crd' : `block-${b.id}`
    };
  }

  if (matchedLocation) {
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['BUILDING_LOCATION'],
      responseText: `**${matchedLocation.name}**\n📍 Location: ${matchedLocation.building} (${matchedLocation.floor})\nCategory: ${matchedLocation.category}\n\n${matchedLocation.description}`,
      subText: `${matchedLocation.description}`,
      matchedLocation,
      actionTargetId: matchedLocation.id
    };
  }

  return null;
}

// ----------------------------------------------------------------------------
// 8. Module: Issue Reports Handler
// ----------------------------------------------------------------------------

export function getIssueAnswer(
  entities: ExtractedEntities,
  normQ: string
): CampusAiResult | null {
  const { rawQuery } = entities;
  const isIssue = normQ.includes('issue') || normQ.includes('complaint') || normQ.includes('reported') || normQ.includes('unresolved') || normQ.includes('wifi') || normQ.includes('wi-fi');
  if (!isIssue) return null;

  // Specific category search (e.g. "wifi ka issue kaha report hua?")
  if (normQ.includes('wifi') || normQ.includes('wi-fi') || normQ.includes('internet')) {
    const issues = queryAllIssues().filter(i => i.category.toLowerCase().includes('wi-fi') || i.category.toLowerCase().includes('internet') || i.title.toLowerCase().includes('wi-fi'));
    if (issues.length > 0) {
      const lines = issues.map(i => `• **${i.title}** (${i.category})\n  📍 Location: ${i.location}\n  Priority: ${i.priority} | Status: ${i.status}`).join('\n\n');
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['ISSUE_REPORT_QUERY'],
        responseText: `Reported Wi-Fi Issues (${issues.length}):\n\n${lines}`,
        subText: "Source: Central Campus Pulse issue-report database.",
        matchedIssues: issues
      };
    }
  }

  if (normQ.includes('water') || normQ.includes('dispenser')) {
    const issues = queryAllIssues().filter(i => i.category.toLowerCase().includes('water') || i.title.toLowerCase().includes('water'));
    if (issues.length > 0) {
      const lines = issues.map(i => `• **${i.title}** (${i.category})\n  📍 Location: ${i.location}\n  Priority: ${i.priority} | Status: ${i.status}`).join('\n\n');
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['ISSUE_REPORT_QUERY'],
        responseText: `Reported Water Facility Issues (${issues.length}):\n\n${lines}`,
        subText: "Source: Central Campus Pulse issue-report database.",
        matchedIssues: issues
      };
    }
  }

  const locBlock = ['lhc', 'esb', 'apex', 'quadrangle', 'multipurpose', 'architecture', 'workshop'].find((b) => normQ.includes(b));
  if (locBlock) {
    const issues = queryIssuesByLocation(locBlock);
    if (issues.length === 0) {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['ISSUE_REPORT_QUERY'],
        responseText: `No issues are currently reported for ${locBlock.toUpperCase()} Block.`,
        subText: `Location Filter: ${locBlock.toUpperCase()} • Campus Pulse Community Issue Dispatch.`
      };
    }
    const lines = issues.map((i) => `• ${i.title} (${i.category})\n  Location: ${i.location}\n  Priority: ${i.priority} | Status: ${i.status}`).join('\n\n');
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['ISSUE_REPORT_QUERY'],
      responseText: `Reported issues in ${locBlock.toUpperCase()} Block (${issues.length}):\n\n${lines}`,
      subText: `Location Filter: ${locBlock.toUpperCase()} • Campus Pulse Community Issue Dispatch.`,
      matchedIssues: issues
    };
  }

  if (normQ.includes('unresolved') || normQ.includes('pending') || normQ.includes('open')) {
    const issues = queryUnresolvedIssues();
    const lines = issues.map((i) => `• ${i.title} [${i.status}]\n  Category: ${i.category} | Location: ${i.location}`).join('\n\n');
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['ISSUE_REPORT_QUERY'],
      responseText: `Unresolved Campus Issues (${issues.length}):\n\n${lines}`,
      subText: "Statuses: Reported, Under Review, In Progress.",
      matchedIssues: issues
    };
  }

  if (normQ.includes('high priority') || normQ.includes('urgent')) {
    const issues = queryHighPriorityIssues();
    const lines = issues.map((i) => `• ${i.title} (${i.category})\n  Location: ${i.location} | Status: ${i.status}`).join('\n\n');
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['ISSUE_REPORT_QUERY'],
      responseText: `High Priority Issues (${issues.length}):\n\n${lines}`,
      subText: "Priority Filter: High • Sourced from active campus issue reports.",
      matchedIssues: issues
    };
  }

  const allIssues = queryAllIssues();
  if (allIssues.length > 0) {
    const lines = allIssues.map((i) => `• ${i.title} (${i.category})\n  Location: ${i.location} | Priority: ${i.priority} | Status: ${i.status}`).join('\n\n');
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['ISSUE_REPORT_QUERY'],
      responseText: `Reported Campus Issues (${allIssues.length}):\n\n${lines}`,
      subText: "Source: Central Campus Pulse issue-report database.",
      matchedIssues: allIssues
    };
  }

  return {
    queryText: rawQuery,
    normalizedQuery: normQ,
    intents: ['ISSUE_REPORT_QUERY'],
    responseText: "No issues are currently reported on campus.",
    subText: "Source: Central Campus Pulse issue-report database."
  };
}

// ----------------------------------------------------------------------------
// 9. Module: Lost & Found Handler
// ----------------------------------------------------------------------------

export function getLostFoundAnswer(
  entities: ExtractedEntities,
  normQ: string
): CampusAiResult | null {
  const { rawQuery } = entities;
  const isLf = normQ.includes('lost') || normQ.includes('found');
  if (!isLf) return null;

  const foundItems = SAMPLE_LOST_FOUND_ITEMS.filter((i) => i.type === 'found');
  const list = foundItems.map((i) => `• ${i.itemName} (Found at ${i.location}, claim at ${i.contactLocation})`).join('\n');
  return {
    queryText: rawQuery,
    normalizedQuery: normQ,
    intents: ['LOST_FOUND_QUERY'],
    responseText: `Found Items Recorded on Campus (${foundItems.length}):\n\n${list}`,
    subText: "Notice: Sample demo records for interactive testing."
  };
}

// ----------------------------------------------------------------------------
// 10. Module: Live Events & Announcements Handler
// ----------------------------------------------------------------------------

export async function getEventsAndAnnouncementsAnswer(
  intents: CampusAiIntent[],
  normQ: string,
  rawQuery: string
): Promise<CampusAiResult | null> {
  const isLocationQuery = /\b(where\s*is|where\s*are|where\s*can\s*i\s*find|where\s*do\s*i\s*find|where['\s]*s|kaha\s*hai|kahan\s*hai|kidhar\s*hai|kaha\s*h|kidhar\s*h|kahan\s*h|kaha\s*milega|kaha\s*milenge|location|location\s*batao|location\s*btao|find|locate|address\s*of|which\s*building|which\s*block|which\s*floor|kis\s*building\s*me|kis\s*block\s*me|kis\s*floor\s*pe|kis\s*floor\s*par|kaunsi\s*floor|konsa\s*block|room\s*kaha\s*hai|room\s*kidhar\s*hai|kaun\s*sa\s*room\s*hai|kaun\s*sa\s*room)\b/i.test(normQ);

  if (isLocationQuery || normQ.includes('seminar hall') || normQ.includes('board room') || normQ.includes('auditorium')) {
    return null;
  }

  const isEvent = intents.includes('EVENT_SEARCH');
  const isAnnouncement = intents.includes('ANNOUNCEMENT_SEARCH');

  if (isEvent) {
    try {
      const res = await fetchEvents();
      const events = (Array.isArray(res) ? res : ((res as any)?.data || [])) as any[];
      if (Array.isArray(events) && events.length > 0) {
        const sample = events.slice(0, 4);
        const text = sample.map((e, i) => `${i + 1}. ${e.title}\n   📅 Date: ${e.date}${e.location ? ` | 📍 Venue: ${e.location}` : ''}`).join('\n\n');
        return {
          queryText: rawQuery,
          normalizedQuery: normQ,
          intents: ['EVENT_SEARCH'],
          responseText: `Upcoming Official MSRIT Events (${events.length} tracked):\n\n${text}`,
          subText: "Source: MSRIT Official Website (https://www.msrit.edu)",
          matchedEvents: sample.map((e) => ({
            title: e.title,
            date: e.date,
            location: e.location || 'MSRIT Campus',
            link: e.link || 'https://www.msrit.edu'
          })),
          sourceUrl: 'https://www.msrit.edu',
          sourceAttribution: 'MSRIT Official Website'
        };
      }
    } catch {
      // Fallback message
    }
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['EVENT_SEARCH'],
      responseText: "No live events are currently listed on the official MSRIT website.",
      subText: "Source: MSRIT Official Website",
      sourceUrl: 'https://www.msrit.edu'
    };
  }

  if (isAnnouncement) {
    try {
      const res = await fetchAnnouncements();
      const announcements = (Array.isArray(res) ? res : ((res as any)?.data || [])) as any[];
      if (Array.isArray(announcements) && announcements.length > 0) {
        const sample = announcements.slice(0, 4);
        const text = sample.map((a, i) => `${i + 1}. ${a.title}\n   📅 Published: ${a.date}`).join('\n\n');
        return {
          queryText: rawQuery,
          normalizedQuery: normQ,
          intents: ['ANNOUNCEMENT_SEARCH'],
          responseText: `Latest MSRIT Announcements (${announcements.length} tracked):\n\n${text}`,
          subText: "Source: MSRIT Official Website (https://www.msrit.edu)",
          matchedAnnouncements: sample.map((a) => ({
            title: a.title,
            date: a.date,
            link: a.link || 'https://www.msrit.edu'
          })),
          sourceUrl: 'https://www.msrit.edu',
          sourceAttribution: 'MSRIT Official Website'
        };
      }
    } catch {
      // Fallback message
    }
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['ANNOUNCEMENT_SEARCH'],
      responseText: "No live announcements are currently listed on the official MSRIT website.",
      subText: "Source: MSRIT Official Website",
      sourceUrl: 'https://www.msrit.edu'
    };
  }

  return null;
}

// ----------------------------------------------------------------------------
// 11. Module: Live Clubs Handler
// ----------------------------------------------------------------------------

export async function getClubsAnswer(
  entities: ExtractedEntities,
  intents: CampusAiIntent[],
  normQ: string,
  rawQuery: string,
  context?: CampusAiContext
): Promise<CampusAiResult | null> {
  const isClubIntent = intents.includes('CLUB_SEARCH') || intents.includes('CLUB_DETAILS') || intents.includes('CLUB_CATEGORY_SEARCH');
  const mentionsClubs = /\b(club|clubs|society|societies|chapter|chapters|tnt|lasya|prayaag|theatrix|chiraranga|debsoc|19a|iclick|inara|clutchrit|nakama|ritmunsoc|ieee|nss|coderit|secureit|secur1t|aion|velocita|aws)\b/i.test(normQ);

  if (!isClubIntent && !mentionsClubs && !entities.matchedClub && !entities.isPronounClub) {
    return null;
  }

  // 1. Specific Club Match (e.g. "What is TNT?", "Tell me about Lasya", "IEEE club details", "what do they do?")
  let targetClub = entities.matchedClub;
  if (!targetClub && entities.isPronounClub && context?.lastClub) {
    targetClub = context.lastClub;
  }

  if (targetClub) {
    const c = targetClub;
    let chaptersBlock = '';
    if (c.relatedChapters && c.relatedChapters.length > 0) {
      chaptersBlock = `\n\n**Related Chapters:**\n${c.relatedChapters.map((ch) => `• ${ch}`).join('\n')}`;
    }
    const igBlock = c.instagramUrl ? `\n\n**Instagram / Social:** [GET TO KNOW →](${c.instagramUrl})` : '';

    // Check if asking specifically about chapters (e.g. "uske chapters?", "What chapters are under IEEE?")
    if (/\b(chapter|chapters|wings|sub-chapters|subchapters)\b/i.test(normQ) && c.relatedChapters && c.relatedChapters.length > 0) {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['CLUB_DETAILS'],
        responseText: `**${c.name} — Related Chapters**\n\n${c.relatedChapters.map((ch) => `• **${ch}**`).join('\n')}\n\n*${c.description}*${igBlock}`,
        subText: `Category: ${c.category} • Source: ${c.source || 'Provided MSRIT club directory'}`,
        matchedClub: c,
        matchedClubs: [{
          name: c.name,
          category: c.category,
          description: c.description,
          instagramUrl: c.instagramUrl
        }],
        actionTargetId: 'sec-others'
      };
    }

    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['CLUB_DETAILS'],
      responseText: `**${c.name}**\n${c.category}\n\n${c.description}${chaptersBlock}${igBlock}`,
      subText: `Category: ${c.category} • Source: ${c.source || 'Provided MSRIT club directory'}`,
      matchedClub: c,
      matchedClubs: [{
        name: c.name,
        category: c.category,
        description: c.description,
        instagramUrl: c.instagramUrl
      }],
      actionTargetId: 'sec-others'
    };
  }

  // 2. Domain / Genre Query (e.g. "dance clubs?", "coding club hai kya?", "photography club?", "debate club", "gaming club", "cybersecurity club")
  const isDance = /\b(dance|dancing|choreography)\b/i.test(normQ);
  const isDrama = /\b(drama|theatre|theater|nukkad|natak|acting|plays)\b/i.test(normQ);
  const isPhoto = /\b(photo|photography|videography|video|camera)\b/i.test(normQ);
  const isGaming = /\b(gaming|esports|games|gamer)\b/i.test(normQ);
  const isAnime = /\b(anime|manga|japanese|otaku)\b/i.test(normQ);
  const isDebate = /\b(debate|debating|debates|mun|public\s*speaking|parliamentary)\b/i.test(normQ);
  const isCoding = /\b(coding|software|code|hackathon|hackathons|programmer)\b/i.test(normQ);
  const isCyber = /\b(cyber|cybersecurity|security|hacking|ethical\s*hacking|ctf)\b/i.test(normQ);
  const isAi = /\b(ai|artificial\s*intelligence|machine\s*learning|ml|data\s*science)\b/i.test(normQ);
  const isRacing = /\b(racing|formula|automotive|motorsport|vehicle)\b/i.test(normQ);
  const isNss = /\b(nss|social\s*service|outreach|blood\s*donation|welfare)\b/i.test(normQ);
  const isAws = /\b(aws|cloud|cloud\s*computing|amazon\s*web\s*services)\b/i.test(normQ);
  const isComedy = /\b(comedy|stand-up|standup|improv)\b/i.test(normQ);
  const isQuiz = /\b(quiz|quizzing|trivia)\b/i.test(normQ);
  const isLit = /\b(literary|writing|poetry|creative\s*writing)\b/i.test(normQ);
  const isArt = /\b(art|arts|design|fine\s*arts|drawing|painting)\b/i.test(normQ) && !normQ.includes('performing');
  const isTechCat = /\b(technical|co-curricular|chapters|technology|tech)\b/i.test(normQ);
  const isCulturalCat = /\b(cultural|arts|performing\s*arts)\b/i.test(normQ) && !isTechCat;
  const isLiteraryCat = /\b(literary|quizzing|media)\b/i.test(normQ) && !isTechCat;

  let domainMatches: VerifiedClub[] = [];
  let domainTitle = '';

  if (isDance) {
    domainMatches = VERIFIED_MSRIT_CLUBS.filter((c) => c.name === 'TNT' || c.name === 'Lasya');
    domainTitle = 'Dance & Performing Arts Clubs';
  } else if (isDrama) {
    domainMatches = VERIFIED_MSRIT_CLUBS.filter((c) => c.name === 'Theatrix' || c.name === 'Chiraranga');
    domainTitle = 'Theatre & Dramatics Clubs';
  } else if (isPhoto) {
    domainMatches = VERIFIED_MSRIT_CLUBS.filter((c) => c.name === 'iClick' || c.name === 'STUDIO.RIT');
    domainTitle = 'Photography & Media Production Clubs';
  } else if (isGaming) {
    domainMatches = VERIFIED_MSRIT_CLUBS.filter((c) => c.name === 'ClutchRIT');
    domainTitle = 'Gaming & Esports Community';
  } else if (isAnime) {
    domainMatches = VERIFIED_MSRIT_CLUBS.filter((c) => c.name === 'Nakama RIT');
    domainTitle = 'Anime & Pop-Culture Community';
  } else if (isDebate) {
    domainMatches = VERIFIED_MSRIT_CLUBS.filter((c) => c.name.includes('DEBSOC') || c.name.includes('RITMUNSOC'));
    domainTitle = 'Debating & Model United Nations Clubs';
  } else if (isCoding) {
    domainMatches = VERIFIED_MSRIT_CLUBS.filter((c) => c.name === 'CodeRIT' || c.name.includes('IEEE'));
    domainTitle = 'Coding & Software Development Clubs';
  } else if (isCyber) {
    domainMatches = VERIFIED_MSRIT_CLUBS.filter((c) => c.name === 'SecureIT');
    domainTitle = 'Cybersecurity & Information Security Chapters';
  } else if (isAi) {
    domainMatches = VERIFIED_MSRIT_CLUBS.filter((c) => c.name === 'AION RIT');
    domainTitle = 'Artificial Intelligence & Machine Learning Clubs';
  } else if (isRacing) {
    domainMatches = VERIFIED_MSRIT_CLUBS.filter((c) => c.name.includes('Velocita'));
    domainTitle = 'Automotive Engineering & Racing Teams';
  } else if (isNss) {
    domainMatches = VERIFIED_MSRIT_CLUBS.filter((c) => c.name === 'NSS MSRIT');
    domainTitle = 'National Service Scheme & Community Outreach';
  } else if (isAws) {
    domainMatches = VERIFIED_MSRIT_CLUBS.filter((c) => c.name === 'AWS Club');
    domainTitle = 'Cloud Computing & AWS Chapters';
  } else if (isComedy) {
    domainMatches = VERIFIED_MSRIT_CLUBS.filter((c) => c.name.includes('Comedy'));
    domainTitle = 'Comedy & Improv Community';
  } else if (isQuiz) {
    domainMatches = VERIFIED_MSRIT_CLUBS.filter((c) => c.name === 'Quiz Club');
    domainTitle = 'Quizzing & Trivia Clubs';
  } else if (isLit) {
    domainMatches = VERIFIED_MSRIT_CLUBS.filter((c) => c.name === '19A');
    domainTitle = 'Literary & Creative Writing Clubs';
  } else if (isArt) {
    domainMatches = VERIFIED_MSRIT_CLUBS.filter((c) => c.name === 'INARA');
    domainTitle = 'Fine Arts & Design Clubs';
  } else if (isCulturalCat) {
    domainMatches = VERIFIED_MSRIT_CLUBS.filter((c) => c.category === 'Cultural & Performing Arts');
    domainTitle = 'Cultural & Performing Arts Clubs';
  } else if (isLiteraryCat) {
    domainMatches = VERIFIED_MSRIT_CLUBS.filter((c) => c.category === 'Literary, Quizzing & Media');
    domainTitle = 'Literary, Quizzing & Media Clubs';
  } else if (isTechCat) {
    domainMatches = VERIFIED_MSRIT_CLUBS.filter((c) => c.category === 'Technical & Co-Curricular Chapters');
    domainTitle = 'Technical & Co-Curricular Chapters';
  }

  if (domainMatches.length > 0) {
    const list = domainMatches.map((c, i) => `${i + 1}. **${c.name}** — ${c.category}\n   ${c.description}${c.instagramUrl ? ` • [GET TO KNOW →](${c.instagramUrl})` : ''}`).join('\n\n');
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['CLUB_CATEGORY_SEARCH'],
      responseText: `**MSRIT ${domainTitle}** (${domainMatches.length}):\n\n${list}`,
      subText: 'Source: Provided MSRIT club directory • Verified database records',
      matchedClubs: domainMatches.map((c) => ({
        name: c.name,
        category: c.category,
        description: c.description,
        instagramUrl: c.instagramUrl
      })),
      matchedClub: domainMatches.length > 0 ? domainMatches[0] : undefined,
      actionTargetId: 'sec-others'
    };
  }

  // 3. General Club Directory Listing (Limit to max 5 featured clubs per Prompt Rule 17)
  const sample = VERIFIED_MSRIT_CLUBS.slice(0, 5);
  const sampleText = sample.map((c, i) => `${i + 1}. **${c.name}** — ${c.category}\n   ${c.description}${c.instagramUrl ? ` • [GET TO KNOW →](${c.instagramUrl})` : ''}`).join('\n\n');

  return {
    queryText: rawQuery,
    normalizedQuery: normQ,
    intents: ['CLUB_SEARCH'],
    responseText: `**MSRIT Clubs & Student Activities Directory** (22 Verified Clubs)\n\n**Categories:**\n• **Cultural & Performing Arts** (5 clubs)\n• **Literary, Quizzing & Media** (10 clubs)\n• **Technical & Co-Curricular Chapters** (7 clubs)\n\n**Featured Clubs:**\n\n${sampleText}\n\n*View all 22 clubs and chapters under Others → Clubs & Student Activities.*`,
    subText: 'Source: Provided MSRIT club directory • Filter by category or search by name.',
    matchedClubs: sample.map((c) => ({
      name: c.name,
      category: c.category,
      description: c.description,
      instagramUrl: c.instagramUrl
    })),
    actionTargetId: 'sec-others'
  };
}

// ----------------------------------------------------------------------------
// 12. Module: Emergency Contacts Handler
// ----------------------------------------------------------------------------

export function getEmergencyContactsAnswer(
  normQ: string,
  rawQuery: string
): CampusAiResult | null {
  const isEmergency = normQ.includes('emergency') || normQ.includes('ambulance') || normQ.includes('fire') || normQ.includes('registrar phone') || normQ.includes('administration phone');
  if (!isEmergency) return null;

  const text = VERIFIED_EMERGENCY_CONTACTS.map((c) => `• ${c.label}: ${c.phone} (${c.category})`).join('\n');
  return {
    queryText: rawQuery,
    normalizedQuery: normQ,
    intents: ['EMERGENCY_CONTACT'],
    responseText: `Campus Emergency & Verified Official Contacts:\n\n${text}`,
    subText: "Source: MSRIT Official Website & Standard Emergency Services.",
    matchedEmergencyContacts: VERIFIED_EMERGENCY_CONTACTS
  };
}

// ----------------------------------------------------------------------------
// 13. Context Maintenance
// ----------------------------------------------------------------------------

export function maintainConversationContext(
  result: CampusAiResult,
  rawQuery: string,
  context?: CampusAiContext
): CampusAiResult {
  const history = context?.history ? [...context.history] : [];
  history.push({
    query: rawQuery,
    responseText: result.responseText,
    timestamp: Date.now()
  });

  const updatedContext: CampusAiContext = {
    ...(context || {}),
    history
  };

  if (result.matchedFaculty) updatedContext.lastFaculty = result.matchedFaculty;
  if (result.matchedLibrary) updatedContext.lastLibrary = result.matchedLibrary;
  if (result.matchedBlock) updatedContext.lastBlock = result.matchedBlock;
  if (result.matchedNode) updatedContext.lastBuildingNode = result.matchedNode;
  if (result.matchedLocation) updatedContext.lastLocation = result.matchedLocation;
  if (result.matchedDepartment) updatedContext.lastDepartment = result.matchedDepartment;
  if (result.matchedRoom) updatedContext.lastRoom = result.matchedRoom;
  if (result.matchedClub) updatedContext.lastClub = result.matchedClub;
  if (result.intents) updatedContext.lastIntents = result.intents;

  const entities = extractEntities(normalizeQuery(rawQuery), rawQuery, result.intents || [], context);
  if (entities.departmentCode) updatedContext.lastDepartmentCode = entities.departmentCode;
  if (entities.roomCategory) updatedContext.lastRoomCategory = entities.roomCategory;
  if (entities.buildingKey) updatedContext.lastBuildingKey = entities.buildingKey;
  if (entities.matchedClub && !updatedContext.lastClub) updatedContext.lastClub = entities.matchedClub;

  result.contextUpdated = updatedContext;
  return result;
}

// ----------------------------------------------------------------------------
// 14. Central Dispatch Pipeline: processCampusAiQuery
// ----------------------------------------------------------------------------

export async function processCampusAiQuery(
  rawQuery: string,
  simulatedTime?: SimulatedTimeState | null,
  context?: CampusAiContext
): Promise<CampusAiResult> {
  if (!rawQuery || !rawQuery.trim()) {
    return {
      queryText: rawQuery,
      normalizedQuery: '',
      intents: ['UNKNOWN_QUERY'],
      responseText: "Please enter a question to ask Campus Pulse AI.",
      subText: "You can ask about faculty members, departments, classrooms, libraries, campus blocks, events, clubs, or issues."
    };
  }

  // Step 1: Normalize Query
  const normQ = normalizeQuery(rawQuery);

  // Step 2: Detect Intents
  const intents = detectIntents(normQ, context);

  // Step 3: Extract Entities
  const entities = extractEntities(normQ, rawQuery, intents, context);

  // Step 4: Search Relevant Data & Generate Grounded Response (Deterministic Pipeline Priority Order)

  // 1. Emergency Contacts
  const emergencyAns = getEmergencyContactsAnswer(normQ, rawQuery);
  if (emergencyAns) {
    return maintainConversationContext(emergencyAns, rawQuery, context);
  }

  // 2. Exact Room / Location Handler (Highest deterministic priority for locations)
  const roomAns = getRoomAnswer(entities, intents, normQ, rawQuery);
  if (roomAns) {
    return maintainConversationContext(roomAns, rawQuery, context);
  }

  // 3. Library & Occupancy Handler
  const libAns = getLibraryAnswer(entities, intents, normQ, simulatedTime);
  if (libAns) {
    return maintainConversationContext(libAns, rawQuery, context);
  }

  // 4. Faculty Handler (Includes faculty ambiguity guard)
  const facultyAns = getFacultyAnswer(entities, intents, simulatedTime);
  if (facultyAns) {
    return maintainConversationContext(facultyAns, rawQuery, context);
  }

  // 5. Clubs & Activities (High deterministic priority for club inquiries)
  const clubAns = await getClubsAnswer(entities, intents, normQ, rawQuery, context);
  if (clubAns && (entities.matchedClub || entities.isPronounClub || intents.includes('CLUB_DETAILS') || intents.includes('CLUB_CATEGORY_SEARCH'))) {
    return maintainConversationContext(clubAns, rawQuery, context);
  }

  // 6. Building & Location Handler
  const bldgAns = getBuildingAnswer(entities, intents, normQ);
  if (bldgAns) {
    return maintainConversationContext(bldgAns, rawQuery, context);
  }

  // 7. Issue Reports Handler
  const issueAns = getIssueAnswer(entities, normQ);
  if (issueAns) {
    return maintainConversationContext(issueAns, rawQuery, context);
  }

  // 8. Events & Announcements (Only when asking for real events/schedules)
  const eventAns = await getEventsAndAnnouncementsAnswer(intents, normQ, rawQuery);
  if (eventAns) {
    return maintainConversationContext(eventAns, rawQuery, context);
  }

  // 9. Clubs General Handler (If not already dispatched)
  if (clubAns) {
    return maintainConversationContext(clubAns, rawQuery, context);
  }

  // 10. Lost & Found Handler
  const lfAns = getLostFoundAnswer(entities, normQ);
  if (lfAns) {
    return maintainConversationContext(lfAns, rawQuery, context);
  }

  // 4J. Fallback: Strict No-Hallucination Response with helpful suggestions
  const fallbackRes: CampusAiResult = {
    queryText: rawQuery,
    normalizedQuery: normQ,
    intents: ['UNKNOWN_QUERY'],
    responseText: "I couldn't find that information in the Campus Pulse data.",
    subText: "Try searching for:\n• Faculty member (e.g., 'Dr. Yogish H K')\n• Library occupancy (e.g., 'Which library is least crowded?')\n• Campus location (e.g., 'Where is LHC?')\n• Events & Announcements (e.g., 'What events are happening today?')\n• Student Clubs (e.g., 'What clubs are available?')"
  };

  return maintainConversationContext(fallbackRes, rawQuery, context);
}
