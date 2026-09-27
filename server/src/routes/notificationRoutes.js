import { Router } from 'express';
import { getNotifications, markAsRead } from '../controllers/notificationController.js';

const router = Router();

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);

export default router;
