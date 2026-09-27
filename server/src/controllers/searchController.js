import { Faculty } from '../models/Faculty.js';
import { Library } from '../models/Library.js';
import { Building } from '../models/Building.js';
import { Room } from '../models/Room.js';
import { Issue } from '../models/Issue.js';
import { calculateFacultyDynamicStatus } from '../services/facultyStatusService.js';
import { calculateEstimatedOccupancy, isLibraryOpen } from '../services/occupancyService.js';
import { normalizeRoomNumber } from '../utils/roomUtils.js';
import { successResponse } from '../utils/apiResponse.js';

export async function searchGlobal(req, res, next) {
  try {
    const q = (req.query.q || '').trim();

    if (!q) {
      return successResponse(res, {
        faculty: [],
        libraries: [],
        buildings: [],
        rooms: [],
        issues: []
      });
    }

    const norm = normalizeRoomNumber(q);
    const now = new Date();
    const openState = isLibraryOpen(now);

    const [facultyRaw, librariesRaw, buildingsRaw, roomsRaw, issuesRaw] = await Promise.all([
      Faculty.find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { department: { $regex: q, $options: 'i' } },
          { designation: { $regex: q, $options: 'i' } },
          { cabinLocation: { $regex: q, $options: 'i' } }
        ]
      }).limit(10).lean(),

      Library.find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { building: { $regex: q, $options: 'i' } },
          { code: { $regex: q, $options: 'i' } },
          { disciplines: { $regex: q, $options: 'i' } }
        ]
      }).lean(),

      Building.find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { displayName: { $regex: q, $options: 'i' } },
          { shortName: { $regex: q, $options: 'i' } },
          { departments: { $regex: q, $options: 'i' } }
        ]
      }).lean(),

      Room.find({
        $or: [
          { roomNumber: { $regex: q, $options: 'i' } },
          { roomNumberNormalized: { $regex: norm, $options: 'i' } },
          { building: { $regex: q, $options: 'i' } },
          { department: { $regex: q, $options: 'i' } }
        ]
      }).limit(15).lean(),

      Issue.find({
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { location: { $regex: q, $options: 'i' } },
          { category: { $regex: q, $options: 'i' } }
        ]
      }).limit(10).lean()
    ]);

    const faculty = facultyRaw.map(f => {
      const dynamic = calculateFacultyDynamicStatus(f, now);
      return {
        ...f,
        status: dynamic.status,
        currentLocation: dynamic.currentLocation
      };
    });

    const libraries = librariesRaw.map(l => {
      const occ = calculateEstimatedOccupancy(l.id, now);
      return {
        ...l,
        isOpen: openState,
        calculatedOccupancy: occ,
        formattedOccupancy: `${occ}%`
      };
    });

    return successResponse(res, {
      faculty,
      libraries,
      buildings: buildingsRaw,
      rooms: roomsRaw,
      issues: issuesRaw
    });
  } catch (err) {
    next(err);
  }
}
