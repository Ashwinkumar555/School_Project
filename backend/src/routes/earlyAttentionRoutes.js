import express from 'express';
import {
  getEarlyAttentionDashboard,
  getStudentAttentionProfile,
  addIntervention,
  reevaluateAll,
} from '../controllers/earlyAttentionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', authorize('headmaster_admin', 'teacher', 'welfare_officer'), getEarlyAttentionDashboard);
router.get('/student/:studentId', getStudentAttentionProfile);
router.post('/interventions', authorize('headmaster_admin', 'teacher'), addIntervention);
router.post('/re-evaluate', authorize('headmaster_admin', 'teacher'), reevaluateAll);

export default router;
