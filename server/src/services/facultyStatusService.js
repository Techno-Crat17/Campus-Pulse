/**
 * Normalizes room values for display and consistency (e.g. LHC204 -> LHC-204, DES203 -> DES-203).
 */
export function normalizeRoomName(room) {
  if (!room || typeof room !== 'string') return '';
  const trimmed = room.trim();
  if (!trimmed) return '';

  const lhcMatch = trimmed.match(/^LHC[-\s]?([0-9]+[A-Z]?)$/i);
  if (lhcMatch) return `LHC-${lhcMatch[1].toUpperCase()}`;

  const desMatch = trimmed.match(/^DES[-\s]?([0-9]+[A-Z]?)$/i);
  if (desMatch) return `DES-${desMatch[1].toUpperCase()}`;

  const abMatch = trimmed.match(/^AB[-\s]?([0-9]+[A-Z]?)$/i);
  if (abMatch) return `AB-${abMatch[1].toUpperCase()}`;

  const roomMatch = trimmed.match(/^Room[-\s]?([0-9]+[A-Z]?)$/i);
  if (roomMatch) return `Room-${roomMatch[1].toUpperCase()}`;

  const esbMatch = trimmed.match(/^ESB[-\s]?([0-9]+[A-Z]?)$/i);
  if (esbMatch) return `ESB-${esbMatch[1].toUpperCase()}`;

  return trimmed;
}

/**
 * Dynamic Faculty Status Service
 * Authoritative backend service calculating faculty availability, schedule, and presence
 * using Asia/Kolkata (IST) timezone.
 */

import {
  getCampusISTDate,
  parseScheduleInterval,
  minutesToFormattedTime,
  getCurrentCampusTime
} from '../utils/istTime.js';

export { getCurrentCampusTime };

/**
 * Returns today's verified schedule for a faculty member based on IST weekday.
 * Resolves from weeklySchedule for the specific IST day (Monday-Saturday).
 * On Sunday, returns [] (strictly no classes).
 */
export function getFacultyTodaySchedule(facultyRecord, dateOrSimulated) {
  if (!facultyRecord) return [];
  const istInfo = getCampusISTDate(dateOrSimulated);

  // Sunday: strictly no scheduled classes
  if (istInfo.isSunday) {
    return [];
  }

  const dayTitle = istInfo.dayTitle; // e.g. "Thursday"
  const weekly = facultyRecord.weeklySchedule;

  if (weekly && typeof weekly === 'object') {
    const dayList = weekly[dayTitle];
    if (Array.isArray(dayList)) {
      return dayList.map((item) => ({
        time: item.time,
        subject: item.subject || item.event || '',
        event: item.event || item.subject || '',
        room: item.room || ''
      }));
    }
  }

  // Fallback for faculty records that only have todaySchedule array
  if (Array.isArray(facultyRecord.todaySchedule) && (!weekly || Object.keys(weekly).length === 0)) {
    return facultyRecord.todaySchedule.map((item) => ({
      time: item.time,
      subject: item.subject || item.event || '',
      event: item.event || item.subject || '',
      room: item.room || ''
    }));
  }

  return [];
}

/**
 * Derives status type from event title
 */
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
  if (s.includes('AVAILABLE') || s.includes('CABIN') || s.includes('FREE')) return 'available';
  if (s.includes('OFF') || s.includes('CLOSED')) return 'off_campus';
  return 'busy';
}

/**
 * Returns primary status: "AVAILABLE" | "BUSY" | "OFF_CAMPUS" | "ENDING SOON"
 */
export function getFacultyStatus(facultyRecord, dateObj) {
  const istInfo = getCampusISTDate(dateObj);
  const currentMinutes = istInfo.totalMinutes;

  // Priority 1: Sunday -> OFF CAMPUS
  if (istInfo.isSunday) {
    return 'OFF_CAMPUS';
  }

  // Priority 2: Outside faculty campus hours -> OFF CAMPUS (Mon-Fri 09:00–16:30, Sat 09:00–13:00)
  if (!istInfo.isCampusHours) {
    return 'OFF_CAMPUS';
  }

  // Priority 3: Active schedule event in progress -> BUSY or ENDING SOON
  const todaySchedule = getFacultyTodaySchedule(facultyRecord, dateObj);
  for (const item of todaySchedule) {
    const interval = parseScheduleInterval(item.time);
    if (interval && currentMinutes >= interval.startMin && currentMinutes < interval.endMin) {
      if (interval.endMin - currentMinutes <= 10) {
        return 'ENDING SOON';
      }
      return 'BUSY';
    }
  }

  // Priority 4: No active schedule during working hours -> AVAILABLE
  return 'AVAILABLE';
}

