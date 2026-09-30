import { isBlockedUser, BLOCKED_USER_ERROR_MESSAGE } from '../config/blockedUsers';
import { VERIFIED_MSRIT_CLUBS } from '../data/clubsData';

/**
 * Campus Pulse Frontend API Service Client
 * Connects Campus Pulse Frontend to Node.js REST API Server (http://localhost:5000/api)
 * Implements graceful fallback to static local data if backend is offline.
 */

const getApiBaseUrl = (): string => {
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  let envUrl = (
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
      ? import.meta.env.VITE_API_URL
      : isLocalhost
        ? 'http://localhost:5000/api'
        : 'https://campus-pulse-leyt.onrender.com/api'
  ).trim();
  if (envUrl.endsWith('/')) {
    envUrl = envUrl.slice(0, -1);
  }
  if (!envUrl.endsWith('/api')) {
    envUrl = `${envUrl}/api`;
  }
  return envUrl;
};

export const API_BASE_URL = getApiBaseUrl();

let isBackendAvailable: boolean | null = null;
let lastAvailabilityCheck = 0;
const CHECK_INTERVAL = 30000; // Check every 30s

/**
 * Check if the backend REST server is healthy and responding.
 */
export async function checkBackendHealth(): Promise<boolean> {
  const now = Date.now();
  if (isBackendAvailable !== null && now - lastAvailabilityCheck < CHECK_INTERVAL) {
    return isBackendAvailable;
  }

  // When deployed on HTTPS (e.g., GitHub Pages) without an explicit API URL, avoid blocked mixed-content requests to localhost
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && (!import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL.startsWith('http://localhost'))) {
    isBackendAvailable = false;
    lastAvailabilityCheck = Date.now();
    return false;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const json = await res.json();
      isBackendAvailable = json.success === true;
    } else {
      isBackendAvailable = false;
    }
  } catch {
    isBackendAvailable = false;
  }

  lastAvailabilityCheck = Date.now();
  return isBackendAvailable;
}

// ----------------------------------------------------
// 1. FACULTY API
// ----------------------------------------------------

export interface FacultyPaginationResult {
  faculty: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function fetchFaculty(page = 1, limit = 10, search = '', department = ''): Promise<FacultyPaginationResult> {
  try {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit)
      });
      if (search) params.append('q', search);
      if (department) params.append('department', department);

      const endpoint = search ? `/faculty/search?${params}` : `/faculty?${params}`;
      const res = await fetch(`${API_BASE_URL}${endpoint}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    }
  } catch (err) {
    console.warn('[API Client] Backend request failed for fetchFaculty. Falling back to local data.', err);
  }

  // Graceful Fallback
  return fallbackFetchFaculty(page, limit, search, department);
}

export async function fetchFacultyById(id: string): Promise<any | null> {
  try {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const res = await fetch(`${API_BASE_URL}/faculty/${encodeURIComponent(id)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    }
  } catch (err) {
    console.warn(`[API Client] fetchFacultyById failed for ${id}. Falling back.`, err);
  }
  return fallbackGetFacultyById(id);
}

// ----------------------------------------------------
// 2. LIBRARY & OCCUPANCY API
// ----------------------------------------------------

export async function fetchLibraries(): Promise<any[]> {
  try {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const res = await fetch(`${API_BASE_URL}/libraries`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    }
  } catch (err) {
    console.warn('[API Client] fetchLibraries failed. Falling back to local data.', err);
  }
  return fallbackGetLibraries();
}

export async function fetchLibraryOccupancy(libraryId: string): Promise<any> {
  try {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const res = await fetch(`${API_BASE_URL}/libraries/${encodeURIComponent(libraryId)}/occupancy`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    }
  } catch (err) {
    console.warn(`[API Client] fetchLibraryOccupancy failed for ${libraryId}. Falling back.`, err);
  }
  return fallbackGetLibraryOccupancy(libraryId);
}

export async function fetchAllOccupancy(): Promise<any[]> {
  try {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const res = await fetch(`${API_BASE_URL}/libraries/occupancy/current`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    }
  } catch (err) {
    console.warn('[API Client] fetchAllOccupancy failed. Falling back.', err);
  }
  return fallbackGetAllOccupancy();
}

