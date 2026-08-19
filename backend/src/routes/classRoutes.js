import express from 'express';
import {
  getClasses,
  getClassById,
  createClass,
  updateClass,
} from '../controllers/classController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getClasses)
  .post(authorize('headmaster_admin', 'admin'), createClass);

router.route('/:id')
  .get(getClassById)
  .put(authorize('headmaster_admin', 'admin'), updateClass);

export default router;
