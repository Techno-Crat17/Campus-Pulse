/**
 * Authoritative Asia/Kolkata (IST) Date/Time & Weekday Utility
 * Deterministic across any server timezone (UTC, local, etc.)
 */

export const NORMALIZED_DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
export const TITLE_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DAY_NAME_TO_INDEX = {
  sunday: 0, sun: 0, ravivar: 0, itwar: 0,
  monday: 1, mon: 1, somwar: 1, somavar: 1,
  tuesday: 2, tue: 2, mangalwar: 2, mangalavar: 2,
  wednesday: 3, wed: 3, budhwar: 3, budhavar: 3,
  thursday: 4, thu: 4, guruwar: 4, guruvar: 4, brihaspativar: 4,
  friday: 5, fri: 5, shukrawar: 5, shukravar: 5,
  saturday: 6, sat: 6, shaniwar: 6, shanivar: 6
};

/**
 * Normalizes any string or number representation of a weekday into standard normalized/title formats.
 */
export function normalizeDayName(dayInput) {
  if (typeof dayInput === 'number') {
    const idx = ((dayInput % 7) + 7) % 7;
    return {
      index: idx,
      normalized: NORMALIZED_DAYS[idx],
      title: TITLE_DAYS[idx]
    };
  }

  const clean = String(dayInput || '').toLowerCase().trim();
  if (clean in DAY_NAME_TO_INDEX) {
    const idx = DAY_NAME_TO_INDEX[clean];
    return {
      index: idx,
      normalized: NORMALIZED_DAYS[idx],
      title: TITLE_DAYS[idx]
    };
  }

  // Fallback to current IST day
  const current = getCampusISTDate();
  return {
    index: current.dayOfWeek,
    normalized: current.dayNormalized,
    title: current.dayTitle
  };
}

/**
 * Extracts comprehensive IST date, time, weekday, and campus hours state.
 * Guaranteed deterministic using Intl.DateTimeFormat with Asia/Kolkata.
 */
