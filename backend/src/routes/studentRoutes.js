import express from 'express';
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  getWelfareSchemes,
} from '../controllers/studentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/welfare/schemes', authorize('headmaster_admin', 'teacher', 'welfare_officer'), getWelfareSchemes);

router.route('/')
  .get(getStudents)
  .post(authorize('headmaster_admin', 'teacher'), createStudent);

router.route('/:id')
  .get(getStudentById)
  .put(authorize('headmaster_admin', 'teacher'), updateStudent);

export default router;
