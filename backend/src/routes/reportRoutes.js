import express from 'express';
import { getSchoolSummaryReport } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/school-summary', authorize('headmaster_admin', 'teacher', 'village_head', 'welfare_officer'), getSchoolSummaryReport);

export default router;
