import { Faculty } from '../models/Faculty.js';
import { Library } from '../models/Library.js';
import { Building } from '../models/Building.js';
import { Room } from '../models/Room.js';
import { Issue } from '../models/Issue.js';
import { calculateFacultyDynamicStatus } from './facultyStatusService.js';
import { calculateEstimatedOccupancy, isLibraryOpen } from './occupancyService.js';
import { normalizeRoomNumber } from '../utils/roomUtils.js';
import { getLiveAnnouncements, getLiveEvents } from './msritService.js';

// In-memory short-lived session context store
const sessionContextStore = new Map();

function getSessionContext(sessionId) {
  if (!sessionId) return {};
  const existing = sessionContextStore.get(sessionId);
  if (existing && Date.now() - existing.lastUpdated < 15 * 60 * 1000) {
    return existing;
  }
  return {};
}

function updateSessionContext(sessionId, newContext) {
  if (!sessionId) return;
  const current = getSessionContext(sessionId);
  sessionContextStore.set(sessionId, {
    ...current,
    ...newContext,
    lastUpdated: Date.now()
  });
}

export async function processAiQuery(userQuery, sessionId = 'default-session') {
  const query = (userQuery || '').trim();
  const lower = query.toLowerCase();
  const context = getSessionContext(sessionId);

  if (!query) {
    return {
      intent: 'GENERAL_CAMPUS_QUERY',
      answer: 'Please enter a campus query (e.g. "Where is Dr. Sumana?", "Which library is open?", "Where is LHC204?").',
      data: null
    };
  }

  // Handle pronoun resolution using session context
  let resolvedFacultyName = null;
  let resolvedLibraryId = null;

  if (/(she|her|he|him|they|them|the professor|the faculty|dr|prof)/i.test(query) && context.lastFacultyId) {
    resolvedFacultyName = context.lastFacultyId;
  }

  if (/(it|that library|the library)/i.test(query) && context.lastLibraryId) {
    resolvedLibraryId = context.lastLibraryId;
  }

  // 0.5. MSRIT ANNOUNCEMENTS & EVENTS QUERY PATTERNS
  const isAnnouncementQuery = lower.includes('announcement') || lower.includes('news') || lower.includes('circular') || lower.includes('timetable') || lower.includes('notification');
  const isEventQuery = lower.includes('event') || lower.includes('symposium') || lower.includes('workshop') || lower.includes('fresher') || lower.includes('graduation');

  if (isAnnouncementQuery) {
    const result = await getLiveAnnouncements();
    const list = (result.data || []).slice(0, 3);
    if (list.length > 0) {
      const itemsText = list.map((a, i) => `${i + 1}. "${a.title}" (${a.date})`).join('; ');
      const ans = `Latest MSRIT Announcements (Source: ${result.source}, Updated: ${new Date(result.lastFetched).toLocaleTimeString()}): ${itemsText}. Total ${result.data.length} official announcements tracked.`;
      return { intent: 'ANNOUNCEMENT_QUERY', answer: ans, data: { announcements: list, source: result.source, lastFetched: result.lastFetched } };
    }
    return { intent: 'ANNOUNCEMENT_QUERY', answer: 'No live MSRIT announcements are currently available from the official website.', data: null };
  }

  if (isEventQuery) {
    const result = await getLiveEvents();
    const list = (result.data || []).slice(0, 3);
    if (list.length > 0) {
      const itemsText = list.map((e, i) => `${i + 1}. "${e.title}" (${e.date}, Location: ${e.location})`).join('; ');
      const ans = `Latest MSRIT Events (Source: ${result.source}, Updated: ${new Date(result.lastFetched).toLocaleTimeString()}): ${itemsText}. Total ${result.data.length} official events tracked.`;
      return { intent: 'EVENT_QUERY', answer: ans, data: { events: list, source: result.source, lastFetched: result.lastFetched } };
    }
    return { intent: 'EVENT_QUERY', answer: 'No live MSRIT events are currently available from the official website.', data: null };
  }

  // 1. FACULTY QUERY PATTERNS
  const isFacultyQuery = lower.includes('faculty') || lower.includes('professor') || lower.includes('dr.') || lower.includes('dr ') || lower.includes('prof') || lower.includes('cabin') || lower.includes('email') || lower.includes('schedule') || resolvedFacultyName;

  if (isFacultyQuery) {
    let faculty = null;

    // Search by explicit name if provided, else use context
    let searchTerm = query
      .replace(/(where is|what is|email of|cabin of|schedule of|is|available|prof|dr\.|dr|professor|contact|status|for)/gi, '')
      .trim();

    if (searchTerm.length >= 2) {
      faculty = await Faculty.findOne({
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { id: { $regex: searchTerm, $options: 'i' } }
        ]
      });
    }

    if (!faculty && resolvedFacultyName) {
      faculty = await Faculty.findOne({
        $or: [
          { id: resolvedFacultyName },
          { name: { $regex: resolvedFacultyName, $options: 'i' } }
        ]
      });
    }

    if (faculty) {
      updateSessionContext(sessionId, { lastFacultyId: faculty.id, lastFacultyName: faculty.name });
      const dynStatus = calculateFacultyDynamicStatus(faculty);

      // Multi-intent checks
      const wantsEmail = lower.includes('email') || lower.includes('contact');
      const wantsCabin = lower.includes('cabin') || lower.includes('office') || lower.includes('room');
      const wantsSchedule = lower.includes('schedule') || lower.includes('lecture') || lower.includes('class');

      let answer = `${faculty.name} (${faculty.designation || 'Faculty'}, ${faculty.department || 'MSRIT'}). `;

      if (wantsEmail && wantsCabin) {
        answer += `Email: ${faculty.email || 'Not available'}. Cabin: ${faculty.cabinLocation || 'Main Block'}. Current live status: ${dynStatus.status} (${dynStatus.currentLocation}).`;
        return { intent: 'FACULTY_LOCATION', answer, data: { faculty, dynamicStatus: dynStatus } };
      }

      if (wantsEmail) {
        answer += `Email address is ${faculty.email || 'Not available'}.`;
        return { intent: 'FACULTY_EMAIL', answer, data: { faculty, dynamicStatus: dynStatus } };
      }

      if (wantsCabin) {
        answer += `Cabin location: ${faculty.cabinLocation || 'Main Block'}. Currently ${dynStatus.status}.`;
        return { intent: 'FACULTY_CABIN', answer, data: { faculty, dynamicStatus: dynStatus } };
      }

      if (wantsSchedule) {
        const schedCount = (faculty.todaySchedule || []).length;
        answer += `Has ${schedCount} scheduled session(s) today. Current status: ${dynStatus.status} at ${dynStatus.currentLocation}.`;
        return { intent: 'FACULTY_SCHEDULE', answer, data: { faculty, dynamicStatus: dynStatus } };
      }

      answer += `Current live status: ${dynStatus.status} (${dynStatus.currentLocation}). Cabin: ${faculty.cabinLocation || 'N/A'}.`;
      return { intent: 'FACULTY_AVAILABILITY', answer, data: { faculty, dynamicStatus: dynStatus } };
    }
  }

  // 2. LIBRARY & OCCUPANCY QUERY PATTERNS
  const isLibraryQuery = lower.includes('library') || lower.includes('study') || lower.includes('quiet') || lower.includes('crowded') || lower.includes('lhc library') || lower.includes('esb library') || lower.includes('apex library') || resolvedLibraryId;

  if (isLibraryQuery) {
    const libraries = await Library.find({});
    const now = new Date();
    const openState = isLibraryOpen(now);

    let targetLib = null;
    if (lower.includes('esb')) targetLib = libraries.find(l => l.id.includes('esb'));
    else if (lower.includes('lhc')) targetLib = libraries.find(l => l.id.includes('lhc'));
    else if (lower.includes('apex')) targetLib = libraries.find(l => l.id.includes('apex'));
    else if (resolvedLibraryId) targetLib = libraries.find(l => l.id === resolvedLibraryId);

    if (lower.includes('least crowded') || lower.includes('quietest') || lower.includes('best place')) {
      const libData = libraries.map(l => ({
        library: l,
        occ: calculateEstimatedOccupancy(l.id, now)
      })).sort((a, b) => a.occ - b.occ);

      const best = libData[0];
      if (best) {
        updateSessionContext(sessionId, { lastLibraryId: best.library.id });
        const ans = `${best.library.name} (${best.library.building} Block) is currently the least crowded library at ${best.occ}% estimated occupancy (${openState ? 'Open 09:00–21:00' : 'Currently Closed'}). Primary users: ${best.library.primaryUsers.join(', ')}.`;
        return { intent: 'LIBRARY_OCCUPANCY', answer: ans, data: { libraries: libData } };
      }
    }

    if (targetLib) {
      updateSessionContext(sessionId, { lastLibraryId: targetLib.id });
      const occ = calculateEstimatedOccupancy(targetLib.id, now);
      const ans = `${targetLib.name} (${targetLib.building} Block, ${targetLib.floor}): ${openState ? 'Open' : 'Closed'} (${occ}% estimated occupancy). Hours: 09:00–21:00 Daily. Primary users: ${targetLib.primaryUsers.join(', ')}.`;
      return { intent: 'LIBRARY_STATUS', answer: ans, data: { library: targetLib, occupancy: occ, isOpen: openState } };
    }

    const allLibsSummary = libraries.map(l => `${l.name}: ${calculateEstimatedOccupancy(l.id, now)}%`).join(', ');
    const ans = `Campus Libraries status (${openState ? 'Open 09:00–21:00' : 'Currently Closed'}): ${allLibsSummary}. All 3 libraries (ESB, LHC, Apex) are open daily 09:00–21:00.`;
    return { intent: 'LIBRARY_SEARCH', answer: ans, data: { libraries } };
  }

  // 3. ROOM QUERY PATTERNS
  if (lower.includes('room') || lower.includes('lab') || lower.includes('hall') || lower.includes('auditorium') || /[a-z]+-?\d+/i.test(query)) {
    const norm = normalizeRoomNumber(query);
    const rooms = await Room.find({
      $or: [
        { roomNumber: { $regex: norm, $options: 'i' } },
        { roomNumberNormalized: { $regex: norm, $options: 'i' } }
      ]
    });

    if (rooms && rooms.length > 0) {
      const room = rooms[0];
      const ans = `Room ${room.roomNumber} is a verified ${room.type} located in ${room.building} (${room.department ? room.department + ' Dept' : 'MSRIT'}). Source: ${room.sourceTitle || 'Official MSRIT Records'}.`;
      return { intent: 'ROOM_LOCATION', answer: ans, data: { room } };
    }
  }

  // 4. BUILDING QUERY PATTERNS
  if (lower.includes('building') || lower.includes('block') || lower.includes('where is')) {
    const buildings = await Building.find({});
    const match = buildings.find(b =>
      lower.includes(b.name.toLowerCase()) ||
      lower.includes(b.id.toLowerCase()) ||
      (b.displayName && lower.includes(b.displayName.toLowerCase()))
    );

    if (match) {
      const ans = `${match.name} (${match.displayName || match.id}): ${match.description || 'Verified Campus Block'}. Departments: ${(match.departments || []).join(', ')}.`;
      return { intent: 'BUILDING_LOCATION', answer: ans, data: { building: match } };
    }
  }

  // 5. ISSUE QUERY PATTERNS
  if (lower.includes('issue') || lower.includes('broken') || lower.includes('repair') || lower.includes('report')) {
    const issues = await Issue.find({}).sort({ createdAt: -1 }).limit(5);
    const ans = `Currently tracking ${issues.length} facility maintenance issue(s). Top report: "${issues[0]?.title || 'No active issues'}" (${issues[0]?.status || 'N/A'}, ${issues[0]?.location || ''}).`;
    return { intent: 'ISSUE_QUERY', answer: ans, data: { issues } };
  }

  // Fallback Grounded Answer
  return {
    intent: 'UNKNOWN_QUERY',
    answer: `I don't have that specific information in the current Campus Pulse data. You can query faculty availability, library occupancies, verified rooms, building locations, or issue reports.`,
    data: null
  };
}
