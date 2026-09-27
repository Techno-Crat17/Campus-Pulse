const fs = require('fs');
const path = require('path');

const facultyList = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/faculty_msrit_dynamic.json'), 'utf8'));

const COLLEGE_HOURS_CONFIG = {
  start: "09:00",
  end: "17:00",
  workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
};

const DAYS_OF_WEEK_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function parseTimeString(timeStr, isEndPMContext = false) {
  const clean = timeStr.trim().toUpperCase();
  const isPM = clean.includes('PM');
  const isAM = clean.includes('AM');
  
  const numbersOnly = clean.replace(/[A-Z]/g, '').trim();
  const parts = numbersOnly.split(':');
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1] || '0', 10);

  if (isPM) {
    if (hours < 12) hours += 12;
  } else if (isAM) {
    if (hours === 12) hours = 0;
  } else {
    if (hours >= 1 && hours <= 7) {
      hours += 12;
    } else if (isEndPMContext && hours < 12 && hours >= 1 && hours <= 7) {
      hours += 12;
    }
  }

  return hours * 60 + minutes;
}

function minutesToFormattedTime(totalMins) {
  let hours = Math.floor(totalMins / 60);
  const minutes = totalMins % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const minsStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${minsStr} ${ampm}`;
}

function parseScheduleInterval(timeRangeStr) {
  const parts = timeRangeStr.split('-');
  if (parts.length < 2) return null;

  const rawStart = parts[0].trim();
  const rawEnd = parts[1].trim();

  const isEndPM = rawEnd.toUpperCase().includes('PM');
  let endMin = parseTimeString(rawEnd, isEndPM);
  let startMin = parseTimeString(rawStart, isEndPM);

  if (rawStart.startsWith('11:') && isEndPM) {
    startMin = 11 * 60 + parseInt(rawStart.split(':')[1] || '0', 10);
  }

  return {
    startMin,
    endMin,
    startFormatted: minutesToFormattedTime(startMin),
    endFormatted: minutesToFormattedTime(endMin)
  };
}

function deriveStatusFromEvent(event) {
  const ev = event.toLowerCase().trim();
  if (ev.includes('lecture') || ev.includes('class') || ev.includes('teaching')) {
    return 'In Lecture';
  }
  if (ev.includes('lab') || ev.includes('laboratory') || ev.includes('practical')) {
    return 'In Lab';
  }
  if (ev.includes('meeting') || ev.includes('conference')) {
    return 'In Meeting';
  }
  if (ev.includes('mentoring') || ev.includes('consultation') || ev.includes('guidance')) {
    return 'Available for Consultation';
  }
  if (ev.includes('project review') || ev.includes('viva') || ev.includes('eval')) {
    return 'In Project Review';
  }
  if (ev.includes('seminar') || ev.includes('symposium')) {
    return 'In Seminar';
  }
  if (ev.includes('workshop') || ev.includes('bootcamp')) {
    return 'In Workshop';
  }
  return 'Busy';
}

function getFacultyLiveStatus(fac, hour, minute, dayOfWeekIndex = 1) {
  const totalMins = hour * 60 + minute;
  const dayName = DAYS_OF_WEEK_NAMES[dayOfWeekIndex];

  const startCollegeMins = 9 * 60;  // 09:00 AM
  const endCollegeMins = 17 * 60;  // 05:00 PM (17:00)

  const isWorkingDay = COLLEGE_HOURS_CONFIG.workingDays.includes(dayName);
  const isWithinHours = totalMins >= startCollegeMins && totalMins < endCollegeMins;

  if (!isWorkingDay || !isWithinHours) {
    return {
      liveStatus: 'College Closed',
      liveLocation: 'Off-Campus',
      liveNextAvailableTime: 'Next Working Day at 09:00 AM',
      isCollegeOpen: false
    };
  }

  // Search today's schedule
  for (const item of fac.todaySchedule || []) {
    const interval = parseScheduleInterval(item.time);
    if (interval && totalMins >= interval.startMin && totalMins < interval.endMin) {
      return {
        liveStatus: deriveStatusFromEvent(item.event),
        liveLocation: item.room || fac.cabinLocation,
        liveNextAvailableTime: interval.endFormatted,
        isCollegeOpen: true
      };
    }
  }

  // Between events during college hours
  let upcomingNextTime = null;
  for (const item of fac.todaySchedule || []) {
    const interval = parseScheduleInterval(item.time);
    if (interval && interval.startMin > totalMins) {
      upcomingNextTime = interval.startFormatted;
      break;
    }
  }

  return {
    liveStatus: 'Available in Cabin',
    liveLocation: fac.cabinLocation,
    liveNextAvailableTime: upcomingNextTime || 'Available after schedule',
    isCollegeOpen: true
  };
}

console.log(`Total Faculty Records in JSON: ${facultyList.length}`);

const sampleFac = facultyList[0];
console.log('\nTesting Acceptance Scenarios on', sampleFac.name);
console.log('09:00 AM:', getFacultyLiveStatus(sampleFac, 9, 0));
console.log('10:15 AM (during lecture):', getFacultyLiveStatus(sampleFac, 10, 15));
console.log('12:00 PM (during lab):', getFacultyLiveStatus(sampleFac, 12, 0));
console.log('02:30 PM (during mentoring):', getFacultyLiveStatus(sampleFac, 14, 30));
console.log('16:30 PM (no later schedule):', getFacultyLiveStatus(sampleFac, 16, 30));
console.log('17:01 PM (after hours):', getFacultyLiveStatus(sampleFac, 17, 1));
console.log('Saturday 10:15 AM (Saturday Working Day):', getFacultyLiveStatus(sampleFac, 10, 15, 6));
console.log('Sunday 10:15 AM (Sunday Closed):', getFacultyLiveStatus(sampleFac, 10, 15, 0));
