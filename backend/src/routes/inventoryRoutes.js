import express from 'express';
import {
  getInventory,
  addInventoryItem,
  updateInventoryItem,
  getInventorySummary,
} from '../controllers/inventoryController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/summary', getInventorySummary);

router.route('/')
  .get(getInventory)
  .post(authorize('headmaster_admin', 'admin'), addInventoryItem);

router.route('/:id')
  .put(authorize('headmaster_admin', 'admin'), updateInventoryItem);

export default router;
