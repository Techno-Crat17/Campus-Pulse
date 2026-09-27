// ============================================================================
// GENERAL CAMPUS AI CHATBOT ENGINE
// Single Source of Truth Grounding:
// 1. Existing Campus Pulse JSON / datasets
// 2. Faculty Dataset (faculty_msrit_dynamic.json, FACULTY_MSRIT_DATA)
// 3. Central Library Dataset (LIBRARIES, DIGITAL_LIBRARY, occupancy)
// 4. Verified Campus Blocks & Building Nodes (VERIFIED_CAMPUS_BLOCKS, CAMPUS_NODES_MAPPING)
// 5. Dynamic Occupancy Engine (calculateLibraryOccupancy, formatOccupancy)
// 6. Lost & Found Dataset (SAMPLE_LOST_FOUND_ITEMS)
// 7. Campus Issue Reports Data (getStoredIssueReports, query...)
// 8. Official MSRIT Classroom & Room Registry (msrit_rooms.json, roomsData.ts)
// 9. Official MSRIT Information (strictly verified, zero hallucination)
// ============================================================================

import {
  FACULTY_MSRIT_DATA,
  CAMPUS_NODES_MAPPING,
  resolveFacultyBuildingMapping
} from './facultyData';
import type { MSRITFacultyRecord, CampusNode } from './facultyData';

import {
  LIBRARIES,
  DIGITAL_LIBRARY,
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
  isCampusOpen,
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
  queryResolvedIssues,
  queryHighPriorityIssues,
  queryIssuesByCategory,
  queryIssuesByReporter
} from './issueReportsData';
import type { IssueReport } from './issueReportsData';

import {
  MSRIT_ROOMS,
  findRoomByNumber,
  getRoomsByBuilding,
  getRoomsByDepartment,
  normalizeRoomNumber
} from './roomsData';
import type { MSRITRoomRecord } from './roomsData';

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
  | 'LIBRARY_USERS'
  | 'LIBRARY_OCCUPANCY'
  | 'LIBRARY_HOURS'
  | 'DIGITAL_LIBRARY_QUERY'
  | 'BUILDING_SEARCH'
  | 'BUILDING_LOCATION'
  | 'CAMPUS_LOCATION'
  | 'CAMPUS_NAVIGATION'
  | 'DEPARTMENT_LOCATION'
  | 'OCCUPANCY_QUERY'
  | 'LOST_FOUND_QUERY'
  | 'ISSUE_REPORT_QUERY'
  | 'CAMPUS_HOURS'
  | 'ROOM_SEARCH'
  | 'CLASSROOM_QUERY'
  | 'GENERAL_CAMPUS_QUERY'
  | 'UNKNOWN_QUERY';

