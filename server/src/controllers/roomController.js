import { Room } from '../models/Room.js';
import { normalizeRoomNumber, normalizeRoomNameForSearch } from '../utils/roomUtils.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export async function getRooms(req, res, next) {
  try {
    const { building, floor, department, q, search, type } = req.query;
    const filter = {};

    // 1. Building filter
    if (building) {
      const bStr = String(building).trim();
      filter.$or = filter.$or || [];
      const buildingFilter = [
        { building: { $regex: bStr, $options: 'i' } },
        { buildingCode: { $regex: bStr, $options: 'i' } }
      ];
      // Special alias mapping for LHC / CRD / Multipurpose
      if (/lhc/i.test(bStr)) {
        buildingFilter.push({ building: { $regex: 'Lecture Hall Complex', $options: 'i' } });
      }
      if (/crd|multipurpose/i.test(bStr)) {
        buildingFilter.push({ building: { $regex: 'Multipurpose', $options: 'i' } });
        buildingFilter.push({ building: { $regex: 'CRD', $options: 'i' } });
        buildingFilter.push({ buildingCode: 'CRD' });
      }
      filter.$and = filter.$and || [];
      filter.$and.push({ $or: buildingFilter });
    }

    // 2. Floor filter
    if (floor) {
      const fStr = String(floor).trim();
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { floor: { $regex: fStr, $options: 'i' } },
          { floor: fStr }
        ]
      });
    }

    // 3. Department filter
    if (department) {
      const dStr = String(department).trim();
      const deptRegex = new RegExp(dStr, 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { department: deptRegex },
          { departments: { $in: [deptRegex, dStr] } }
        ]
      });
    }

    // 4. Type / Category filter
    if (type) {
      const tStr = String(type).trim();
      filter.type = { $regex: tStr, $options: 'i' };
    }

    // 5. Keyword search filter
    const queryTerm = (q || search || '').trim();
    if (queryTerm) {
      const norm = normalizeRoomNumber(queryTerm);
      const normName = normalizeRoomNameForSearch(queryTerm);
      const qRegex = { $regex: queryTerm, $options: 'i' };
      const normNameRegex = normName ? { $regex: normName, $options: 'i' } : qRegex;

      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { roomNumber: qRegex },
          { roomNumberNormalized: { $regex: norm, $options: 'i' } },
          { name: qRegex },
          { normalizedName: normNameRegex },
          { building: qRegex },
          { buildingCode: qRegex },
          { department: qRegex },
          { departments: { $in: [qRegex] } },
          { floor: qRegex },
          { type: qRegex },
          { description: qRegex }
        ]
      });
    }

    const rooms = await Room.find(filter).sort({ roomNumber: 1 }).lean();
    return successResponse(res, rooms, 200, { total: rooms.length });
  } catch (err) {
    next(err);
  }
}

export async function searchRooms(req, res, next) {
  try {
    const queryStr = (req.query.q || req.query.search || '').trim();
    if (!queryStr) {
      return getRooms(req, res, next);
    }

    const norm = normalizeRoomNumber(queryStr);
    const normName = normalizeRoomNameForSearch(queryStr);
    const qRegex = { $regex: queryStr, $options: 'i' };
    const normNameRegex = normName ? { $regex: normName, $options: 'i' } : qRegex;

    const rooms = await Room.find({
      $or: [
        { roomNumber: qRegex },
        { roomNumberNormalized: { $regex: norm, $options: 'i' } },
        { name: qRegex },
        { normalizedName: normNameRegex },
        { building: qRegex },
        { buildingCode: qRegex },
        { department: qRegex },
        { departments: { $in: [qRegex] } },
        { floor: qRegex },
        { type: qRegex },
        { description: qRegex }
      ]
    }).sort({ roomNumber: 1 }).lean();

    return successResponse(res, rooms, 200, { total: rooms.length });
  } catch (err) {
    next(err);
  }
}

export async function getRoomsByBuilding(req, res, next) {
  try {
    const bld = req.params.building;
    const isLhc = /lhc/i.test(bld);
    const isCrd = /crd|multipurpose/i.test(bld);

    const query = isLhc
      ? {
          $or: [
            { building: { $regex: 'LHC', $options: 'i' } },
            { buildingCode: 'LHC' },
            { building: { $regex: 'Lecture Hall Complex', $options: 'i' } }
          ]
        }
      : isCrd
      ? {
          $or: [
            { building: { $regex: 'CRD', $options: 'i' } },
            { buildingCode: 'CRD' },
            { building: { $regex: 'Multipurpose', $options: 'i' } }
          ]
        }
      : {
          $or: [
            { building: { $regex: bld, $options: 'i' } },
            { buildingCode: { $regex: bld, $options: 'i' } }
          ]
        };

    const rooms = await Room.find(query).sort({ roomNumber: 1 }).lean();
    return successResponse(res, rooms, 200, { total: rooms.length });
  } catch (err) {
    next(err);
  }
}

export async function getRoomsByDepartment(req, res, next) {
  try {
    const dept = req.params.department;
    const deptRegex = new RegExp(dept, 'i');
    const rooms = await Room.find({
      $or: [
        { department: deptRegex },
        { departments: { $in: [deptRegex, dept] } }
      ]
    }).sort({ roomNumber: 1 }).lean();

    return successResponse(res, rooms, 200, { total: rooms.length });
  } catch (err) {
    next(err);
  }
}

export async function getRoomByNumber(req, res, next) {
  try {
    const rawNumber = req.params.roomNumber;
    const norm = normalizeRoomNumber(rawNumber);

    const room = await Room.findOne({
      $or: [
        { roomNumber: { $regex: new RegExp(`^${rawNumber}$`, 'i') } },
        { roomNumberNormalized: norm }
      ]
    }).lean();

    if (!room) {
      return errorResponse(res, `Room ${rawNumber} not found`, 'ROOM_NOT_FOUND', 404);
    }

    return successResponse(res, room);
  } catch (err) {
    next(err);
  }
}
