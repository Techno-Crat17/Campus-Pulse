import { getFacultyLiveState, normalizeRoomName } from '../src/data/statusEngine.ts';
import facultyList from '../src/data/faculty_msrit_dynamic.json' assert { type: 'json' };

console.log('================================================================');
console.log('🧪 RUNNING FACULTY LIVE LOCATION & STATUS MATRIX TESTS');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failCount++;
  }
}

// ---------------------------------------------------------------------------
// TEST 1: PROMPT'S EXACT CONTROLLED SPECIFICATION (Dr. XYZ)
// ---------------------------------------------------------------------------
console.log('--- TEST SUITE 1: Prompt Controlled Specification Example (Dr. XYZ) ---');
const drXYZ: any = {
  id: 'fac-xyz',
  name: 'Dr. XYZ',
  cabinLocation: 'DES-203',
  department: 'Computer Science and Engineering',
  designation: 'Professor',
  email: 'xyz@msrit.edu',
  nodeId: 'block-lhc',
  weeklySchedule: {
    Monday: [
      { time: '10:00 - 11:00', subject: 'Data Structures', room: 'LHC204' },
      { time: '11:30 - 12:30', subject: 'Algorithms', room: 'DES203' }
    ]
  }
};

// Monday 09:30 AM: Before 10:00 class -> Fallback Cabin
const tMon0930 = { enabled: true, dayOfWeek: 1, hour: 9, minute: 30 };
const stateXYZ0930 = getFacultyLiveState(drXYZ, tMon0930);
assert(stateXYZ0930.status === 'AVAILABLE', 'Monday 09:30: No active class -> status is AVAILABLE');
assert(stateXYZ0930.currentLocation === 'DES-203', `Monday 09:30: No active class -> fallback location DES-203 (got ${stateXYZ0930.currentLocation})`);
assert(stateXYZ0930.locationSource === 'CABIN_FALLBACK', 'Monday 09:30: locationSource is CABIN_FALLBACK');

// Monday 10:30 AM: Active class 10:00-11:00 in LHC204 -> currentLocation = LHC-204 (NOT DES-203)
const tMon1030 = { enabled: true, dayOfWeek: 1, hour: 10, minute: 30 };
const stateXYZ1030 = getFacultyLiveState(drXYZ, tMon1030);
assert(stateXYZ1030.status === 'BUSY', 'Monday 10:30: Active class -> status is BUSY');
assert(stateXYZ1030.currentLocation === 'LHC-204', `Monday 10:30: Active class in LHC204 -> currentLocation is LHC-204 (got ${stateXYZ1030.currentLocation})`);
assert(stateXYZ1030.currentLocation !== drXYZ.cabinLocation, 'Monday 10:30: does NOT show cabin location during active class');
assert(stateXYZ1030.locationSource === 'ACTIVE_CLASS', 'Monday 10:30: locationSource is ACTIVE_CLASS');

// Monday 10:59 AM: Class still active -> LHC-204
const tMon1059 = { enabled: true, dayOfWeek: 1, hour: 10, minute: 59 };
const stateXYZ1059 = getFacultyLiveState(drXYZ, tMon1059);
assert(stateXYZ1059.currentLocation === 'LHC-204', `Monday 10:59: Class still active -> currentLocation is LHC-204`);

// Monday 11:00 AM / 11:01 AM: Class ended -> Fallback Cabin (DES-203)
const tMon1101 = { enabled: true, dayOfWeek: 1, hour: 11, minute: 1 };
const stateXYZ1101 = getFacultyLiveState(drXYZ, tMon1101);
assert(stateXYZ1101.status === 'AVAILABLE', 'Monday 11:01: Class ended -> status is AVAILABLE');
assert(stateXYZ1101.currentLocation === 'DES-203', `Monday 11:01: Class ended -> reverts to Cabin fallback DES-203 (got ${stateXYZ1101.currentLocation})`);

// Monday 11:15 AM: In-between classes -> Do NOT assume 11:30 class room -> Fallback Cabin
const tMon1115 = { enabled: true, dayOfWeek: 1, hour: 11, minute: 15 };
const stateXYZ1115 = getFacultyLiveState(drXYZ, tMon1115);
assert(stateXYZ1115.status === 'AVAILABLE', 'Monday 11:15: In-between classes -> status is AVAILABLE');
assert(stateXYZ1115.currentLocation === 'DES-203', `Monday 11:15: In-between classes -> shows Cabin DES-203, not future room`);