export async function fetchLeastCrowdedLibrary(): Promise<any> {
  try {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const res = await fetch(`${API_BASE_URL}/libraries/least-crowded`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    }
  } catch (err) {
    console.warn('[API Client] fetchLeastCrowdedLibrary failed. Falling back.', err);
  }
  return fallbackGetLeastCrowdedLibrary();
}

// ----------------------------------------------------
// 3. BUILDING API
// ----------------------------------------------------

export async function fetchBuildings(): Promise<any[]> {
  try {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const res = await fetch(`${API_BASE_URL}/buildings`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    }
  } catch (err) {
    console.warn('[API Client] fetchBuildings failed. Falling back.', err);
  }
  return fallbackGetBuildings();
}

export async function fetchBuildingById(id: string): Promise<any | null> {
  try {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const res = await fetch(`${API_BASE_URL}/buildings/${encodeURIComponent(id)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    }
  } catch (err) {
    console.warn(`[API Client] fetchBuildingById failed for ${id}. Falling back.`, err);
  }
  return fallbackGetBuildingById(id);
}

// ----------------------------------------------------
// 4. ROOM API
// ----------------------------------------------------

export async function fetchRooms(): Promise<any[]> {
  try {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const res = await fetch(`${API_BASE_URL}/rooms`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    }
  } catch (err) {
    console.warn('[API Client] fetchRooms failed. Falling back.', err);
  }
  return fallbackGetRooms();
}

export async function fetchRoomByNumber(roomNumber: string): Promise<any | null> {
  try {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const res = await fetch(`${API_BASE_URL}/rooms/${encodeURIComponent(roomNumber)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    }
  } catch (err) {
    console.warn(`[API Client] fetchRoomByNumber failed for ${roomNumber}. Falling back.`, err);
  }
  return fallbackGetRoomByNumber(roomNumber);
}

// ----------------------------------------------------
// 5. ISSUE REPORTING API
// ----------------------------------------------------

export async function fetchIssues(filters: Record<string, string> = {}): Promise<any[]> {
  try {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const params = new URLSearchParams(filters);
      const res = await fetch(`${API_BASE_URL}/issues?${params}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    }
  } catch (err) {
    console.warn('[API Client] fetchIssues failed. Falling back.', err);
  }
  return fallbackGetIssues(filters);
}

export async function createIssue(issueData: any): Promise<any> {
  const targetUrl = `${API_BASE_URL}/issues`;

  // Pre-flight validation: check if reporter / user identifier is blocked
  const idToCheck = issueData?.reportedBy || issueData?.user || issueData?.reporter || issueData?.username || issueData?.studentId;
  if (isBlockedUser(idToCheck)) {
    throw new Error(BLOCKED_USER_ERROR_MESSAGE);
  }

  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(issueData)
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok || json.success === false) {
      throw new Error(json.message || `Failed to report issue to backend (HTTP ${res.status})`);
    }

    isBackendAvailable = true;
    return json.issue || json.data || json;
  } catch (err: any) {
    console.error(`[API Client] POST ${targetUrl} failed:`, err);
    throw err;
  }
}

export async function updateIssueStatus(id: string, status: string): Promise<any> {
  try {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const res = await fetch(`${API_BASE_URL}/issues/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    }
  } catch (err) {
    console.warn('[API Client] updateIssueStatus failed. Falling back.', err);
  }
  return fallbackUpdateIssueStatus(id, status);
}

// ----------------------------------------------------
// 6. LOST & FOUND API
// ----------------------------------------------------

export async function fetchLostFound(filters: Record<string, string> = {}): Promise<any[]> {
  try {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const params = new URLSearchParams(filters);
      const res = await fetch(`${API_BASE_URL}/lost-found?${params}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) return json.data;
      }
    }
  } catch (err) {
    console.warn('[API Client] fetchLostFound failed. Falling back.', err);
  }
  return fallbackGetLostFound(filters);
}

export async function createLostFound(itemData: any): Promise<any> {
  const targetUrl = `${API_BASE_URL}/lost-found`;

  const usnToCheck = itemData?.usn;
  if (isBlockedUser(usnToCheck)) {
    throw new Error(BLOCKED_USER_ERROR_MESSAGE);
  }

  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok || json.success === false) {
      throw new Error(json.message || `Failed to report found item to backend (HTTP ${res.status})`);
    }

    isBackendAvailable = true;
    return json.data || json;
  } catch (err: any) {
    console.error(`[API Client] POST ${targetUrl} failed:`, err);
    throw err;
  }
}

export async function updateLostFoundStatus(id: string, status: string): Promise<any> {
  try {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const res = await fetch(`${API_BASE_URL}/lost-found/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    }
  } catch (err) {
    console.warn('[API Client] updateLostFoundStatus failed. Falling back.', err);
  }
  return fallbackUpdateLostFoundStatus(id, status);
}

// ----------------------------------------------------
// 7. GLOBAL SEARCH API
// ----------------------------------------------------

export async function globalSearch(query: string): Promise<any> {
  try {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const res = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    }
  } catch (err) {
    console.warn('[API Client] globalSearch failed. Falling back.', err);
  }
  return fallbackGlobalSearch(query);
}

