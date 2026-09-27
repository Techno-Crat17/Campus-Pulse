import { Library } from '../models/Library.js';
import { LibraryOccupancy } from '../models/LibraryOccupancy.js';
import { calculateEstimatedOccupancy, isLibraryOpen } from '../services/occupancyService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export async function getLibraries(req, res, next) {
  try {
    const libraries = await Library.find({}).lean();
    const now = new Date();
    const openState = isLibraryOpen(now);

    const data = libraries.map(lib => {
      const occ = calculateEstimatedOccupancy(lib.id, now);
      return {
        ...lib,
        isOpen: openState,
        calculatedOccupancy: occ,
        formattedOccupancy: `${occ}%`
      };
    });

    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getLibraryById(req, res, next) {
  try {
    const library = await Library.findOne({ id: req.params.id }).lean();
    if (!library) {
      return errorResponse(res, `Library with ID ${req.params.id} not found`, 'LIBRARY_NOT_FOUND', 404);
    }

    const now = new Date();
    const openState = isLibraryOpen(now);
    const occ = calculateEstimatedOccupancy(library.id, now);

    return successResponse(res, {
      ...library,
      isOpen: openState,
      calculatedOccupancy: occ,
      formattedOccupancy: `${occ}%`
    });
  } catch (err) {
    next(err);
  }
}

export async function getLibraryOccupancy(req, res, next) {
  try {
    const library = await Library.findOne({ id: req.params.id }).lean();
    if (!library) {
      return errorResponse(res, `Library with ID ${req.params.id} not found`, 'LIBRARY_NOT_FOUND', 404);
    }

    const now = new Date();
    const openState = isLibraryOpen(now);
    const occ = calculateEstimatedOccupancy(library.id, now);

    // Save dynamic occupancy record
    await LibraryOccupancy.create({
      libraryId: library.id,
      occupancyPercentage: occ,
      source: 'estimated'
    });

    return successResponse(res, {
      libraryId: library.id,
      name: library.name,
      isOpen: openState,
      occupancyPercentage: occ,
      formattedOccupancy: `${occ}%`,
      timestamp: now
    });
  } catch (err) {
    next(err);
  }
}

export async function getLibraryOccupancyHistory(req, res, next) {
  try {
    const library = await Library.findOne({ id: req.params.id }).lean();
    if (!library) {
      return errorResponse(res, `Library with ID ${req.params.id} not found`, 'LIBRARY_NOT_FOUND', 404);
    }

    const history = await LibraryOccupancy.find({ libraryId: library.id })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    return successResponse(res, {
      libraryId: library.id,
      history: history.length > 0 ? history : (library.historicalTrend || [])
    });
  } catch (err) {
    next(err);
  }
}

export async function getCurrentOccupancy(req, res, next) {
  try {
    const libraries = await Library.find({}).lean();
    const now = new Date();
    const openState = isLibraryOpen(now);

    const data = libraries.map(lib => {
      const occ = calculateEstimatedOccupancy(lib.id, now);
      return {
        libraryId: lib.id,
        name: lib.name,
        building: lib.building,
        isOpen: openState,
        occupancyPercentage: occ,
        formattedOccupancy: `${occ}%`
      };
    });

    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getLeastCrowdedLibrary(req, res, next) {
  try {
    const libraries = await Library.find({}).lean();
    const now = new Date();
    const openState = isLibraryOpen(now);

    const list = libraries.map(lib => {
      const occ = calculateEstimatedOccupancy(lib.id, now);
      return {
        ...lib,
        isOpen: openState,
        calculatedOccupancy: occ,
        formattedOccupancy: `${occ}%`
      };
    }).sort((a, b) => a.calculatedOccupancy - b.calculatedOccupancy);

    const leastCrowded = list[0];
    return successResponse(res, {
      leastCrowded,
      allLibraries: list
    });
  } catch (err) {
    next(err);
  }
}