export interface CampusAiResult {
  queryText: string;
  normalizedQuery: string;
  intents: CampusAiIntent[];
  responseText: string;
  subText?: string;
  matchedFaculty?: MSRITFacultyRecord;
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
// 1. Natural Language Normalization
// ----------------------------------------------------------------------------

export function normalizeQuery(query: string): string {
  let q = query
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/["“”]/g, '"')
    .replace(/['"]s\b/g, '') // e.g. sumana's -> sumana
    .replace(/[?.,!;:()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Common typo normalizations & aliases
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
    // Hinglish expressions
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
  const hasDesignation = /\b(designation|position|post|role|title|rank)\b/.test(q);
  const hasDepartment = /\b(which\s*department|what\s*department|department\s*does|dept\s*does|where\s*does\s*.*work)\b/.test(q);
  const hasHod = /\b(hod|head\s*of\s*department|department\s*head)\b/.test(q);
  const hasLocation = /\b(where\s*is|where\s*can\s*i\s*find|where\s*are|where\s*to\s*find|location|floor|which\s*floor|which\s*block|which\s*building|take\s*me\s*to|show\s*on\s*map|view\s*on\s*map|nearest)\b/.test(q);

  const hasOccupancy = /\b(occupancy|how\s*crowded|crowded|busy|rush|empty|least\s*crowded|less\s*crowded|seats|full)\b/.test(q);
  const hasLibraryUsers = /\b(who\s*uses|primary\s*users|for\s*cse|for\s*electronics|for\s*first\s*year|which\s*library\s*should|best\s*library|where\s*can\s*.*study)\b/.test(q);
  const hasLibraryHours = /\b(library\s*open|library\s*close|library\s*hours|library\s*timing|is\s*.*library\s*open)\b/.test(q);
  const mentionsExplicitLibrary = /\b(library|libraries|esb\s*library|lhc\s*library|apex\s*library)\b/.test(q);

  const hasLostFound = /\b(lost|found|misplaced|calculator|airpods|bottle|wallet|watch|umbrella|keys|bag|spectacles)\b/.test(q);
  const hasIssues = /\b(issue|issues|complaint|complaints|reported|unresolved|resolved|high\s*priority|urgent|infrastructure|cleanliness|electricity|water|wifi|wi-fi)\b/.test(q);

  const hasRoom = /\b(ab[- ]?\d{3}[a-z]?|esb[- ]?\d{3}[a-z]?|lhc[- ]?\d{3}[a-z]?|arch[- ]?\d{3}[a-z]?|room[- ]?\d{3}[a-z]?|classroom|classrooms|seminar\s*hall|board\s*room|auditorium)\b/i.test(q);
  const mentionsBuilding = /\b(lhc|esb|apex|architecture|basketball|sports|quadrangle|multipurpose|workshop|crd|des|cafeteria|food\s*court|hostel|basic\s*sciences)\b/.test(q);

  // 1. Room & Classroom Intents
  if (hasRoom) {
    intents.push('ROOM_SEARCH');
    if (q.includes('classroom')) intents.push('CLASSROOM_QUERY');
  }

  // 2. Lost & Found
  if (hasLostFound && (q.includes('lost') || q.includes('found') || q.includes('item') || q.includes('where was'))) {
    intents.push('LOST_FOUND_QUERY');
  }

  // 3. Issue reports
  if (hasIssues && (q.includes('issue') || q.includes('reported') || q.includes('unresolved') || q.includes('resolved') || q.includes('priority'))) {
    intents.push('ISSUE_REPORT_QUERY');
  }

  // 4. Digital Library
  if (q.includes('digital library') || q.includes('delnet') || q.includes('cmti') || (q.includes('vtu') && q.includes('library')) || q.includes('sciencedirect') || q.includes('springerlink')) {
    intents.push('DIGITAL_LIBRARY_QUERY');
  }

  // 5. Library specific
  if (mentionsExplicitLibrary || (mentionsBuilding && (hasOccupancy || hasLibraryUsers))) {
    if (hasOccupancy) intents.push('LIBRARY_OCCUPANCY');
    if (hasLibraryUsers) intents.push('LIBRARY_USERS');
    if (hasLibraryHours) intents.push('LIBRARY_HOURS');
    if (hasLocation && !hasOccupancy && !hasLibraryUsers) intents.push('LIBRARY_LOCATION');
    if (intents.length === 0) intents.push('LIBRARY_SEARCH');
  }

  // 6. Building & Department locations
  if (hasHod) intents.push('FACULTY_HOD');
  if (mentionsBuilding && hasLocation && !mentionsExplicitLibrary && !hasRoom) intents.push('BUILDING_LOCATION');
  if (hasDepartment && (q.includes('where') || q.includes('located') || q.includes('find'))) intents.push('DEPARTMENT_LOCATION');

  // 7. Faculty specific
  if (hasEmail) intents.push('FACULTY_EMAIL');
  if (hasCabin) intents.push('FACULTY_CABIN');
  if (hasLocation && !mentionsExplicitLibrary && !mentionsBuilding && !hasRoom) intents.push('FACULTY_LOCATION');
  if (hasAvailability) intents.push('FACULTY_AVAILABILITY');
  if (hasSchedule) intents.push('FACULTY_SCHEDULE');
  if (hasDesignation) intents.push('FACULTY_DESIGNATION');
  if (hasDepartment && !intents.includes('DEPARTMENT_LOCATION')) intents.push('FACULTY_DEPARTMENT');

  // 8. General campus hours
  if ((q.includes('campus') || q.includes('college')) && (q.includes('open') || q.includes('hours') || q.includes('working') || q.includes('close'))) {
    intents.push('CAMPUS_HOURS');
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

  // --- Pronoun Follow-up Resolution ---
  const hasFacultyPronoun = /\b(she|her|he|his|him|the professor|the teacher|that professor)\b/.test(normQ);
  const hasLibraryPronoun = /\b(it|the library|that library|this library)\b/.test(normQ);
  const hasBuildingPronoun = /\b(it|that block|that building|this block)\b/.test(normQ);

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
  } else {
    // Check specific named facilities
    const facilityKeys = [
      { key: 'apex block auditorium', name: 'Apex Block Auditorium' },
      { key: 'apex auditorium', name: 'Apex Block Auditorium' },
      { key: 'apex board room', name: 'Apex Board Room' },
      { key: 'esb seminar hall 1', name: 'ESB Seminar Hall 1' },
      { key: 'esb seminar hall 2', name: 'ESB Seminar Hall 2' },
      { key: 'esb board room', name: 'ESB Board Room' },
      { key: 'des hi-tech seminar hall', name: 'DES Hi-Tech Seminar Hall' },
      { key: 'des seminar hall', name: 'DES Hi-Tech Seminar Hall' },
      { key: 'des board room 1', name: 'DES Board Room 1' },
      { key: 'des board room 2', name: 'DES Board Room 2' },
      { key: 'lhc seminar hall 1', name: 'LHC Seminar Hall 1' },
      { key: 'lhc seminar hall 2', name: 'LHC Seminar Hall 2' },
      { key: 'mca board room', name: 'MCA Board Room' },
      { key: 'diagnostic & therapeutic', name: 'Diagnostic & Therapeutic Equipment Laboratory' },
      { key: 'english language lab', name: 'English Language Lab' },
      { key: 'chemistry lab', name: 'Engineering Chemistry Lab' }
    ];
    for (const { key, name } of facilityKeys) {
      if (normQ.includes(key)) {
        const found = findRoomByNumber(name);
        if (found) {
          entities.matchedRoom = found;
          break;
        }
      }
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
      .replace(/\b(where is|what is|email of|cabin of|is|available|schedule of|show|who is|find|cabin|location|now|today|office|the|class|lecture)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    for (const fac of FACULTY_MSRIT_DATA) {
      const fClean = cleanFacultyName(fac.name);
      const nameParts = fClean.split(' ').filter((p) => p.length >= 3);

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
  if (hasLibraryPronoun && context?.lastLibrary && !entities.matchedLibrary) {
    entities.matchedLibrary = context.lastLibrary;
    entities.isPronounLibrary = true;
  } else {
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

  // --- Student Group Intent ---
  if (/\b(mca|master\s*of\s*computer\s*applications?)\b/.test(normQ)) {
    entities.studentGroup = 'MCA';
  } else if (/\b(mba|management\s*studies)\b/.test(normQ)) {
    entities.studentGroup = 'MBA';
  } else if (/\b(arch|architecture|b\.?arch)\b/.test(normQ)) {
    entities.studentGroup = 'Architecture';
  } else if (/\b(cse|computer\s*science|ise|ai|aiml|cyber|software)\b/.test(normQ)) {
    entities.studentGroup = 'CSE';
  } else if (/\b(first\s*year|1st\s*year|freshers?|basic\s*sciences?)\b/.test(normQ)) {
    entities.studentGroup = '1st Year';
  } else if (/\b(electronics|ece|eee|eie|telecom|medical\s*electronics)\b/.test(normQ)) {
    entities.studentGroup = 'Electronics';
  } else if (/\b(non-cse|mechanical|civil|biotech|industrial|chemical)\b/.test(normQ)) {
    entities.studentGroup = 'Civil/Mechanical/Chemical/Biotech';
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
        (normQ.includes('architecture') && bId.includes('arch')) ||
        (normQ.includes('workshop') && bId.includes('workshop')) ||
        (normQ.includes('quadrangle') && bId.includes('quadrangle')) ||
        (normQ.includes('multipurpose') && bId.includes('multipurpose'))
      );
    });
    if (blockMatch) {
      entities.matchedBlock = blockMatch;
      entities.buildingId = blockMatch.id;
    }
  }

  // --- Campus Node / Location Matching ---
  const nodeMatch = Object.values(CAMPUS_NODES_MAPPING).find((node) => {
    const n = node.name.toLowerCase();
    const b = node.building.toLowerCase();
    return normQ.includes(n) || normQ.includes(b);
  });
  if (nodeMatch) {
    entities.matchedNode = nodeMatch;
  }

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
// 4. Module: Faculty Query Handler
// ----------------------------------------------------------------------------

export function getFacultyAnswer(
  entities: ExtractedEntities,
  intents: CampusAiIntent[],
  simulatedTime?: SimulatedTimeState | null
): CampusAiResult | null {
  const { normQ, rawQuery, matchedFaculty, multipleFaculty } = entities;

  // Multiple faculty match ambiguity guard: Never guess
  if (multipleFaculty && multipleFaculty.length > 1) {
    const names = multipleFaculty.map((f) => `• ${f.name} (${f.department})`).join('\n');
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents,
      responseText: `I found multiple faculty members matching that name:\n\n${names}\n\nPlease specify which faculty member you are looking for.`,
      subText: "Strict Faculty Resolution Rule: Never guess among multiple matches.",
      multipleFaculty
    };
  }

  // 1. Department Faculty Listing (e.g. "show me CSE faculty", "where can I find CSE AIML faculty?")
  if (normQ.includes('faculty') && (entities.matchedDepartment || /\b(cse|ise|ece|aiml|ai-ml|ai & ml|cy|cyber|cv|civil|biotech|industrial|me|medical)\b/.test(normQ))) {
    const deptFilter = entities.departmentCode || entities.matchedDepartment?.code || (
      normQ.includes('aiml') || normQ.includes('ai-ml') || normQ.includes('ai & ml') ? 'AI-ML' :
      normQ.includes('cse') ? 'CSE' :
      normQ.includes('ise') ? 'ISE' :
      normQ.includes('ece') ? 'ECE' :
      normQ.includes('cv') || normQ.includes('civil') ? 'CV' :
      normQ.includes('biotech') ? 'BT' : 'ALL'
    );

    const bldgMapping = resolveFacultyBuildingMapping(deptFilter);
    const facultyList = FACULTY_MSRIT_DATA.filter((f) => {
      const fDept = f.department.toLowerCase();
      if (deptFilter === 'CSE') return fDept.includes('computer science') && !fDept.includes('ai') && !fDept.includes('cyber');
      if (deptFilter === 'AI-ML') return fDept.includes('ai') || fDept.includes('artificial');
      if (deptFilter === 'ISE') return fDept.includes('information');
      if (deptFilter === 'ECE') return fDept.includes('electronics & comm');
      return fDept.includes(deptFilter.toLowerCase());
    });

    if (facultyList.length > 0) {
      const sample = facultyList.slice(0, 5);
      const listText = sample.map((f) => `• ${f.name} — ${f.designation} (Cabin: ${f.cabinLocation})`).join('\n');
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['FACULTY_SEARCH'],
        responseText: `${deptFilter} Faculty are based in ${bldgMapping.primaryBuilding}.\n\nFaculty Members (${facultyList.length} total):\n${listText}${facultyList.length > 5 ? `\n...and ${facultyList.length - 5} more.` : ''}`,
        subText: `Department Location: ${bldgMapping.primaryBuilding} • Grounded in faculty_msrit_dynamic.json.`,
        matchedDepartment: entities.matchedDepartment
      };
    }
  }

  // 2. Availability General Queries: "who is free?", "who is available now?", "which faculty are available right now?"
  if (intents.includes('FACULTY_AVAILABILITY') && !matchedFaculty) {
    const consultationOpen = isFacultyConsultationOpen(simulatedTime);
    if (!consultationOpen) {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['FACULTY_AVAILABILITY'],
        responseText: "Faculty consultation is currently closed.\n\nFaculty working hours are Monday–Friday 09:00–17:00 and Saturday 09:00–13:30 (Sunday closed).",
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
  const wantsDesignation = intents.includes('FACULTY_DESIGNATION');
  const wantsDepartment = intents.includes('FACULTY_DEPARTMENT');

  // Faculty Schedule Class Room Inquiry: "Where is Dr Sumana's 10 AM class?" / "Where is Dr X's class?"
  if (normQ.includes('class') || normQ.includes('lecture')) {
    if (fac.todaySchedule && fac.todaySchedule.length > 0) {
      const targetSession = fac.todaySchedule.find((s) => {
        const sLower = s.time.toLowerCase();
        if (normQ.includes('10') && (sLower.includes('10') || sLower.includes('09:30'))) return true;
        if (normQ.includes('11') && sLower.includes('11')) return true;
        if (normQ.includes('morning') && (sLower.includes('morning') || sLower.includes('am'))) return true;
        if (normQ.includes('afternoon') && (sLower.includes('afternoon') || sLower.includes('pm'))) return true;
        return false;
      }) || fac.todaySchedule[0];

      const roomRec = findRoomByNumber(targetSession.room);
      const roomDetails = roomRec
        ? `${targetSession.room} (${roomRec.building}${roomRec.department ? ` - ${roomRec.department}` : ''})`
        : targetSession.room;

      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['FACULTY_LOCATION', 'FACULTY_SCHEDULE'],
        responseText: `${fac.name}'s ${targetSession.event} (${targetSession.time}) is in ${roomDetails}.`,
        subText: `Home Cabin: ${fac.cabinLocation} (${fac.primaryBuilding || fac.building || 'LHC Block'}).`,
        matchedFaculty: fac,
        matchedRoom: roomRec
      };
    }
  }

  // Multi-Intent: Email AND Location (e.g. "what is Sumana's email and where is she?")
  if (wantsEmail && wantsLocation) {
    const locText = liveInfo.activeEvent
      ? `${liveInfo.liveLocation} (${liveInfo.activeEvent})`
      : `Cabin: ${fac.cabinLocation}`;
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['FACULTY_EMAIL', 'FACULTY_LOCATION'],
      responseText: `${fac.name}\n\nEmail: ${fac.email || 'N/A'}\nCurrent Location: ${locText}`,
      subText: `Department: ${fac.department} • Live Status: ${liveInfo.liveStatus}`,
      matchedFaculty: fac
    };
  }

  // Single-Intent: Email
  if (wantsEmail) {
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['FACULTY_EMAIL'],
      responseText: `${fac.name}\n${fac.designation}, ${fac.department}\nEmail: ${fac.email || 'N/A'}`,
      subText: `Cabin: ${fac.cabinLocation}`,
      matchedFaculty: fac
    };
  }

  // Single-Intent: Current Location (Strict: Active schedule location takes priority over home building)
  if (wantsLocation) {
    if (!liveInfo.isCollegeOpen) {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['FACULTY_LOCATION'],
        responseText: `${fac.name} is currently Off-Campus.\nCampus is closed (Opens next working day at 09:00 AM).`,
        subText: `Usual Cabin: ${fac.cabinLocation} (${fac.primaryBuilding || fac.building || 'LHC Block'})`,
        matchedFaculty: fac
      };
    }

    if (liveInfo.activeEvent && liveInfo.liveLocation) {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['FACULTY_LOCATION'],
        responseText: `${fac.name} is currently in ${liveInfo.liveLocation}.\nSession: ${liveInfo.activeEvent} (until ${liveInfo.liveNextAvailableTime}).`,
        subText: `Home Cabin: ${fac.cabinLocation} (${fac.primaryBuilding || fac.building || 'LHC Block'}).`,
        matchedFaculty: fac
      };
    }

    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['FACULTY_LOCATION'],
      responseText: `${fac.name} is in their cabin at ${fac.cabinLocation}.`,
      subText: `Status: ${liveInfo.liveStatus} • Building: ${fac.primaryBuilding || fac.building || 'LHC Block'}.`,
      matchedFaculty: fac
    };
  }

  // Single-Intent: Availability
  if (wantsAvailability) {
    if (!liveInfo.isCollegeOpen) {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['FACULTY_AVAILABILITY'],
        responseText: `Faculty consultation is currently closed.\n${fac.name} will be available ${liveInfo.liveNextAvailableTime}.`,
        subText: "Faculty consultation follows Campus Operating Hours (Mon-Fri 09:00-17:00, Sat 09:00-13:30).",
        matchedFaculty: fac
      };
    }

    if (liveInfo.liveStatus === 'Available for Consultation') {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['FACULTY_AVAILABILITY'],
        responseText: `Yes, ${fac.name} is available for consultation right now in ${fac.cabinLocation}.`,
        subText: `Next Scheduled Event: ${liveInfo.liveNextAvailableTime}`,
        matchedFaculty: fac
      };
    }

    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['FACULTY_AVAILABILITY'],
      responseText: `No, ${fac.name} is currently ${liveInfo.liveStatus} in ${liveInfo.liveLocation || 'class'}.\nExpected free: ${liveInfo.liveNextAvailableTime}.`,
      subText: `Session: ${liveInfo.activeEvent || 'Academic Duty'}`,
      matchedFaculty: fac
    };
  }

