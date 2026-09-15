import express from 'express';
import {
  getCommunications,
  createCommunication,
  replyCommunication,
} from '../controllers/communicationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getCommunications)
  .post(authorize('parent', 'student_parent', 'headmaster_admin', 'admin'), createCommunication);

router
  .route('/:id/reply')
  .put(authorize('teacher', 'headmaster_admin', 'admin'), replyCommunication);

export default router;
