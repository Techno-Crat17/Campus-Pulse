import express from 'express';
import {
  createLostFoundItem,
  getLostFoundItems,
  updateLostFoundStatus
} from '../controllers/lostFoundController.js';

const router = express.Router();

router.route('/')
  .get(getLostFoundItems)
  .post(createLostFoundItem);

router.route('/:id/status')
  .patch(updateLostFoundStatus);

export default router;