  // Single-Intent: Schedule
  if (wantsSchedule) {
    if (!fac.todaySchedule || fac.todaySchedule.length === 0) {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['FACULTY_SCHEDULE'],
        responseText: `No lecture sessions scheduled today for ${fac.name}. Available in cabin (${fac.cabinLocation}).`,
        subText: "Verified from dynamic faculty schedule registry.",
        matchedFaculty: fac
      };
    }

    const scheduleList = fac.todaySchedule.map((s) => `• ${s.time}: ${s.event} (${s.room})`).join('\n');
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['FACULTY_SCHEDULE'],
      responseText: `Today's Schedule for ${fac.name}:\n\n${scheduleList}`,
      subText: `Live Status: ${liveInfo.liveStatus} | Location: ${liveInfo.liveLocation}`,
      matchedFaculty: fac
    };
  }

  // Single-Intent: Designation
  if (wantsDesignation) {
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['FACULTY_DESIGNATION'],
      responseText: `${fac.name} is a ${fac.designation} in the Department of ${fac.department}.`,
      subText: `Cabin: ${fac.cabinLocation} | Email: ${fac.email || 'N/A'}`,
      matchedFaculty: fac
    };
  }

  // Single-Intent: Department
  if (wantsDepartment) {
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['FACULTY_DEPARTMENT'],
      responseText: `${fac.name} belongs to the Department of ${fac.department} (${fac.primaryBuilding || fac.building || 'LHC Block'}).`,
      subText: `Designation: ${fac.designation} | Cabin: ${fac.cabinLocation}`,
      matchedFaculty: fac
    };
  }

  // Default Faculty Profile Response
  return {
    queryText: rawQuery,
    normalizedQuery: normQ,
    intents: ['FACULTY_SEARCH'],
    responseText: `${fac.name}\n${fac.designation} — ${fac.department}\n\nCabin: ${fac.cabinLocation}\nEmail: ${fac.email || 'N/A'}`,
    subText: `Live Status: ${liveInfo.liveStatus} | Location: ${liveInfo.liveLocation}`,
    matchedFaculty: fac
  };
}

// ----------------------------------------------------------------------------
// 5. Module: Room & Classroom Query Handler
// ----------------------------------------------------------------------------

