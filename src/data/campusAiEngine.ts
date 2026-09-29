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
import type { MSRITFacultyRecord, CampusNode } from './facultyData';

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
  getFacultyLiveStatus,
  isFacultyConsultationOpen
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
  getRoomsByBuilding,
  normalizeRoomNumber
} from './roomsData';
import type { MSRITRoomRecord } from './roomsData';

import {
  fetchAnnouncements,
  fetchEvents,
  fetchClubs
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
  | 'LIBRARY_SEARCH'
  | 'LIBRARY_LOCATION'
  | 'LIBRARY_OCCUPANCY'
  | 'LIBRARY_USERS'
  | 'LIBRARY_HOURS'
  | 'DIGITAL_LIBRARY_QUERY'
  | 'BUILDING_SEARCH'
  | 'BUILDING_LOCATION'
  | 'BUILDING_ROOMS'
  | 'BUILDING_FACULTY'
  | 'ROOM_SEARCH'
  | 'ROOM_AVAILABILITY'
  | 'ROOM_LOCATION'
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
  matchedClubs?: Array<{ name: string; category: string; description?: string; officialUrl?: string; sourceUrl?: string; department?: string }>;
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
  lastRoom?: MSRITRoomRecord | null;
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
  departmentCode?: string;
  departmentName?: string;
  matchedDepartment?: MSRITDepartment;
  libraryId?: string;
  matchedLibrary?: CampusLibrary;
  isPronounLibrary?: boolean;
  buildingId?: string;
  matchedBlock?: VerifiedCampusBlock;
  matchedLocation?: MSRITLocation;
  matchedNode?: CampusNode;
  isPronounBuilding?: boolean;
  studentGroup?: 'CSE' | '1st Year' | 'Electronics' | 'Non-CSE' | 'MCA' | 'MBA' | 'Architecture' | 'Civil/Mechanical/Chemical/Biotech';
  lostFoundKeyword?: string;
  issueKeyword?: string;
  roomQuery?: string;
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
    [/\bhead\s*of\s*department\b/g, 'hod'],
    [/\bwhere['\s]*s\b/g, 'where is'],
    [/\bwhat['\s]*s\b/g, 'what is'],
    [/\bhow['\s]*s\b/g, 'how is'],
    [/\bkaha\s*hai\b|\bkahan\s*hai\b|\bkidhar\s*hai\b|\bkaha\s*h\b|\bkidhar\s*h\b|\bkahan\s*milega\b/g, 'where is'],
    [/\bkon\s*hai\b|\bkaun\s*hai\b|\bkaun\s*h\b/g, 'who is'],
    [/\bkab\s*free\b|\bkab\s*available\b|\bkab\s*milenge\b/g, 'when available'],
    [/\bkiske\s*liye\b/g, 'for whom']
  ];

  for (const [pattern, replacement] of typoReplacements) {
    q = q.replace(pattern, replacement);
  }

  return q.replace(/\s+/g, ' ').trim();
}

// ----------------------------------------------------------------------------
// 2. Intent Detection Pipeline (Multi-Intent Support)
// ----------------------------------------------------------------------------

export function detectIntents(normalizedQuery: string): CampusAiIntent[] {
  const q = normalizedQuery;
  const intents: CampusAiIntent[] = [];

  const hasEmail = /\b(email|e-mail|mail\s*id|email\s*id|mail\s*address|email\s*address|mail|contact\s*email)\b/.test(q);
  const hasCabin = /\b(cabin|office|which\s*cabin|find\s*cabin|sitting|sit)\b/.test(q);
  const hasAvailability = /\b(available|availability|free|busy|in\s*lecture|in\s*class|can\s*i\s*meet|who\s*can\s*i\s*meet|who\s*is\s*free|who\s*is\s*available|which\s*faculty\s*are\s*available|when\s*free|vacant)\b/.test(q);
  const hasSchedule = /\b(schedule|timetable|classes\s*today|routine)\b/.test(q);
  const hasHod = /\b(hod|head\s*of\s*department|department\s*head)\b/.test(q);
  const hasLocation = /\b(where\s*is|where\s*can\s*i\s*find|where\s*are|where\s*to\s*find|location|floor|which\s*floor|which\s*block|which\s*building|take\s*me\s*to|show\s*on\s*map|view\s*on\s*map|nearest)\b/.test(q);

  const hasOccupancy = /\b(occupancy|how\s*crowded|crowded|busy|rush|empty|least\s*crowded|less\s*crowded|seats|full)\b/.test(q);
  const hasLibraryUsers = /\b(who\s*uses|primary\s*users|for\s*cse|for\s*electronics|for\s*first\s*year|which\s*library\s*should|best\s*library|where\s*can\s*.*study)\b/.test(q);
  const hasLibraryHours = /\b(library\s*open|library\s*close|library\s*hours|library\s*timing|is\s*.*library\s*open)\b/.test(q);
  const mentionsExplicitLibrary = /\b(library|libraries|esb\s*library|lhc\s*library|apex\s*library)\b/.test(q);

  const hasEvents = /\b(event|events|happening\s*today|upcoming\s*events|fest|symposium|seminar|workshop)\b/.test(q);
  const hasAnnouncements = /\b(announcement|announcements|news|circular|notice|latest\s*news|msrit\s*news|circulars)\b/.test(q);
  const hasClubs = /\b(club|clubs|organization|organizations|society|societies|extracurricular|ieee|nss|tedx|edc|iic|idea\s*lab|apple\s*training|co-curricular|student\s*activity|student\s*activities)\b/.test(q);
  const hasEmergency = /\b(emergency|contact|phone|ambulance|fire|registrar\s*phone|administration\s*phone|helpline|anti[- ]ragging)\b/.test(q);

  const hasLostFound = /\b(lost|found|misplaced|calculator|airpods|bottle|wallet|watch|umbrella|keys|bag|spectacles)\b/.test(q);
  const hasIssues = /\b(issue|issues|complaint|complaints|reported|unresolved|resolved|high\s*priority|urgent|infrastructure|cleanliness|electricity|water|wifi|wi-fi)\b/.test(q);

  const hasRoom = /\b(ab[- ]?\d{3}[a-z]?|esb[- ]?\d{3}[a-z]?|lhc[- ]?\d{3}[a-z]?|arch[- ]?\d{3}[a-z]?|room[- ]?\d{3}[a-z]?|classroom|classrooms|seminar\s*hall|board\s*room|auditorium)\b/i.test(q);
  const mentionsBuilding = /\b(lhc|esb|apex|architecture|basketball|sports|quadrangle|multipurpose|workshop|crd|des|cafeteria|food\s*court|hostel|basic\s*sciences)\b/.test(q);

  // 1. Events & Announcements
  if (hasEvents) intents.push('EVENT_SEARCH');
  if (hasAnnouncements) intents.push('ANNOUNCEMENT_SEARCH');

  // 2. Clubs & Student Activities
  if (hasClubs) intents.push('CLUB_SEARCH');

  // 3. Emergency Contacts
  if (hasEmergency && (q.includes('emergency') || q.includes('number') || q.includes('phone') || q.includes('contact') || q.includes('ambulance') || q.includes('fire'))) {
    intents.push('EMERGENCY_CONTACT');
  }

  // 4. Room & Classroom Intents
  if (hasRoom) {
    intents.push('ROOM_SEARCH');
    if (q.includes('classroom')) intents.push('CLASSROOM_QUERY');
  }

  // 5. Lost & Found
  if (hasLostFound && (q.includes('lost') || q.includes('found') || q.includes('item') || q.includes('where was'))) {
    intents.push('LOST_FOUND_QUERY');
  }

  // 6. Issue reports (Takes precedence over location matching for queries like "What issues are reported in LHC?")
  if (hasIssues && (q.includes('issue') || q.includes('reported') || q.includes('unresolved') || q.includes('resolved') || q.includes('priority'))) {
    intents.push('ISSUE_REPORT_QUERY');
  }

  // 7. Library specific
  if ((mentionsExplicitLibrary || (mentionsBuilding && (hasOccupancy || hasLibraryUsers))) && !hasIssues) {
    if (hasOccupancy) intents.push('LIBRARY_OCCUPANCY');
    if (hasLibraryUsers) intents.push('LIBRARY_USERS');
    if (hasLibraryHours) intents.push('LIBRARY_HOURS');
    if (hasLocation && !hasOccupancy && !hasLibraryUsers) intents.push('LIBRARY_LOCATION');
    if (intents.length === 0) intents.push('LIBRARY_SEARCH');
  }

  // 8. Building & Department locations (Takes precedence when asking "Where is LHC?")
  if (hasHod) intents.push('FACULTY_HOD');
  if (mentionsBuilding && hasLocation && !mentionsExplicitLibrary && !hasRoom && !hasIssues) intents.push('BUILDING_LOCATION');

  // 9. Faculty specific
  if (hasEmail) intents.push('FACULTY_EMAIL');
  if (hasCabin) intents.push('FACULTY_CABIN');
  if (hasLocation && !mentionsExplicitLibrary && !mentionsBuilding && !hasRoom && !hasIssues) intents.push('FACULTY_LOCATION');
  if (hasAvailability) intents.push('FACULTY_AVAILABILITY');
  if (hasSchedule) intents.push('FACULTY_SCHEDULE');

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

  // --- Pronoun Follow-up Resolution ---
  const hasFacultyPronoun = /\b(she|her|he|his|him|the professor|the teacher|that professor|this professor)\b/.test(normQ) && !normQ.includes('library') && !normQ.includes('crowded');
  const hasLibraryPronoun = /\b(it|its|the library|that library|this library)\b/.test(normQ);
  const hasBuildingPronoun = /\b(it|its|that block|that building|this block)\b/.test(normQ);

  // --- Room Entity Extraction ---
  const roomPattern = /\b(AB[- ]?\d{3}[A-Z]?|ESB[- ]?\d{3}[A-Z]?|LHC[- ]?\d{3}[A-Z]?|ARCH[- ]?\d{3}[A-Z]?|ROOM[- ]?\d{3}[A-Z]?)\b/i;
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

  // --- Faculty Entity Matching ---
  if (hasFacultyPronoun && context?.lastFaculty) {
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

    const FACULTY_STOP_WORDS = new Set(['and', 'the', 'for', 'with', 'of', 'in', 'on', 'at', 'to', 'is', 'are', 'was', 'where', 'what', 'which', 'who', 'how', 'principal', 'head', 'dean', 'director']);

    for (const fac of FACULTY_MSRIT_DATA) {
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
      const exact = candidates.find((c) => normQ.includes(cleanFacultyName(c.name)));
      if (exact) {
        entities.matchedFaculty = exact;
      } else {
        entities.multipleFaculty = candidates;
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
  const deptMatch = MSRIT_DEPARTMENTS_DATA.find((d) => {
    const codeRegex = new RegExp(`\\b${d.code.toLowerCase()}\\b`, 'i');
    return codeRegex.test(normQ) || normQ.includes(d.name.toLowerCase());
  });
  if (deptMatch) {
    entities.matchedDepartment = deptMatch;
    entities.departmentCode = deptMatch.code;
    entities.departmentName = deptMatch.name;
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
        normQ.includes(bName) ||
        normQ.includes(bDisp) ||
        normQ.includes(bId) ||
        (bId === 'lhc' && /\blhc\b/.test(normQ)) ||
        (bId === 'esb' && /\besb\b/.test(normQ)) ||
        (bId === 'apex' && /\bapex\b/.test(normQ)) ||
        (bId === 'des' && /\bdes\b/.test(normQ)) ||
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

  // 1. Department & Building Filtered Faculty Query
  if (normQ.includes('faculty') && (entities.matchedDepartment || /\b(cse|ise|ece|aiml|ai-ml|cv|civil|biotech)\b/.test(normQ))) {
    const deptFilter = entities.departmentCode || entities.matchedDepartment?.code || (
      normQ.includes('aiml') || normQ.includes('ai-ml') ? 'AI-ML' :
      normQ.includes('cse') ? 'CSE' :
      normQ.includes('ise') ? 'ISE' :
      normQ.includes('ece') ? 'ECE' : 'CSE'
    );

    const bldgMapping = resolveFacultyBuildingMapping(deptFilter);
    let facultyList = FACULTY_MSRIT_DATA.filter((f) => {
      const fDept = f.department.toLowerCase();
      if (deptFilter === 'CSE') return fDept.includes('computer science') && !fDept.includes('ai') && !fDept.includes('cyber');
      if (deptFilter === 'AI-ML') return fDept.includes('ai') || fDept.includes('artificial');
      if (deptFilter === 'ISE') return fDept.includes('information');
      if (deptFilter === 'ECE') return fDept.includes('electronics & comm');
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
        return live.liveStatus === 'Available for Consultation' || live.liveStatus.includes('Available');
      });
    }

    if (facultyList.length > 0) {
      const sample = facultyList.slice(0, 5);
      const listText = sample.map((f) => `• ${f.name} (${f.designation}) — Cabin: ${f.cabinLocation}`).join('\n');
      const bldgTag = filterLhc ? ' in LHC Block' : '';
      const availTag = filterAvailable ? ' currently available' : '';

      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['FACULTY_SEARCH'],
        responseText: `${deptFilter} Faculty${bldgTag}${availTag} (${facultyList.length} total):\n\n${listText}${facultyList.length > 5 ? `\n...and ${facultyList.length - 5} more.` : ''}`,
        subText: `Department Base: ${bldgMapping.primaryBuilding} • Sourced from official faculty registry.`,
        matchedDepartment: entities.matchedDepartment,
        actionTargetId: filterLhc ? 'block-lhc' : undefined
      };
    }
  }

  // 2. Availability General Queries
  if (intents.includes('FACULTY_AVAILABILITY') && !matchedFaculty) {
    const consultationOpen = isFacultyConsultationOpen(simulatedTime);
    if (!consultationOpen) {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['FACULTY_AVAILABILITY'],
        responseText: "Faculty consultation is currently closed.\n\nWorking Hours: Monday–Friday 09:00–17:00, Saturday 09:00–13:30 (Sunday closed).",
        subText: "Faculty consultation strictly follows Campus Operating Hours."
      };
    }

    const availableFaculty = FACULTY_MSRIT_DATA.filter((f) => {
      const status = getFacultyLiveStatus(f, simulatedTime);
      return status.liveStatus === 'Available for Consultation' || status.liveStatus.includes('Available');
    });

    const sample = availableFaculty.slice(0, 5);
    const listText = sample.map((f) => `• ${f.name} (${f.department}) — Cabin: ${f.cabinLocation}`).join('\n');

    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['FACULTY_AVAILABILITY'],
      responseText: `Currently Available Faculty (${availableFaculty.length} available right now):\n\n${listText}${availableFaculty.length > 5 ? `\n...and ${availableFaculty.length - 5} more.` : ''}`,
      subText: "Real-time consultation status dynamically calculated from today's schedule."
    };
  }

  // 3. Specific Faculty Inquiries
  if (!matchedFaculty) return null;

  const fac = matchedFaculty;
  const liveInfo = getFacultyLiveStatus(fac, simulatedTime);
  const wantsEmail = intents.includes('FACULTY_EMAIL') || /\b(email|mail)\b/.test(normQ);
  const wantsLocation = intents.includes('FACULTY_LOCATION') || intents.includes('FACULTY_CABIN') || /\b(where|location|find|cabin|office)\b/.test(normQ);
  const wantsAvailability = intents.includes('FACULTY_AVAILABILITY') || /\b(available|free|busy|consult)\b/.test(normQ);
  const wantsSchedule = intents.includes('FACULTY_SCHEDULE') || /\b(schedule|timetable)\b/.test(normQ);

  const bldgId = fac.nodeId || (
    fac.primaryBuilding?.toLowerCase().includes('lhc') ? 'block-lhc' :
    fac.primaryBuilding?.toLowerCase().includes('esb') ? 'block-esb' :
    fac.primaryBuilding?.toLowerCase().includes('apex') ? 'block-apex' : 'block-lhc'
  );

  // Multi-Intent: Email AND Location
  if (wantsEmail && wantsLocation) {
    const locText = liveInfo.activeEvent
      ? `${liveInfo.liveLocation} (${liveInfo.activeEvent})`
      : `Cabin: ${fac.cabinLocation}`;
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['FACULTY_EMAIL', 'FACULTY_LOCATION'],
      responseText: `${fac.name}\n${fac.designation} — ${fac.department}\n\n📍 Location: ${locText}\n📧 Email: ${fac.email || 'N/A'}\n🟢 Live Status: ${liveInfo.liveStatus}`,
      subText: `Cabin: ${fac.cabinLocation} (${fac.primaryBuilding || 'LHC Block'})`,
      matchedFaculty: { ...fac, status: liveInfo.liveStatus, currentLocation: liveInfo.liveLocation, isCollegeOpen: liveInfo.isCollegeOpen },
      actionTargetId: bldgId
    };
  }

  // Single-Intent: Email
  if (wantsEmail) {
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['FACULTY_EMAIL'],
      responseText: `${fac.name}\n${fac.designation}, ${fac.department}\n\n📧 Email: ${fac.email || 'N/A'}`,
      subText: `Cabin: ${fac.cabinLocation}`,
      matchedFaculty: { ...fac, status: liveInfo.liveStatus, currentLocation: liveInfo.liveLocation, isCollegeOpen: liveInfo.isCollegeOpen },
      actionTargetId: bldgId
    };
  }

  // Single-Intent: Location / Cabin
  if (wantsLocation) {
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['FACULTY_LOCATION'],
      responseText: `${fac.name} is in their cabin at ${fac.cabinLocation}.\nLive Location: ${liveInfo.liveLocation || fac.cabinLocation}.`,
      subText: `Status: ${liveInfo.liveStatus} • Building: ${fac.primaryBuilding || 'LHC Block'}.`,
      matchedFaculty: { ...fac, status: liveInfo.liveStatus, currentLocation: liveInfo.liveLocation, isCollegeOpen: liveInfo.isCollegeOpen },
      actionTargetId: bldgId
    };
  }

  // Single-Intent: Availability
  if (wantsAvailability) {
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['FACULTY_AVAILABILITY'],
      responseText: liveInfo.liveStatus === 'Available for Consultation'
        ? `Yes, ${fac.name} is available for consultation right now in ${fac.cabinLocation}.`
        : `${fac.name} is currently ${liveInfo.liveStatus} in ${liveInfo.liveLocation || 'class'}.\nExpected free: ${liveInfo.liveNextAvailableTime}.`,
      subText: `Department: ${fac.department} • Cabin: ${fac.cabinLocation}`,
      matchedFaculty: { ...fac, status: liveInfo.liveStatus, currentLocation: liveInfo.liveLocation, isCollegeOpen: liveInfo.isCollegeOpen },
      actionTargetId: bldgId
    };
  }

  // Single-Intent: Schedule
  if (wantsSchedule) {
    const schedList = (fac.todaySchedule && fac.todaySchedule.length > 0)
      ? fac.todaySchedule.map((s) => `• ${s.time}: ${s.event} (${s.room})`).join('\n')
      : 'No lecture sessions scheduled today. Available in cabin.';

    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['FACULTY_SCHEDULE'],
      responseText: `Today's Schedule for ${fac.name}:\n\n${schedList}`,
      subText: `Status: ${liveInfo.liveStatus} | Cabin: ${fac.cabinLocation}`,
      matchedFaculty: { ...fac, status: liveInfo.liveStatus, currentLocation: liveInfo.liveLocation, isCollegeOpen: liveInfo.isCollegeOpen },
      actionTargetId: bldgId
    };
  }

  // Default Faculty Profile Response
  return {
    queryText: rawQuery,
    normalizedQuery: normQ,
    intents: ['FACULTY_SEARCH'],
    responseText: `${fac.name}\n${fac.designation} — ${fac.department}\n\n📍 Cabin: ${fac.cabinLocation}\n📧 Email: ${fac.email || 'N/A'}\n🟢 Live Status: ${liveInfo.liveStatus}`,
    subText: `Building: ${fac.primaryBuilding || 'LHC Block'}`,
    matchedFaculty: { ...fac, status: liveInfo.liveStatus, currentLocation: liveInfo.liveLocation, isCollegeOpen: liveInfo.isCollegeOpen },
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
  const { matchedRoom, roomQuery } = entities;

  if (matchedRoom) {
    const r = matchedRoom;
    const isHistorical = r.temporalStatus === 'historical';
    const statusLabel = isHistorical ? 'Historical Archive Room' : 'Current Verified Room (2026)';
    const deptInfo = r.department ? `\nDepartment: ${r.department}` : '';

    const bldgId = r.building?.toLowerCase().includes('apex') ? 'block-apex' :
      r.building?.toLowerCase().includes('lhc') ? 'block-lhc' :
      r.building?.toLowerCase().includes('esb') ? 'block-esb' :
      r.building?.toLowerCase().includes('des') ? 'block-des' :
      r.building?.toLowerCase().includes('arch') ? 'block-architecture' : 'block-lhc';

    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['ROOM_SEARCH'],
      responseText: `${r.roomNumber} is located in ${r.building || 'Campus Facilities'}.\nType: ${r.type}${deptInfo}\nStatus: ${statusLabel}.`,
      subText: `Source: ${r.sourceTitle} • Grounded in official MSRIT classroom registry.`,
      matchedRoom: r,
      actionTargetId: bldgId
    };
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

  // Building specific rooms query
  const bldgKey = ['apex', 'lhc', 'esb', 'des', 'arch'].find((b) => normQ.includes(b));
  if (bldgKey && (normQ.includes('room') || normQ.includes('classroom') || normQ.includes('find'))) {
    const bRooms = getRoomsByBuilding(bldgKey);
    if (bRooms.length > 0) {
      const displayList = bRooms.slice(0, 6);
      const lines = displayList.map((r) => `• ${r.roomNumber} [${r.type}]${r.department ? ` - ${r.department}` : ''}`).join('\n');

      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['ROOM_SEARCH'],
        responseText: `Verified Rooms in ${bldgKey.toUpperCase()} (${bRooms.length} total):\n\n${lines}${bRooms.length > 6 ? `\n...and ${bRooms.length - 6} more rooms.` : ''}`,
        subText: "Grounded strictly in official MSRIT department & facility registry.",
        matchedRoomsList: bRooms,
        actionTargetId: `block-${bldgKey}`
      };
    }
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

  if (matchedBlock) {
    const b = matchedBlock;
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['BUILDING_LOCATION'],
      responseText: `${b.displayName} (${b.name})\n📍 Location: Ground Block\n\n${b.description}\nDepartments: ${b.departments.join(', ')}`,
      subText: "Verified 4-corner coordinates on Google Maps Satellite base.",
      matchedBlock: b,
      actionTargetId: `block-${b.id}`
    };
  }

  if (matchedLocation) {
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['BUILDING_LOCATION'],
      responseText: `${matchedLocation.name}\n📍 Location: ${matchedLocation.building} (${matchedLocation.floor})\nCategory: ${matchedLocation.category}`,
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
  const isIssue = normQ.includes('issue') || normQ.includes('complaint') || normQ.includes('reported') || normQ.includes('unresolved');
  if (!isIssue) return null;

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
  const isEvent = intents.includes('EVENT_SEARCH') || normQ.includes('event') || normQ.includes('happening today');
  const isAnnouncement = intents.includes('ANNOUNCEMENT_SEARCH') || normQ.includes('announcement') || normQ.includes('news') || normQ.includes('circular');

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
  intents: CampusAiIntent[],
  normQ: string,
  rawQuery: string
): Promise<CampusAiResult | null> {
  const isClub = intents.includes('CLUB_SEARCH') || normQ.includes('club') || normQ.includes('student activit') || normQ.includes('ieee') || normQ.includes('nss') || normQ.includes('tedx') || normQ.includes('idea lab');
  if (!isClub) return null;

  try {
    const res = await fetchClubs();
    const clubs = (Array.isArray(res) ? res : ((res as any)?.data || [])) as any[];
    if (Array.isArray(clubs) && clubs.length > 0) {
      let filtered = clubs;
      if (normQ.includes('technical')) {
        filtered = clubs.filter((c) => c.category === 'Technical' || c.category === 'Professional Society' || c.name.toLowerCase().includes('ieee') || c.name.toLowerCase().includes('apple'));
      } else if (normQ.includes('innovation')) {
        filtered = clubs.filter((c) => c.category === 'Innovation' || c.name.toLowerCase().includes('idea') || c.name.toLowerCase().includes('iic'));
      } else if (normQ.includes('sports')) {
        filtered = clubs.filter((c) => c.category === 'Sports');
      } else if (normQ.includes('ieee')) {
        filtered = clubs.filter((c) => c.name.toLowerCase().includes('ieee'));
      }

      const sample = filtered.slice(0, 5);
      const text = sample.map((c, i) => `${i + 1}. ${c.name} [${c.category}]\n   ${c.description ? c.description.slice(0, 110) + '...' : ''}`).join('\n\n');

      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['CLUB_SEARCH'],
        responseText: `Official MSRIT Student Organizations & Clubs (${filtered.length}):\n\n${text}`,
        subText: "Source: MSRIT Official Website (https://www.msrit.edu)",
        matchedClubs: sample.map((c) => ({
          name: c.name,
          category: c.category,
          description: c.description,
          officialUrl: c.officialUrl || c.sourceUrl || 'https://www.msrit.edu',
          sourceUrl: c.sourceUrl || 'https://www.msrit.edu'
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
    intents: ['CLUB_SEARCH'],
    responseText: "I couldn't find that information in the official MSRIT data.",
    subText: "Source: MSRIT Official Website"
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
  if (result.intents) updatedContext.lastIntents = result.intents;

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
  const intents = detectIntents(normQ);

  // Step 3: Extract Entities
  const entities = extractEntities(normQ, rawQuery, intents, context);

  // Step 4: Search Relevant Data & Generate Grounded Response

  // 4A. Emergency Contacts
  const emergencyAns = getEmergencyContactsAnswer(normQ, rawQuery);
  if (emergencyAns) {
    return maintainConversationContext(emergencyAns, rawQuery, context);
  }

  // 4B. Events & Announcements
  const eventAns = await getEventsAndAnnouncementsAnswer(intents, normQ, rawQuery);
  if (eventAns) {
    return maintainConversationContext(eventAns, rawQuery, context);
  }

  // 4C. Clubs & Activities
  const clubAns = await getClubsAnswer(intents, normQ, rawQuery);
  if (clubAns) {
    return maintainConversationContext(clubAns, rawQuery, context);
  }

  // 4D. Issue Reports Handler
  const issueAns = getIssueAnswer(entities, normQ);
  if (issueAns) {
    return maintainConversationContext(issueAns, rawQuery, context);
  }

  // 4E. Faculty Handler (Includes faculty ambiguity guard)
  const facultyAns = getFacultyAnswer(entities, intents, simulatedTime);
  if (facultyAns) {
    return maintainConversationContext(facultyAns, rawQuery, context);
  }

  // 4F. Room & Building Handler
  const roomAns = getRoomAnswer(entities, intents, normQ, rawQuery);
  if (roomAns) {
    return maintainConversationContext(roomAns, rawQuery, context);
  }

  // 4G. Library & Occupancy Handler
  const libAns = getLibraryAnswer(entities, intents, normQ, simulatedTime);
  if (libAns) {
    return maintainConversationContext(libAns, rawQuery, context);
  }

  // 4H. Building & Location Handler
  const bldgAns = getBuildingAnswer(entities, intents, normQ);
  if (bldgAns) {
    return maintainConversationContext(bldgAns, rawQuery, context);
  }

  // 4I. Lost & Found Handler
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
