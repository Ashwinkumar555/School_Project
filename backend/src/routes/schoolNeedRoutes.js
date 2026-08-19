import express from 'express';
import {
  getSchoolNeeds,
  getSchoolNeedById,
  createSchoolNeed,
  updateSchoolNeed,
} from '../controllers/schoolNeedController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public / Authenticated read
router.get('/', getSchoolNeeds);
router.get('/:id', getSchoolNeedById);

// Admin-only create & update
router.post('/', protect, authorize('headmaster_admin', 'admin'), createSchoolNeed);
router.put('/:id', protect, authorize('headmaster_admin', 'admin'), updateSchoolNeed);

export default router;