export function getRoomAnswer(
  entities: ExtractedEntities,
  _intents: CampusAiIntent[],
  normQ: string,
  rawQuery: string
): CampusAiResult | null {
  const { matchedRoom, roomQuery } = entities;

  // 1. Direct Specific Room Match: "Where is AB-401?", "Which building is AB-401 in?", "Where is LHC204?", "Where is ARCH307?"
  if (matchedRoom) {
    const r = matchedRoom;
    const blockMatch = VERIFIED_CAMPUS_BLOCKS.find((b) => {
      if (!r.building) return false;
      const bName = b.name.toLowerCase();
      const bDisp = b.displayName.toLowerCase();
      const rB = r.building.toLowerCase();
      return (
        rB.includes(bName) ||
        bDisp.includes(rB) ||
        (rB.includes('apex') && b.id === 'apex') ||
        (rB.includes('lhc') && b.id === 'lhc') ||
        (rB.includes('esb') && b.id === 'esb') ||
        (rB.includes('des') && b.id === 'des') ||
        (rB.includes('arch') && b.id === 'architecture')
      );
    });

    const isHistorical = r.temporalStatus === 'historical';
    const statusLabel = isHistorical ? 'Historical Archive Room' : 'Current Verified Room (2026)';
    const deptInfo = r.department ? `\nDepartment: ${r.department}` : '';

    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['ROOM_SEARCH'],
      responseText: `${r.roomNumber} is located in ${r.building || 'Campus Facilities'}.\nType: ${r.type}${deptInfo}\nStatus: ${statusLabel}.`,
      subText: `Source: ${r.sourceTitle} (${r.sourceUrl}) • Grounded in official MSRIT classroom registry.`,
      matchedRoom: r,
      matchedBlock: blockMatch
    };
  }

  // 2. Unverified Room Query Guard (e.g. "Where is AB-999?", "Where is LHC999?", "Where is Room 402?")
  if (roomQuery) {
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['ROOM_SEARCH'],
      responseText: "I don't have a verified location for that room in the current MSRIT data.",
      subText: "Strict No-Hallucination Policy: Only room numbers verified from official MSRIT sources (msrit.edu) are recognized."
    };
  }

  // 3. Department Specific Classrooms: "Show MCA classrooms", "Where is the Architecture classroom?"
  if (normQ.includes('classroom') || normQ.includes('classrooms') || normQ.includes('room')) {
    if (entities.matchedDepartment || normQ.includes('mca') || normQ.includes('arch') || normQ.includes('medical electronics')) {
      const deptKey = normQ.includes('mca') ? 'mca' :
        normQ.includes('arch') ? 'arch' :
        normQ.includes('medical') ? 'medical' :
        entities.departmentCode || '';

      const deptRooms = getRoomsByDepartment(deptKey).filter((r) => r.type === 'Classroom');
      if (deptRooms.length > 0) {
        const lines = deptRooms.map((r) => `• ${r.roomNumber} (${r.building} - ${r.type})`).join('\n');
        return {
          queryText: rawQuery,
          normalizedQuery: normQ,
          intents: ['CLASSROOM_QUERY'],
          responseText: `Verified Classrooms for ${deptRooms[0].department} (${deptRooms.length}):\n\n${lines}`,
          subText: `Source: ${deptRooms[0].sourceTitle} • Verified Official MSRIT Database.`,
          matchedRoomsList: deptRooms
        };
      }
    }

    // 4. Building Specific Classrooms / Rooms: "What classrooms are in Apex?", "What rooms are available in Apex?", "Give me verified classrooms in LHC"
    const bldgKey = ['apex', 'lhc', 'esb', 'des', 'arch'].find((b) => normQ.includes(b));
    if (bldgKey) {
      const bRooms = getRoomsByBuilding(bldgKey);
      if (bRooms.length > 0) {
        const onlyClassrooms = normQ.includes('classroom');
        const filtered = onlyClassrooms ? bRooms.filter((r) => r.type === 'Classroom') : bRooms;
        const displayList = filtered.slice(0, 8);
        const lines = displayList.map((r) => `• ${r.roomNumber} [${r.type}]${r.department ? ` - ${r.department}` : ''}${r.temporalStatus === 'historical' ? ' (Historical)' : ''}`).join('\n');

        return {
          queryText: rawQuery,
          normalizedQuery: normQ,
          intents: ['ROOM_SEARCH'],
          responseText: `Verified Rooms in ${bldgKey.toUpperCase()} (${filtered.length} total):\n\n${lines}${filtered.length > 8 ? `\n...and ${filtered.length - 8} more rooms.` : ''}`,
          subText: "Grounded strictly in official MSRIT department & facility registry.",
          matchedRoomsList: filtered
        };
      }
    }
  }

  // 5. Seminar Hall or Board Room generic query: "Where is the DES seminar hall?", "ESB seminar hall", "Apex auditorium"
  if (normQ.includes('seminar hall') || normQ.includes('board room') || normQ.includes('auditorium')) {
    const hallQuery = normQ.includes('des') ? 'DES' : normQ.includes('esb') ? 'ESB' : normQ.includes('lhc') ? 'LHC' : normQ.includes('apex') ? 'Apex' : '';
    if (hallQuery) {
      const matches = MSRIT_ROOMS.filter((r) => r.roomNumber.toLowerCase().includes(hallQuery.toLowerCase()) && (r.type === 'Seminar Hall' || r.type === 'Board Room' || r.type === 'Auditorium'));
      if (matches.length > 0) {
        const lines = matches.map((m) => `• ${m.roomNumber} (${m.type}, ${m.building})`).join('\n');
        return {
          queryText: rawQuery,
          normalizedQuery: normQ,
          intents: ['ROOM_SEARCH'],
          responseText: `Verified Official Facilities in ${hallQuery.toUpperCase()}:\n\n${lines}`,
          subText: "Source: Official MSRIT Facilities page (https://www.msrit.edu/facilities/)",
          matchedRoomsList: matches
        };
      }
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
  const { rawQuery, matchedLibrary, studentGroup } = entities;

  // 1. Digital Library Queries
  if (intents.includes('DIGITAL_LIBRARY_QUERY') || normQ.includes('digital library') || normQ.includes('delnet') || normQ.includes('cmti') || normQ.includes('vtu')) {
    if (normQ.includes('password') || normQ.includes('login') || normQ.includes('credential') || normQ.includes('floor') || normQ.includes('room') || normQ.includes('how many books')) {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['DIGITAL_LIBRARY_QUERY'],
        responseText: "I don't have verified information for that detail.",
        subText: "Source Priority Rule: In accordance with MSRIT source accuracy rules, unverified details are not invented."
      };
    }

    if (normQ.includes('resource') || normQ.includes('journal') || normQ.includes('subscription') || normQ.includes('e-resource')) {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['DIGITAL_LIBRARY_QUERY'],
        responseText: "MSRIT Digital Library subscribes to online e-journals & resources from:\n• Elsevier ScienceDirect\n• IEEE\n• Taylor & Francis\n• SpringerLink",
        subText: `Source: ${DIGITAL_LIBRARY.source} • Subscribed Online E-Resources.`
      };
    }

    if (normQ.includes('delnet')) {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['DIGITAL_LIBRARY_QUERY'],
        responseText: "Yes, the official MSRIT information states that RIT is a member of DELNET (Developing Library Network).",
        subText: `Source: ${DIGITAL_LIBRARY.source} • Institutional Membership.`
      };
    }

    if (normQ.includes('vtu')) {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['DIGITAL_LIBRARY_QUERY'],
        responseText: "Yes, official MSRIT information verifies that MSRIT is an active member of VTU E-Library Consortium.",
        subText: `Source: ${DIGITAL_LIBRARY.source} • Institutional Membership.`
      };
    }

    if (normQ.includes('cmti')) {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['DIGITAL_LIBRARY_QUERY'],
        responseText: "Yes, official MSRIT information confirms that MSRIT has membership in CMTI (Central Manufacturing Technology Institute).",
        subText: `Source: ${DIGITAL_LIBRARY.source} • Institutional Membership.`
      };
    }

    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['DIGITAL_LIBRARY_QUERY'],
      responseText: "MSRIT has a Digital Library with access and subscriptions to online e-resources including Elsevier ScienceDirect, IEEE, Taylor & Francis, and SpringerLink, alongside memberships in DELNET, CMTI, and VTU E-Library.",
      subText: `Source: ${DIGITAL_LIBRARY.source}`
    };
  }

  // 2. Physical Library Existence / "Does MSRIT have a physical library?"
  if (normQ.includes('physical library') || (/\b(does\s*msrit\s*have\s*(a\s*)?library|is\s*there\s*(a\s*)?library\s*in\s*msrit)\b/.test(normQ) && !matchedLibrary)) {
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['LIBRARY_SEARCH'],
      responseText: "Yes. Campus Pulse features six official campus libraries:\n\n1. MSRIT Main Library (ESB Block - 4th Level)\n   • Primary: Civil, Mechanical, Chemical, Industrial & Biotechnology\n\n2. Unit II - Library (LHC Block - 2nd Level)\n   • Primary: CSE, ISE, ECE, EEE, AI & ML, Cybersecurity\n\n3. Unit III - Library (Apex Block - 5th Level)\n   • Exclusive for 1st Year UG courses\n\n4. MCA Library (Apex Block - 2nd Level)\n   • Master of Computer Applications & Software Systems\n\n5. Architecture Library (ADS Block - 3rd Level)\n   • Architecture, Urban Design & Spatial Folios\n\n6. MBA Library (ESB Block - 5th Level)\n   • Master of Business Administration & Management Studies",
      subText: "All six libraries are open 09:00–21:00 every day (Monday through Sunday)."
    };
  }

  // 2B. "Where to study?" / "Where can I study?" / "Which library should I go to?"
  if (normQ.includes('where to study') || normQ.includes('where can i study') || normQ.includes('study spot') || normQ.includes('quiet place') || normQ.includes('which library should i go to') || normQ.includes('which library should i use') || normQ.includes('best place to study')) {
    if (!studentGroup) {
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
        intents: ['LIBRARY_SEARCH', 'LIBRARY_USERS'],
        responseText: `Campus Pulse provides six dedicated libraries based on your branch and program:\n\n• 💻 CSE, ISE & Electronics → Unit II - Library (LHC-II 2nd Level)\n• 📐 1st Year Students → Unit III - Library (Apex 5th Level - Exclusive for 1st Year) or Main Library\n• 🏗️ Core Engineering (Civil/Mech/Chem/Biotech) → MSRIT Main Library (ESB-II 4th Level)\n• 📊 Management Students → MBA Library (ESB-II 5th Level)\n• 🖥️ MCA Students → MCA Library (Apex 2nd Level)\n• 🏛️ Architecture Students → Architecture Library (ADS 3rd Level)\n\nLeast Crowded Right Now: ${lowest.name} is currently at ${lowestDet.displayOccupancy} occupancy.`,
        subText: "All libraries open 09:00–21:00 every day (Monday through Sunday)."
      };
    }
  }

  // 3. Student Group Specific:
  // "which library is least crowded for CSE students?", "best library for CSE", "which library for first year?"
  if (studentGroup || normQ.includes('for cse') || normQ.includes('for electronics') || normQ.includes('first year') || normQ.includes('1st year') || normQ.includes('mca') || normQ.includes('mba') || normQ.includes('arch')) {
    // 3A. CSE / Electronics Query
    if (studentGroup === 'CSE' || studentGroup === 'Electronics' || normQ.includes('cse') || normQ.includes('electronics')) {
      const lhc = LIBRARIES.find((l) => l.id.includes('lhc')) || LIBRARIES[1];
      const lhcDet = getLibraryOccupancyDetails(lhc, simulatedTime);
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['LIBRARY_USERS', 'LIBRARY_OCCUPANCY'],
        responseText: `Unit II - Library (LHC-II 2nd Level) is currently at ${lhcDet.displayOccupancy} occupancy and is the primary library for CSE, ISE, and Electronics students.`,
        subText: `Location: LHC-II 2nd Level, LHC Block • Open 09:00–21:00 Daily.`,
        matchedLibrary: lhc
      };
    }

    // 3B. 1st Year Query ("which library is for first year?")
    if (studentGroup === '1st Year' || normQ.includes('first year') || normQ.includes('1st year')) {
      const apex = LIBRARIES.find((l) => l.id.includes('apex_unit')) || LIBRARIES[2];
      const esb = LIBRARIES.find((l) => l.id === 'esb_main_library') || LIBRARIES[0];
      const apexDet = getLibraryOccupancyDetails(apex, simulatedTime);
      const esbDet = getLibraryOccupancyDetails(esb, simulatedTime);

      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['LIBRARY_USERS', 'LIBRARY_OCCUPANCY'],
        responseText: `Unit III - Library (Apex Block 5th Level) is exclusive for 1st Year UG courses, currently at ${apexDet.displayOccupancy} occupancy.\n\nIn addition, MSRIT Main Library (ESB Block 4th Level, currently at ${esbDet.displayOccupancy}) also primarily serves 1st Year and upper-year students across core engineering disciplines.`,
        subText: "Unit III - Library: Exclusive for 1st Year • MSRIT Main Library: Core Engineering & 1st Year.",
        matchedLibrary: apex
      };
    }

    // 3C. Non-CSE / Core disciplines
    if (studentGroup === 'Civil/Mechanical/Chemical/Biotech' || normQ.includes('non-cse') || normQ.includes('civil') || normQ.includes('mechanical')) {
      const esb = LIBRARIES.find((l) => l.id === 'esb_main_library') || LIBRARIES[0];
      const esbDet = getLibraryOccupancyDetails(esb, simulatedTime);
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['LIBRARY_USERS', 'LIBRARY_OCCUPANCY'],
        responseText: `MSRIT Main Library (ESB Block 4th Level) is currently at ${esbDet.displayOccupancy} occupancy and is the primary library for Civil, Mechanical, Chemical, Industrial, and Biotechnology engineering students.`,
        subText: "ESB-II 4th Level • Open 09:00–21:00 Daily.",
        matchedLibrary: esb
      };
    }

    // 3D. MCA Query
    if (studentGroup === 'MCA' || normQ.includes('mca')) {
      const mca = LIBRARIES.find((l) => l.id === 'apex_mca_library') || LIBRARIES[3];
      const mcaDet = getLibraryOccupancyDetails(mca, simulatedTime);
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['LIBRARY_USERS', 'LIBRARY_OCCUPANCY'],
        responseText: `MCA Library (Apex Block 2nd Level) is currently at ${mcaDet.displayOccupancy} occupancy and is the dedicated library for Master of Computer Applications students.`,
        subText: "Apex Block 2nd Level • Open 09:00–21:00 Daily.",
        matchedLibrary: mca
      };
    }

    // 3E. MBA Query
    if (studentGroup === 'MBA' || normQ.includes('mba')) {
      const mba = LIBRARIES.find((l) => l.id === 'esb_mba_library') || LIBRARIES[5];
      const mbaDet = getLibraryOccupancyDetails(mba, simulatedTime);
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['LIBRARY_USERS', 'LIBRARY_OCCUPANCY'],
        responseText: `MBA Library (ESB-II 5th Level) is currently at ${mbaDet.displayOccupancy} occupancy and is the dedicated management library for MBA students and researchers.`,
        subText: "ESB-II 5th Level • Open 09:00–21:00 Daily.",
        matchedLibrary: mba
      };
    }

    // 3F. Architecture Query
    if (studentGroup === 'Architecture' || normQ.includes('arch')) {
      const arch = LIBRARIES.find((l) => l.id === 'arch_library') || LIBRARIES[4];
      const archDet = getLibraryOccupancyDetails(arch, simulatedTime);
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['LIBRARY_USERS', 'LIBRARY_OCCUPANCY'],
        responseText: `Architecture Library (ADS Block 3rd Level) is currently at ${archDet.displayOccupancy} occupancy and is dedicated to architecture, urban planning, and design studio students.`,
        subText: "ADS Block 3rd Level • Open 09:00–21:00 Daily.",
        matchedLibrary: arch
      };
    }
  }

  // 4. "which library is empty?", "which library is least crowded?", "lowest occupancy"
  if (normQ.includes('empty') || normQ.includes('least crowded') || normQ.includes('lowest occupancy') || normQ.includes('less crowded')) {
    const sorted = [...LIBRARIES].sort((a, b) => {
      const aDet = getLibraryOccupancyDetails(a, simulatedTime);
      const bDet = getLibraryOccupancyDetails(b, simulatedTime);
      return aDet.percentageEquivalent - bDet.percentageEquivalent;
    });

    const lowest = sorted[0];
    const lowestDet = getLibraryOccupancyDetails(lowest, simulatedTime);
    const isOpen = isLibraryOpen(simulatedTime);

    if (!isOpen) {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['LIBRARY_OCCUPANCY'],
        responseText: `All six campus libraries are currently CLOSED (Operating hours: 09:00–21:00 every day).\n\n• MSRIT Main Library: 0% (Closed)\n• Unit II - Library: 0% (Closed)\n• Unit III - Library: 0% (Closed)\n• MCA Library: 0% (Closed)\n• Architecture Library: 0% (Closed)\n• MBA Library: 0% (Closed)`,
        subText: "Libraries reopen at 09:00 AM.",
        matchedLibrary: lowest
      };
    }

    // Check for ties among the libraries
    const ties = sorted.filter((lib) => {
      const det = getLibraryOccupancyDetails(lib, simulatedTime);
      return det.percentageEquivalent === lowestDet.percentageEquivalent;
    });

    const lines = LIBRARIES.map((lib) => {
      const det = getLibraryOccupancyDetails(lib, simulatedTime);
      return `• ${lib.name} (${lib.building} Block): ${det.displayOccupancy}`;
    }).join('\n');

    let responseHeading = '';
    if (ties.length > 1) {
      const tiedNames = ties.map((t) => t.name).join(' and ');
      responseHeading = `There is currently a tie for least crowded: ${tiedNames} are both at ${lowestDet.displayOccupancy} occupancy.`;
    } else {
      responseHeading = `${lowest.name} is currently the least crowded library with an occupancy of ${lowestDet.displayOccupancy}.`;
    }

    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['LIBRARY_OCCUPANCY'],
      responseText: `${responseHeading}\n\nCurrent Library Occupancy across all 6 units:\n${lines}`,
      subText: "Estimated Live Occupancy (Dynamic campus telemetry).",
      matchedLibrary: lowest
    };
  }

  // 5. "show library occupancy", "what is library occupancy", "show me library occupancy"
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

  // 6. Library Operating Hours: "is LHC library open?", "is Apex library open?", "when does library open?"
  if (intents.includes('LIBRARY_HOURS') || (normQ.includes('library') && (normQ.includes('open') || normQ.includes('close') || normQ.includes('hours') || normQ.includes('timing')))) {
    const openNow = isLibraryOpen(simulatedTime);
    const target = matchedLibrary ? matchedLibrary.name : "All six campus libraries";
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['LIBRARY_HOURS'],
      responseText: `${target} are open 09:00–21:00 every day (Monday through Sunday).\n\nCurrent Status: ${openNow ? 'OPEN' : 'CLOSED'}.`,
      subText: "Operating hours: 09:00–21:00 Daily. Unaffected by faculty consultation half-days.",
      matchedLibrary
    };
  }

  // 7. Specific library inquiries (e.g. "Where is LHC library?", "What is ESB library occupancy?")
  if (matchedLibrary) {
    const lib = matchedLibrary;
    const det = getLibraryOccupancyDetails(lib, simulatedTime);

    // Multi-Intent: least crowded / occupancy + is it open?
    if ((normQ.includes('occupancy') || normQ.includes('crowded')) && (normQ.includes('open') || normQ.includes('status'))) {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['LIBRARY_OCCUPANCY', 'LIBRARY_HOURS'],
        responseText: `${lib.name} (${lib.building} Block)\nCurrent Occupancy: ${det.displayOccupancy}\nStatus: ${det.isOpen ? 'OPEN' : 'CLOSED'} (Hours: 09:00–21:00 Daily)`,
        subText: `Primary Users: ${lib.primaryGroups.join(', ')} • ${det.subNotice}`,
        matchedLibrary: lib
      };
    }

    // Single-Intent: Occupancy (e.g. "What is ESB library occupancy?")
    if (normQ.includes('occupancy') || normQ.includes('crowded') || normQ.includes('rush') || normQ.includes('busy')) {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['LIBRARY_OCCUPANCY'],
        responseText: `${lib.name} is currently at ${det.displayOccupancy} occupancy (${det.statusLabel}).`,
        subText: `Building: ${lib.building} Block (${lib.floor}) • Primary Users: ${lib.primaryGroups.join(', ')}`,
        matchedLibrary: lib
      };
    }

    // Single-Intent: Location / Where is... (e.g. "Where is LHC library?")
    if (normQ.includes('where') || normQ.includes('location') || normQ.includes('floor')) {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['LIBRARY_LOCATION'],
        responseText: `${lib.name} is located on the ${lib.floor}.`,
        subText: `Primary Users: ${lib.primaryGroups.join(', ')} • Current Occupancy: ${det.displayOccupancy}`,
        matchedLibrary: lib
      };
    }

    // Default Library Profile
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['LIBRARY_SEARCH'],
      responseText: `${lib.name}\nLocation: ${lib.floor}\nPrimary Users: ${lib.primaryGroups.join(', ')}\nCurrent Occupancy: ${det.displayOccupancy}\nStatus: ${det.isOpen ? 'OPEN' : 'CLOSED'} (09:00–21:00 Daily)`,
      subText: "Opening hours: 09:00–21:00 Every Day (Monday through Sunday).",
      matchedLibrary: lib
    };
  }

  // 8. General Library list / "which library..."
  if (normQ.includes('libraries') || normQ.includes('which library')) {
    const list = LIBRARIES.map((l) => {
      const d = getLibraryOccupancyDetails(l, simulatedTime);
      return `• ${l.name} (${l.floor}) — ${d.displayOccupancy} [Primary Users: ${l.primaryGroups.join(', ')}]`;
    }).join('\n');

    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['LIBRARY_SEARCH'],
      responseText: `Campus Pulse features three campus libraries:\n\n${list}`,
      subText: "Digital Library: MSRIT Digital Library [Official MSRIT Info]."
    };
  }

  return null;
}

