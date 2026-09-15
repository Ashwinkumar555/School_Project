import express from 'express';
import {
  getSupportRequests,
  getEligibleStudents,
  getNgoList,
  getSupportRequestById,
  createSupportRequest,
  reviewSupportRequest,
  respondToSupportRequest,
} from '../controllers/supportRequestController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// General requests listing (role-scoped within controller)
router.get('/', protect, getSupportRequests);

// Student picker for Parent & Village Head
router.get(
  '/eligible-students',
  protect,
  authorize('parent', 'student_parent', 'village_head', 'headmaster_admin', 'admin'),
  getEligibleStudents
);

// NGO directory for Head Master forwarding
router.get('/ngos', protect, authorize('headmaster_admin', 'admin'), getNgoList);

// Create request (Parent, Village Head, Admin)
router.post(
  '/',
  protect,
  authorize('parent', 'student_parent', 'village_head', 'headmaster_admin', 'admin'),
  createSupportRequest
);

// Get single request detail
router.get('/:id', protect, getSupportRequestById);

// Head Master review, verification, and NGO forwarding
router.put(
  '/:id/review',
  protect,
  authorize('headmaster_admin', 'admin'),
  reviewSupportRequest
);

// NGO / Partner response (accept, reject, complete)
router.put('/:id/respond', protect, authorize('ngo'), respondToSupportRequest);

export default router;
