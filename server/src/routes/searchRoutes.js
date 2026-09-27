import { Router } from 'express';
import { searchGlobal } from '../controllers/searchController.js';

const router = Router();

router.get('/', searchGlobal);

export default router;
