import express from 'express';
import {
  recordMarks,
  updateMarksRecord,
  getStudentMarks,
} from '../controllers/academicController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/marks', authorize('headmaster_admin', 'teacher'), recordMarks);
router.put('/marks/:id', authorize('headmaster_admin', 'teacher'), updateMarksRecord);
router.get('/student/:studentId', getStudentMarks);

export default router;
