import type { SimulatedTimeState } from './statusEngine';
export { getCampusOperatingHours, isCampusOpen, isFacultyConsultationOpen } from './statusEngine';

// Central Single Source of Truth for Campus Pulse Libraries & Dynamic Occupancy Logic
// Distinguishes between:
// 1. Official MSRIT Information (Digital Library, e-resources, consortium memberships, source: https://www.msrit.edu/)
// 2. Campus Pulse Project Data (ESB Library, LHC Library, Apex Library physical block associations)

export interface CampusLibrary {
  id: string;
  name: string;
  code?: string;
  roomNumber?: string;
  building: string;
  type: "Physical Library";
  openingTime: "09:00";
  closingTime: "21:00";
  primaryGroups: string[];
  nodeId: string;
  floor: string;
  description: string;
  noiseLevel: 'Silent' | 'Quiet' | 'Moderate';
  walkTimeMinutes: number;
  capacity?: number;
  carpetArea?: string;
  digitalSystems?: string;
  servers?: string;
  sections?: string;
  facilities?: string;
  exclusiveFor?: string;
  disciplines?: string;
  primaryUsers?: string[];
  historicalTrend?: Array<{ hour: string; avgOccupancy: number }>;
  source: string;
}

export interface DigitalLibraryInfo {
  name: string;
  type: "Digital Library";
  resources: string[];
  memberships: string[];
  features: string[];
  sourceUrl: string;
  source: 'Official MSRIT Website (https://www.msrit.edu/)';
  description: string;
}

/**
 * Official MSRIT Digital Library Information
 * Source: https://www.msrit.edu/
 * Verified from official MSRIT documentation:
 * - Digital Library subscribes to online e-journals/resources:
 *   Elsevier ScienceDirect, IEEE, Taylor & Francis, SpringerLink
 * - Member of: DELNET, CMTI, VTU E-Library
 * - Large, air-conditioned library/Digital Library with collection of books and national/international journals.
 */
export const DIGITAL_LIBRARY: DigitalLibraryInfo = {
  name: "MSRIT Digital Library",
  type: "Digital Library",
  resources: [
    "Elsevier ScienceDirect",
    "IEEE",
    "Taylor & Francis",
    "SpringerLink"
  ],
  memberships: [
    "DELNET",
    "CMTI",
    "VTU E-Library"
  ],
  features: [
    "Subscriptions to online e-journals & digital resources",
    "Institutional memberships in national resource-sharing networks",
    "Access to national and international research journals",
    "Air-conditioned reading and digital research facilities"
  ],
  sourceUrl: "https://www.msrit.edu/",
  source: "Official MSRIT Website (https://www.msrit.edu/)",
  description: "Official MSRIT information verifies that Ramaiah Institute of Technology has a Digital Library providing access to online e-journals from Elsevier ScienceDirect, IEEE, Taylor & Francis, and SpringerLink, alongside institutional memberships in DELNET, CMTI, and VTU E-Library. The institute features a large, air-conditioned library/Digital Library with a collection of books and subscriptions to national and international journals."
};

export const digitalLibrary = DIGITAL_LIBRARY;

/**
 * Campus Pulse Libraries (3 Exactly: ESB Library, LHC Library, Apex Library)
 *
 * 1. ESB Library (Building: ESB)
 *    Primary Users: 1st Year, Above 1st Year, Mainly Non-CSE
 * 2. LHC Library (Building: LHC)
 *    Primary Users: CSE, Electronics
 * 3. Apex Library (Building: Apex)
 *    Primary Users: 1st Year
 *
 * Operating Hours: 09:00–21:00 Every Day (Monday through Sunday).
 */
