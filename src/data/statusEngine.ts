export { COLLEGE_HOURS_CONFIG } from '../config/collegeConfig';
import type { MSRITFacultyRecord } from './facultyData';
import { parseCurrentTime, getCurrentCampusTime, isLibraryOpen, getLibraryOccupancy, calculateLibraryOccupancy } from './libraryData';
export { parseCurrentTime, getCurrentCampusTime, isLibraryOpen, getLibraryOccupancy, calculateLibraryOccupancy };

export interface FacultyDynamicStatus {
  status: string;
  statusType: string;
  currentLocation: string;
  currentEvent: string | null;
  scheduleStart?: string;
  scheduleEnd?: string;
  nextAvailableTime: string;
  isCollegeOpen: boolean;

  // Backwards compatibility aliases
  liveStatus: string;
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

/**
 * Derives faculty status from active schedule event per Section 4:
 * Lecture / Class / Theory -> "IN CLASS"
 * Lab / Laboratory -> "IN LAB"
 * Meeting -> "IN MEETING"
 * Project Review -> "IN PROJECT REVIEW"
 * Mentoring / Consultation -> "AVAILABLE FOR CONSULTATION"
 * Seminar -> "IN SEMINAR"
 * Workshop -> "IN WORKSHOP"
 * Any other event -> "BUSY"
 */
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

export function getStatusTypeFromStatus(status: string): string {
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

/**
 * Centralized function to calculate faculty dynamic status per user requirements:
 * getFacultyDynamicStatus(faculty, currentDateTime)
 *
 * 1. Checks Asia/Kolkata date/time.
 * 2. Determines current day.
 * 3. Reads faculty.todaySchedule.
 * 4. Finds active schedule where startTime <= currentTime && endTime > currentTime.
 * 5. Derives status from active event.
 * 6. Derives dynamic location from active event room.
 * 7. If no active event during working hours -> AVAILABLE IN CABIN (faculty.cabinLocation).
 * 8. Outside working hours -> COLLEGE CLOSED (Off-Campus).
 */
export function getFacultyDynamicStatus(
  faculty: MSRITFacultyRecord,
  currentDateTime?: Date | SimulatedTimeState | null
): FacultyDynamicStatus {
  const { day, hours, minutes } = parseCurrentTime(currentDateTime);
  const currentTotalMins = hours * 60 + minutes;

  // Working hours check
  const campusOpen = isCampusOpen(currentDateTime);
  if (!campusOpen) {
    const isSunday = day === 0;
    const isSaturdayAfternoon = day === 6 && currentTotalMins >= 13 * 60 + 30;
    const nextAvailableTime = isSunday || isSaturdayAfternoon
      ? 'Monday at 09:00 AM'
      : 'Next Working Day at 09:00 AM';

    return {
      status: 'COLLEGE CLOSED',
      statusType: 'closed',
      currentLocation: 'Off-Campus',
      currentEvent: null,
      nextAvailableTime,
      isCollegeOpen: false,
      liveStatus: 'COLLEGE CLOSED',
      liveLocation: 'Off-Campus',
      liveNextAvailableTime: nextAvailableTime,
      activeEvent: null,
      activeRoom: null
    };
  }

  // Campus is open: check todaySchedule for active event
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

  if (activeEvent && activeInterval) {
    const status = deriveStatusFromEvent(activeEvent.event);
    const statusType = getStatusTypeFromStatus(status);
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
      status,
      statusType,
      currentLocation: location,
      currentEvent: activeEvent.event,
      scheduleStart: activeInterval.startFormatted,
      scheduleEnd: activeInterval.endFormatted,
      nextAvailableTime: chainEndFormatted,
      isCollegeOpen: true,
      liveStatus: status,
      liveLocation: location,
      liveNextAvailableTime: chainEndFormatted,
      activeEvent: activeEvent.event,
      activeRoom: activeEvent.room || null
    };
  }

  // Within working hours, no active schedule -> AVAILABLE IN CABIN
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
    status: 'AVAILABLE IN CABIN',
    statusType: 'cabin',
    currentLocation: cabin,
    currentEvent: null,
    nextAvailableTime: nextAvailableStr,
    isCollegeOpen: true,
    liveStatus: 'AVAILABLE IN CABIN',
    liveLocation: cabin,
    liveNextAvailableTime: nextAvailableStr,
    activeEvent: null,
    activeRoom: cabin
  };
}

// Backwards compatibility aliases
export const getFacultyLiveStatus = getFacultyDynamicStatus;
export const getCurrentFacultyStatus = getFacultyDynamicStatus;

export function getFacultyLiveLocation(
  faculty: MSRITFacultyRecord,
  simulatedTime?: SimulatedTimeState | null
): string {
  const statusInfo = getFacultyDynamicStatus(faculty, simulatedTime);
  return statusInfo.currentLocation;
}

