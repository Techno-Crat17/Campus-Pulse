import { Faculty } from '../models/Faculty.js';
import { Library } from '../models/Library.js';
import { Room } from '../models/Room.js';
import { Issue } from '../models/Issue.js';
import { LibraryOccupancy } from '../models/LibraryOccupancy.js';
import { calculateEstimatedOccupancy } from '../services/occupancyService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export async function createFaculty(req, res, next) {
  try {
    const facultyData = req.body;
    if (!facultyData.id || !facultyData.name) {
      return errorResponse(res, 'id and name are required for faculty record', 'VALIDATION_ERROR', 400);
    }

    const created = await Faculty.create(facultyData);
    return successResponse(res, created, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateFaculty(req, res, next) {
  try {
    const updated = await Faculty.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!updated) {
      return errorResponse(res, `Faculty member ${req.params.id} not found`, 'NOT_FOUND', 404);
    }
    return successResponse(res, updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteFaculty(req, res, next) {
  try {
    const deleted = await Faculty.findOneAndDelete({ id: req.params.id });
    if (!deleted) {
      return errorResponse(res, `Faculty member ${req.params.id} not found`, 'NOT_FOUND', 404);
    }
    return successResponse(res, { message: `Faculty ${req.params.id} deleted successfully` });
  } catch (err) {
    next(err);
  }
}

export async function updateLibrary(req, res, next) {
  try {
    const updated = await Library.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!updated) {
      return errorResponse(res, `Library ${req.params.id} not found`, 'NOT_FOUND', 404);
    }
    return successResponse(res, updated);
  } catch (err) {
    next(err);
  }
}

export async function createRoom(req, res, next) {
  try {
    const roomData = req.body;
    if (!roomData.roomNumber || !roomData.building || !roomData.type) {
      return errorResponse(res, 'roomNumber, building, and type are required', 'VALIDATION_ERROR', 400);
    }
    const created = await Room.create(roomData);
    return successResponse(res, created, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateRoom(req, res, next) {
  try {
    const updated = await Room.findOneAndUpdate(
      { roomNumber: { $regex: new RegExp(`^${req.params.roomNumber}$`, 'i') } },
      req.body,
      { new: true }
    );
    if (!updated) {
      return errorResponse(res, `Room ${req.params.roomNumber} not found`, 'NOT_FOUND', 404);
    }
    return successResponse(res, updated);
  } catch (err) {
    next(err);
  }
}

export async function triggerOccupancyRefresh(req, res, next) {
  try {
    const libraries = await Library.find({});
    const now = new Date();
    const records = [];

    for (const lib of libraries) {
      const occ = calculateEstimatedOccupancy(lib.id, now);
      const rec = await LibraryOccupancy.create({
        libraryId: lib.id,
        occupancyPercentage: occ,
        source: 'estimated'
      });
      records.push(rec);
    }

    return successResponse(res, { message: 'Occupancy refreshed successfully', records });
  } catch (err) {
    next(err);
  }
}
