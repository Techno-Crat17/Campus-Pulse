import msritRoomsRaw from './msrit_rooms.json';

export interface MSRITRoomRecord {
  roomNumber: string;
  roomNumberNormalized?: string;
  name?: string;
  normalizedName?: string;
  building: string;
  buildingCode?: string;
  floor: string;
  department?: string | null;
  departments?: string[];
  type: 'Classroom' | 'Lab' | 'Seminar Hall' | 'Board Room' | 'Auditorium' | 'Office' | 'Library' | 'Lounge' | 'Other' | string;
  category?: string;
  description?: string;
  libraryReference?: string;
  nodeId?: string;
  coordinates?: { lat: number; lng: number };
  status?: string;
  sourceUrl?: string;
  sourceTitle?: string;
  sourceYear?: number;
  verified?: boolean;
  temporalStatus?: 'current' | 'historical';
}

export interface MSRITRoomDatabase {
  lastVerified: string;
  source: string;
  rooms: MSRITRoomRecord[];
}

export const MSRIT_ROOMS_DB: MSRITRoomDatabase = msritRoomsRaw as MSRITRoomDatabase;
export const MSRIT_ROOMS: MSRITRoomRecord[] = MSRIT_ROOMS_DB.rooms;

export interface RoomStatistics {
  totalRooms: number;
  totalVerifiedClassrooms: number;
  totalVerifiedLabs: number;
  totalVerifiedSeminarHalls: number;
  totalVerifiedBoardRooms: number;
  totalVerifiedAuditoriums: number;
  totalHistoricalRooms: number;
}

export function getRoomStats(): RoomStatistics {
  const rooms = MSRIT_ROOMS;
  return {
    totalRooms: rooms.length,
    totalVerifiedClassrooms: rooms.filter((r) => r.type === 'Classroom' && r.temporalStatus === 'current').length,
    totalVerifiedLabs: rooms.filter((r) => r.type === 'Lab').length,
    totalVerifiedSeminarHalls: rooms.filter((r) => r.type === 'Seminar Hall').length,
    totalVerifiedBoardRooms: rooms.filter((r) => r.type === 'Board Room').length,
    totalVerifiedAuditoriums: rooms.filter((r) => r.type === 'Auditorium').length,
    totalHistoricalRooms: rooms.filter((r) => r.temporalStatus === 'historical').length
  };
}

/**
 * Normalizes query string to match uniform room formats:
 * - "LHC 101", "LHC-101", "LHC101" -> "LHC-101"
 * - "CRD 508", "CRD-508", "CRD508" -> "CRD-508"
 * - "AB 401", "AB401", "AB-401" -> "AB-401"
 * - "ESB 419A", "ESB419A", "ESB-419A" -> "ESB-419A"
 * - "ARCH 307", "ARCH-307", "ARCH307" -> "ARCH-307"
 */
/**
 * Normalizes query string to match uniform room formats:
 * - "LHC 101", "LHC-101", "LHC101" -> "LHC-101"
 * - "CRD 508", "CRD-508", "CRD508" -> "CRD-508"
 * - "AB 401", "AB401", "AB-401" -> "AB-401"
 * - "AB 804/A", "AB-804/A" -> "AB-804/A"
 * - "DES 101/102", "DES-101/102", "DES-402" -> "DES-101/102", "DES-402"
 * - "ESB 419A", "ESB419A", "ESB-419A" -> "ESB-419A"
 * - "ARCH 307", "ARCH-307", "ARCH307" -> "ARCH-307"
 */