/**
 * Centralized getFacultyLiveState function:
 * Authoritative logic returning status, location, schedule, and locationSource.
 *
 * Location Priority Order:
 * 1. Active class from today's verified schedule (ACTIVE_CLASS)
 * 2. Reliable explicit meeting/lab/event location from today's active schedule (ACTIVE_SCHEDULE_EVENT)
 * 3. Reliable explicit off-campus status (OFF_CAMPUS)
 * 4. Existing faculty current location if verified (EXPLICIT_LOCATION)
 * 5. Faculty cabin location as fallback (CABIN_FALLBACK)
 */
export function getFacultyLiveState(facultyRecord, dateObj) {
  const istInfo = getCampusISTDate(dateObj);
  const currentMinutes = istInfo.totalMinutes;
  const status = getFacultyStatus(facultyRecord, dateObj);
  const cabin = facultyRecord?.cabinLocation || 'Faculty Cabin';
  const todaySchedule = getFacultyTodaySchedule(facultyRecord, dateObj);

  if (status === 'OFF_CAMPUS') {
    const isSunday = istInfo.isSunday;
    const isSaturdayAfternoon = istInfo.isSaturday && currentMinutes >= 13 * 60;
    const isWeekdayAfternoon = istInfo.isWeekday && currentMinutes >= 16 * 60 + 30;
    const isMorningBeforeHours = currentMinutes < 9 * 60;

    let reason = 'Outside official faculty campus hours.';
    if (isSunday) {
      reason = 'Faculty are off campus on Sundays.';
    } else if (isSaturdayAfternoon) {
      reason = 'Faculty campus hours ended at 1:00 PM.';
    } else if (isWeekdayAfternoon) {
      reason = 'Faculty campus hours ended at 4:30 PM.';
    } else if (isMorningBeforeHours) {
      reason = 'Faculty campus hours start at 9:00 AM.';
    }

    const nextAvailableTime =
      isSunday || isSaturdayAfternoon
        ? 'Monday at 09:00 AM'
        : isMorningBeforeHours
        ? 'Today at 09:00 AM'
        : 'Next Working Day at 09:00 AM';

    const location = 'Off-Campus';

    return {
      status: 'OFF_CAMPUS',
      statusType: 'off_campus',
      statusReason: reason,
      liveStatus: 'OFF_CAMPUS',
      liveLocation: location,
      currentLocation: location,
      locationSource: 'OFF_CAMPUS',
      activeSchedule: null,
      currentEvent: null,
      currentActivity: null,
      activityEndTime: null,
      nextAvailableTime,
      liveNextAvailableTime: nextAvailableTime,
      isCollegeOpen: false,
      activeEvent: null,
      activeRoom: null,
      day: istInfo.dayNormalized,
      dayTitle: istInfo.dayTitle,
      date: istInfo.dateString,
      currentTime: istInfo.timeString,
      timezone: 'Asia/Kolkata',
      todaySchedule
    };
  }

  // Active event currently in progress
  const matchingActiveItems = [];

  for (const item of todaySchedule) {
    const interval = parseScheduleInterval(item.time);
    if (interval && currentMinutes >= interval.startMin && currentMinutes < interval.endMin) {
      matchingActiveItems.push({ item, interval });
    }
  }

  let activeEvent = null;
  let activeInterval = null;

  if (matchingActiveItems.length > 0) {
    if (matchingActiveItems.length > 1) {
      console.warn(`[FacultyLiveState] Overlapping schedule for ${facultyRecord?.name}: using most specific entry`);
      activeEvent = matchingActiveItems.find((m) => m.item.room && m.item.room.trim().length > 0)?.item || matchingActiveItems[0].item;
      activeInterval = matchingActiveItems.find((m) => m.item.room && m.item.room.trim().length > 0)?.interval || matchingActiveItems[0].interval;
    } else {
      activeEvent = matchingActiveItems[0].item;
      activeInterval = matchingActiveItems[0].interval;
    }
  }

  if ((status === 'BUSY' || status === 'ENDING SOON') && activeEvent && activeInterval) {
    const normalizedRoom = normalizeRoomName(activeEvent.room);
    const hasRoom = Boolean(normalizedRoom && normalizedRoom.length > 0);

    let locationText = cabin;
    let locationSource = 'CABIN_FALLBACK';

    if (hasRoom) {
      const eventLower = (activeEvent.event || activeEvent.subject || '').toLowerCase();
      if (
        eventLower.includes('meeting') ||
        eventLower.includes('lab') ||
        eventLower.includes('seminar') ||
        eventLower.includes('workshop') ||
        eventLower.includes('review')
      ) {
        locationSource = 'ACTIVE_SCHEDULE_EVENT';
      } else {
        locationSource = 'ACTIVE_CLASS';
      }
      locationText = normalizedRoom;
    } else {
      locationSource = 'CABIN_FALLBACK';
      locationText = cabin;
    }

    // Next available time: walk forward through contiguous back-to-back classes
    let chainEndMin = activeInterval.endMin;
    for (const other of todaySchedule) {
      const otherInt = parseScheduleInterval(other.time);
      if (otherInt && otherInt.startMin <= chainEndMin && otherInt.endMin > chainEndMin) {
        chainEndMin = otherInt.endMin;
      }
    }

    const nextAvail = minutesToFormattedTime(chainEndMin);
    const isEndingSoon = status === 'ENDING SOON';

    const liveActiveSchedule = {
      time: activeEvent.time,
      event: activeEvent.event,
      subject: activeEvent.subject,
      room: normalizedRoom || undefined,
      startTime: activeInterval.startFormatted,
      endTime: activeInterval.endFormatted
    };

    return {
      status: isEndingSoon ? 'ENDING SOON' : 'BUSY',
      statusType: 'busy',
      statusReason: isEndingSoon ? 'CLASS_ENDING_SOON' : 'CURRENT_SCHEDULED_ACTIVITY',
      liveStatus: isEndingSoon ? 'ENDING SOON' : 'BUSY',
      liveLocation: locationText,
      currentLocation: locationText,
      locationSource,
      activeSchedule: liveActiveSchedule,
      currentEvent: activeEvent.event,
      currentActivity: {
        subject: activeEvent.subject,
        startTime: activeInterval.startFormatted,
        endTime: activeInterval.endFormatted,
        room: normalizedRoom || undefined
      },
      activityEndTime: activeInterval.endFormatted,
      scheduleStart: activeInterval.startFormatted,
      scheduleEnd: activeInterval.endFormatted,
      nextAvailableTime: nextAvail,
      liveNextAvailableTime: nextAvail,
      isCollegeOpen: true,
      activeEvent: activeEvent.event,
      activeRoom: normalizedRoom || null,
      day: istInfo.dayNormalized,
      dayTitle: istInfo.dayTitle,
      date: istInfo.dateString,
      currentTime: istInfo.timeString,
      timezone: 'Asia/Kolkata',
      todaySchedule
    };
  }

  // AVAILABLE
  let nextUpcoming = null;
  for (const item of todaySchedule) {
    const interval = parseScheduleInterval(item.time);
    if (interval && interval.startMin > currentMinutes) {
      if (!nextUpcoming || interval.startMin < nextUpcoming.startMin) {
        nextUpcoming = interval;
      }
    }
  }

  const nextAvailStr = nextUpcoming ? `Available until ${nextUpcoming.startFormatted}` : 'Available Now';
  const locationSource = 'CABIN_FALLBACK';

  return {
    status: 'AVAILABLE',
    statusType: 'available',
    statusReason: 'ON_CAMPUS_NO_ACTIVE_SCHEDULE',
    liveStatus: 'AVAILABLE',
    liveLocation: cabin,
    currentLocation: cabin,
    locationSource,
    activeSchedule: null,
    currentEvent: null,
    currentActivity: null,
    activityEndTime: null,
    nextAvailableTime: nextAvailStr,
    liveNextAvailableTime: nextAvailStr,
    isCollegeOpen: true,
    activeEvent: null,
    activeRoom: cabin,
    day: istInfo.dayNormalized,
    dayTitle: istInfo.dayTitle,
    date: istInfo.dateString,
    currentTime: istInfo.timeString,
    timezone: 'Asia/Kolkata',
    todaySchedule
  };
}

export const getFacultyDynamicStatus = getFacultyLiveState;
export const calculateFacultyDynamicStatus = getFacultyLiveState;
export const getFacultyStatusDetails = getFacultyLiveState;
export const getFacultyLiveStatus = getFacultyLiveState;

