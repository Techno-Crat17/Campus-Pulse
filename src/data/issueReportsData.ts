/**
 * CAMPUS PULSE — CENTRALIZED ISSUE REPORTING DATA STRUCTURE
 * 
 * Supports campus maintenance reporting, lifecycle tracking, and Ask Campus AI grounding.
 * Student Contributors & Reporters:
 * 1. Udbhav Verma
 * 2. Ravnish Sekhar
 * 3. Shivam Kr Chaudhary
 * 4. Varad Adavakar
 * 5. Sagnik
 */

export type IssueCategory =
  | 'Infrastructure'
  | 'Cleanliness'
  | 'Electricity'
  | 'Water'
  | 'Internet / Wi-Fi'
  | 'Classroom'
  | 'Laboratory'
  | 'Library'
  | 'Security'
  | 'Other';

export type IssuePriority = 'Low' | 'Medium' | 'High';

export type IssueStatus = 'Reported' | 'Under Review' | 'In Progress' | 'Resolved';

export interface IssueReport {
  id: string;
  title: string;
  category: IssueCategory;
  description: string;
  location: string;
  priority: IssuePriority;
  status: IssueStatus;
  reportedBy: string;
  dateTime: string;
  imageUrl?: string;
  isDemo?: boolean;
}

export const ISSUE_CATEGORIES: IssueCategory[] = [
  'Infrastructure',
  'Cleanliness',
  'Electricity',
  'Water',
  'Internet / Wi-Fi',
  'Classroom',
  'Laboratory',
  'Library',
  'Security',
  'Other'
];

export const ISSUE_PRIORITIES: IssuePriority[] = ['Low', 'Medium', 'High'];

export const ISSUE_STATUSES: IssueStatus[] = [
  'Reported',
  'Under Review',
  'In Progress',
  'Resolved'
];

export const STUDENT_CONTRIBUTORS: string[] = [];

/**
 * Initial sample issues — completely anonymous campus telemetry.
 */
export const INITIAL_ISSUE_REPORTS: IssueReport[] = [
  {
    id: 'iss-demo-01',
    title: 'Flickering Overhead Tube Light',
    category: 'Electricity',
    description: 'Two fluorescent fixtures in row 3 flicker intermittently during evening lectures.',
    location: 'LHC Block, Room 204',
    priority: 'Low',
    status: 'Under Review',
    reportedBy: 'Anonymous',
    dateTime: '2026-09-26 14:30',
    isDemo: true
  },
  {
    id: 'iss-demo-02',
    title: 'Water Dispenser Sensor Malfunction',
    category: 'Water',
    description: 'Drinking water station sensor does not detect bottles reliably; continuous slow drip.',
    location: 'ESB Block, 2nd Floor Corridor',
    priority: 'Medium',
    status: 'In Progress',
    reportedBy: 'Anonymous',
    dateTime: '2026-09-26 11:15',
    isDemo: true
  },
  {
    id: 'iss-demo-03',
    title: 'Weak Wi-Fi Signal Near Study Pods',
    category: 'Internet / Wi-Fi',
    description: 'Access point coverage drops below -82dBm near the quiet study pods on the north side.',
    location: 'Apex Block, Library Reading Hall',
    priority: 'High',
    status: 'Reported',
    reportedBy: 'Anonymous',
    dateTime: '2026-09-26 16:45',
    isDemo: true
  },
  {
    id: 'iss-demo-04',
    title: 'Broken Bench Armrest Replaced',
    category: 'Infrastructure',
    description: 'Outdoor wooden seating armrest repaired and revarnished by campus carpentry dispatch.',
    location: 'Campus Quadrangle Plaza',
    priority: 'Low',
    status: 'Resolved',
    reportedBy: 'Anonymous',
    dateTime: '2026-09-25 10:00',
    isDemo: true
  },
  {
    id: 'iss-demo-05',
    title: 'Projector HDMI Loose Connection',
    category: 'Classroom',
    description: 'Wall plate HDMI port cuts signal intermittently when connecting laptops at the podium.',
    location: 'LHC Block, Seminar Hall 1',
    priority: 'High',
    status: 'Under Review',
    reportedBy: 'Anonymous',
    dateTime: '2026-09-26 15:20',
    isDemo: true
  }
];

const LOCAL_STORAGE_KEY = 'campus_pulse_issue_reports';

/**
 * Get all current issue reports (from localStorage if available, fallback to initial demo dataset)
 * All reports are strictly anonymous with no student identity details.
 */
export function getStoredIssueReports(): IssueReport[] {
  if (typeof window === 'undefined') return INITIAL_ISSUE_REPORTS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return INITIAL_ISSUE_REPORTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item: IssueReport) => ({
        ...item,
        reportedBy: 'Anonymous'
      }));
    }
  } catch (err) {
    console.warn('Failed to parse stored issue reports:', err);
  }
  return INITIAL_ISSUE_REPORTS;
}

/**
 * Persist an issue report to storage
 */
export function saveIssueReport(newReport: IssueReport): IssueReport[] {
  const current = getStoredIssueReports();
  const updated = [newReport, ...current];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('campus_pulse_issues_updated'));
    } catch (err) {
      console.warn('Failed to save issue report:', err);
    }
  }
  return updated;
}

/**
 * Query Helpers for Ask Campus AI
 */

export function queryAllIssues(): IssueReport[] {
  return getStoredIssueReports();
}

export function queryIssuesByLocation(locationQuery: string): IssueReport[] {
  const q = locationQuery.trim().toLowerCase();
  return getStoredIssueReports().filter((i) =>
    i.location.toLowerCase().includes(q) ||
    (q.includes('lhc') && i.location.toLowerCase().includes('lhc')) ||
    (q.includes('esb') && i.location.toLowerCase().includes('esb')) ||
    (q.includes('apex') && i.location.toLowerCase().includes('apex')) ||
    (q.includes('quadrangle') && i.location.toLowerCase().includes('quadrangle'))
  );
}

export function queryUnresolvedIssues(): IssueReport[] {
  return getStoredIssueReports().filter((i) => i.status !== 'Resolved');
}

export function queryResolvedIssues(): IssueReport[] {
  return getStoredIssueReports().filter((i) => i.status === 'Resolved');
}

export function queryHighPriorityIssues(): IssueReport[] {
  return getStoredIssueReports().filter((i) => i.priority === 'High');
}

export function queryIssuesByCategory(categoryQuery: string): IssueReport[] {
  const q = categoryQuery.trim().toLowerCase();
  return getStoredIssueReports().filter((i) =>
    i.category.toLowerCase().includes(q) ||
    q.includes(i.category.toLowerCase()) ||
    (q.includes('wifi') && i.category.toLowerCase().includes('wi-fi')) ||
    (q.includes('electric') && i.category === 'Electricity') ||
    (q.includes('infra') && i.category === 'Infrastructure')
  );
}

export function queryIssuesByReporter(reporterName: string): IssueReport[] {
  const q = reporterName.trim().toLowerCase();
  return getStoredIssueReports().filter((i) =>
    i.reportedBy.toLowerCase().includes(q) ||
    q.includes(i.reportedBy.toLowerCase())
  );
}
