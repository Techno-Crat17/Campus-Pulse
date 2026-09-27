import { Router } from 'express';
import {
  getLibraries,
  getLibraryById,
  getLibraryOccupancy,
  getLibraryOccupancyHistory,
  getCurrentOccupancy,
  getLeastCrowdedLibrary
} from '../controllers/libraryController.js';

const router = Router();

router.get('/', getLibraries);
router.get('/least-crowded', getLeastCrowdedLibrary);
router.get('/occupancy/current', getCurrentOccupancy);
router.get('/:id', getLibraryById);
router.get('/:id/occupancy', getLibraryOccupancy);
router.get('/:id/occupancy/history', getLibraryOccupancyHistory);

export default router;
