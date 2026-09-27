const fs = require('fs');
const path = require('path');

const facultyList = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/faculty_msrit.json'), 'utf8'));

function parseTimeStrToMinutes(timeStr, isEndPM = false) {
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
    // Neither AM nor PM specified explicitly (e.g., "11:30" or "02:00" in "02:00 - 04:00 PM")
    if (isEndPM) {
      if (hours < 12 && hours >= 1 && hours <= 7) {
        hours += 12;
      }
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
  let endMin = parseTimeStrToMinutes(rawEnd, isEndPM);
  let startMin = parseTimeStrToMinutes(rawStart, isEndPM);

  // Special check: if "11:30 - 01:00 PM", 11:30 is AM (690 min), 01:00 PM is PM (780 min)
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
  if (ev.includes('lab') || ev.includes('practical') || ev.includes('experiment')) {
    return 'In Lab';
  }
  if (ev.includes('meeting') || ev.includes('conference') || ev.includes('committee')) {
    return 'In Meeting';
  }
  if (ev.includes('mentoring') || ev.includes('consultation') || ev.includes('guidance')) {
    return 'Available for Consultation';
  }
  if (ev.includes('project review') || ev.includes('viva') || ev.includes('eval')) {
    return 'In Project Review';
  }
  return 'Busy';
}

function calculateFacultyStatus(fac, hour, minute, dayOfWeek = 1) {
  const totalMins = hour * 60 + minute;
  const startCollegeMins = 9 * 60;  // 09:00 AM
  const endCollegeMins = 17 * 60;  // 05:00 PM
  const isWorkingDay = [1, 2, 3, 4, 5].includes(dayOfWeek);

  if (!isWorkingDay || totalMins < startCollegeMins || totalMins >= endCollegeMins) {
    return {
      status: 'College Closed',
      currentLocation: 'Off-Campus',
      nextAvailable: 'Next Working Day at 09:00 AM'
    };
  }

  for (const item of fac.todaySchedule || []) {
    const interval = parseScheduleInterval(item.time);
    if (interval && totalMins >= interval.startMin && totalMins < interval.endMin) {
      return {
        status: deriveStatusFromEvent(item.event),
        currentLocation: item.room || fac.cabinLocation,
        nextAvailable: interval.endFormatted
      };
    }
  }

  let upcomingNextTime = null;
  for (const item of fac.todaySchedule || []) {
    const interval = parseScheduleInterval(item.time);
    if (interval && interval.startMin > totalMins) {
      upcomingNextTime = interval.startFormatted;
      break;
    }
  }

  return {
    status: 'Available in Cabin',
    currentLocation: fac.cabinLocation,
    nextAvailable: upcomingNextTime || 'Now (Consultation Open)'
  };
}

const testFac = facultyList.find(f => f.name.includes('Yogish'));

console.log('Testing Dr. Yogish H K at different times:');
console.log('At 10:15 AM:', calculateFacultyStatus(testFac, 10, 15));
console.log('At 12:00 PM:', calculateFacultyStatus(testFac, 12, 0));
console.log('At 02:30 PM:', calculateFacultyStatus(testFac, 14, 30));
console.log('At 05:30 PM:', calculateFacultyStatus(testFac, 17, 30));
console.log('On Sunday 10:15 AM:', calculateFacultyStatus(testFac, 10, 15, 0));
