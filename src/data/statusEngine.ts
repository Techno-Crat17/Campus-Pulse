export { COLLEGE_HOURS_CONFIG } from '../config/collegeConfig';
import type { MSRITFacultyRecord } from './facultyData';
import { parseCurrentTime, getCurrentCampusTime, isLibraryOpen, getLibraryOccupancy, calculateLibraryOccupancy } from './libraryData';
export { parseCurrentTime, getCurrentCampusTime, isLibraryOpen, getLibraryOccupancy, calculateLibraryOccupancy };

export type FacultyStatusType = 'AVAILABLE' | 'BUSY' | 'OFF_CAMPUS';

export interface FacultyDynamicStatus {
  status: FacultyStatusType;
  statusType: 'available' | 'busy' | 'off_campus';
  statusReason?: string;
  currentLocation: string;
  currentEvent: string | null;
  scheduleStart?: string;
  scheduleEnd?: string;
  nextAvailableTime: string;
  isCollegeOpen: boolean;

  // Backwards compatibility aliases
  liveStatus: FacultyStatusType;
  liveLocation: string;
  liveNextAvailableTime: string;
  activeEvent: string | null;
  activeRoom: string | null;
}

export type CalculatedFacultyLiveStatus = FacultyDynamicStatus;

export interface SimulatedTimeState {
  enabled: boolean;
  hour: number;
  minute: number;
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
}

export interface CampusOperatingHours {
  dayOfWeek: number;
  dayName: string;
  isOpenDay: boolean;
  isHalfDay: boolean;
  openMinutes: number;
  closeMinutes: number;
  openTimeStr: string;
  closeTimeStr: string;
  scheduleSummary: string;
}

const DAYS_OF_WEEK_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Returns faculty campus operating hours configuration for a given date/time:
 * - Monday–Friday: 09:00–16:30 (4:30 PM)
 * - Saturday: 09:00–13:00 (1:00 PM Half Day)
 * - Sunday: OFF CAMPUS ALL DAY
 */
export function getCampusOperatingHours(date?: Date | SimulatedTimeState | null): CampusOperatingHours {
  const { day } = parseCurrentTime(date);
  const dayName = DAYS_OF_WEEK_NAMES[day];

  // Sunday: Closed / Off campus all day
  if (day === 0) {
    return {
      dayOfWeek: 0,
      dayName: 'Sunday',
      isOpenDay: false,
      isHalfDay: false,
      openMinutes: 0,
      closeMinutes: 0,
      openTimeStr: 'CLOSED',
      closeTimeStr: 'CLOSED',
      scheduleSummary: 'OFF CAMPUS'
    };
  }

  // Saturday: 09:00–13:00 (1:00 PM Half day)
  if (day === 6) {
    return {
      dayOfWeek: 6,
      dayName: 'Saturday',
      isOpenDay: true,
      isHalfDay: true,
      openMinutes: 9 * 60, // 540
      closeMinutes: 13 * 60, // 780 (01:00 PM)
      openTimeStr: '09:00',
      closeTimeStr: '13:00',
      scheduleSummary: '09:00–13:00 (Half Day)'
    };
  }

  // Monday–Friday: 09:00–16:30 (4:30 PM)
  return {
    dayOfWeek: day,
    dayName,
    isOpenDay: true,
    isHalfDay: false,
    openMinutes: 9 * 60, // 540
    closeMinutes: 16 * 60 + 30, // 990 (04:30 PM)
    openTimeStr: '09:00',
    closeTimeStr: '16:30',
    scheduleSummary: '09:00–16:30'
  };
}

/**
 * Centralized function to check if faculty campus hours are currently open:
 * Monday–Friday: 09:00–16:30
 * Saturday: 09:00–13:00 (Half day)
 * Sunday: OFF CAMPUS ALL DAY
 */
export function isCampusOpen(date?: Date | SimulatedTimeState | null): boolean {
  const { day, hours, minutes } = parseCurrentTime(date);
  const currentMinutes = hours * 60 + minutes;

  // Sunday: Closed all day
  if (day === 0) {
    return false;
  }

  const openingMinutes = 9 * 60; // 09:00 = 540 min

  // Saturday: 09:00–13:00 (1:00 PM)
  if (day === 6) {
    const closingMinutes = 13 * 60; // 13:00 = 780 min
    return currentMinutes >= openingMinutes && currentMinutes < closingMinutes;
  }

  // Monday–Friday: 09:00–16:30 (4:30 PM)
  const closingMinutes = 16 * 60 + 30; // 16:30 = 990 min
  return currentMinutes >= openingMinutes && currentMinutes < closingMinutes;
}

export function isFacultyCampusHoursOpen(date?: Date | SimulatedTimeState | null): boolean {
  return isCampusOpen(date);
}

export function isFacultyConsultationOpen(date?: Date | SimulatedTimeState | null): boolean {
  return isCampusOpen(date);
}

