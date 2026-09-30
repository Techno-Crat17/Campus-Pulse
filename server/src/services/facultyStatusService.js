/**
 * Dynamic Faculty Status Service
 * Calculates faculty location, availability, and active schedule status based on current working hours.
 */

export function getCurrentCampusTime() {
  const now = new Date();
  try {
    const kolkataStr = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    return new Date(kolkataStr);
  } catch {
    return now;
  }
}

export function parseScheduleTime(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split('-').map(s => s.trim());
  if (parts.length !== 2) return null;

  const rawStart = parts[0];
  const rawEnd = parts[1];
  const isEndPM = /PM/i.test(rawEnd);

  const parseHourMin = (str, isEndPMContext) => {
    const isPM = /PM/i.test(str);
    const isAM = /AM/i.test(str);
    const cleaned = str.replace(/(AM|PM)/i, '').trim();
    const [hStr, mStr] = cleaned.split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr || '0', 10);

    if (isPM) {
      if (h < 12) h += 12;
    } else if (isAM) {
      if (h === 12) h = 0;
    } else {
      if (h >= 1 && h <= 7) h += 12;
      else if (isEndPMContext && h < 12 && h >= 1 && h <= 7) h += 12;
    }
    return h * 60 + m;
  };

  try {
    let startMin = parseHourMin(rawStart, isEndPM);
    let endMin = parseHourMin(rawEnd, isEndPM);
    if (rawStart.startsWith('11:') && isEndPM) {
      startMin = 11 * 60 + parseInt(rawStart.split(':')[1] || '0', 10);
    }
    return {
      start: startMin,
      end: endMin
    };
  } catch {
    return null;
  }
}

export function deriveStatusFromEvent(event) {
  const ev = (event || '').toLowerCase().trim();
  if (ev.includes('lecture') || ev.includes('class') || ev.includes('theory') || ev.includes('teaching')) {
    return 'IN CLASS';
  }
  if (ev.includes('lab') || ev.includes('laboratory') || ev.includes('practical')) {
    return 'IN LAB';
  }
  if (ev.includes('meeting') || ev.includes('conference') || ev.includes('council')) {
    return 'IN MEETING';
  }
  if (ev.includes('project review') || ev.includes('project') || ev.includes('viva') || ev.includes('eval') || ev.includes('review')) {
    return 'IN PROJECT REVIEW';
  }
  if (ev.includes('mentoring') || ev.includes('consultation') || ev.includes('guidance') || ev.includes('consult')) {
    return 'AVAILABLE FOR CONSULTATION';
  }
  if (ev.includes('seminar') || ev.includes('symposium')) {
    return 'IN SEMINAR';
  }
  if (ev.includes('workshop') || ev.includes('bootcamp')) {
    return 'IN WORKSHOP';
  }
  return 'BUSY';
}

export function getStatusTypeFromStatus(status) {
  const s = (status || '').toUpperCase();
  if (s.includes('CLASS') || s.includes('LECTURE')) return 'class';
  if (s.includes('LAB')) return 'lab';
  if (s.includes('MEETING')) return 'meeting';
  if (s.includes('PROJECT')) return 'project_review';
  if (s.includes('CONSULTATION')) return 'consultation';
  if (s.includes('CABIN')) return 'cabin';
  if (s.includes('SEMINAR')) return 'seminar';
  if (s.includes('WORKSHOP')) return 'workshop';
  if (s.includes('CLOSED')) return 'closed';
  return 'busy';
}

function minutesToFormatted(totalMins) {
  let hours = Math.floor(totalMins / 60);
  const minutes = totalMins % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const minsStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${minsStr} ${ampm}`;
}

export function getFacultyDynamicStatus(facultyRecord, dateObj) {
  const targetDate = dateObj instanceof Date ? dateObj : getCurrentCampusTime();
  const day = targetDate.getDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat
  const currentMinutes = targetDate.getHours() * 60 + targetDate.getMinutes();

  const isSunday = day === 0;
  const isSaturday = day === 6;

  let isWorkingHours = false;
  if (isSunday) {
    isWorkingHours = false;
  } else if (isSaturday) {
    isWorkingHours = currentMinutes >= (9 * 60) && currentMinutes < (13 * 60 + 30); // 09:00 - 13:30
  } else {
    isWorkingHours = currentMinutes >= (9 * 60) && currentMinutes < (17 * 60); // 09:00 - 17:00
  }

  const cabin = facultyRecord.cabinLocation || 'AVAILABLE';

  if (!isWorkingHours) {
    const nextAvailableTime = isSunday || (isSaturday && currentMinutes >= 13 * 60 + 30)
      ? 'Monday at 09:00 AM'
      : 'Next Working Day at 09:00 AM';

    return {
      status: 'COLLEGE CLOSED',
      statusType: 'closed',
      liveStatus: 'COLLEGE CLOSED',
      liveLocation: 'Off-Campus',
      currentLocation: 'Off-Campus',
      currentEvent: null,
      nextAvailableTime,
      liveNextAvailableTime: nextAvailableTime,
      isCollegeOpen: false,
      activeEvent: null,
      activeRoom: null
    };
  }

  // Check today's schedule for active events
  const schedule = facultyRecord.todaySchedule || [];
  let activeEvent = null;
  let activeRange = null;

  for (const item of schedule) {
    const range = parseScheduleTime(item.time);
    if (range && currentMinutes >= range.start && currentMinutes < range.end) {
      activeEvent = item;
      activeRange = range;
      break;
    }
  }

  if (activeEvent && activeRange) {
    const statusText = deriveStatusFromEvent(activeEvent.event);
    const statusType = getStatusTypeFromStatus(statusText);
    const locationText = activeEvent.room ? activeEvent.room : cabin;

    // Next available time: chain contiguous events
    let chainEndMin = activeRange.end;
    for (const other of schedule) {
      const otherRange = parseScheduleTime(other.time);
      if (otherRange && otherRange.start <= chainEndMin && otherRange.end > chainEndMin) {
        chainEndMin = otherRange.end;
      }
    }

    const nextAvail = minutesToFormatted(chainEndMin);

    return {
      status: statusText,
      statusType,
      liveStatus: statusText,
      liveLocation: locationText,
      currentLocation: locationText,
      currentEvent: activeEvent.event,
      scheduleStart: minutesToFormatted(activeRange.start),
      scheduleEnd: minutesToFormatted(activeRange.end),
      nextAvailableTime: nextAvail,
      liveNextAvailableTime: nextAvail,
      isCollegeOpen: true,
      activeEvent: activeEvent.event,
      activeRoom: activeEvent.room || null
    };
  }

  // No active schedule during working hours -> AVAILABLE IN CABIN
  let nextUpcoming = null;
  for (const item of schedule) {
    const range = parseScheduleTime(item.time);
    if (range && range.start > currentMinutes) {
      if (!nextUpcoming || range.start < nextUpcoming.start) {
        nextUpcoming = range;
      }
    }
  }

  const nextAvailStr = nextUpcoming ? `Available until ${minutesToFormatted(nextUpcoming.start)}` : 'Available Now';

  return {
    status: 'AVAILABLE IN CABIN',
    statusType: 'cabin',
    liveStatus: 'AVAILABLE IN CABIN',
    liveLocation: cabin,
    currentLocation: cabin,
    currentEvent: null,
    nextAvailableTime: nextAvailStr,
    liveNextAvailableTime: nextAvailStr,
    isCollegeOpen: true,
    activeEvent: null,
    activeRoom: cabin
  };
}

export const calculateFacultyDynamicStatus = getFacultyDynamicStatus;
