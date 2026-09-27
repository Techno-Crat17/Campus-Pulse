export { COLLEGE_HOURS_CONFIG } from '../config/collegeConfig';
import type { MSRITFacultyRecord } from './facultyData';
import { parseCurrentTime, isLibraryOpen, getLibraryOccupancy, calculateLibraryOccupancy } from './libraryData';

export { isLibraryOpen, getLibraryOccupancy, calculateLibraryOccupancy };

export interface CalculatedFacultyLiveStatus {
  liveStatus: string;
  liveLocation: string;
  liveNextAvailableTime: string;
  activeEvent: string | null;
  activeRoom: string | null;
  isCollegeOpen: boolean;
}

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
 *
 * Saturday 13:29 -> OPEN (true)
 * Saturday 13:30 -> CLOSED (false)
 * Sunday -> CLOSED (false)
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
 * Derives faculty status from active schedule event according to strict priority:
 * 4. Active Lecture -> "In Lecture"
 * 5. Active Lab -> "In Lab"
 * 6. Active Meeting -> "In Meeting"
 * 7. Active Project Review -> "In Project Review"
 */
export function deriveStatusFromEvent(event: string): string {
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
  if (ev.includes('project review') || ev.includes('viva') || ev.includes('eval') || ev.includes('review')) {
    return 'In Project Review';
  }
  if (ev.includes('seminar') || ev.includes('symposium')) {
    return 'In Seminar';
  }
  if (ev.includes('workshop') || ev.includes('bootcamp')) {
    return 'In Workshop';
  }
  if (ev.includes('mentoring') || ev.includes('consultation') || ev.includes('guidance')) {
    return 'Available for Consultation';
  }
  return 'In Meeting';
}

/**
 * Calculates faculty live status following strict 8-step priority:
 * 1. Check campus/faculty working hours.
 * 2. If campus is closed:
 *    -> "Campus Closed"
 * 3. If campus is open:
 *    -> Check today's faculty schedule.
 * 4. If an active Lecture:
 *    -> "In Lecture"
 * 5. If an active Lab:
 *    -> "In Lab"
 * 6. If an active Meeting:
 *    -> "In Meeting"
 * 7. If an active Project Review:
 *    -> "In Project Review"
 * 8. If no active schedule and faculty is available:
 *    -> "Available for Consultation"
 *
 * Never shows "Available for Consultation" outside faculty working hours.
 */
export function getFacultyLiveStatus(
  faculty: MSRITFacultyRecord,
  simulatedTime?: SimulatedTimeState | null
): CalculatedFacultyLiveStatus {
  const { day, hours, minutes } = parseCurrentTime(simulatedTime);
  const currentTotalMins = hours * 60 + minutes;

  // 1 & 2. Check campus/faculty working hours. If campus is closed -> "Campus Closed"
  const campusOpen = isCampusOpen(simulatedTime);
  if (!campusOpen) {
    const isSunday = day === 0;
    const isSaturdayAfternoon = day === 6 && currentTotalMins >= 13 * 60 + 30;
    const nextAvailableTime = isSunday || isSaturdayAfternoon
      ? 'Monday at 09:00 AM'
      : 'Next Working Day at 09:00 AM';

    return {
      liveStatus: 'Campus Closed',
      liveLocation: 'Off-Campus',
      liveNextAvailableTime: nextAvailableTime,
      activeEvent: null,
      activeRoom: null,
      isCollegeOpen: false
    };
  }

  // 3. If campus is open: Check today's faculty schedule
  if (faculty.todaySchedule && faculty.todaySchedule.length > 0) {
    for (const item of faculty.todaySchedule) {
      const interval = parseScheduleInterval(item.time);
      if (interval && currentTotalMins >= interval.startMin && currentTotalMins < interval.endMin) {
        return {
          liveStatus: deriveStatusFromEvent(item.event),
          liveLocation: item.room || faculty.cabinLocation,
          liveNextAvailableTime: interval.endFormatted,
          activeEvent: item.event,
          activeRoom: item.room,
          isCollegeOpen: true
        };
      }
    }

    // Between events during faculty working hours
    let upcomingNextTime: string | null = null;
    for (const item of faculty.todaySchedule) {
      const interval = parseScheduleInterval(item.time);
      if (interval && interval.startMin > currentTotalMins) {
        upcomingNextTime = interval.startFormatted;
        break;
      }
    }

    // 8. If no active schedule and faculty is available: -> "Available for Consultation"
    return {
      liveStatus: 'Available for Consultation',
      liveLocation: faculty.cabinLocation,
      liveNextAvailableTime: upcomingNextTime || 'Available for Consultation',
      activeEvent: null,
      activeRoom: faculty.cabinLocation,
      isCollegeOpen: true
    };
  }

  // 8. If no schedule defined and faculty is available during campus hours:
  return {
    liveStatus: 'Available for Consultation',
    liveLocation: faculty.cabinLocation,
    liveNextAvailableTime: 'Available for Consultation',
    activeEvent: null,
    activeRoom: faculty.cabinLocation,
    isCollegeOpen: true
  };
}

export function getFacultyLiveLocation(
  faculty: MSRITFacultyRecord,
  simulatedTime?: SimulatedTimeState | null
): string {
  const statusInfo = getFacultyLiveStatus(faculty, simulatedTime);
  return statusInfo.liveLocation;
}

// Backwards compatibility alias
export const getCurrentFacultyStatus = getFacultyLiveStatus;