export function normalizeRoomNumber(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  const s = raw.toUpperCase().trim();

  // Pattern: DES-XXX (including combinations like DES-101/102, DES-501/502B, DES-413/405/411/511, etc.)
  const desMatch = s.match(/\bDES[- ]?([0-9A-Z/]+)\b/i);
  if (desMatch) {
    return `DES-${desMatch[1].toUpperCase()}`;
  }

  // Pattern: LHC-XXX
  const lhcMatch = s.match(/\bLHC[- ]?([0-9A-Z/]+)\b/i);
  if (lhcMatch) {
    return `LHC-${lhcMatch[1].toUpperCase()}`;
  }

  // Pattern: CRD-XXX
  const crdMatch = s.match(/\bCRD[- ]?([0-9A-Z/]+)\b/i);
  if (crdMatch) {
    return `CRD-${crdMatch[1].toUpperCase()}`;
  }

  // Pattern: AB-XXX (including AB-804/A, AB-210, etc.)
  const abMatch = s.match(/\bAB[- ]?([0-9A-Z/]+)\b/i);
  if (abMatch) {
    return `AB-${abMatch[1].toUpperCase()}`;
  }

  // Pattern: ESB-XXX
  const esbMatch = s.match(/\bESB[- ]?([0-9A-Z/]+)\b/i);
  if (esbMatch) {
    return `ESB-${esbMatch[1].toUpperCase()}`;
  }

  // Pattern: ARCH-XXX
  const archMatch = s.match(/\bARCH[- ]?([0-9A-Z/]+)\b/i);
  if (archMatch) {
    return `ARCH-${archMatch[1].toUpperCase()}`;
  }

  // Pattern: Room-XXX
  const roomMatch = s.match(/\bROOM[- ]?([0-9A-Z/]+)\b/i);
  if (roomMatch) {
    return `Room-${roomMatch[1].toUpperCase()}`;
  }

  // Bare room numbers like "508" or "101"
  const bareMatch = s.match(/^\d{3}[A-Z]?$/);
  if (bareMatch) {
    return s;
  }

  return s;
}

/**
 * Compact clean representation of room number:
 * strips hyphens, spaces, slashes, and special characters.
 */
export function stripRoomNumber(raw: string): string {
  return (raw || '').toUpperCase().replace(/[\s\-_/]+/g, '');
}

/**
 * Looks up room by exact, normalized, or sub-part room number
 */
export function findRoomByNumber(query: string): MSRITRoomRecord | undefined {
  if (!query) return undefined;
  const qClean = query.toUpperCase().trim();
  const normKey = normalizeRoomNumber(query);
  const strippedKey = stripRoomNumber(query);

  // 1. Direct match
  const directMatch = MSRIT_ROOMS.find((r) => {
    const rNum = r.roomNumber;
    const rStripped = stripRoomNumber(rNum);
    const rNorm = stripRoomNumber(r.roomNumberNormalized || rNum);
    return (
      rNum.toLowerCase() === query.toLowerCase() ||
      rNum.toLowerCase() === normKey.toLowerCase() ||
      rStripped === strippedKey ||
      rNorm === strippedKey
    );
  });
  if (directMatch) return directMatch;

  // 2. Sub-number match for combined rooms (e.g. "DES-101" or "101" matches "DES-101/102", "AB-804" matches "AB-804/A")
  return MSRIT_ROOMS.find((r) => {
    const rNum = r.roomNumber;
    if (rNum.includes('/')) {
      const parts = rNum.split('/');
      const prefix = rNum.split('-')[0]; // "DES" or "AB"
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim();
        const fullPart = part.includes('-') ? part : `${prefix}-${part}`;
        if (
          part.toLowerCase() === qClean.toLowerCase() ||
          fullPart.toLowerCase() === qClean.toLowerCase() ||
          stripRoomNumber(part) === strippedKey ||
          stripRoomNumber(fullPart) === strippedKey
        ) {
          return true;
        }
      }
    }
    return false;
  });
}

/**
 * Normalizes a room name for robust search matching:
 * - Roman numerals (I, II, III, IV, V) <-> Arabic numerals (1, 2, 3, 4, 5)
 * - Em/En dashes, hyphens, and punctuation converted to spaces
 * - & <-> and
 */
