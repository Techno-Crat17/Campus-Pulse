export { COLLEGE_HOURS_CONFIG } from '../config/collegeConfig';
import type { MSRITFacultyRecord } from './facultyData';
import { parseCurrentTime, getCurrentCampusTime, isLibraryOpen, getLibraryOccupancy, calculateLibraryOccupancy } from './libraryData';
export { parseCurrentTime, getCurrentCampusTime, isLibraryOpen, getLibraryOccupancy, calculateLibraryOccupancy };

export type FacultyStatusType = 'AVAILABLE' | 'BUSY' | 'OFF_CAMPUS';

export interface FacultyDynamicStatus {
  status: FacultyStatusType;
  statusType: 'available' | 'busy' | 'off_campus';
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
 * Returns campus operating hours configuration for a given date/time:
 * - Monday–Friday: 09:00–17:00
 * - Saturday: 09:00–13:30 (Half Day)
 * - Sunday: CLOSED ALL DAY
 */
export function getCampusOperatingHours(date?: Date | SimulatedTimeState | null): CampusOperatingHours {
  const { day } = parseCurrentTime(date);
  const dayName = DAYS_OF_WEEK_NAMES[day];

  // Sunday: Closed all day
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
      scheduleSummary: 'CLOSED'
    };
  }

  // Saturday: 09:00–13:30 (Half day)
  if (day === 6) {
    return {
      dayOfWeek: 6,
      dayName: 'Saturday',
      isOpenDay: true,
      isHalfDay: true,
      openMinutes: 9 * 60, // 540
      closeMinutes: 13 * 60 + 30, // 810
      openTimeStr: '09:00',
      closeTimeStr: '13:30',
      scheduleSummary: '09:00–13:30 (Half Day)'
    };
  }

  // Monday–Friday: 09:00–17:00
  return {
    dayOfWeek: day,
    dayName,
    isOpenDay: true,
    isHalfDay: false,
    openMinutes: 9 * 60, // 540
    closeMinutes: 17 * 60, // 1020
    openTimeStr: '09:00',
    closeTimeStr: '17:00',
    scheduleSummary: '09:00–17:00'
  };
}

/**
 * Centralized function to check if campus is open:
 * Monday–Friday: 09:00–17:00
 * Saturday: 09:00–13:30 (Half day)
 * Sunday: CLOSED ALL DAY
 *
 * Uses strict 24-hour time internally.
 */
export function isCampusOpen(date?: Date | SimulatedTimeState | null): boolean {
  const { day, hours, minutes } = parseCurrentTime(date);
  const currentMinutes = hours * 60 + minutes;

  // Sunday: Closed all day
  if (day === 0) {
    return false;
  }

  const openingMinutes = 9 * 60; // 09:00 = 540 min

  // Saturday: 09:00–13:30
  if (day === 6) {
    const closingMinutes = 13 * 60 + 30; // 13:30 = 810 min
    return currentMinutes >= openingMinutes && currentMinutes < closingMinutes;
  }

  // Monday–Friday: 09:00–17:00
  const closingMinutes = 17 * 60; // 17:00 = 1020 min
  return currentMinutes >= openingMinutes && currentMinutes < closingMinutes;
}

/**
 * Faculty consultation follows campus/faculty working hours:
 * Monday–Friday: 09:00–17:00
 * Saturday: 09:00–13:30 (Half day)
 * Sunday: CLOSED ALL DAY
 */
export function isFacultyConsultationOpen(date?: Date | SimulatedTimeState | null): boolean {
  return isCampusOpen(date);
}

function parseTimeString(timeStr: string, isEndPMContext: boolean = false): number {
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

/**
 * Primary status evaluation function:
 * Returns ONLY "AVAILABLE", "BUSY", or "OFF_CAMPUS".
 *
 * Decision tree priority:
 * 1. Explicit reliable OFF_CAMPUS status indicator
 * 2. Outside faculty working hours
 * 3. Active schedule event -> BUSY
 * 4. Otherwise -> AVAILABLE
 */
export function getFacultyStatus(
  faculty: MSRITFacultyRecord,
  currentDateTime?: Date | SimulatedTimeState | null
): FacultyStatusType {
  // Priority 1: Explicit reliable OFF_CAMPUS indicator
  const rawStatus = (faculty.status || '').toUpperCase().trim();
  if (rawStatus === 'OFF_CAMPUS' || rawStatus === 'OFF CAMPUS' || rawStatus === 'OFF-CAMPUS') {
    return 'OFF_CAMPUS';
  }

  // Priority 2: Outside faculty working hours
  const campusOpen = isCampusOpen(currentDateTime);
  if (!campusOpen) {
    return 'OFF_CAMPUS';
  }

  // Priority 3: Active schedule event -> BUSY
  const { hours, minutes } = parseCurrentTime(currentDateTime);
  const currentTotalMins = hours * 60 + minutes;
  const schedule = faculty.todaySchedule || [];

  for (const item of schedule) {
    const interval = parseScheduleInterval(item.time);
    if (interval && currentTotalMins >= interval.startMin && currentTotalMins < interval.endMin) {
      return 'BUSY';
    }
  }

  // Priority 4: No active schedule during working hours -> AVAILABLE
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
    const isSaturdayAfternoon = day === 6 && currentTotalMins >= 13 * 60 + 30;
    const nextAvailableTime = (isSunday || isSaturdayAfternoon)
      ? 'Monday at 09:00 AM'
      : 'Next Working Day at 09:00 AM';

    const location = (faculty.currentLocation && faculty.currentLocation !== 'Faculty Cabin' && faculty.currentLocation !== 'AVAILABLE')
      ? faculty.currentLocation
      : 'Off-Campus';

    return {
      status: 'OFF_CAMPUS',
      statusType: 'off_campus',
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
  const schedule = faculty.todaySchedule || [];
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
    const location = activeEvent.room || faculty.cabinLocation || 'Faculty Cabin';

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
      activeRoom: activeEvent.room || null
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
