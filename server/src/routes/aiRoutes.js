import { Router } from 'express';
import { handleAiQuery } from '../controllers/aiController.js';

const router = Router();

router.post('/query', handleAiQuery);

export default router;