export function normalizeRoomNameForSearch(name: string): string {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .replace(/[’‘`'"]/g, '')
    .replace(/[–—_–-]/g, ' ')
    .replace(/\b(ii|2)\b/gi, '2')
    .replace(/\b(i|1)\b/gi, '1')
    .replace(/\b(iii|3)\b/gi, '3')
    .replace(/\b(iv|4)\b/gi, '4')
    .replace(/\b(v|5)\b/gi, '5')
    .replace(/\b(vi|6)\b/gi, '6')
    .replace(/&/g, 'and')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Looks up room by its descriptive name or title
 */
export function findRoomsByName(query: string): MSRITRoomRecord[] {
  if (!query || typeof query !== 'string') return [];
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];

  const qSearch = normalizeRoomNameForSearch(q);

  const BUILDING_NAMES = new Set([
    'lhc', 'crd', 'multipurpose', 'apex', 'esb', 'des', 'arch', 'architecture', 'workshop', 'quadrangle',
    'lhc block', 'crd block', 'apex block', 'esb block', 'des block', 'arch block', 'multipurpose block'
  ]);
  const GENERIC_CATEGORY_NAMES = new Set([
    'faculty room', 'faculty rooms', 'faculty lounge', 'faculty lounges', 'staff room', 'teachers room',
    'seminar hall', 'seminar halls', 'seminar room', 'seminar rooms', 'lab', 'labs', 'laboratory', 'laboratories',
    'computer lab', 'computer labs', 'classroom', 'classrooms', 'office', 'offices'
  ]);

  // Special alias mappings for verified campus room entities
  if (/\b(apex\s*library|apex\s*block\s*library|apex\s*first\s*year\s*library|first\s*year\s*library|1st\s*year\s*library|apex\s*1st\s*year\s*library|apex\s*first\s*year\s*lib|apex\s*library\s*&\s*information\s*center|library\s*&\s*information\s*center\s*\(first\s*year\))\b/i.test(q)) {
    const ab714 = findRoomByNumber('AB-714');
    if (ab714) return [ab714];
  }

  if (/\b(mca\s*library|mca\s*department\s*library|mca\s*dept\s*library|dept\s*of\s*mca\s*library)\b/i.test(q)) {
    const ab401 = findRoomByNumber('AB-401');
    if (ab401) return [ab401];
  }

  if (/\b(lhc\s*unit\s*2\s*library|lhc\s*unit\s*ii\s*library|lhc\s*library|unit\s*2\s*library|unit\s*ii\s*library|lhc-306\s*library|library\s*&\s*information\s*center\s*unit\s*[-–]\s*ii)\b/i.test(q)) {
    const lhc306 = findRoomByNumber('LHC-306');
    if (lhc306) return [lhc306];
  }

  if (BUILDING_NAMES.has(qSearch) || BUILDING_NAMES.has(q) || GENERIC_CATEGORY_NAMES.has(qSearch) || GENERIC_CATEGORY_NAMES.has(q)) {
    return [];
  }

  // 1. Exact or substring match on normalized name or room number
  const exactMatches = MSRIT_ROOMS.filter((r) => {
    const name = r.name || '';
    const num = r.roomNumber || '';
    const desc = r.description || '';
    const cat = r.category || '';

    const nameSearch = normalizeRoomNameForSearch(name);
    const numSearch = normalizeRoomNameForSearch(num);

    if (nameSearch && (nameSearch === qSearch || nameSearch.includes(qSearch) || (qSearch.length >= 4 && qSearch.includes(nameSearch)))) {
      return true;
    }
    if (numSearch && (numSearch === qSearch || (/\d/.test(qSearch) && numSearch.includes(qSearch)))) {
      return true;
    }
    if (desc && desc.toLowerCase().includes(q) && !BUILDING_NAMES.has(q)) return true;
    if (cat && cat.length >= 4 && cat.toLowerCase().includes(q)) return true;
    return false;
  });

  if (exactMatches.length > 0) return exactMatches;

  // 2. Token overlap search (for queries like "seminar hall 2 lhc" or "lhc 2 seminar hall")
  const stopWords = new Set(['where', 'is', 'kaha', 'kahan', 'kidhar', 'what', 'the', 'ka', 'ke', 'ki', 'in', 'at', 'on', 'room', 'block', 'building']);
  const tokens = qSearch.split(' ').filter((t) => t.length >= 2 && !stopWords.has(t));
  if (tokens.length >= 2) {
    const scored = MSRIT_ROOMS.map((r) => {
      const nameSearch = normalizeRoomNameForSearch(r.name || '');
      const numSearch = normalizeRoomNameForSearch(r.roomNumber || '');
      const bldgSearch = (r.building || '').toLowerCase();
      const combined = `${numSearch} ${nameSearch} ${bldgSearch}`;
      const count = tokens.filter((t) => combined.includes(t)).length;
      return { room: r, count };
    }).filter((item) => item.count >= Math.min(tokens.length, 2));

    scored.sort((a, b) => b.count - a.count);
    if (scored.length > 0) {
      return scored.map((s) => s.room);
    }
  }

  return [];
}

/**
 * Filter rooms by building (e.g. LHC, CRD, APEX, ESB, DES, ARCH)
 */
export function getRoomsByBuilding(buildingQuery: string): MSRITRoomRecord[] {
  if (!buildingQuery) return [];
  const b = buildingQuery.toLowerCase().trim();

  return MSRIT_ROOMS.filter((r) => {
    if (!r.building) return false;
    const rb = r.building.toLowerCase();
    const bCode = (r.buildingCode || '').toLowerCase();

    if (b === 'lhc' || b.includes('lecture hall complex')) {
      return rb.includes('lhc') || bCode === 'lhc' || rb.includes('lecture hall complex');
    }
    if (b === 'crd' || b.includes('multipurpose')) {
      return rb.includes('crd') || bCode === 'crd' || rb.includes('multipurpose');
    }
    if (b === 'apex') {
      return rb.includes('apex') || bCode === 'apex';
    }
    if (b === 'esb') {
      return rb.includes('esb') || bCode === 'esb';
    }
    if (b === 'des') {
      return rb.includes('des') || bCode === 'des';
    }
    if (b === 'arch' || b.includes('architecture')) {
      return rb.includes('arch') || bCode === 'arch' || rb.includes('architecture');
    }
    if (b === 'workshop') {
      return rb.includes('workshop') || bCode === 'workshop';
    }

    return rb.includes(b) || b.includes(rb) || bCode.includes(b);
  });
}

/**
 * Filter rooms by floor for a building
 */
export function getRoomsByFloor(buildingQuery: string, floorQuery: string): MSRITRoomRecord[] {
  const buildingRooms = getRoomsByBuilding(buildingQuery);
  const f = floorQuery.toLowerCase().trim();

  return buildingRooms.filter((r) => {
    const rf = (r.floor || '').toLowerCase();
    return rf.includes(f) || f.includes(rf);
  });
}

/**
 * Normalizes a department input string to a canonical department code
 */
export function normalizeDepartmentCode(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const s = input.trim().toLowerCase();

  // 1. CSE-AIML (Explicitly check CSE with AIML / AI&ML first so it is never confused with pure AI & ML)
  if (
    /\b(cse[- ]?aiml|cse\s*\(?aiml\)?|cse[- ]?ai[- ]?ml|cse\s*\(?ai\s*&?\s*ml\)?|cse\s*ai\s*ml|cse\s*ai\s*&\s*ml|cse\s*artificial\s*intelligence)\b/i.test(s) ||
    (/\bcse\b/i.test(s) && /\b(aiml|ai\s*&?\s*ml|ai\s*and\s*ml)\b/i.test(s))
  ) {
    return 'CSE-AIML';
  }

  // 2. Pure AI & ML (Apex Block department, strictly non-CSE)
  if (
    /\b(aiml|ai\s*&\s*ml|ai[- ]ml|ai\s*and\s*ml|ai\s*ml|artificial\s*intelligence\s*&\s*machine\s*learning|artificial\s*intelligence\s*and\s*machine\s*learning|ai\s*machine\s*learning)\b/i.test(s)
  ) {
    return 'AI & ML';
  }

  // 3. AI & DS (Apex Block department)
  if (
    /\b(ai\s*&\s*ds|ai[- ]ds|aids|ai\s*and\s*ds|ai\s*ds|artificial\s*intelligence\s*&\s*data\s*science|artificial\s*intelligence\s*and\s*data\s*science)\b/i.test(s)
  ) {
    return 'AI & DS';
  }

  // 4. CSE-CY (Cyber Security)
  if (
    /\b(cse[- ]?cy|cse\s*\(?cy\)?|cse\s*\(?cyber\s*security\)?|cyber\s*security|cybersecurity|cyber|cy)\b/i.test(s) ||
    (/\bcse\b/i.test(s) && /\b(cy|cyber)\b/i.test(s))
  ) {
    return 'CSE-CY';
  }

  // 5. Basic Sciences & Humanities (Apex Block)
  if (/\b(physics|phy)\b/i.test(s)) {
    return 'Physics';
  }
  if (/\b(math|mathematics|maths)\b/i.test(s)) {
    return 'Mathematics';
  }
  if (/\b(humanities|hum)\b/i.test(s)) {
    return 'Humanities';
  }

  // 6. MLE (Medical Electronics)
  if (
    /\b(mle|medical\s*electronics|medical\s*electronics\s*engineering|medical\s*software|medical\s*instrumentation|medical\s*lab)\b/i.test(s) ||
    (/\bme\s*(dept|department|wing)\b/i.test(s) && !/\bmechanical\b/i.test(s))
  ) {
    return 'MLE';
  }

  // 7. E&EE / EEE (Electrical & Electronics)
  if (/\b(e&ee|e\s*&\s*ee|eee|e\s*\.\s*e\s*\.\s*e|electrical|electrical\s*&\s*electronics|electrical\s*and\s*electronics|electrical\s*electronics)\b/i.test(s)) {
    return 'E&EE';
  }

  // 8. E&IE / EIE (Electronics & Instrumentation)
  if (/\b(e&ie|e\s*&\s*ie|eie|e\s*\.\s*i\s*\.\s*e|instrumentation|electronics\s*&\s*instrumentation|electronics\s*and\s*instrumentation|instrumentation\s*engineering)\b/i.test(s)) {
    return 'E&IE';
  }

  // 9. E&TE / ETE (Electronics & Telecommunication)
  if (/\b(e&te|e\s*&\s*te|ete|e\s*\.\s*t\s*\.\s*e|telecom|telecommunication|electronics\s*&\s*telecommunication|electronics\s*and\s*telecommunication|telecommunication\s*engineering|electronics\s*telecommunication)\b/i.test(s)) {
    return 'ETE';
  }

  // 10. ISE (Information Science)
  if (/\b(ise|i\s*\.\s*s\s*\.\s*e|i\s*s\s*e|information\s*science|information\s*science\s*and\s*engineering|information\s*science\s*&\s*engineering|info\s*science|info\s*science\s*&\s*engineering)\b/i.test(s)) {
    return 'ISE';
  }

  // 11. ECE / E&CE (Electronics & Communication)
  if (/\b(e&ce|e\s*&\s*ce|ece|e\s*\.\s*c\s*\.\s*e|electronics\s*&\s*communication|electronics\s*and\s*communication|electronics\s*communication)\b/i.test(s)) {
    return 'E&CE';
  }

  // 12. MCA (Master of Computer Applications)
  if (/\b(mca|m\s*\.\s*c\s*\.\s*a|master\s*of\s*computer\s*applications)\b/i.test(s)) {
    return 'MCA';
  }

  // 13. Other Engineering Branches
  if (/\b(cv|civil|civil\s*engineering)\b/i.test(s)) {
    return 'CV';
  }
  if (/\b(biotech|biotechnology|biotechnology\s*engineering)\b/i.test(s)) {
    return 'BIOTECH';
  }
  if (/\b(ind|industrial|iem|industrial\s*engineering|industrial\s*engineering\s*&\s*management)\b/i.test(s)) {
    return 'IND';
  }

  // 14. Pure CSE (Computer Science & Engineering - LHC Block, strictly non-AIML / non-Cyber)
  if (/\b(cse|c\s*\.\s*s\s*\.\s*e|c\s*s\s*e|computer\s*science|computer\s*science\s*and\s*engineering|comp\s*science|computer\s*science\s*dept)\b/i.test(s)) {
    return 'CSE';
  }

  return null;
}

/**
 * Returns human-friendly display name for a department code
 */
export function getDepartmentDisplayName(code: string): string {
  switch (code) {
    case 'CSE-AIML':
      return 'CSE (AI & ML)';
    case 'AIML':
    case 'AI & ML':
      return 'AI & ML';
    case 'AI & DS':
    case 'AIDS':
      return 'AI & DS';
    case 'Physics':
      return 'Department of Physics';
    case 'Mathematics':
      return 'Department of Mathematics';
    case 'Humanities':
      return 'Department of Humanities';
    case 'CSE-CY':
    case 'CY':
      return 'CSE (Cyber Security)';
    case 'MLE':
      return 'Medical Electronics (MLE)';
    case 'E&EE':
    case 'EEE':
      return 'Electrical & Electronics (E&EE)';
    case 'E&IE':
    case 'EIE':
      return 'Electronics & Instrumentation (E&IE)';
    case 'E&TE':
    case 'ETE':
      return 'Electronics & Telecommunication (ETE)';
    case 'CSE':
      return 'Computer Science & Engineering (CSE)';
    case 'ISE':
      return 'Information Science & Engineering (ISE)';
    case 'ECE':
    case 'E&CE':
      return 'Electronics & Communication (E&CE)';
    case 'CV':
      return 'Civil Engineering (CV)';
    case 'BIOTECH':
      return 'Biotechnology';
    case 'IND':
      return 'Industrial Engineering & Management (IEM)';
    case 'MCA':
      return 'Master of Computer Applications (MCA)';
    default:
      return code;
  }
}

/**
 * Extracts standard room-category concept from a query
 */
export function extractRoomCategory(query: string): 'FACULTY_ROOM' | 'LAB' | 'LIBRARY' | 'SEMINAR_HALL' | 'OFFICE' | 'CLASSROOM' | null {
  if (!query) return null;
  const q = query.toLowerCase();

  if (/\b(faculty\s*room|faculty\s*rooms|faculty\s*lounge|faculty\s*lounges|staff\s*room|staff\s*rooms|staff\s*lounge|staff\s*lounges|teachers?\s*room|teachers?\s*rooms|teachers?\s*lounge|teachers?\s*lounges|professors?\s*room|faculty\s*area|faculty\s*space|faculty\s*office|faculty\s*cabin|teachers\s*ka\s*room|teachers\s*ke\s*room|faculty\s*ka\s*room|faculty\s*ke\s*rooms?)\b/i.test(q)) {
    return 'FACULTY_ROOM';
  }
  if (/\b(lab|labs|laboratory|laboratories|lab\s*room|department\s*lab|dept\s*lab|computer\s*lab|faculty\s*lab|research\s*lab)\b/i.test(q)) {
    return 'LAB';
  }
  if (/\b(library|libraries|department\s*library|dept\s*library)\b/i.test(q)) {
    return 'LIBRARY';
  }
  if (/\b(seminar\s*hall|seminar\s*room|seminar\s*halls|auditorium|board\s*room)\b/i.test(q)) {
    return 'SEMINAR_HALL';
  }
  if (/\b(office|admin\s*office|administrative\s*office|department\s*office|dept\s*office|hod\s*office)\b/i.test(q)) {
    return 'OFFICE';
  }
  if (/\b(classroom|classrooms|lecture\s*hall|lecture\s*room)\b/i.test(q)) {
    return 'CLASSROOM';
  }

  return null;
}

export interface RoomQueryConstraints {
  roomNumber?: string | null;
  department?: string | null;
  building?: string | null;
  roomCategory?: 'FACULTY_ROOM' | 'LAB' | 'LIBRARY' | 'SEMINAR_HALL' | 'OFFICE' | 'CLASSROOM' | string | null;
  floor?: string | null;
  name?: string | null;
}

/**
 * Structured Multi-Constraint Room Query Engine
 * Performs deterministic filtering across department, building, category, and floor.
 */
export function queryRooms(constraints: RoomQueryConstraints): MSRITRoomRecord[] {
  let rooms = [...MSRIT_ROOMS];

  // 1. Room Number constraint (Highest Priority Exact Match)
  if (constraints.roomNumber) {
    const norm = normalizeRoomNumber(constraints.roomNumber);
    const exact = findRoomByNumber(norm);
    return exact ? [exact] : [];
  }

  // 2. Building constraint (Hard Filter)
  if (constraints.building) {
    const b = constraints.building.toLowerCase().trim();
    rooms = rooms.filter((r) => {
      const rb = (r.building || '').toLowerCase();
      const rbc = (r.buildingCode || '').toLowerCase();
      if (b === 'crd' || b === 'multipurpose') {
        return rb.includes('crd') || rb.includes('multipurpose') || rbc === 'crd';
      }
      if (b === 'lhc') {
        return rb.includes('lhc') || rbc === 'lhc' || rb.includes('lecture hall');
      }
      if (b === 'apex') {
        return rb.includes('apex') || rbc === 'apex';
      }
      if (b === 'esb') {
        return rb.includes('esb') || rbc === 'esb';
      }
      if (b === 'des') {
        return rb.includes('des') || rbc === 'des';
      }
      if (b === 'arch' || b.includes('architecture')) {
        return rb.includes('arch') || rbc === 'arch' || rb.includes('architecture');
      }
      return rb.includes(b) || rbc.includes(b);
    });
  }

  // 3. Department constraint (HARD FILTER - Strict separation between AI&ML, CSE-AIML, and AI&DS)
  if (constraints.department) {
    const normDept = normalizeDepartmentCode(constraints.department) || constraints.department.toUpperCase();
    rooms = rooms.filter((r) => {
      const depts = (r.departments || []).map((x) => x.toUpperCase());
      const dStr = (r.department || '').toUpperCase();
      const bCode = (r.buildingCode || '').toUpperCase();

      if (normDept === 'CSE-AIML') {
        return depts.includes('CSE-AIML') || dStr.includes('CSE-AIML') || dStr.includes('CSE (AIML)') || (dStr.includes('AIML') && (dStr.includes('CSE') || bCode === 'CRD'));
      }
      if (normDept === 'AI & ML' || normDept === 'AIML') {
        return (depts.includes('AIML') || depts.includes('AI & ML') || dStr.includes('AI & ML') || dStr.includes('ARTIFICIAL INTELLIGENCE & MACHINE LEARNING')) && !depts.includes('CSE-AIML') && !dStr.includes('CSE') && bCode !== 'CRD';
      }
      if (normDept === 'AI & DS' || normDept === 'AIDS') {
        return depts.includes('AI & DS') || depts.includes('AIDS') || dStr.includes('AI & DS') || dStr.includes('AIDS') || dStr.includes('ARTIFICIAL INTELLIGENCE & DATA SCIENCE');
      }
      if (normDept === 'Physics') {
        return depts.includes('PHYSICS') || dStr.includes('PHYSICS');
      }
      if (normDept === 'Mathematics') {
        return depts.includes('MATHEMATICS') || dStr.includes('MATHEMATICS') || dStr.includes('MATH');
      }
      if (normDept === 'Humanities') {
        return depts.includes('HUMANITIES') || dStr.includes('HUMANITIES');
      }
      if (normDept === 'CSE-CY' || normDept === 'CY' || normDept === 'CYBER SECURITY') {
        return depts.includes('CSE-CY') || depts.includes('CY') || dStr.includes('CYBER');
      }
      if (normDept === 'MLE') {
        return depts.includes('MLE') || dStr.includes('MLE') || dStr.includes('MEDICAL ELECTRONICS') || dStr.includes('MEDICAL');
      }
      if (normDept === 'E&EE' || normDept === 'EEE') {
        return depts.includes('E&EE') || depts.includes('EEE') || dStr.includes('E&EE') || dStr.includes('EEE') || dStr.includes('ELECTRICAL');
      }
      if (normDept === 'E&IE' || normDept === 'EIE') {
        return depts.includes('E&IE') || depts.includes('EIE') || dStr.includes('E&IE') || dStr.includes('EIE') || dStr.includes('INSTRUMENTATION');
      }
      if (normDept === 'E&TE' || normDept === 'ETE') {
        return depts.includes('E&TE') || depts.includes('ETE') || dStr.includes('E&TE') || dStr.includes('ETE') || dStr.includes('TELECOMMUNICATION') || dStr.includes('TELECOM');
      }
      if (normDept === 'CSE') {
        return (depts.includes('CSE') || dStr === 'CSE' || dStr.includes('COMPUTER SCIENCE')) && !depts.includes('CSE-AIML') && !depts.includes('CSE-CY') && !dStr.includes('AIML') && !dStr.includes('CYBER');
      }
      if (normDept === 'ISE') {
        return depts.includes('ISE') || dStr.includes('ISE') || dStr.includes('INFORMATION SCIENCE');
      }
      if (normDept === 'ECE' || normDept === 'E&CE') {
        return depts.includes('ECE') || depts.includes('E&CE') || dStr.includes('ECE') || dStr.includes('E&CE') || dStr.includes('ELECTRONICS & COMM');
      }
      if (normDept === 'CV') {
        return depts.includes('CV') || dStr.includes('CIVIL');
      }
      if (normDept === 'BIOTECH') {
        return depts.includes('BIOTECH') || dStr.includes('BIOTECH');
      }
      if (normDept === 'IND') {
        return depts.includes('IND') || dStr.includes('IND') || dStr.includes('INDUSTRIAL');
      }
      if (normDept === 'MCA') {
        return depts.includes('MCA') || dStr.includes('MCA');
      }

      return depts.includes(normDept) || dStr.includes(normDept);
    });
  }

  // 4. Room Category constraint
  if (constraints.roomCategory) {
    const cat = constraints.roomCategory;
    if (cat === 'FACULTY_ROOM') {
      rooms = rooms.filter((r) => {
        const c = (r.category || '').toLowerCase();
        const t = (r.type || '').toLowerCase();
        const n = (r.name || '').toLowerCase();
        return c.includes('faculty') || t === 'lounge' || n.includes('faculty') || n.includes('staff') || n.includes('hod & staff');
      });
    } else if (cat === 'LAB') {
      rooms = rooms.filter((r) => {
        const c = (r.category || '').toLowerCase();
        const t = (r.type || '').toLowerCase();
        const n = (r.name || '').toLowerCase();
        return t === 'lab' || c.includes('lab') || n.includes('lab');
      });
    } else if (cat === 'LIBRARY') {
      rooms = rooms.filter((r) => {
        const t = (r.type || '').toLowerCase();
        const n = (r.name || '').toLowerCase();
        return t === 'library' || n.includes('library');
      });
    } else if (cat === 'SEMINAR_HALL') {
      rooms = rooms.filter((r) => {
        const t = (r.type || '').toLowerCase();
        const n = (r.name || '').toLowerCase();
        return t === 'seminar hall' || n.includes('seminar hall') || n.includes('auditorium');
      });
    } else if (cat === 'OFFICE') {
      rooms = rooms.filter((r) => {
        const t = (r.type || '').toLowerCase();
        const n = (r.name || '').toLowerCase();
        return t === 'office' || n.includes('office');
      });
    } else if (cat === 'CLASSROOM') {
      rooms = rooms.filter((r) => {
        const t = (r.type || '').toLowerCase();
        const n = (r.name || '').toLowerCase();
        return t === 'classroom' || n.includes('classroom');
      });
    }
  }

  // 5. Floor constraint
  if (constraints.floor) {
    const f = constraints.floor.toLowerCase().trim();
    rooms = rooms.filter((r) => (r.floor || '').toLowerCase().includes(f));
  }

  // 6. Name / search term constraint (if provided)
  if (constraints.name) {
    const nSearch = normalizeRoomNameForSearch(constraints.name);
    rooms = rooms.filter((r) => {
      const rName = normalizeRoomNameForSearch(r.name || '');
      const rNum = normalizeRoomNameForSearch(r.roomNumber || '');
      return rName.includes(nSearch) || rNum.includes(nSearch);
    });
  }

  return rooms;
}

/**
 * Filter rooms by department (e.g. MLE, E&EE, E&IE, E&TE, AIML, CY)
 */
export function getRoomsByDepartment(deptQuery: string, buildingFilter?: string): MSRITRoomRecord[] {
  return queryRooms({
    department: deptQuery,
    building: buildingFilter
  });
}

/**
 * Filter rooms by type (Classroom, Lab, Seminar Hall, Board Room, Auditorium, Office, Lounge)
 */
export function getRoomsByType(typeQuery: string): MSRITRoomRecord[] {
  const t = typeQuery.toLowerCase().trim();
  return MSRIT_ROOMS.filter((r) => r.type.toLowerCase().includes(t));
}

/**
 * Client-Side / API fetcher for Rooms with graceful fallback to bundled dataset
 */
export async function fetchRoomsApi(params?: {
  building?: string;
  floor?: string;
  department?: string;
  category?: string;
  roomCategory?: string;
  q?: string;
}): Promise<MSRITRoomRecord[]> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.building) searchParams.append('building', params.building);
    if (params?.floor) searchParams.append('floor', params.floor);
    if (params?.department) searchParams.append('department', params.department);
    if (params?.category || params?.roomCategory) searchParams.append('category', params.category || params.roomCategory || '');
    if (params?.q) searchParams.append('q', params.q);

    const queryUrl = `/api/rooms?${searchParams.toString()}`;
    const res = await fetch(queryUrl);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        return data.data;
      }
    }
  } catch {
    // Graceful fallback to client dataset
  }

  // Fallback using client multi-constraint engine
  return queryRooms({
    building: params?.building,
    floor: params?.floor,
    department: params?.department,
    roomCategory: params?.roomCategory || params?.category,
    name: params?.q
  });
}
