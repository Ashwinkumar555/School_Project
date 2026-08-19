import express from 'express';
import {
  getCommunityDrives,
  getDriveById,
  createCommunityDrive,
} from '../controllers/communityDriveController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public / Authenticated read
router.get('/', getCommunityDrives);
router.get('/:id', getDriveById);

// Local Head / Admin create
router.post('/', protect, authorize('village_head', 'headmaster_admin', 'admin'), createCommunityDrive);

export default router;
