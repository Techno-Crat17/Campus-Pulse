import { Router } from 'express';
import {
  createIssue,
  getIssues,
  getIssueById,
  updateIssueStatus,
  deleteIssue
} from '../controllers/issueController.js';

const router = Router();

router.post('/', createIssue);
router.get('/', getIssues);
router.get('/:id', getIssueById);
router.patch('/:id/status', updateIssueStatus);
router.delete('/:id', deleteIssue);

export default router;