// ----------------------------------------------------
// 6.5 MSRIT LIVE ANNOUNCEMENTS & EVENTS API
// ----------------------------------------------------

export async function fetchAnnouncements(): Promise<{ success: boolean; data: any[]; lastFetched?: string }> {
  try {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const res = await fetch(`${API_BASE_URL}/announcements`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) return json;
      }
    }
  } catch (err) {
    console.warn('[API Client] fetchAnnouncements failed:', err);
  }
  return { success: false, data: [] };
}

export async function fetchEvents(): Promise<{ success: boolean; data: any[]; lastFetched?: string }> {
  try {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const res = await fetch(`${API_BASE_URL}/events`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) return json;
      }
    }
  } catch (err) {
    console.warn('[API Client] fetchEvents failed:', err);
  }
  return { success: false, data: [] };
}

export async function fetchClubs(params?: { category?: string; q?: string; limit?: number }): Promise<{ success: boolean; data: any[]; lastFetched?: string }> {
  try {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const searchParams = new URLSearchParams();
      if (params?.category && params.category !== 'All') searchParams.set('category', params.category);
      if (params?.q) searchParams.set('q', params.q);
      if (params?.limit) searchParams.set('limit', String(params.limit));

      const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
      const res = await fetch(`${API_BASE_URL}/clubs${queryStr}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) return json;
      }
    }
  } catch (err) {
    console.warn('[API Client] fetchClubs failed:', err);
  }

  // Fallback to static verified directory
  let data = [...VERIFIED_MSRIT_CLUBS];
  if (params?.category && params.category !== 'All') {
    data = data.filter(c => c.category.toLowerCase() === params.category!.toLowerCase());
  }
  if (params?.q) {
    const qNorm = params.q.toLowerCase().trim();
    data = data.filter(c =>
      c.normalizedName.includes(qNorm) ||
      c.name.toLowerCase().includes(qNorm) ||
      c.description.toLowerCase().includes(qNorm) ||
      c.category.toLowerCase().includes(qNorm) ||
      (c.relatedChapters && c.relatedChapters.some(rc => rc.toLowerCase().includes(qNorm)))
    );
  }
  if (params?.limit) {
    data = data.slice(0, params.limit);
  }

  return { success: true, data, lastFetched: new Date().toISOString() };
}

export async function fetchClubById(idOrName: string): Promise<{ success: boolean; data: any | null }> {
  try {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const res = await fetch(`${API_BASE_URL}/clubs/${encodeURIComponent(idOrName)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) return json;
      }
    }
  } catch (err) {
    console.warn('[API Client] fetchClubById failed:', err);
  }

  const norm = idOrName.toLowerCase().trim();
  const found = VERIFIED_MSRIT_CLUBS.find(c =>
    c.normalizedName === norm ||
    c.name.toLowerCase() === norm ||
    (c.id && c.id === idOrName)
  );

  return { success: !!found, data: found || null };
}

// ----------------------------------------------------
// 7. ASK CAMPUS AI API
// ----------------------------------------------------