// ----------------------------------------------------------------------------
// 7. Module: Building & Map Query Handler
// ----------------------------------------------------------------------------

export function getBuildingAnswer(
  entities: ExtractedEntities,
  _intents: CampusAiIntent[],
  normQ: string
): CampusAiResult | null {
  const { rawQuery, matchedBlock, matchedNode, matchedLocation } = entities;

  // 1. Department Location (e.g. "where is the CSE department?", "where is CSE AIML located?")
  if (entities.matchedDepartment || /\b(cse|ise|ece|aiml|crd|civil|mechanical|biotech|industrial)\b/.test(normQ)) {
    const dept = entities.matchedDepartment;
    const code = (dept?.code || (
      normQ.includes('aiml') ? 'AI-ML' :
      normQ.includes('cse') ? 'CSE' :
      normQ.includes('ise') ? 'ISE' :
      normQ.includes('ece') ? 'ECE' : ''
    )).toUpperCase();

    if (code === 'AI-ML' || code === 'CY' || normQ.includes('crd')) {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['DEPARTMENT_LOCATION'],
        responseText: "Department of Artificial Intelligence & Machine Learning (CSE AIML) and Cyber Security (CSE CY) are located in CRD Block.",
        subText: "Note: CRD Block is an official academic department mapping. Coordinates are non-geographic reference."
      };
    }

    if (code === 'CSE' || code === 'ISE' || code === 'ECE') {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['DEPARTMENT_LOCATION'],
        responseText: `Department of ${dept ? dept.name : code} is located in LHC Block.\n${dept?.hod ? `HOD: ${dept.hod}` : ''}`,
        subText: "LHC Block has verified geographic polygon coordinates on Google Maps Satellite.",
        matchedDepartment: dept
      };
    }
  }

  // 2. Verified Campus Blocks (LHC, DES, APEX, MULTIPURPOSE BLOCK, ESB, QUADRANGLE, ARCHITECTURE BLOCK, WORKSHOP BLOCK)
  if (matchedBlock) {
    const b = matchedBlock;
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['BUILDING_LOCATION'],
      responseText: `${b.displayName} is located in the ${b.name} building on campus.`,
      subText: `${b.description} Verified 4-corner coordinates on Google Maps Satellite base.`,
      matchedBlock: b
    };
  }

  // 3. MSRIT Locations or Campus Nodes
  if (matchedNode) {
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['BUILDING_LOCATION'],
      responseText: `${matchedNode.name} is located at ${matchedNode.building} (${matchedNode.floor}).`,
      subText: `${matchedNode.description} Grounded in verified campus registry.`,
      matchedNode
    };
  }

  if (matchedLocation) {
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['BUILDING_LOCATION'],
      responseText: `${matchedLocation.name} is located in ${matchedLocation.building} (${matchedLocation.floor}).`,
      subText: `${matchedLocation.description} Grounded in official MSRIT website portal.`,
      matchedLocation
    };
  }

  return null;
}

