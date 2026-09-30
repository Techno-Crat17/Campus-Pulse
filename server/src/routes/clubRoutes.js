import { Router } from 'express';
import { getClubs, getClub } from '../controllers/clubController.js';

const router = Router();

router.get('/', getClubs);
router.get('/:id', getClub);

export default router;
