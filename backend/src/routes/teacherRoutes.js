import express from 'express';
import {
  getTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  assignTeacher,
} from '../controllers/teacherController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize('headmaster_admin', 'admin', 'teacher', 'parent', 'student_parent'), getTeachers)
  .post(authorize('headmaster_admin', 'admin'), createTeacher);

router.post('/assign', authorize('headmaster_admin', 'admin'), assignTeacher);

router.route('/:id')
  .put(authorize('headmaster_admin', 'admin'), updateTeacher)
  .delete(authorize('headmaster_admin', 'admin'), deleteTeacher);

export default router;
