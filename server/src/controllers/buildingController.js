import { Building } from '../models/Building.js';
import { Room } from '../models/Room.js';
import { Faculty } from '../models/Faculty.js';
import { calculateFacultyDynamicStatus } from '../services/facultyStatusService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export async function getBuildings(req, res, next) {
  try {
    const buildings = await Building.find({}).lean();
    return successResponse(res, buildings);
  } catch (err) {
    next(err);
  }
}

export async function getBuildingById(req, res, next) {
  try {
    const building = await Building.findOne({
      $or: [
        { id: req.params.id },
        { name: { $regex: new RegExp(`^${req.params.id}$`, 'i') } }
      ]
    }).lean();

    if (!building) {
      return errorResponse(res, `Building ${req.params.id} not found`, 'BUILDING_NOT_FOUND', 404);
    }

    return successResponse(res, building);
  } catch (err) {
    next(err);
  }
}

export async function getBuildingRooms(req, res, next) {
  try {
    const building = await Building.findOne({
      $or: [
        { id: req.params.id },
        { name: { $regex: new RegExp(`^${req.params.id}$`, 'i') } }
      ]
    }).lean();

    const buildingName = building ? building.name : req.params.id;
    const rooms = await Room.find({
      building: { $regex: buildingName, $options: 'i' }
    }).lean();

    return successResponse(res, rooms, 200, { total: rooms.length });
  } catch (err) {
    next(err);
  }
}

export async function getBuildingFaculty(req, res, next) {
  try {
    const building = await Building.findOne({
      $or: [
        { id: req.params.id },
        { name: { $regex: new RegExp(`^${req.params.id}$`, 'i') } }
      ]
    }).lean();

    const bName = building ? building.name : req.params.id;
    const facultyDocs = await Faculty.find({
      $or: [
        { cabinLocation: { $regex: bName, $options: 'i' } },
        { department: { $in: building?.departments || [] } }
      ]
    }).lean();

    const now = new Date();
    const data = facultyDocs.map(f => {
      const dynamic = calculateFacultyDynamicStatus(f, now);
      return {
        ...f,
        status: dynamic.status,
        currentLocation: dynamic.currentLocation
      };
    });

    return successResponse(res, data, 200, { total: data.length });
  } catch (err) {
    next(err);
  }
}
