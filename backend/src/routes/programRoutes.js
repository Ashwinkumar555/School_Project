import express from 'express';
import {
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
} from '../controllers/programController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getPrograms)
  .post(authorize('ngo', 'headmaster_admin', 'admin'), createProgram);

router
  .route('/:id')
  .get(getProgramById)
  .put(authorize('ngo', 'headmaster_admin', 'admin'), updateProgram)
  .delete(authorize('ngo', 'headmaster_admin', 'admin'), deleteProgram);

export default router;
