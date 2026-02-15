import express from 'express';
import {
  getBanners,
  getActiveBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
} from '../controllers/bannerController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.route('/').get(getBanners);
router.route('/active').get(getActiveBanners);
router.route('/:id').get(getBannerById);

// Admin routes
router.route('/').post(protect, admin, createBanner);
router
  .route('/:id')
  .put(protect, admin, updateBanner)
  .delete(protect, admin, deleteBanner);

export default router;
