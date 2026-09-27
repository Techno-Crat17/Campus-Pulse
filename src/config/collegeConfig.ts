export interface CollegeHoursConfig {
  facultyWeekday: { start: string; end: string };
  facultySaturday: { start: string; end: string };
  facultySunday: { closed: boolean };
  librariesDaily: { start: string; end: string };
}

export const COLLEGE_HOURS_CONFIG = {
  facultyWeekday: { start: "09:00", end: "17:00" },
  facultySaturday: { start: "09:00", end: "13:30" },
  facultySunday: { closed: true },
  librariesDaily: { start: "09:00", end: "21:00" }
};

