/**
 * Dynamic Faculty Status Service
 * Calculates faculty location, availability, and active schedule status based on current working hours.
 */

export function parseScheduleTime(timeStr) {
  // Format example: "09:00 - 10:00" or "09:00 AM - 10:00 AM" or "14:00 - 16:00"
  if (!timeStr) return null;
  const parts = timeStr.split('-').map(s => s.trim());
  if (parts.length !== 2) return null;

  const parseHourMin = (str) => {
    const isPM = /PM/i.test(str);
    const isAM = /AM/i.test(str);
    const cleaned = str.replace(/(AM|PM)/i, '').trim();
    const [hStr, mStr] = cleaned.split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr || '0', 10);

    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return h * 60 + m;
  };

  try {
    return {
      start: parseHourMin(parts[0]),
      end: parseHourMin(parts[1])
    };
  } catch {
    return null;
  }
}

export function calculateFacultyDynamicStatus(facultyRecord, dateObj = new Date()) {
  const day = dateObj.getDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat
  const currentMinutes = dateObj.getHours() * 60 + dateObj.getMinutes();

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

  const cabin = facultyRecord.cabinLocation || 'Faculty Cabin';

  if (!isWorkingHours) {
    return {
      status: 'College Closed',
      liveStatus: 'College Closed',
      liveLocation: 'Off-Campus',
      currentLocation: 'Off-Campus',
      liveNextAvailableTime: isSunday ? 'Opens Mon at 09:00 AM' : 'Opens Next Working Day at 09:00 AM'
    };
  }

  // Check today's schedule for active events
  const schedule = facultyRecord.todaySchedule || [];
  let activeEvent = null;

  for (const item of schedule) {
    const range = parseScheduleTime(item.time);
    if (range && currentMinutes >= range.start && currentMinutes < range.end) {
      activeEvent = item;
      break;
    }
  }

  if (activeEvent) {
    const eventType = activeEvent.event.toLowerCase();
    let statusText = 'Busy';

    if (eventType.includes('lecture')) statusText = 'In Lecture';
    else if (eventType.includes('lab')) statusText = 'In Lab';
    else if (eventType.includes('meeting')) statusText = 'In Meeting';
    else if (eventType.includes('consult') || eventType.includes('mentor')) statusText = 'Available for Consultation';
    else if (eventType.includes('project') || eventType.includes('review')) statusText = 'In Project Review';

    const locationText = activeEvent.room ? activeEvent.room : cabin;

    return {
      status: statusText,
      liveStatus: statusText,
      liveLocation: locationText,
      currentLocation: locationText,
      activeEvent: activeEvent.event,
      liveNextAvailableTime: 'Check Schedule Timeline'
    };
  }

  // No active schedule during working hours
  return {
    status: 'Available in Cabin',
    liveStatus: 'Available in Cabin',
    liveLocation: cabin,
    currentLocation: cabin,
    liveNextAvailableTime: 'Available Now'
  };
}
