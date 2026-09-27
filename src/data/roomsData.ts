import msritRoomsRaw from './msrit_rooms.json';

export interface MSRITRoomRecord {
  roomNumber: string;
  building: string | null;
  department: string | null;
  type: 'Classroom' | 'Lab' | 'Seminar Hall' | 'Board Room' | 'Auditorium' | string;
  sourceUrl: string;
  sourceTitle: string;
  sourceYear: number;
  verified: boolean;
  temporalStatus: 'current' | 'historical';
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
 * Normalizes query string to match room formats:
 * - "AB 401", "AB401", "AB-401" -> "AB-401"
 * - "LHC 204", "LHC-204", "LHC204" -> "LHC204"
 * - "ARCH 307", "ARCH-307", "ARCH307" -> "ARCH307"
 * - "ESB 419A", "ESB419A", "ESB-419A" -> "ESB-419A"
 */
export function normalizeRoomNumber(raw: string): string {
  let s = raw.toUpperCase().trim();

  // Pattern: AB-XXX
  const abMatch = s.match(/\bAB[- ]?(\d{3}[A-Z]?)\b/i);
  if (abMatch) {
    return `AB-${abMatch[1]}`;
  }

  // Pattern: ESB-XXX
  const esbMatch = s.match(/\bESB[- ]?(\d{3}[A-Z]?)\b/i);
  if (esbMatch) {
    return `ESB-${esbMatch[1]}`;
  }

  // Pattern: LHCXXX
  const lhcMatch = s.match(/\bLHC[- ]?(\d{3}[A-Z]?)\b/i);
  if (lhcMatch) {
    return `LHC${lhcMatch[1]}`;
  }

  // Pattern: ARCHXXX
  const archMatch = s.match(/\bARCH[- ]?(\d{3}[A-Z]?)\b/i);
  if (archMatch) {
    return `ARCH${archMatch[1]}`;
  }

  // Pattern: Room-XXX
  const roomMatch = s.match(/\bROOM[- ]?(\d{3}[A-Z]?)\b/i);
  if (roomMatch) {
    return `Room-${roomMatch[1]}`;
  }

  return s;
}

/**
 * Looks up room by exact or normalized room number
 */
export function findRoomByNumber(query: string): MSRITRoomRecord | undefined {
  const normKey = normalizeRoomNumber(query).toLowerCase();
  const rawClean = query.toLowerCase().replace(/[- ]/g, '');

  return MSRIT_ROOMS.find((r) => {
    const rNum = r.roomNumber.toLowerCase();
    const rClean = rNum.replace(/[- ]/g, '');
    return rNum === normKey || rClean === rawClean || normKey === rClean;
  });
}

/**
 * Filter rooms by building
 */
export function getRoomsByBuilding(buildingQuery: string): MSRITRoomRecord[] {
  const b = buildingQuery.toLowerCase().trim();
  return MSRIT_ROOMS.filter((r) => {
    if (!r.building) return false;
    const rb = r.building.toLowerCase();
    return rb.includes(b) || b.includes(rb) ||
      (b.includes('apex') && rb.includes('apex')) ||
      (b.includes('lhc') && rb.includes('lhc')) ||
      (b.includes('esb') && rb.includes('esb')) ||
      (b.includes('des') && rb.includes('des')) ||
      (b.includes('arch') && rb.includes('arch'));
  });
}

/**
 * Filter rooms by department
 */
export function getRoomsByDepartment(deptQuery: string): MSRITRoomRecord[] {
  const d = deptQuery.toLowerCase().trim();
  return MSRIT_ROOMS.filter((r) => {
    if (!r.department) return false;
    const rd = r.department.toLowerCase();
    return rd.includes(d) || d.includes(rd);
  });
}

/**
 * Filter rooms by type (Classroom, Lab, Seminar Hall, Board Room, Auditorium)
 */
export function getRoomsByType(typeQuery: string): MSRITRoomRecord[] {
  const t = typeQuery.toLowerCase().trim();
  return MSRIT_ROOMS.filter((r) => r.type.toLowerCase().includes(t));
}