export const LIBRARIES: CampusLibrary[] = [
  {
    id: "esb_main_library",
    name: "ESB Library",
    code: "ESB-LIB",
    building: "ESB",
    type: "Physical Library",
    openingTime: "09:00",
    closingTime: "21:00",
    primaryGroups: [
      "1st Year",
      "Above 1st Year",
      "Mainly Non-CSE"
    ],
    primaryUsers: [
      "1st Year",
      "Above 1st Year",
      "Mainly Non-CSE"
    ],
    nodeId: "esb_main_library",
    floor: "4th Level, ESB Block",
    description: "Engineering Sciences Block library housing comprehensive reference collections, research journals, and reading carrels for 1st Year and upper-level students across non-CSE disciplines.",
    noiseLevel: "Silent",
    walkTimeMinutes: 2,
    capacity: 538,
    carpetArea: "791.84 Sq.m",
    digitalSystems: "60 TFT Workstations",
    servers: "LMS, DSpace & E-Learning Servers",
    disciplines: "1st Year, Above 1st Year, Mainly Non-CSE (Civil, Mechanical, Chemical, Biotechnology, Core Engineering)",
    facilities: "Textbooks, reference volumes, research terminals, and reading carrels",
    historicalTrend: [
      { hour: '09:00', avgOccupancy: 25 },
      { hour: '11:00', avgOccupancy: 55 },
      { hour: '13:00', avgOccupancy: 42 },
      { hour: '15:00', avgOccupancy: 68 },
      { hour: '17:00', avgOccupancy: 35 },
      { hour: '19:00', avgOccupancy: 40 },
    ],
    source: "MSRIT ESB Block"
  },
  {
    id: "lhc_unit_2_library",
    name: "LHC Library",
    code: "LHC-306",
    roomNumber: "LHC-306",
    building: "LHC",
    type: "Physical Library",
    openingTime: "09:00",
    closingTime: "21:00",
    primaryGroups: [
      "CSE",
      "Electronics"
    ],
    primaryUsers: [
      "CSE",
      "Electronics"
    ],
    nodeId: "lhc_unit_2_library",
    floor: "1st Floor (Room LHC-306), LHC Block",
    description: "Lecture Hall Complex Central Library located on 1st Floor (Room LHC-306), specialized for Computer Science and Electronics engineering students.",
    noiseLevel: "Silent",
    walkTimeMinutes: 3,
    capacity: 538,
    carpetArea: "495.83 Sq.m",
    digitalSystems: "61 Workstations",
    disciplines: "CSE, Electronics, Information Science, AI & ML, Cybersecurity, ECE, EEE",
    facilities: "CSE textbooks, IEEE research access, Subhashini Language Lab, technical journals",
    historicalTrend: [
      { hour: '09:00', avgOccupancy: 20 },
      { hour: '11:00', avgOccupancy: 50 },
      { hour: '13:00', avgOccupancy: 38 },
      { hour: '15:00', avgOccupancy: 72 },
      { hour: '17:00', avgOccupancy: 30 },
      { hour: '19:00', avgOccupancy: 70 },
    ],
    source: "MSRIT LHC Block"
  },
  {
    id: "apex_unit_3_library",
    name: "Apex Library",
    code: "APEX-LIB",
    building: "Apex",
    type: "Physical Library",
    openingTime: "09:00",
    closingTime: "21:00",
    primaryGroups: [
      "1st Year"
    ],
    primaryUsers: [
      "1st Year"
    ],
    nodeId: "apex_unit_3_library",
    floor: "5th Level, Apex Block",
    description: "Dedicated foundational academic library on Apex Block 5th Level, exclusively tailored for 1st Year undergraduate engineering students.",
    noiseLevel: "Silent",
    walkTimeMinutes: 4,
    capacity: 64,
    exclusiveFor: "Exclusive for 1st Year UG courses",
    carpetArea: "200.94 Sq.m",
    digitalSystems: "02 Workstations",
    disciplines: "1st Year, Mathematics, Physics, Chemistry, Basic Engineering & Humanities",
    facilities: "1st Year textbooks, foundational science reference holdings, quiet study cubicles",
    historicalTrend: [
      { hour: '09:00', avgOccupancy: 15 },
      { hour: '11:00', avgOccupancy: 45 },
      { hour: '13:00', avgOccupancy: 30 },
      { hour: '15:00', avgOccupancy: 55 },
      { hour: '17:00', avgOccupancy: 20 },
      { hour: '19:00', avgOccupancy: 30 },
    ],
    source: "MSRIT Apex Block"
  }
];

export const libraries = LIBRARIES;

/**
 * ONE formatting function for library occupancy:
 * All occupancy UI components MUST use this function.
 * UI must ALWAYS display occupancy as a percentage (e.g. 60%, 35%, 80%, 10%).
 * Never displays /10 anywhere.
 */