// Monday 11:30 AM: Next class begins in DES203 -> currentLocation = DES-203
const tMon1130 = { enabled: true, dayOfWeek: 1, hour: 11, minute: 30 };
const stateXYZ1130 = getFacultyLiveState(drXYZ, tMon1130);
assert(stateXYZ1130.status === 'BUSY', 'Monday 11:30: Next class active -> status is BUSY');
assert(stateXYZ1130.currentLocation === 'DES-203', `Monday 11:30: Next class active -> currentLocation is DES-203`);

// ---------------------------------------------------------------------------
// TEST 2: REAL ISE FACULTY TIMETABLE (Dr. Yogish H K)
// ---------------------------------------------------------------------------
console.log('\n--- TEST SUITE 2: Real Timetable Integration (Dr. Yogish H K) ---');
const yogish = facultyList.find((f: any) => f.name.includes('Yogish') || f.shortCode === 'YHK');
assert(!!yogish, `Found Dr. Yogish faculty record (Cabin: ${yogish?.cabinLocation})`);

// Monday 09:30 AM: Active class 09:00-09:55 in Room-101
const stateYogish0930 = getFacultyLiveState(yogish, tMon0930);
assert(stateYogish0930.status === 'BUSY', `Monday 09:30: Active class (09:00-09:55) -> status is BUSY`);
assert(stateYogish0930.currentLocation === 'Room-101', `Monday 09:30: Active class -> currentLocation is Room-101 (got ${stateYogish0930.currentLocation})`);
assert(stateYogish0930.locationSource === 'ACTIVE_CLASS', `Monday 09:30: locationSource is ACTIVE_CLASS`);

// Monday 10:30 AM: Free between 09:55 and 11:05 -> Cabin fallback
const stateYogish1030 = getFacultyLiveState(yogish, tMon1030);
assert(stateYogish1030.status === 'AVAILABLE', `Monday 10:30: Free between classes -> status is AVAILABLE`);
assert(stateYogish1030.currentLocation === yogish.cabinLocation, `Monday 10:30: currentLocation is Cabin fallback`);
assert(stateYogish1030.locationSource === 'CABIN_FALLBACK', `Monday 10:30: locationSource is CABIN_FALLBACK`);

// Monday 11:15 AM: Active class 11:05-12:00 in DES-106
const stateYogish1115 = getFacultyLiveState(yogish, tMon1115);
assert(stateYogish1115.status === 'BUSY', `Monday 11:15: Active class (11:05-12:00) -> status is BUSY`);
assert(stateYogish1115.currentLocation === 'DES-106', `Monday 11:15: Active class -> currentLocation is DES-106 (got ${stateYogish1115.currentLocation})`);

// Monday 12:15 PM: Class ended at 12:00 -> Cabin fallback
const tMon1215 = { enabled: true, dayOfWeek: 1, hour: 12, minute: 15 };
const stateYogish1215 = getFacultyLiveState(yogish, tMon1215);
assert(stateYogish1215.status === 'AVAILABLE', `Monday 12:15: Class ended -> status is AVAILABLE`);
assert(stateYogish1215.currentLocation === yogish.cabinLocation, `Monday 12:15: currentLocation is Cabin fallback`);

// Tuesday 12:00 PM: Active IDT Lab2 in DES-308
const tTue1200 = { enabled: true, dayOfWeek: 2, hour: 12, minute: 0 };
const stateYogishTue1200 = getFacultyLiveState(yogish, tTue1200);
assert(stateYogishTue1200.status === 'BUSY', `Tuesday 12:00: Active Lab -> status is BUSY`);
assert(stateYogishTue1200.currentLocation === 'DES-308', `Tuesday 12:00: Active Lab -> currentLocation is DES-308`);

// ---------------------------------------------------------------------------
// TEST 3: WEEKEND & OPERATING HOURS RULES
// ---------------------------------------------------------------------------
console.log('\n--- TEST SUITE 3: Weekend & Operating Hours Rules ---');
// Saturday 10:30 AM: Saturday Working Hours (09:00 - 13:00)
const tSat1030 = { enabled: true, dayOfWeek: 6, hour: 10, minute: 30 };
const stateSat1030 = getFacultyLiveState(yogish, tSat1030);
assert(stateSat1030.status === 'AVAILABLE', `Saturday 10:30 AM: Within working hours -> AVAILABLE`);
assert(stateSat1030.currentLocation === yogish.cabinLocation, `Saturday 10:30 AM: Cabin fallback`);

