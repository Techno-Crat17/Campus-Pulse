import { Router } from 'express';
import { getClubs } from '../controllers/clubController.js';

const router = Router();

router.get('/', getClubs);

export default router;
