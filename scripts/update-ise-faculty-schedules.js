import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildFacultySchedules, FACULTY_CODE_MAP } from './parse-ise-timetable.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const facultyPath = path.join(__dirname, '../src/data/faculty_msrit_dynamic.json');
const facultyList = JSON.parse(fs.readFileSync(facultyPath, 'utf8'));

const schedules = buildFacultySchedules();

// Map faculty name / id to schedule
// Mapping logic:
const ISE_FACULTY_ID_MAP = {
  'fac_1': 'Sumana',
  'fac_8': 'Savita K',
  'fac_2': 'Yogish',
  'fac_3': 'Krishna Raj',
  'fac_4': 'Geetha V',
  'fac_5': 'Lincy',
  'fac_6': 'Pushpalatha',
  'fac_7': 'Mani Sekhar',
  'fac_9': 'Anitha P',
  'fac_10': 'Jagadeesh',
  'fac_12': 'Pra',
  'fac_13': 'Suresh Kumar',
  'fac_14': 'Shruti G',
  'fac_19': 'Jr Shruti',
  'fac_15': 'Evangeline D',
  'fac_16': 'Mushtaq',
  'fac_17': 'Kusuma',
  'fac_18': 'Shivanand',
  'fac_20': 'Kavya',
  'fac_21': 'Charunayana',
  'fac_22': 'Shanmuga Priya',
  'fac_23': 'Subia Salma',
  'fac_24': 'Sudha Kamshetty',
  'fac_25': 'Zeenat',
  'fac_11': 'Pratima'
};

// Also create code lookup for any other name matching
const CODE_BY_NAME = {};
for (const [code, name] of Object.entries(FACULTY_CODE_MAP)) {
  CODE_BY_NAME[name] = code;
}

let updatedCount = 0;

for (const fac of facultyList) {
  const matchKey = ISE_FACULTY_ID_MAP[fac.id];
  if (matchKey && schedules[matchKey]) {
    const s = schedules[matchKey];
    fac.shortCode = s.code;
    fac.weeklySchedule = s.schedule;

    // Convert todaySchedule to simplified list (TIME + SUBJECT only)
    // We can populate todaySchedule dynamically or default to today's schedule
    updatedCount++;
    console.log(`Updated [${s.code}] ${fac.name} (${matchKey})`);
  }
}

fs.writeFileSync(facultyPath, JSON.stringify(facultyList, null, 2), 'utf8');
console.log(`\n✅ Successfully updated ${updatedCount} ISE faculty schedules in ${facultyPath}`);