// Saturday 13:30 PM: After Saturday Half Day (ends at 13:00) -> OFF CAMPUS
const tSat1330 = { enabled: true, dayOfWeek: 6, hour: 13, minute: 30 };
const stateSat1330 = getFacultyLiveState(yogish, tSat1330);
assert(stateSat1330.status === 'OFF_CAMPUS', `Saturday 13:30 PM: After 13:00 -> status is OFF_CAMPUS`);
assert(stateSat1330.currentLocation === 'Off-Campus', `Saturday 13:30 PM: currentLocation is Off-Campus`);
assert(stateSat1330.locationSource === 'OFF_CAMPUS', `Saturday 13:30 PM: locationSource is OFF_CAMPUS`);

// Sunday: Off Campus all day
const tSun1100 = { enabled: true, dayOfWeek: 0, hour: 11, minute: 0 };
const stateSun1100 = getFacultyLiveState(yogish, tSun1100);
assert(stateSun1100.status === 'OFF_CAMPUS', `Sunday: Status is OFF_CAMPUS`);
assert(stateSun1100.currentLocation === 'Off-Campus', `Sunday: currentLocation is Off-Campus`);
assert(stateSun1100.locationSource === 'OFF_CAMPUS', `Sunday: locationSource is OFF_CAMPUS`);

// Weekday 17:00: After weekday hours (ends 16:30) -> OFF CAMPUS
const tMon1700 = { enabled: true, dayOfWeek: 1, hour: 17, minute: 0 };
const stateMon1700 = getFacultyLiveState(yogish, tMon1700);
assert(stateMon1700.status === 'OFF_CAMPUS', `Monday 17:00: After 16:30 -> status is OFF_CAMPUS`);
assert(stateMon1700.currentLocation === 'Off-Campus', `Monday 17:00: currentLocation is Off-Campus`);

// ---------------------------------------------------------------------------
// TEST 4: EDGE CASES (Malformed, Missing Room, Overlaps, Room Normalization)
// ---------------------------------------------------------------------------
console.log('\n--- TEST SUITE 4: Edge Cases & Robustness ---');
// Missing room schedule: Fallback to cabin without inventing room or crashing
const mockFacNoRoom: any = {
  id: 'fac-noroom',
  name: 'Prof. NoRoom',
  cabinLocation: 'LHC-210',
  department: 'Information Science and Engineering',
  weeklySchedule: {
    Monday: [{ time: '10:00 - 11:00', subject: 'Special Seminar' }] // no room property
  }
};
const stateNoRoom = getFacultyLiveState(mockFacNoRoom, tMon1030);
assert(stateNoRoom.status === 'BUSY', 'Missing room: status is BUSY');
assert(stateNoRoom.currentLocation === 'LHC-210', `Missing room: falls back to cabin LHC-210 (got ${stateNoRoom.currentLocation})`);
assert(stateNoRoom.locationSource === 'CABIN_FALLBACK', 'Missing room: locationSource is CABIN_FALLBACK');

// Overlapping schedules: Pick entry with verified room
const mockFacOverlap: any = {
  id: 'fac-overlap',
  name: 'Prof. Overlap',
  cabinLocation: 'LHC-210',
  department: 'ISE',
  weeklySchedule: {
    Monday: [
      { time: '10:00 - 11:00', subject: 'General Discussion', room: '' },
      { time: '10:00 - 11:00', subject: 'Advanced ML Lab', room: 'LHC-301' }
    ]
  }
};
const stateOverlap = getFacultyLiveState(mockFacOverlap, tMon1030);
assert(stateOverlap.status === 'BUSY', 'Overlapping schedule: status is BUSY');
assert(stateOverlap.currentLocation === 'LHC-301', `Overlapping schedule: selects entry with verified room LHC-301 (got ${stateOverlap.currentLocation})`);

// Room Normalization
assert(normalizeRoomName('LHC204') === 'LHC-204', 'Normalizes LHC204 -> LHC-204');
assert(normalizeRoomName('LHC 204') === 'LHC-204', 'Normalizes LHC 204 -> LHC-204');
assert(normalizeRoomName('DES203') === 'DES-203', 'Normalizes DES203 -> DES-203');
assert(normalizeRoomName('Room 101') === 'Room-101', 'Normalizes Room 101 -> Room-101');
assert(normalizeRoomName('Room101') === 'Room-101', 'Normalizes Room101 -> Room-101');
assert(normalizeRoomName('AB401') === 'AB-401', 'Normalizes AB401 -> AB-401');

console.log(`\n================================================================`);
console.log(`Summary: ${passCount} Passed, ${failCount} Failed`);
console.log('================================================================');

if (failCount > 0) process.exit(1);