function parseTimeString(timeStr: string, isEndPMContext: boolean = false, isStart: boolean = false): number {
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
    // No explicit AM/PM
    if (isStart && (hours === 8 || hours === 9 || hours === 10 || hours === 11)) {
      // Morning college slots are AM
    } else if (!isStart && hours === 12) {
      // 12 noon
    } else if (hours >= 1 && hours <= 7) {
      hours += 12;
    } else if (isEndPMContext && hours < 12 && hours >= 1 && hours <= 7) {
      hours += 12;
    }
  }

  return hours * 60 + minutes;
}

function minutesToFormattedTime(totalMins: number): string {
  let hours = Math.floor(totalMins / 60);
  const minutes = totalMins % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const minsStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${minsStr} ${ampm}`;
}

export function parseScheduleInterval(timeRangeStr: string): { startMin: number; endMin: number; startFormatted: string; endFormatted: string } | null {
  if (!timeRangeStr) return null;
  const normalizedStr = timeRangeStr.replace(/[–—]/g, '-').replace(/\bto\b/i, '-');
  const parts = normalizedStr.split('-');
  if (parts.length < 2) return null;

  const rawStart = parts[0].trim();
  const rawEnd = parts[1].trim();

  const isEndPM = rawEnd.toUpperCase().includes('PM');
  let startMin = parseTimeString(rawStart, isEndPM, true);
  let endMin = parseTimeString(rawEnd, isEndPM, false);

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

export function deriveStatusFromEvent(event: string): string {
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

export function getStatusTypeFromStatus(status: string): 'available' | 'busy' | 'off_campus' {
  const s = (status || '').toUpperCase();
  if (s === 'AVAILABLE' || s.includes('AVAILABLE') || s.includes('CABIN') || s.includes('FREE')) return 'available';
  if (s === 'OFF_CAMPUS' || s.includes('OFF CAMPUS') || s.includes('CLOSED') || s.includes('OFF-CAMPUS')) return 'off_campus';
  return 'busy';
}

const DAY_INDEX_NAME: Record<number, 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday'
};

export function getTodayFacultySchedule(
  faculty: MSRITFacultyRecord,
  currentDateTime?: Date | SimulatedTimeState | null
): Array<{ time: string; event: string; room?: string }> {
  const { day } = parseCurrentTime(currentDateTime);
  const dayName = DAY_INDEX_NAME[day];
  if (dayName && faculty.weeklySchedule && faculty.weeklySchedule[dayName]) {
    return faculty.weeklySchedule[dayName].map(s => ({
      time: s.time,
      event: s.subject,
      room: ''
    }));
  }
  return (faculty.todaySchedule || []).map(s => ({
    time: s.time,
    event: s.event,
    room: s.room || ''
  }));
}

/**
 * Primary status evaluation function:
 * Returns ONLY "AVAILABLE", "BUSY", or "OFF_CAMPUS".
 *
 * Deterministic Decision Tree:
 * 1. Is today Sunday? -> YES -> OFF CAMPUS
 * 2. Is current time outside faculty campus hours? -> YES -> OFF CAMPUS (OFF CAMPUS has absolute priority)
 * 3. Is faculty currently scheduled in an active timetable commitment? (startTime <= now && now < endTime) -> YES -> BUSY
 * 4. Otherwise -> AVAILABLE
 */
export function getFacultyStatus(
  faculty: MSRITFacultyRecord,
  currentDateTime?: Date | SimulatedTimeState | null
): FacultyStatusType {
  const { day, hours, minutes } = parseCurrentTime(currentDateTime);
  const currentTotalMins = hours * 60 + minutes;

  // Priority 1: Sunday -> OFF CAMPUS
  if (day === 0) {
    return 'OFF_CAMPUS';
  }

  // Priority 2: Outside faculty campus hours -> OFF CAMPUS (Mon-Fri 09:00–16:30, Sat 09:00–13:00)
  let isWithinCampusHours = false;
  if (day === 6) {
    isWithinCampusHours = currentTotalMins >= 9 * 60 && currentTotalMins < 13 * 60;
  } else {
    isWithinCampusHours = currentTotalMins >= 9 * 60 && currentTotalMins < 16 * 60 + 30;
  }

  if (!isWithinCampusHours) {
    return 'OFF_CAMPUS';
  }

  // Priority 3: Active schedule event currently in progress -> BUSY
  const schedule = getTodayFacultySchedule(faculty, currentDateTime);
  for (const item of schedule) {
    const interval = parseScheduleInterval(item.time);
    if (interval && currentTotalMins >= interval.startMin && currentTotalMins < interval.endMin) {
      return 'BUSY';
    }
  }

  // Priority 4: No active schedule during campus hours -> AVAILABLE
  return 'AVAILABLE';
}

/**
 * Detailed status evaluation function:
 * Calculates status as "AVAILABLE", "BUSY", or "OFF_CAMPUS" along with telemetry details.
 */
export function getFacultyStatusDetails(
  faculty: MSRITFacultyRecord,
  currentDateTime?: Date | SimulatedTimeState | null
): FacultyDynamicStatus {
  const { day, hours, minutes } = parseCurrentTime(currentDateTime);
  const currentTotalMins = hours * 60 + minutes;

  const primaryStatus = getFacultyStatus(faculty, currentDateTime);

  if (primaryStatus === 'OFF_CAMPUS') {
    const isSunday = day === 0;
    const isSaturdayAfternoon = day === 6 && currentTotalMins >= 13 * 60;
    const isWeekdayAfternoon = day >= 1 && day <= 5 && currentTotalMins >= (16 * 60 + 30);
    const isMorningBeforeHours = currentTotalMins < 9 * 60;

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

    const nextAvailableTime = (isSunday || isSaturdayAfternoon)
      ? 'Monday at 09:00 AM'
      : isMorningBeforeHours
      ? 'Today at 09:00 AM'
      : 'Next Working Day at 09:00 AM';

    const location = 'Off-Campus';

    return {
      status: 'OFF_CAMPUS',
      statusType: 'off_campus',
      statusReason: reason,
      currentLocation: location,
      currentEvent: null,
      nextAvailableTime,
      isCollegeOpen: false,
      liveStatus: 'OFF_CAMPUS',
      liveLocation: location,
      liveNextAvailableTime: nextAvailableTime,
      activeEvent: null,
      activeRoom: null
    };
  }

  // Check today's schedule for active events
  const schedule = getTodayFacultySchedule(faculty, currentDateTime);
  let activeEvent: { event: string; room?: string; time: string } | null = null;
  let activeInterval: { startMin: number; endMin: number; startFormatted: string; endFormatted: string } | null = null;

  for (const item of schedule) {
    const interval = parseScheduleInterval(item.time);
    if (interval && currentTotalMins >= interval.startMin && currentTotalMins < interval.endMin) {
      activeEvent = item;
      activeInterval = interval;
      break;
    }
  }

  if (primaryStatus === 'BUSY' && activeEvent && activeInterval) {
    const location = faculty.cabinLocation || 'Faculty Cabin';

    // Calculate next available time: walk forward through contiguous back-to-back schedules
    let chainEndMin = activeInterval.endMin;
    let chainEndFormatted = activeInterval.endFormatted;
    for (const other of schedule) {
      const otherInt = parseScheduleInterval(other.time);
      if (otherInt && otherInt.startMin <= chainEndMin && otherInt.endMin > chainEndMin) {
        chainEndMin = otherInt.endMin;
        chainEndFormatted = otherInt.endFormatted;
      }
    }

    return {
      status: 'BUSY',
      statusType: 'busy',
      statusReason: 'CURRENT_SCHEDULED_ACTIVITY',
      currentLocation: location,
      currentEvent: activeEvent.event,
      scheduleStart: activeInterval.startFormatted,
      scheduleEnd: activeInterval.endFormatted,
      nextAvailableTime: chainEndFormatted,
      isCollegeOpen: true,
      liveStatus: 'BUSY',
      liveLocation: location,
      liveNextAvailableTime: chainEndFormatted,
      activeEvent: activeEvent.event,
      activeRoom: null
    };
  }

  // Within working hours, no active schedule -> AVAILABLE
  const cabin = faculty.cabinLocation || 'AVAILABLE';

  // Find next upcoming event if any
  let nextUpcomingTime: string | null = null;
  for (const item of schedule) {
    const interval = parseScheduleInterval(item.time);
    if (interval && interval.startMin > currentTotalMins) {
      if (!nextUpcomingTime) {
        nextUpcomingTime = interval.startFormatted;
      }
    }
  }

  const nextAvailableStr = nextUpcomingTime ? `Available until ${nextUpcomingTime}` : 'Available Now';

  return {
    status: 'AVAILABLE',
    statusType: 'available',
    statusReason: 'ON_CAMPUS_NO_ACTIVE_SCHEDULE',
    currentLocation: cabin,
    currentEvent: null,
    nextAvailableTime: nextAvailableStr,
    isCollegeOpen: true,
    liveStatus: 'AVAILABLE',
    liveLocation: cabin,
    liveNextAvailableTime: nextAvailableStr,
    activeEvent: null,
    activeRoom: cabin
  };
}

export const getFacultyDynamicStatus = getFacultyStatusDetails;
export const getFacultyLiveStatus = getFacultyStatusDetails;
export const getCurrentFacultyStatus = getFacultyStatusDetails;

export function getFacultyLiveLocation(
  faculty: MSRITFacultyRecord,
  simulatedTime?: SimulatedTimeState | null
): string {
  const statusInfo = getFacultyStatusDetails(faculty, simulatedTime);
  return statusInfo.currentLocation;
}
