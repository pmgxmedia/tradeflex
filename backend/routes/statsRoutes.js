import express from 'express';
import {
  getDashboardStats,
  getSalesStats,
  getTopProducts,
  getRecentOrders,
} from '../controllers/statsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All stats routes require admin authentication
router.use(protect, admin);

router.get('/dashboard', getDashboardStats);
router.get('/sales', getSalesStats);
router.get('/top-products', getTopProducts);
router.get('/recent-orders', getRecentOrders);

export default router;
