import express from 'express';
import {
  submitContribution,
  getContributions,
  reviewContribution,
  markAsReceived,
} from '../controllers/contributionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(submitContribution)
  .get(getContributions);

router.put('/:id/review', authorize('headmaster_admin', 'admin'), reviewContribution);
router.post('/:id/mark-received', authorize('headmaster_admin', 'admin'), markAsReceived);

export default router;
