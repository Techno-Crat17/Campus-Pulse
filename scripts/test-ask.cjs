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

function processAskQuery(query, hour = 10, minute = 15, dayIndex = 1) {
  const q = query.toLowerCase().trim();

  // 1. Check for email query
  if (q.includes('email')) {
    const cleanQ = q
      .replace(/\b(give|me|the|email|of|what|is|address|official|dr|prof)\b/gi, '')
      .replace(/\./g, '')
      .trim();

    // First try exact name match
    let facs = facultyList.filter(f => {
      const n = f.name.toLowerCase().replace(/\./g, '').trim();
      return n.includes(cleanQ) || cleanQ.includes(n);
    });

    if (facs.length === 0) {
      facs = facultyList.filter(f => {
        const n = f.name.toLowerCase().replace(/\./g, '').trim();
        const qWords = cleanQ.split(/\s+/).filter(w => w.length > 2);
        return qWords.length > 0 && qWords.every(w => n.includes(w));
      });
    }

    if (facs.length === 1) {
      const f = facs[0];
      return `${f.name}'s official email address is ${f.email}.\n\nDepartment: ${f.department}\nCabin: ${f.cabinLocation}`;
    } else if (facs.length > 1) {
      return `Multiple faculty members matched your email query:\n${facs.map(f => `• ${f.name} (${f.email})`).join('\n')}`;
    }
  }

  // 2. Check for HOD query
  if (q.includes('hod') || q.includes('head of department')) {
    const hods = facultyList.filter(f => f.designation.toLowerCase().includes('hod') || f.designation.toLowerCase().includes('head of department'));
    let targetDept = '';
    if (q.includes('ise') || q.includes('information science')) targetDept = 'information science';
    else if (q.includes('cse') || q.includes('computer science')) targetDept = 'computer science';
    else if (q.includes('ece') || q.includes('electronics')) targetDept = 'electronics';

    const match = hods.find(f => f.department.toLowerCase().includes(targetDept));
    if (match) {
      const live = getFacultyLiveStatus(match, hour, minute, dayIndex);
      return `The HOD of ${match.department} is ${match.name}.\n\nCabin: ${match.cabinLocation}\nEmail: ${match.email}\nStatus: ${live.liveStatus} (${live.liveLocation})`;
    }
  }

  // 3. Department faculty list query
  if (q.includes('faculty in') || q.includes('faculty are in') || q.includes('show all') || q.includes('which faculty')) {
    let targetDept = '';
    if (q.includes('ise') || q.includes('information science')) targetDept = 'Information Science';
    else if (q.includes('cse') || q.includes('computer science')) targetDept = 'Computer Science';

    if (targetDept) {
      const list = facultyList.filter(f => f.department.toLowerCase().includes(targetDept.toLowerCase()));
      return `Found ${list.length} faculty members in ${targetDept}:\n${list.slice(0, 6).map(f => `• ${f.name} (${f.designation}) - Cabin: ${f.cabinLocation}`).join('\n')}`;
    }
  }

  // 4. Clean name matching using word boundaries
  const cleanNameQuery = q
    .replace(/\b(where|is|the|cabin|of|located|available|which|department|does|belong|to|dr|prof|find|who|give|me)\b/gi, '')
    .replace(/\./g, '')
    .trim();

  const matches = facultyList.filter(f => {
    const n = f.name.toLowerCase().replace(/\./g, '').trim();
    if (n.includes(cleanNameQuery)) return true;
    const qWords = cleanNameQuery.split(/\s+/).filter(w => w.length > 2);
    return qWords.length > 0 && qWords.every(w => n.includes(w));
  });

  if (matches.length === 1) {
    const f = matches[0];
    const live = getFacultyLiveStatus(f, hour, minute, dayIndex);

    if (!live.isCollegeOpen) {
      return `College is currently closed.\n\n${f.name}'s next availability can be checked during college hours.`;
    }

    if (live.liveStatus === 'Available in Cabin') {
      return `${f.name} is currently available in their cabin.\n\nDepartment: ${f.department}\nCabin: ${f.cabinLocation}\nStatus: Available in Cabin`;
    }

    return `${f.name} is currently ${live.liveStatus.toLowerCase()}.\n\nDepartment: ${f.department}\nLocation: ${live.liveLocation}\nStatus: ${live.liveStatus}\nNext available: ${live.liveNextAvailableTime}`;
  } else if (matches.length > 1) {
    return `Multiple faculty members matched your query:\n${matches.map(f => `• ${f.name} (${f.department})`).join('\n')}\n\nPlease specify the full name.`;
  }

  return "I couldn't find that faculty member in the available MSRIT faculty data.";
}

console.log('Testing ASK Queries:');
console.log('\nQuery: "Give me the email of Dr. Krishna Raj P. M."');
console.log(processAskQuery('Give me the email of Dr. Krishna Raj P. M.', 10, 15));
