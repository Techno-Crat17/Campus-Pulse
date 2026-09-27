import { Router } from 'express';
import {
  getBuildings,
  getBuildingById,
  getBuildingRooms,
  getBuildingFaculty
} from '../controllers/buildingController.js';

const router = Router();

router.get('/', getBuildings);
router.get('/:id', getBuildingById);
router.get('/:id/rooms', getBuildingRooms);
router.get('/:id/faculty', getBuildingFaculty);

export default router;
