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
export function normalizeRoomNumber(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  const s = raw.toUpperCase().trim();

  // Pattern: LHC-XXX
  const lhcMatch = s.match(/\bLHC[- ]?(\d{3}[A-Z]?)\b/i);
  if (lhcMatch) {
    return `LHC-${lhcMatch[1].toUpperCase()}`;
  }

  // Pattern: CRD-XXX
  const crdMatch = s.match(/\bCRD[- ]?(\d{3}[A-Z]?)\b/i);
  if (crdMatch) {
    return `CRD-${crdMatch[1].toUpperCase()}`;
  }

  // Pattern: AB-XXX
  const abMatch = s.match(/\bAB[- ]?(\d{3}[A-Z]?)\b/i);
  if (abMatch) {
    return `AB-${abMatch[1].toUpperCase()}`;
  }

  // Pattern: ESB-XXX
  const esbMatch = s.match(/\bESB[- ]?(\d{3}[A-Z]?)\b/i);
  if (esbMatch) {
    return `ESB-${esbMatch[1].toUpperCase()}`;
  }

  // Pattern: ARCH-XXX
  const archMatch = s.match(/\bARCH[- ]?(\d{3}[A-Z]?)\b/i);
  if (archMatch) {
    return `ARCH-${archMatch[1].toUpperCase()}`;
  }

  // Pattern: Room-XXX
  const roomMatch = s.match(/\bROOM[- ]?(\d{3}[A-Z]?)\b/i);
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
 * strips hyphens, spaces, and special characters.
 */
export function stripRoomNumber(raw: string): string {
  return (raw || '').toUpperCase().replace(/[\s\-_]+/g, '');
}

/**
 * Looks up room by exact or normalized room number
 */
export function findRoomByNumber(query: string): MSRITRoomRecord | undefined {
  if (!query) return undefined;
  const normKey = normalizeRoomNumber(query);
  const strippedKey = stripRoomNumber(query);

  return MSRIT_ROOMS.find((r) => {
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
  if (BUILDING_NAMES.has(qSearch) || BUILDING_NAMES.has(q)) {
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
 * Filter rooms by department (e.g. MLE, E&EE, E&IE, E&TE, AIML, CY)
 */
export function getRoomsByDepartment(deptQuery: string, buildingFilter?: string): MSRITRoomRecord[] {
  if (!deptQuery) return [];
  const d = deptQuery.toLowerCase().trim();
  const pool = buildingFilter ? getRoomsByBuilding(buildingFilter) : MSRIT_ROOMS;

  return pool.filter((r) => {
    const deptStr = (r.department || '').toLowerCase();
    const depts = (r.departments || []).map((x) => x.toLowerCase());

    const matchesStr = deptStr.includes(d) || d.includes(deptStr);
    const matchesArray = depts.some((item) => item.includes(d) || d.includes(item));

    // Special aliases
    if (d === 'mle' || d.includes('medical electronics')) {
      return matchesStr || matchesArray || deptStr.includes('medical') || depts.some((x) => x.includes('mle'));
    }
    if (d === 'e&ee' || d === 'eee' || d.includes('electrical')) {
      return matchesStr || matchesArray || deptStr.includes('electrical') || depts.some((x) => x.includes('e&ee') || x.includes('eee'));
    }
    if (d === 'e&ie' || d === 'eie' || d.includes('instrumentation')) {
      return matchesStr || matchesArray || deptStr.includes('instrumentation') || depts.some((x) => x.includes('e&ie') || x.includes('eie'));
    }
    if (d === 'e&te' || d === 'ete' || d.includes('telecommunication')) {
      return matchesStr || matchesArray || deptStr.includes('telecommunication') || depts.some((x) => x.includes('e&te') || x.includes('ete'));
    }
    if (d.includes('aiml') || d.includes('ai') || d.includes('cyber') || d.includes('cy')) {
      return matchesStr || matchesArray;
    }

    return matchesStr || matchesArray;
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
  q?: string;
}): Promise<MSRITRoomRecord[]> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.building) searchParams.append('building', params.building);
    if (params?.floor) searchParams.append('floor', params.floor);
    if (params?.department) searchParams.append('department', params.department);
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

  // Fallback using client dataset
  let results = [...MSRIT_ROOMS];
  if (params?.building) {
    results = getRoomsByBuilding(params.building);
  }
  if (params?.floor) {
    const f = params.floor.toLowerCase();
    results = results.filter((r) => (r.floor || '').toLowerCase().includes(f));
  }
  if (params?.department) {
    results = getRoomsByDepartment(params.department, params?.building);
  }
  if (params?.q) {
    const q = params.q.toLowerCase();
    results = results.filter((r) =>
      r.roomNumber.toLowerCase().includes(q) ||
      (r.name && r.name.toLowerCase().includes(q)) ||
      (r.description && r.description.toLowerCase().includes(q))
    );
  }
  return results;
}
