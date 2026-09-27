import { Router } from 'express';
import {
  getRooms,
  searchRooms,
  getRoomsByBuilding,
  getRoomsByDepartment,
  getRoomByNumber
} from '../controllers/roomController.js';

const router = Router();

router.get('/', getRooms);
router.get('/search', searchRooms);
router.get('/building/:building', getRoomsByBuilding);
router.get('/department/:department', getRoomsByDepartment);
router.get('/:roomNumber', getRoomByNumber);

export default router;