// ----------------------------------------------------------------------------
// 8. Module: Department & HOD Query Handler
// ----------------------------------------------------------------------------

export function getDepartmentAnswer(
  entities: ExtractedEntities,
  normQ: string
): CampusAiResult | null {
  const { rawQuery, matchedDepartment } = entities;
  const isHodQuery = normQ.includes('hod') || normQ.includes('head');

  if (matchedDepartment && isHodQuery) {
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['FACULTY_HOD'],
      responseText: `The Head of Department (HOD) of ${matchedDepartment.name} (${matchedDepartment.code}) is ${matchedDepartment.hod}.\nBuilding: ${matchedDepartment.building}`,
      subText: `Source: Official MSRIT Department Directory (${matchedDepartment.sourceUrl})`,
      matchedDepartment
    };
  }

  if (matchedDepartment) {
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['DEPARTMENT_LOCATION'],
      responseText: `The Department of ${matchedDepartment.name} (${matchedDepartment.code}) is located in ${matchedDepartment.building}.\nHOD: ${matchedDepartment.hod}`,
      subText: `Source: Official MSRIT Department Directory (${matchedDepartment.sourceUrl})`,
      matchedDepartment
    };
  }

  return null;
}

// ----------------------------------------------------------------------------
// 9. Module: Lost & Found Query Handler
// ----------------------------------------------------------------------------

