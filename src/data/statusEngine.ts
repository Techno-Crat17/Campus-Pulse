export { COLLEGE_HOURS_CONFIG } from '../config/collegeConfig';
import type { MSRITFacultyRecord } from './facultyData';
import {
  getCampusISTDate,
  parseScheduleInterval,
  minutesToFormattedTime,
  getCurrentCampusDay,
  getCurrentCampusDayTitle,
  getCurrentCampusTime,
  type SimulatedTimeState,
  type CampusISTDateTimeInfo,
  type NormalizedCampusDay,
  type TitleCampusDay
} from '../utils/istTime';

export {
  getCampusISTDate,
  parseScheduleInterval,
  minutesToFormattedTime,
  getCurrentCampusDay,
  getCurrentCampusDayTitle,
  getCurrentCampusTime
};
export type { SimulatedTimeState, CampusISTDateTimeInfo, NormalizedCampusDay, TitleCampusDay };

import { isLibraryOpen, getLibraryOccupancy, calculateLibraryOccupancy } from './libraryData';
export { isLibraryOpen, getLibraryOccupancy, calculateLibraryOccupancy };

export type FacultyStatusType = 'AVAILABLE' | 'BUSY' | 'OFF_CAMPUS' | 'ENDING SOON';

export interface FacultyDynamicStatus {
  status: 'AVAILABLE' | 'BUSY' | 'OFF_CAMPUS' | 'ENDING SOON';
  statusType: 'available' | 'busy' | 'off_campus';
  statusReason?: string;
  currentLocation: string;
  currentEvent: string | null;
  currentActivity?: {
    subject: string;
    startTime?: string;
    endTime?: string;
  } | null;
  scheduleStart?: string;
  scheduleEnd?: string;
  nextAvailableTime: string;
  isCollegeOpen: boolean;
  todaySchedule: Array<{ time: string; event: string; subject?: string; room?: string }>;
  day: NormalizedCampusDay;
  dayTitle: TitleCampusDay;
  date: string;
  currentTime: string;
  timezone: 'Asia/Kolkata';

  // Backwards compatibility aliases
  liveStatus: 'AVAILABLE' | 'BUSY' | 'OFF_CAMPUS' | 'ENDING SOON';
  liveLocation: string;
  liveNextAvailableTime: string;
  activeEvent: string | null;
  activeRoom: string | null;
}

export type CalculatedFacultyLiveStatus = FacultyDynamicStatus;

export interface CampusOperatingHours {
  dayOfWeek: number;
  dayName: string;
  dayNormalized: NormalizedCampusDay;
  isOpenDay: boolean;
  isHalfDay: boolean;
  openMinutes: number;
  closeMinutes: number;
  openTimeStr: string;
  closeTimeStr: string;
  scheduleSummary: string;
}

/**
 * Returns faculty campus operating hours configuration for a given date/time:
 * - Monday–Friday: 09:00–16:30 (4:30 PM)
 * - Saturday: 09:00–13:00 (1:00 PM Half Day)
 * - Sunday: OFF CAMPUS ALL DAY
 */
