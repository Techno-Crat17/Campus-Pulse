import { Router } from 'express';
import {
  createFaculty,
  updateFaculty,
  deleteFaculty,
  updateLibrary,
  createRoom,
  updateRoom,
  triggerOccupancyRefresh
} from '../controllers/adminController.js';
import { authenticateJWT, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all admin routes
router.use(authenticateJWT, requireAdmin);

router.post('/faculty', createFaculty);
router.patch('/faculty/:id', updateFaculty);
router.delete('/faculty/:id', deleteFaculty);

router.patch('/libraries/:id', updateLibrary);

router.post('/rooms', createRoom);
router.patch('/rooms/:roomNumber', updateRoom);

router.post('/occupancy/trigger-refresh', triggerOccupancyRefresh);

export default router;