export function getLostFoundAnswer(
  entities: ExtractedEntities,
  normQ: string
): CampusAiResult | null {
  const { rawQuery } = entities;
  const isLf = normQ.includes('lost') || normQ.includes('found');
  if (!isLf) return null;

  const itemKeywords = [
    { key: 'calculator', name: 'Scientific Calculator' },
    { key: 'airpods', name: 'AirPods' },
    { key: 'bottle', name: 'Black Water Bottle' },
    { key: 'wallet', name: 'Leather Wallet' },
    { key: 'watch', name: 'Wrist Watch' },
    { key: 'umbrella', name: 'Compact Umbrella' },
    { key: 'spectacles', name: 'Reading Spectacles' }
  ];

  for (const { key } of itemKeywords) {
    if (normQ.includes(key)) {
      const item = SAMPLE_LOST_FOUND_ITEMS.find((i) => i.itemName.toLowerCase().includes(key));
      if (item) {
        return {
          queryText: rawQuery,
          normalizedQuery: normQ,
          intents: ['LOST_FOUND_QUERY'],
          responseText: `${item.itemName} [${item.statusLabel || item.type.toUpperCase()}]\nLocation: ${item.location}\nDate: ${item.date}\nDescription: ${item.description}\nClaim / Deposit Location: ${item.contactLocation} [DEMO / SAMPLE DATA]`,
          subText: "Community Lost & Found Telemetry • Sample demo data for interactive testing.",
          matchedLostItem: item
        };
      }
    }
  }

  if (normQ.includes('found')) {
    const foundItems = SAMPLE_LOST_FOUND_ITEMS.filter((i) => i.type === 'found');
    const list = foundItems.map((i) => `• ${i.itemName} (Found at ${i.location}, claim at ${i.contactLocation})`).join('\n');
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['LOST_FOUND_QUERY'],
      responseText: `Found Items Recorded on Campus (${foundItems.length}) [DEMO DATA]:\n\n${list}`,
      subText: "Notice: Sample demo records for interactive testing."
    };
  }

  const lostItems = SAMPLE_LOST_FOUND_ITEMS.filter((i) => i.type === 'lost');
  const list = lostItems.map((i) => `• ${i.itemName} (Misplaced at ${i.location}, report to ${i.contactLocation})`).join('\n');
  return {
    queryText: rawQuery,
    normalizedQuery: normQ,
    intents: ['LOST_FOUND_QUERY'],
    responseText: `Lost Items Reported on Campus (${lostItems.length}) [DEMO DATA]:\n\n${list}`,
    subText: "Notice: Sample demo records for interactive testing."
  };
}

// ----------------------------------------------------------------------------
// 10. Module: Issue Reports Query Handler
// ----------------------------------------------------------------------------

