import { Router } from 'express';
import { getAnnouncements } from '../controllers/announcementController.js';

const router = Router();

router.get('/', getAnnouncements);

export default router;