export function getCampusOperatingHours(date?: Date | SimulatedTimeState | null): CampusOperatingHours {
  const istInfo = getCampusISTDate(date);

  // Sunday: Closed / Off campus all day
  if (istInfo.isSunday) {
    return {
      dayOfWeek: 0,
      dayName: 'Sunday',
      dayNormalized: 'SUNDAY',
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
  if (istInfo.isSaturday) {
    return {
      dayOfWeek: 6,
      dayName: 'Saturday',
      dayNormalized: 'SATURDAY',
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
    dayOfWeek: istInfo.dayOfWeek,
    dayName: istInfo.dayTitle,
    dayNormalized: istInfo.dayNormalized,
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
  const istInfo = getCampusISTDate(date);
  return istInfo.isCampusHours;
}

export function isFacultyCampusHoursOpen(date?: Date | SimulatedTimeState | null): boolean {
  return isCampusOpen(date);
}

export function isFacultyConsultationOpen(date?: Date | SimulatedTimeState | null): boolean {
  return isCampusOpen(date);
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
 * Resolves today's schedule for a faculty member dynamically according to current IST day.
 * - On Sunday: strictly []
 * - Mon-Sat: extracts faculty.weeklySchedule[currentDayTitle]
 */
export function getTodayFacultySchedule(
  faculty: MSRITFacultyRecord,
  currentDateTime?: Date | SimulatedTimeState | null
): Array<{ time: string; event: string; subject: string; room?: string }> {
  const istInfo = getCampusISTDate(currentDateTime);

  // Sunday: strictly no scheduled classes
  if (istInfo.isSunday) {
    return [];
  }

  const weekly = faculty.weeklySchedule;
  const dayTitle = istInfo.dayTitle; // e.g. "Thursday"
  if (weekly && dayTitle in weekly) {
    const list = (weekly as unknown as Record<string, Array<{ time: string; subject: string }>>)[dayTitle] || [];
    return list.map((s) => ({
      time: s.time,
      event: s.subject,
      subject: s.subject,
      room: ''
    }));
  }

  // Fallback for records with todaySchedule only
  if (Array.isArray(faculty.todaySchedule) && (!weekly || Object.keys(weekly).length === 0)) {
    return faculty.todaySchedule.map((s) => ({
      time: s.time,
      event: s.event || (s as any).subject || '',
      subject: (s as any).subject || s.event || '',
      room: s.room || ''
    }));
  }

  return [];
}

/**
 * Primary status evaluation function:
 * Returns ONLY "AVAILABLE", "BUSY", "OFF_CAMPUS", or "ENDING SOON".
 *
 * Deterministic Priority:
 * 1. Is today Sunday? -> YES -> OFF CAMPUS
 * 2. Outside campus presence window? (Mon-Fri 09:00–16:30, Sat 09:00–13:00) -> YES -> OFF CAMPUS
 * 3. Active schedule event currently in progress? (startTime <= now && now < endTime) -> YES -> BUSY (or ENDING SOON if <= 10 min left)
 * 4. Otherwise -> AVAILABLE
 */
export function getFacultyStatus(
  faculty: MSRITFacultyRecord,
  currentDateTime?: Date | SimulatedTimeState | null
): FacultyStatusType {
  const istInfo = getCampusISTDate(currentDateTime);
  const currentTotalMins = istInfo.totalMinutes;

  // Priority 1: Sunday -> OFF CAMPUS
  if (istInfo.isSunday) {
    return 'OFF_CAMPUS';
  }

  // Priority 2: Outside faculty campus hours -> OFF CAMPUS
  if (!istInfo.isCampusHours) {
    return 'OFF_CAMPUS';
  }

  // Priority 3: Active schedule event currently in progress -> BUSY / ENDING SOON
  const schedule = getTodayFacultySchedule(faculty, currentDateTime);
  for (const item of schedule) {
    const interval = parseScheduleInterval(item.time);
    if (interval && currentTotalMins >= interval.startMin && currentTotalMins < interval.endMin) {
      if (interval.endMin - currentTotalMins <= 10) {
        return 'ENDING SOON';
      }
      return 'BUSY';
    }
  }

  // Priority 4: No active schedule during campus hours -> AVAILABLE
  return 'AVAILABLE';
}

/**
 * Detailed status evaluation function:
 * Calculates status along with location, schedule, and telemetry details.
 */
export function getFacultyStatusDetails(
  faculty: MSRITFacultyRecord,
  currentDateTime?: Date | SimulatedTimeState | null
): FacultyDynamicStatus {
  const istInfo = getCampusISTDate(currentDateTime);
  const currentTotalMins = istInfo.totalMinutes;
  const primaryStatus = getFacultyStatus(faculty, currentDateTime);
  const cabin = faculty.cabinLocation || 'Faculty Cabin';
  const todaySchedule = getTodayFacultySchedule(faculty, currentDateTime);

  if (primaryStatus === 'OFF_CAMPUS') {
    const isSunday = istInfo.isSunday;
    const isSaturdayAfternoon = istInfo.isSaturday && currentTotalMins >= 13 * 60;
    const isWeekdayAfternoon = istInfo.isWeekday && currentTotalMins >= (16 * 60 + 30);
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
      currentActivity: null,
      nextAvailableTime,
      isCollegeOpen: false,
      liveStatus: 'OFF_CAMPUS',
      liveLocation: location,
      liveNextAvailableTime: nextAvailableTime,
      activeEvent: null,
      activeRoom: null,
      todaySchedule,
      day: istInfo.dayNormalized,
      dayTitle: istInfo.dayTitle,
      date: istInfo.dateString,
      currentTime: istInfo.timeString,
      timezone: 'Asia/Kolkata'
    };
  }

  // Check today's schedule for active events
  let activeEvent: { event: string; subject: string; room?: string; time: string } | null = null;
  let activeInterval: { startMin: number; endMin: number; startFormatted: string; endFormatted: string } | null = null;

  for (const item of todaySchedule) {
    const interval = parseScheduleInterval(item.time);
    if (interval && currentTotalMins >= interval.startMin && currentTotalMins < interval.endMin) {
      activeEvent = item;
      activeInterval = interval;
      break;
    }
  }

  if ((primaryStatus === 'BUSY' || primaryStatus === 'ENDING SOON') && activeEvent && activeInterval) {
    const location = cabin;
    const isEndingSoon = primaryStatus === 'ENDING SOON';

    // Calculate next available time: walk forward through contiguous back-to-back schedules
    let chainEndMin = activeInterval.endMin;
    for (const other of todaySchedule) {
      const otherInt = parseScheduleInterval(other.time);
      if (otherInt && otherInt.startMin <= chainEndMin && otherInt.endMin > chainEndMin) {
        chainEndMin = otherInt.endMin;
      }
    }

    const nextAvail = minutesToFormattedTime(chainEndMin);

    return {
      status: isEndingSoon ? 'ENDING SOON' : 'BUSY',
      statusType: 'busy',
      statusReason: isEndingSoon ? 'CLASS_ENDING_SOON' : 'CURRENT_SCHEDULED_ACTIVITY',
      currentLocation: location,
      currentEvent: activeEvent.event,
      currentActivity: {
        subject: activeEvent.subject || activeEvent.event,
        startTime: activeInterval.startFormatted,
        endTime: activeInterval.endFormatted
      },
      scheduleStart: activeInterval.startFormatted,
      scheduleEnd: activeInterval.endFormatted,
      nextAvailableTime: nextAvail,
      isCollegeOpen: true,
      liveStatus: isEndingSoon ? 'ENDING SOON' : 'BUSY',
      liveLocation: location,
      liveNextAvailableTime: nextAvail,
      activeEvent: activeEvent.event,
      activeRoom: null,
      todaySchedule,
      day: istInfo.dayNormalized,
      dayTitle: istInfo.dayTitle,
      date: istInfo.dateString,
      currentTime: istInfo.timeString,
      timezone: 'Asia/Kolkata'
    };
  }

  // Within working hours, no active schedule -> AVAILABLE
  let nextUpcoming: { startMin: number; endMin: number; startFormatted: string; endFormatted: string } | null = null;
  for (const item of todaySchedule) {
    const interval = parseScheduleInterval(item.time);
    if (interval && interval.startMin > currentTotalMins) {
      if (!nextUpcoming || interval.startMin < nextUpcoming.startMin) {
        nextUpcoming = interval;
      }
    }
  }

  const nextAvailableStr = nextUpcoming ? `Available until ${nextUpcoming.startFormatted}` : 'Available Now';

  return {
    status: 'AVAILABLE',
    statusType: 'available',
    statusReason: 'ON_CAMPUS_NO_ACTIVE_SCHEDULE',
    currentLocation: cabin,
    currentEvent: null,
    currentActivity: null,
    nextAvailableTime: nextAvailableStr,
    isCollegeOpen: true,
    liveStatus: 'AVAILABLE',
    liveLocation: cabin,
    liveNextAvailableTime: nextAvailableStr,
    activeEvent: null,
    activeRoom: cabin,
    todaySchedule,
    day: istInfo.dayNormalized,
    dayTitle: istInfo.dayTitle,
    date: istInfo.dateString,
    currentTime: istInfo.timeString,
    timezone: 'Asia/Kolkata'
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