export function getIssueAnswer(
  entities: ExtractedEntities,
  normQ: string
): CampusAiResult | null {
  const { rawQuery } = entities;
  const isIssue = normQ.includes('issue') || normQ.includes('complaint') || normQ.includes('reported by') || normQ.includes('unresolved');
  if (!isIssue) return null;

  const reporter = [
    'udbhav verma',
    'ravnish sekhar',
    'shivam kr chaudhary',
    'varad adavakar',
    'sagnik'
  ].find((name) => normQ.includes(name) || (name.includes('udbhav') && normQ.includes('udbhav')) || (name.includes('ravnish') && normQ.includes('ravnish')) || (name.includes('shivam') && normQ.includes('shivam')) || (name.includes('varad') && normQ.includes('varad')) || (name.includes('sagnik') && normQ.includes('sagnik')));

  if (reporter) {
    const issues = queryIssuesByReporter(reporter);
    if (issues.length === 0) {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['ISSUE_REPORT_QUERY'],
        responseText: `No issues are currently logged under ${reporter.toUpperCase()}.`,
        subText: "Reported By Students Protocol • Campus Pulse Issue Tracking."
      };
    }
    const lines = issues.map((i) => `• ${i.title} (${i.category})\n  Location: ${i.location}\n  Priority: ${i.priority} | Status: ${i.status}${i.isDemo ? ' [DEMO DATA]' : ''}`).join('\n\n');
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['ISSUE_REPORT_QUERY'],
      responseText: `Issues reported by ${issues[0].reportedBy} (${issues.length}):\n\n${lines}`,
      subText: "Reported By Students Protocol • Campus Pulse Issue Tracking.",
      matchedIssues: issues
    };
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
    const lines = issues.map((i) => `• ${i.title} (${i.category})\n  Location: ${i.location}\n  Priority: ${i.priority} | Status: ${i.status}\n  Reported by: ${i.reportedBy}${i.isDemo ? ' [DEMO DATA]' : ''}`).join('\n\n');
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['ISSUE_REPORT_QUERY'],
      responseText: `Reported issues in ${locBlock.toUpperCase()} Block (${issues.length}):\n\n${lines}`,
      subText: `Location Filter: ${locBlock.toUpperCase()} • Campus Pulse Community Issue Dispatch.`,
      matchedIssues: issues
    };
  }

  if (normQ.includes('unresolved') || normQ.includes('pending') || normQ.includes('open issues')) {
    const issues = queryUnresolvedIssues();
    if (issues.length === 0) {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['ISSUE_REPORT_QUERY'],
        responseText: "All reported campus issues have been resolved.",
        subText: "Statuses: Reported, Under Review, In Progress."
      };
    }
    const lines = issues.map((i) => `• ${i.title} [${i.status}]\n  Category: ${i.category} | Location: ${i.location}\n  Priority: ${i.priority} | Reported by: ${i.reportedBy}${i.isDemo ? ' [DEMO DATA]' : ''}`).join('\n\n');
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['ISSUE_REPORT_QUERY'],
      responseText: `Unresolved Campus Issues (${issues.length}):\n\n${lines}`,
      subText: "Statuses: Reported, Under Review, In Progress.",
      matchedIssues: issues
    };
  }

  if (normQ.includes('resolved')) {
    const issues = queryResolvedIssues();
    if (issues.length === 0) {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['ISSUE_REPORT_QUERY'],
        responseText: "No issues are currently marked as resolved.",
        subText: "Status: Resolved."
      };
    }
    const lines = issues.map((i) => `• ${i.title} (${i.category})\n  Location: ${i.location}\n  Reported by: ${i.reportedBy}${i.isDemo ? ' [DEMO DATA]' : ''}`).join('\n\n');
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['ISSUE_REPORT_QUERY'],
      responseText: `Resolved Campus Issues (${issues.length}):\n\n${lines}`,
      subText: "Status: Resolved.",
      matchedIssues: issues
    };
  }

  if (normQ.includes('high priority') || normQ.includes('urgent') || normQ.includes('critical')) {
    const issues = queryHighPriorityIssues();
    if (issues.length === 0) {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['ISSUE_REPORT_QUERY'],
        responseText: "There are currently no high-priority issues reported on campus.",
        subText: "Priority Filter: High • Sourced from active campus issue reports."
      };
    }
    const lines = issues.map((i) => `• ${i.title} (${i.category})\n  Location: ${i.location} | Status: ${i.status}\n  Reported by: ${i.reportedBy}${i.isDemo ? ' [DEMO DATA]' : ''}`).join('\n\n');
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['ISSUE_REPORT_QUERY'],
      responseText: `High Priority Issues (${issues.length}):\n\n${lines}`,
      subText: "Priority Filter: High • Sourced from active campus issue reports.",
      matchedIssues: issues
    };
  }

  const catMatch = [
    'infrastructure',
    'cleanliness',
    'electricity',
    'water',
    'wi-fi',
    'wifi',
    'classroom',
    'laboratory',
    'security'
  ].find((c) => normQ.includes(c));

  if (catMatch) {
    const issues = queryIssuesByCategory(catMatch);
    if (issues.length === 0) {
      return {
        queryText: rawQuery,
        normalizedQuery: normQ,
        intents: ['ISSUE_REPORT_QUERY'],
        responseText: `No ${catMatch.toUpperCase()} issues are currently reported on campus.`,
        subText: `Category: ${catMatch.toUpperCase()} • Campus Pulse Issue Reports.`
      };
    }
    const lines = issues.map((i) => `• ${i.title}\n  Location: ${i.location} | Priority: ${i.priority} | Status: ${i.status}\n  Reported by: ${i.reportedBy}${i.isDemo ? ' [DEMO DATA]' : ''}`).join('\n\n');
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['ISSUE_REPORT_QUERY'],
      responseText: `Reported ${catMatch.toUpperCase()} Issues (${issues.length}):\n\n${lines}`,
      subText: `Category: ${catMatch.toUpperCase()} • Campus Pulse Issue Reports.`
      };
  }

  const allIssues = queryAllIssues();
  if (allIssues.length === 0) {
    return {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['ISSUE_REPORT_QUERY'],
      responseText: "No issues are currently reported on campus.",
      subText: "Source: Central Campus Pulse issue-report database • Reported By Students."
    };
  }
  const lines = allIssues.map((i) => `• ${i.title} (${i.category})\n  Location: ${i.location} | Priority: ${i.priority} | Status: ${i.status}\n  Reported by: ${i.reportedBy}${i.isDemo ? ' [DEMO DATA]' : ''}`).join('\n\n');
  return {
    queryText: rawQuery,
    normalizedQuery: normQ,
    intents: ['ISSUE_REPORT_QUERY'],
    responseText: `Reported Campus Issues (${allIssues.length}):\n\n${lines}`,
    subText: "Source: Central Campus Pulse issue-report database • Reported By Students.",
    matchedIssues: allIssues
  };
}

// ----------------------------------------------------------------------------
// 11. Context Maintenance & Memory
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
// 12. Central Dispatch Pipeline: processCampusAiQuery
// ----------------------------------------------------------------------------

export function processCampusAiQuery(
  rawQuery: string,
  simulatedTime?: SimulatedTimeState | null,
  context?: CampusAiContext
): CampusAiResult {
  if (!rawQuery || !rawQuery.trim()) {
    return {
      queryText: rawQuery,
      normalizedQuery: '',
      intents: ['UNKNOWN_QUERY'],
      responseText: "Please enter a question to ask Campus Pulse AI.",
      subText: "You can ask about faculty members, departments, classrooms, libraries, campus blocks, lost items, or issues."
    };
  }

  // Step 1: Normalize Query
  const normQ = normalizeQuery(rawQuery);

  // Step 2: Detect Intents
  const intents = detectIntents(normQ);

  // Step 3: Extract Entities
  const entities = extractEntities(normQ, rawQuery, intents, context);

  // Step 4: Search Relevant Data & Generate Grounded Response

  // 4A. Campus Hours
  if (intents.includes('CAMPUS_HOURS')) {
    const campusOpen = isCampusOpen(simulatedTime);
    const res: CampusAiResult = {
      queryText: rawQuery,
      normalizedQuery: normQ,
      intents: ['CAMPUS_HOURS'],
      responseText: `Campus & Faculty Working Hours:\n• Monday–Friday: 09:00–17:00\n• Saturday: 09:00–13:30 (Half Day)\n• Sunday: CLOSED ALL DAY\n\nCurrent Campus Status: ${campusOpen ? 'OPEN' : 'CLOSED'}.`,
      subText: "Libraries operate on independent daily hours (09:00–21:00 every day)."
    };
    return maintainConversationContext(res, rawQuery, context);
  }

  // 4B. Faculty Handler (Includes faculty class schedules and lecture room resolution)
  const facultyAns = getFacultyAnswer(entities, intents, simulatedTime);
  if (facultyAns) {
    return maintainConversationContext(facultyAns, rawQuery, context);
  }

  // 4C. Room & Classroom Handler
  const roomAns = getRoomAnswer(entities, intents, normQ, rawQuery);
  if (roomAns) {
    return maintainConversationContext(roomAns, rawQuery, context);
  }

  // 4D. Department & HOD Handler
  const deptAns = getDepartmentAnswer(entities, normQ);
  if (deptAns && (intents.includes('FACULTY_HOD') || intents.includes('DEPARTMENT_LOCATION'))) {
    return maintainConversationContext(deptAns, rawQuery, context);
  }

  // 4E. Library & Occupancy Handler
  const libAns = getLibraryAnswer(entities, intents, normQ, simulatedTime);
  if (libAns) {
    return maintainConversationContext(libAns, rawQuery, context);
  }

  // 4F. Building & Location Handler
  const bldgAns = getBuildingAnswer(entities, intents, normQ);
  if (bldgAns) {
    return maintainConversationContext(bldgAns, rawQuery, context);
  }

  // 4G. Issue Reports Handler
  const issueAns = getIssueAnswer(entities, normQ);
  if (issueAns) {
    return maintainConversationContext(issueAns, rawQuery, context);
  }

  // 4H. Lost & Found Handler
  const lfAns = getLostFoundAnswer(entities, normQ);
  if (lfAns) {
    return maintainConversationContext(lfAns, rawQuery, context);
  }

  // 4I. Fallback: Strict No-Hallucination Unknown Response
  const fallbackRes: CampusAiResult = {
    queryText: rawQuery,
    normalizedQuery: normQ,
    intents: ['UNKNOWN_QUERY'],
    responseText: "I don't have that information in the current Campus Pulse data.",
    subText: "You can ask about MSRIT classrooms (e.g. AB-401, LHC204, ARCH307), faculty, departments, libraries, blocks, reported issues, or lost items."
  };

  return maintainConversationContext(fallbackRes, rawQuery, context);
}
