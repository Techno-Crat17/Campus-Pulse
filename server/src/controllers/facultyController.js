import { Faculty } from '../models/Faculty.js';
import { calculateFacultyDynamicStatus } from '../services/facultyStatusService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export async function getFaculty(req, res, next) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const total = await Faculty.countDocuments({});
    const facultyDocs = await Faculty.find({})
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const now = new Date();
    const data = facultyDocs.map(f => {
      const dynamic = calculateFacultyDynamicStatus(f, now);
      return {
        ...f,
        status: dynamic.status,
        currentLocation: dynamic.currentLocation,
        liveStatus: dynamic.liveStatus,
        liveLocation: dynamic.liveLocation,
        nextAvailableTime: dynamic.liveNextAvailableTime
      };
    });

    return successResponse(res, data, 200, {
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function searchFaculty(req, res, next) {
  try {
    const queryStr = (req.query.q || '').trim();
    if (!queryStr) {
      return getFaculty(req, res, next);
    }

    const facultyDocs = await Faculty.find({
      $or: [
        { name: { $regex: queryStr, $options: 'i' } },
        { department: { $regex: queryStr, $options: 'i' } },
        { designation: { $regex: queryStr, $options: 'i' } },
        { cabinLocation: { $regex: queryStr, $options: 'i' } },
        { expertise: { $regex: queryStr, $options: 'i' } }
      ]
    }).lean();

    const now = new Date();
    const data = facultyDocs.map(f => {
      const dynamic = calculateFacultyDynamicStatus(f, now);
      return {
        ...f,
        status: dynamic.status,
        currentLocation: dynamic.currentLocation,
        liveStatus: dynamic.liveStatus,
        liveLocation: dynamic.liveLocation,
        nextAvailableTime: dynamic.liveNextAvailableTime
      };
    });

    return successResponse(res, data, 200, { total: data.length });
  } catch (err) {
    next(err);
  }
}

export async function getFacultyByDepartment(req, res, next) {
  try {
    const dept = req.params.department;
    const facultyDocs = await Faculty.find({
      department: { $regex: new RegExp(`^${dept}$`, 'i') }
    }).lean();

    const now = new Date();
    const data = facultyDocs.map(f => {
      const dynamic = calculateFacultyDynamicStatus(f, now);
      return {
        ...f,
        status: dynamic.status,
        currentLocation: dynamic.currentLocation,
        liveStatus: dynamic.liveStatus,
        liveLocation: dynamic.liveLocation,
        nextAvailableTime: dynamic.liveNextAvailableTime
      };
    });

    return successResponse(res, data, 200, { total: data.length });
  } catch (err) {
    next(err);
  }
}

export async function getFacultyById(req, res, next) {
  try {
    const faculty = await Faculty.findOne({ id: req.params.id }).lean();
    if (!faculty) {
      return errorResponse(res, `Faculty member with ID ${req.params.id} not found`, 'FACULTY_NOT_FOUND', 404);
    }

    const dynamic = calculateFacultyDynamicStatus(faculty, new Date());
    const data = {
      ...faculty,
      status: dynamic.status,
      currentLocation: dynamic.currentLocation,
      liveStatus: dynamic.liveStatus,
      liveLocation: dynamic.liveLocation,
      nextAvailableTime: dynamic.liveNextAvailableTime
    };

    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getFacultySchedule(req, res, next) {
  try {
    const faculty = await Faculty.findOne({ id: req.params.id }).lean();
    if (!faculty) {
      return errorResponse(res, `Faculty member with ID ${req.params.id} not found`, 'FACULTY_NOT_FOUND', 404);
    }

    return successResponse(res, {
      id: faculty.id,
      name: faculty.name,
      todaySchedule: faculty.todaySchedule || []
    });
  } catch (err) {
    next(err);
  }
}

export async function getFacultyStatus(req, res, next) {
  try {
    const faculty = await Faculty.findOne({ id: req.params.id }).lean();
    if (!faculty) {
      return errorResponse(res, `Faculty member with ID ${req.params.id} not found`, 'FACULTY_NOT_FOUND', 404);
    }

    const dynamic = calculateFacultyDynamicStatus(faculty, new Date());
    return successResponse(res, {
      id: faculty.id,
      name: faculty.name,
      ...dynamic
    });
  } catch (err) {
    next(err);
  }
}