export function formatOccupancy(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Helper to extract time values from Date or SimulatedTimeState
 */
export function parseCurrentTime(currentTime?: Date | SimulatedTimeState | null): {
  day: number;
  hours: number;
  minutes: number;
} {
  let day: number;
  let hours: number;
  let minutes: number;

  if (currentTime && 'hour' in currentTime && 'minute' in currentTime) {
    if (currentTime.enabled) {
      day = currentTime.dayOfWeek;
      hours = currentTime.hour;
      minutes = currentTime.minute;
    } else {
      const now = new Date();
      day = now.getDay();
      hours = now.getHours();
      minutes = now.getMinutes();
    }
  } else if (currentTime instanceof Date) {
    day = currentTime.getDay();
    hours = currentTime.getHours();
    minutes = currentTime.getMinutes();
  } else {
    const now = new Date();
    day = now.getDay();
    hours = now.getHours();
    minutes = now.getMinutes();
  }

  return { day, hours, minutes };
}

/**
 * Single centralized function to determine if libraries are open.
 * Rule:
 * ALL THREE LIBRARIES (ESB Library, LHC Library, Apex Library) ARE OPEN EVERY DAY:
 * 09:00–21:00 (Monday through Sunday)
 *
 * 00:00–08:59 → CLOSED
 * 09:00–20:59 → OPEN
 * 21:00–23:59 → CLOSED
 *
 * Current hour & minute in 24-hour time:
 * const currentMinutes = hours * 60 + minutes;
 * const openingMinutes = 9 * 60;   // 09:00 = 540 minutes
 * const closingMinutes = 21 * 60;  // 21:00 = 1260 minutes
 * const isLibraryOpen = currentMinutes >= openingMinutes && currentMinutes < closingMinutes;
 *
 * Can be called as:
 * isLibraryOpen(date)
 * or isLibraryOpen(library, date)
 */
export function isLibraryOpen(
  first?: CampusLibrary | Date | SimulatedTimeState | null,
  second?: Date | SimulatedTimeState | null
): boolean {
  let timeArg: Date | SimulatedTimeState | null | undefined;
  if (first && typeof first === 'object') {
    if ('hour' in first || first instanceof Date) {
      timeArg = first;
    } else {
      timeArg = second;
    }
  } else {
    timeArg = second;
  }

  const { hours, minutes } = parseCurrentTime(timeArg);
  const currentMinutes = hours * 60 + minutes;
  const openingMinutes = 9 * 60;   // 09:00 = 540 minutes
  const closingMinutes = 21 * 60;  // 21:00 = 1260 minutes

  // Open 09:00–21:00 every day (Mon–Sun).
  // At 20:59 -> OPEN. At 21:00 -> CLOSED.
  return currentMinutes >= openingMinutes && currentMinutes < closingMinutes;
}


/**
 * Generates N unique random integers within [min, max] (inclusive).
 * Uses Fisher-Yates shuffle on the range pool to guarantee no duplicates.
 */
export function generateUniqueValues(count: number, min: number, max: number): number[] {
  const pool: number[] = [];
  for (let i = min; i <= max; i++) {
    pool.push(i);
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

// 30–60 second cycle window tracker for evening controlled randomization
const EVENING_CYCLE_MS = 35000; // 35 seconds update cycle (within 30-60s requirement)
let cachedCycleBucket = -1;
let cachedTimeSlot = '';
let cachedEveningValues: Record<string, number> = {};

/**
 * Returns dynamic, mutually unique evening occupancies as percentages (10%-100%) for all 3 libraries.
 * Generates distinct dynamic occupancy for each library (e.g. ESB -> 40%, LHC -> 70%, Apex -> 30%).
 * Recalculates every ~35 seconds (within 30-60s requirement).
 */
export function getEveningOccupancyMap(currentTime?: Date | SimulatedTimeState | null): Record<string, number> {
  const now = Date.now();
  const cycleBucket = Math.floor(now / EVENING_CYCLE_MS);
  const { hours, minutes } = parseCurrentTime(currentTime);
  const timeSlot = `${hours}:${minutes}`;

  // If the 35s cycle bucket elapsed, or the minute changed, or cache is uninitialized:
  if (cycleBucket !== cachedCycleBucket || timeSlot !== cachedTimeSlot || !cachedEveningValues['esb_main_library']) {
    cachedCycleBucket = cycleBucket;
    cachedTimeSlot = timeSlot;

    // Generate 3 unique values for ESB, LHC, and Apex:
    const uniqueValues = generateUniqueValues(3, 2, 8);
    const esbVal = (uniqueValues[0] || 4) * 10;
    const lhcVal = (uniqueValues[1] || 7) * 10;
    const apexVal = (uniqueValues[2] || 3) * 10;

    cachedEveningValues = {
      'esb_main_library': esbVal,
      'esb-library': esbVal,
      'lhc_unit_2_library': lhcVal,
      'lhc-library': lhcVal,
      'apex_unit_3_library': apexVal,
      'apex-library': apexVal
    };
  }

  return cachedEveningValues;
}

/**
 * Force regenerates a fresh set of mutually unique evening occupancies (percentage values).
 */
export function forceRegenerateEveningOccupancies(): Record<string, number> {
  const uniqueValues = generateUniqueValues(3, 2, 8);
  const esbVal = (uniqueValues[0] || 4) * 10;
  const lhcVal = (uniqueValues[1] || 7) * 10;
  const apexVal = (uniqueValues[2] || 3) * 10;

  cachedEveningValues = {
    'esb_main_library': esbVal,
    'esb-library': esbVal,
    'lhc_unit_2_library': lhcVal,
    'lhc-library': lhcVal,
    'apex_unit_3_library': apexVal,
    'apex-library': apexVal
  };
  return cachedEveningValues;
}

/**
 * Calculates Estimated Live Occupancy dynamically (0–100%):
 * - Before 09:00: Strictly 0 (Libraries CLOSED) -> 0%
 * - 09:00 to 17:59 (Daytime): Dynamic calculation (0-100%) based on active schedules & student groups
 * - 18:00 to 20:59 (Evening): Unique separate values for ESB, LHC, Apex (e.g. 40%, 70%, 30%), updated every ~35s
 * - 21:00 onwards (Night): Strictly 0 (Libraries CLOSED at 21:00) -> 0%
 */
export function calculateLibraryOccupancy(
  library: CampusLibrary,
  currentTime?: Date | SimulatedTimeState | null,
  _campusData?: any
): number {
  const { hours, minutes } = parseCurrentTime(currentTime);
  const currentMinutes = hours * 60 + minutes;
  const openingMinutes = 9 * 60;   // 09:00 = 540 min
  const closingMinutes = 21 * 60;  // 21:00 = 1260 min

  // 1. BEFORE 09:00 (00:00–08:59): Library is CLOSED, Occupancy = 0
  if (currentMinutes < openingMinutes) {
    return 0;
  }

  // 2. AT 21:00 AND AFTER: Library is CLOSED, Occupancy = 0
  if (currentMinutes >= closingMinutes) {
    return 0;
  }

  // 3. EVENING PERIOD: 18:00–20:59 (1080 to 1259 min)
  // Libraries are STILL OPEN. Generate separate dynamic occupancy for each library.
  if (currentMinutes >= 1080 && currentMinutes < 1260) {
    const eveningMap = getEveningOccupancyMap(currentTime);
    const score = eveningMap[library.id] ?? eveningMap[library.id.replace('_', '-')];
    if (score !== undefined) {
      return score;
    }
    return 40;
  }

  // 4. DAYTIME LOGIC: 09:00 to 17:59 (540 min to 1079 min)
  let baseOccupancy = 40;
  if (library.id.includes('esb')) {
    baseOccupancy = 46;
  } else if (library.id.includes('lhc')) {
    baseOccupancy = 38;
  } else if (library.id.includes('apex')) {
    baseOccupancy = 32;
  }

  let timeOfDayEffect = 0;
  let activeClassEffect = 0;
  let freePeriodEffect = 0;

  if (currentMinutes >= 540 && currentMinutes < 600) {
    timeOfDayEffect = -4;
  } else if (currentMinutes >= 600 && currentMinutes < 750) {
    activeClassEffect = -14;
    if (currentMinutes >= 660 && currentMinutes <= 675) {
      freePeriodEffect = +12;
    }
  } else if (currentMinutes >= 750 && currentMinutes < 825) {
    timeOfDayEffect = +24;
    freePeriodEffect = +8;
  } else if (currentMinutes >= 825 && currentMinutes < 960) {
    activeClassEffect = -10;
    if (currentMinutes >= 885 && currentMinutes <= 900) {
      freePeriodEffect = +8;
    }
  } else if (currentMinutes >= 960 && currentMinutes < 1020) {
    timeOfDayEffect = +20;
  } else if (currentMinutes >= 1020 && currentMinutes < 1080) {
    timeOfDayEffect = +6;
  }

  let studentGroupEffect = 0;
  if (library.primaryGroups?.includes('1st Year') && currentMinutes >= 780 && currentMinutes <= 880) {
    studentGroupEffect += 6;
  }
  if (library.primaryGroups?.includes('CSE') && currentMinutes >= 930 && currentMinutes <= 1020) {
    studentGroupEffect += 7;
  }

  const controlledRipple = Math.round(2.5 * Math.sin(currentMinutes * 0.4 + library.name.length));
  const rawOccupancy = baseOccupancy + timeOfDayEffect + activeClassEffect + freePeriodEffect + studentGroupEffect + controlledRipple;

  return Math.max(0, Math.min(100, Math.round(rawOccupancy)));
}

/**
 * Centralized library occupancy function:
 * Supports getLibraryOccupancy(date, library) and getLibraryOccupancy(library, date)
 */
export function getLibraryOccupancy(
  first: CampusLibrary | Date | SimulatedTimeState | null,
  second?: CampusLibrary | Date | SimulatedTimeState | null
): number {
  let lib: CampusLibrary;
  let timeArg: Date | SimulatedTimeState | null | undefined;

  if (first && typeof first === 'object' && 'id' in first && 'name' in first) {
    lib = first as CampusLibrary;
    timeArg = second as Date | SimulatedTimeState | null | undefined;
  } else if (second && typeof second === 'object' && 'id' in second && 'name' in second) {
    lib = second as CampusLibrary;
    timeArg = first as Date | SimulatedTimeState | null | undefined;
  } else {
    lib = LIBRARIES[0];
    timeArg = (first || second) as Date | SimulatedTimeState | null | undefined;
  }

  return calculateLibraryOccupancy(lib, timeArg);
}

export interface LibraryOccupancyDetails {
  isOpen: boolean;
  isEveningPeriod: boolean; // 18:00 <= time < 21:00
  occupancy: number; // 0 if closed, percentage value (0-100)
  displayOccupancy: string; // formatOccupancy(occupancy), e.g. "0%", "60%", "72%"
  percentageEquivalent: number; // percentage value (0-100)
  statusLabel: string;
  modeLabel: string;
  subNotice: string;
}

/**
 * Returns comprehensive occupancy details for UI components,
 * ensuring formatted percentage scale via formatOccupancy and clear 24-hour opening hour states.
 */
export function getLibraryOccupancyDetails(
  library: CampusLibrary,
  currentTime?: Date | SimulatedTimeState | null
): LibraryOccupancyDetails {
  const { hours, minutes } = parseCurrentTime(currentTime);
  const currentMinutes = hours * 60 + minutes;
  const isOpen = isLibraryOpen(currentTime);
  const isEvening = currentMinutes >= 1080 && currentMinutes < 1260; // 18:00 to 20:59
  const occ = calculateLibraryOccupancy(library, currentTime);
  const formatted = formatOccupancy(occ);

  if (!isOpen) {
    return {
      isOpen: false,
      isEveningPeriod: false,
      occupancy: 0,
      displayOccupancy: formatOccupancy(0),
      percentageEquivalent: 0,
      statusLabel: "Closed",
      modeLabel: `LIBRARY STATUS // ${library.building} BLOCK`,
      subNotice: "Closed • Operating Hours: 09:00–21:00 Daily"
    };
  }

  return {
    isOpen: true,
    isEveningPeriod: isEvening,
    occupancy: occ,
    displayOccupancy: formatted,
    percentageEquivalent: occ,
    statusLabel: "Open",
    modeLabel: `ESTIMATED LIVE OCCUPANCY // ${library.building} BLOCK`,
    subNotice: "Estimated Live Occupancy"
  };
}

/**
 * Search libraries by name, building, or primary student group
 */
export function searchLibraries(query: string): CampusLibrary[] {
  const q = query.trim().toLowerCase();
  if (!q) return LIBRARIES;

  return LIBRARIES.filter((lib) => {
    const nameMatch = lib.name.toLowerCase().includes(q);
    const buildingMatch = lib.building.toLowerCase().includes(q);
    const groupMatch = lib.primaryGroups.some((g) => g.toLowerCase().includes(q));
    const combinedMatch = `${lib.building} library`.toLowerCase().includes(q) ||
                          `${lib.name} ${lib.building}`.toLowerCase().includes(q);
    return nameMatch || buildingMatch || groupMatch || combinedMatch;
  });
}
