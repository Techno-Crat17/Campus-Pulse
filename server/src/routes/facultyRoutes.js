import { Router } from 'express';
import {
  getFaculty,
  searchFaculty,
  getFacultyByDepartment,
  getFacultyById,
  getFacultySchedule,
  getFacultyStatus
} from '../controllers/facultyController.js';

const router = Router();

router.get('/', getFaculty);
router.get('/search', searchFaculty);
router.get('/department/:department', getFacultyByDepartment);
router.get('/:id', getFacultyById);
router.get('/:id/schedule', getFacultySchedule);
router.get('/:id/status', getFacultyStatus);

export default router;
