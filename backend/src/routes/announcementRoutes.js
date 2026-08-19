import express from 'express';
import {
  getAnnouncements,
  createAnnouncement,
} from '../controllers/announcementController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAnnouncements);
router.post('/', protect, authorize('headmaster_admin', 'admin', 'village_head'), createAnnouncement);

export default router;
