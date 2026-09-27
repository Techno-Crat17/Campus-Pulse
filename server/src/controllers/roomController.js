import { Room } from '../models/Room.js';
import { normalizeRoomNumber } from '../utils/roomUtils.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export async function getRooms(req, res, next) {
  try {
    const rooms = await Room.find({}).sort({ roomNumber: 1 }).lean();
    return successResponse(res, rooms, 200, { total: rooms.length });
  } catch (err) {
    next(err);
  }
}

export async function searchRooms(req, res, next) {
  try {
    const queryStr = (req.query.q || '').trim();
    if (!queryStr) {
      return getRooms(req, res, next);
    }

    const norm = normalizeRoomNumber(queryStr);
    const rooms = await Room.find({
      $or: [
        { roomNumber: { $regex: queryStr, $options: 'i' } },
        { roomNumberNormalized: { $regex: norm, $options: 'i' } },
        { building: { $regex: queryStr, $options: 'i' } },
        { department: { $regex: queryStr, $options: 'i' } },
        { type: { $regex: queryStr, $options: 'i' } }
      ]
    }).lean();

    return successResponse(res, rooms, 200, { total: rooms.length });
  } catch (err) {
    next(err);
  }
}

export async function getRoomsByBuilding(req, res, next) {
  try {
    const bld = req.params.building;
    const rooms = await Room.find({
      building: { $regex: bld, $options: 'i' }
    }).lean();

    return successResponse(res, rooms, 200, { total: rooms.length });
  } catch (err) {
    next(err);
  }
}

export async function getRoomsByDepartment(req, res, next) {
  try {
    const dept = req.params.department;
    const rooms = await Room.find({
      department: { $regex: new RegExp(`^${dept}$`, 'i') }
    }).lean();

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
