import express from 'express';
import {
  recordAttendance,
  updateStudentAttendanceRecord,
  getClassAttendance,
  getStudentAttendance,
  getTodaySummary,
} from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', authorize('headmaster_admin', 'teacher'), recordAttendance);
router.put('/student/:studentId', authorize('headmaster_admin', 'teacher'), updateStudentAttendanceRecord);
router.get('/today-summary', getTodaySummary);
router.get('/class/:classId', getClassAttendance);
router.get('/student/:studentId', getStudentAttendance);

export default router;
