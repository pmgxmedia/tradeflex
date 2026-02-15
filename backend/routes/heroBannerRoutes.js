import express from 'express';
import {
  getHeroBanners,
  getActiveHeroBanner,
  getHeroBannerById,
  createHeroBanner,
  updateHeroBanner,
  deleteHeroBanner,
} from '../controllers/heroBannerController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.route('/').get(getHeroBanners);
router.route('/active').get(getActiveHeroBanner);
router.route('/:id').get(getHeroBannerById);

// Admin routes
router.route('/').post(protect, admin, createHeroBanner);
router
  .route('/:id')
  .put(protect, admin, updateHeroBanner)
  .delete(protect, admin, deleteHeroBanner);

export default router;