export async function queryCampusAi(query: string, sessionId?: string): Promise<{ intent: string; answer: string; data?: any; actions?: any[] }> {
  try {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const res = await fetch(`${API_BASE_URL}/ai/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, sessionId })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          return {
            intent: json.intent,
            answer: json.answer,
            data: json.data,
            actions: json.actions
          };
        }
      }
    }
  } catch (err) {
    console.warn('[API Client] queryCampusAi failed. Falling back to local AI engine.', err);
  }
  return fallbackQueryCampusAi(query);
}

// ----------------------------------------------------
// 8. AUTH API
// ----------------------------------------------------

export async function loginUser(email: string, password: string): Promise<{ token: string; user: any }> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Authentication failed');
  }
  return json.data;
}

export async function registerUser(name: string, email: string, password: string, role = 'student'): Promise<{ token: string; user: any }> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role })
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Registration failed');
  }
  return json.data;
}


// ====================================================
// FALLBACK IMPLEMENTATIONS USING EXISTING DATA MODULES
// ====================================================

import facultyDataDynamic from '../data/faculty_msrit_dynamic.json';
import { LIBRARIES } from '../data/libraryData';
import { VERIFIED_CAMPUS_BLOCKS } from '../data/verifiedCampusBlocks';
import roomDataJson from '../data/msrit_rooms.json';
import { INITIAL_ISSUE_REPORTS } from '../data/issueReportsData';
import { processCampusAiQuery } from '../data/campusAiEngine';
import { getStoredLostFoundItems, saveLostFoundItem } from '../data/lostFoundData';
import type { LostFoundItem } from '../data/lostFoundData';

function fallbackFetchFaculty(page: number, limit: number, search: string, department: string): FacultyPaginationResult {
  let list = facultyDataDynamic as any[];
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((f) =>
      f.name?.toLowerCase().includes(q) ||
      f.department?.toLowerCase().includes(q) ||
      f.designation?.toLowerCase().includes(q) ||
      f.cabinLocation?.toLowerCase().includes(q)
    );
  }
  if (department) {
    const d = department.toLowerCase();
    list = list.filter((f) => f.department?.toLowerCase().includes(d));
  }

  const total = list.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginated = list.slice(startIndex, startIndex + limit);

  return {
    faculty: paginated,
    pagination: { total, page, limit, totalPages }
  };
}

function fallbackGetFacultyById(id: string) {
  const list = facultyDataDynamic as any[];
  return list.find((f) => f.id === id) || null;
}

function fallbackGetLibraries() {
  return LIBRARIES;
}

function fallbackGetLibraryOccupancy(libraryId: string) {
  const lib = LIBRARIES.find((l) => l.id === libraryId);
  return {
    libraryId,
    name: lib ? lib.name : libraryId,
    occupancyPercentage: 45,
    source: 'estimated',
    isOpen: true
  };
}

function fallbackGetAllOccupancy() {
  return LIBRARIES.map((lib, idx) => ({
    libraryId: lib.id,
    name: lib.name,
    occupancyPercentage: [45, 60, 30][idx] || 40,
    source: 'estimated',
    isOpen: true
  }));
}

function fallbackGetLeastCrowdedLibrary() {
  return {
    libraryId: 'apex_unit_3_library',
    name: 'Apex Library',
    occupancyPercentage: 30,
    source: 'estimated',
    isOpen: true
  };
}

function fallbackGetBuildings() {
  return VERIFIED_CAMPUS_BLOCKS;
}

function fallbackGetBuildingById(id: string) {
  return VERIFIED_CAMPUS_BLOCKS.find((b) => b.id === id) || null;
}

function fallbackGetRooms() {
  return roomDataJson.rooms || [];
}

function fallbackGetRoomByNumber(roomNumber: string) {
  const clean = roomNumber.replace(/[\s-]/g, '').toLowerCase();
  const rooms = roomDataJson.rooms || [];
  return rooms.find((r: any) => r.roomNumber.replace(/[\s-]/g, '').toLowerCase() === clean) || null;
}

function fallbackGetIssues(filters: Record<string, string>) {
  let list = INITIAL_ISSUE_REPORTS;
  if (filters.status) list = list.filter((i) => i.status === filters.status);
  if (filters.priority) list = list.filter((i) => i.priority === filters.priority);
  if (filters.category) list = list.filter((i) => i.category === filters.category);
  return list;
}

export function fallbackCreateIssue(data: any) {
  return {
    id: `iss-local-${Date.now()}`,
    ...data,
    status: data.status || 'Reported',
    createdAt: new Date().toISOString()
  };
}

function fallbackUpdateIssueStatus(id: string, status: string) {
  const issue = INITIAL_ISSUE_REPORTS.find((i) => i.id === id);
  if (issue) {
    issue.status = status as any;
    return issue;
  }
  return { id, status };
}

function fallbackGlobalSearch(query: string) {
  const q = query.toLowerCase();
  const faculty = (facultyDataDynamic as any[])
    .filter((f) => f.name.toLowerCase().includes(q) || f.department.toLowerCase().includes(q))
    .slice(0, 5);

  const libraries = LIBRARIES
    .filter((l) => l.name.toLowerCase().includes(q) || l.building.toLowerCase().includes(q));
  const buildings = VERIFIED_CAMPUS_BLOCKS
    .filter((b) => b.name.toLowerCase().includes(q) || (b.displayName && b.displayName.toLowerCase().includes(q)));

  const rooms = (roomDataJson.rooms || [])
    .filter((r: any) => r.roomNumber.toLowerCase().includes(q) || r.department.toLowerCase().includes(q))
    .slice(0, 5);

  const issues = INITIAL_ISSUE_REPORTS
    .filter((i) => i.title.toLowerCase().includes(q) || i.location.toLowerCase().includes(q));

  return { query, faculty, libraries, buildings, rooms, issues };
}

async function fallbackQueryCampusAi(query: string) {
  const result = await processCampusAiQuery(query);
  const textAnswer = (typeof result === 'object' && result?.responseText) ? result.responseText : "I don't have that information in the current Campus Pulse data.";
  return {
    intent: (typeof result === 'object' && result?.intents?.[0]) ? result.intents[0] : 'GENERAL_CAMPUS_QUERY',
    answer: textAnswer
  };
}

function fallbackGetLostFound(filters: Record<string, string>): LostFoundItem[] {
  let list = getStoredLostFoundItems();
  if (filters.status) {
    const s = filters.status.toUpperCase();
    if (s === 'FOUND' || s === 'RECOVERED') {
      list = list.filter((i) => (i.status || '').toUpperCase() === s);
    }
  }
  if (filters.category && filters.category !== 'all' && filters.category !== 'ALL') {
    list = list.filter((i) => (i.category || '').toLowerCase() === filters.category.toLowerCase());
  }
  if (filters.q || filters.search) {
    const q = (filters.q || filters.search).toLowerCase();
    list = list.filter((i) =>
      i.itemName.toLowerCase().includes(q) ||
      (i.description && i.description.toLowerCase().includes(q)) ||
      (i.foundAt && i.foundAt.toLowerCase().includes(q)) ||
      (i.location && i.location.toLowerCase().includes(q)) ||
      (i.usn && i.usn.toLowerCase().includes(q))
    );
  }
  return list;
}

export function fallbackCreateLostFound(data: any): LostFoundItem {
  const newItem: LostFoundItem = {
    id: `lf-local-${Date.now()}`,
    itemName: data.itemTitle || data.itemName || data.title,
    itemTitle: data.itemTitle || data.itemName || data.title,
    category: data.category || 'Other',
    description: data.description,
    foundAt: data.foundAt || data.location,
    location: data.foundAt || data.location,
    foundOn: data.foundOn || data.date || new Date().toISOString().split('T')[0],
    date: data.foundOn || data.date || new Date().toISOString().split('T')[0],
    usn: data.usn,
    status: 'FOUND',
    contactLocation: 'Security Enquiry Desk',
    statusLabel: 'FOUND & SECURED',
    type: 'found',
    image: data.image || '',
    isDemo: false
  };
  saveLostFoundItem(newItem);
  return newItem;
}

function fallbackUpdateLostFoundStatus(id: string, status: string): any {
  const normalizedStatus = status.toLowerCase() === 'recovered' ? 'RECOVERED' : 'FOUND';
  const list = getStoredLostFoundItems();
  const item = list.find((i) => String(i.id) === String(id));
  if (item) {
    item.status = normalizedStatus;
    item.statusLabel = normalizedStatus === 'FOUND' ? 'FOUND & SECURED' : 'RECOVERED & CLAIMED';
    item.type = normalizedStatus === 'FOUND' ? 'found' : 'recovered';
    saveLostFoundItem(item);
    return item;
  }
  return { id, status: normalizedStatus };
}
