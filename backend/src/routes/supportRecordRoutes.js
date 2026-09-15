import express from 'express';
import {
  getSupportRecords,
  createSupportRecord,
  updateSupportRecord,
  deleteSupportRecord,
  getNgoImpactStats,
} from '../controllers/supportRecordController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/impact', authorize('ngo', 'headmaster_admin', 'admin'), getNgoImpactStats);

router
  .route('/')
  .get(authorize('ngo', 'headmaster_admin', 'admin'), getSupportRecords)
  .post(authorize('ngo', 'headmaster_admin', 'admin'), createSupportRecord);

router
  .route('/:id')
  .put(authorize('ngo', 'headmaster_admin', 'admin'), updateSupportRecord)
  .delete(authorize('ngo', 'headmaster_admin', 'admin'), deleteSupportRecord);

export default router;
