import express from 'express';
import {
  registerUser,
  loginUser,
  sendOtp,
  verifyOtp,
  getMe,
  getRoles,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.get('/roles', getRoles);

// Protected routes
router.get('/me', protect, getMe);

export default router;
