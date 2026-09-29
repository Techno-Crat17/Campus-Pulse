import { Router } from 'express';
import { getEvents } from '../controllers/eventController.js';

const router = Router();

router.get('/', getEvents);

export default router;