export function getCampusISTDate(inputDate) {
  let targetDate;
  if (inputDate instanceof Date) {
    targetDate = inputDate;
  } else if (typeof inputDate === 'string' || typeof inputDate === 'number') {
    targetDate = new Date(inputDate);
  } else if (inputDate && typeof inputDate === 'object' && 'enabled' in inputDate) {
    // Simulated time state support
    if (inputDate.enabled) {
      const dayIdx = ((inputDate.dayOfWeek % 7) + 7) % 7;
      const hours = inputDate.hour ?? 10;
      const minutes = inputDate.minute ?? 0;
      const totalMinutes = hours * 60 + minutes;
      const dayNorm = NORMALIZED_DAYS[dayIdx];
      const dayTitle = TITLE_DAYS[dayIdx];
      const isSunday = dayIdx === 0;
      const isSaturday = dayIdx === 6;
      const isWeekday = dayIdx >= 1 && dayIdx <= 5;
      const isCampusHours = isSaturday
        ? (totalMinutes >= 540 && totalMinutes < 780)
        : isWeekday
        ? (totalMinutes >= 540 && totalMinutes < 990)
        : false;

      const hhStr = String(hours).padStart(2, '0');
      const mmStr = String(minutes).padStart(2, '0');

      return {
        date: new Date(),
        year: 2026,
        month: 10,
        dayOfMonth: 1,
        dayOfWeek: dayIdx,
        dayNormalized: dayNorm,
        dayTitle: dayTitle,
        hours,
        minutes,
        seconds: 0,
        totalMinutes,
        dateString: '2026-10-01',
        timeString: `${hhStr}:${mmStr}`,
        formattedTime: formatHoursMinutes(hours, minutes),
        isSunday,
        isSaturday,
        isWeekday,
        isCampusHours,
        timezone: 'Asia/Kolkata'
      };
    }
    targetDate = new Date();
  } else {
    targetDate = new Date();
  }

  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23'
    });

    const parts = Object.fromEntries(dtf.formatToParts(targetDate).map(p => [p.type, p.value]));
    const year = parseInt(parts.year, 10);
    const month = parseInt(parts.month, 10);
    const dayOfMonth = parseInt(parts.day, 10);
    const hours = parseInt(parts.hour, 10);
    const minutes = parseInt(parts.minute, 10);
    const seconds = parseInt(parts.second || '0', 10);
    const weekdayStr = parts.weekday; // e.g. "Thursday"

    const dayNormInfo = normalizeDayName(weekdayStr);
    const totalMinutes = hours * 60 + minutes;
    const isSunday = dayNormInfo.index === 0;
    const isSaturday = dayNormInfo.index === 6;
    const isWeekday = dayNormInfo.index >= 1 && dayNormInfo.index <= 5;

    // Faculty presence window: Mon-Fri 09:00–16:30 (540-990 min), Sat 09:00–13:00 (540-780 min), Sun OFF
    const isCampusHours = isSaturday
      ? (totalMinutes >= 540 && totalMinutes < 780)
      : isWeekday
      ? (totalMinutes >= 540 && totalMinutes < 990)
      : false;

    const mmMonth = String(month).padStart(2, '0');
    const ddDay = String(dayOfMonth).padStart(2, '0');
    const hhStr = String(hours).padStart(2, '0');
    const mmStr = String(minutes).padStart(2, '0');

    return {
      date: targetDate,
      year,
      month,
      dayOfMonth,
      dayOfWeek: dayNormInfo.index,
      dayNormalized: dayNormInfo.normalized,
      dayTitle: dayNormInfo.title,
      hours,
      minutes,
      seconds,
      totalMinutes,
      dateString: `${year}-${mmMonth}-${ddDay}`,
      timeString: `${hhStr}:${mmStr}`,
      formattedTime: formatHoursMinutes(hours, minutes),
      isSunday,
      isSaturday,
      isWeekday,
      isCampusHours,
      timezone: 'Asia/Kolkata'
    };
  } catch (err) {
    // Fallback if Intl fails
    const dayIdx = targetDate.getDay();
    const hours = targetDate.getHours();
    const minutes = targetDate.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    return {
      date: targetDate,
      year: targetDate.getFullYear(),
      month: targetDate.getMonth() + 1,
      dayOfMonth: targetDate.getDate(),
      dayOfWeek: dayIdx,
      dayNormalized: NORMALIZED_DAYS[dayIdx],
      dayTitle: TITLE_DAYS[dayIdx],
      hours,
      minutes,
      seconds: targetDate.getSeconds(),
      totalMinutes,
      dateString: targetDate.toISOString().slice(0, 10),
      timeString: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
      formattedTime: formatHoursMinutes(hours, minutes),
      isSunday: dayIdx === 0,
      isSaturday: dayIdx === 6,
      isWeekday: dayIdx >= 1 && dayIdx <= 5,
      isCampusHours: totalMinutes >= 540 && totalMinutes < 990,
      timezone: 'Asia/Kolkata'
    };
  }
}

export function getCurrentCampusDay(inputDate) {
  return getCampusISTDate(inputDate).dayNormalized;
}

export function getCurrentCampusDayTitle(inputDate) {
  return getCampusISTDate(inputDate).dayTitle;
}

export function getCurrentCampusTime(inputDate) {
  return getCampusISTDate(inputDate).date;
}

export function parseTimeString(timeStr, isEndPMContext = false, isStart = false) {
  const clean = String(timeStr || '').trim().toUpperCase();
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
    // Standard college slots
    if (isStart && (hours === 8 || hours === 9 || hours === 10 || hours === 11)) {
      // morning slot
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

export function formatHoursMinutes(hours, minutes) {
  const ampm = hours >= 12 ? 'PM' : 'AM';
  let h = hours % 12;
  if (h === 0) h = 12;
  const m = String(minutes).padStart(2, '0');
  return `${h}:${m} ${ampm}`;
}

export function minutesToFormattedTime(totalMins) {
  const hours = Math.floor(totalMins / 60);
  const minutes = totalMins % 60;
  return formatHoursMinutes(hours, minutes);
}

export function parseScheduleInterval(timeRangeStr) {
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
