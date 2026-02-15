import express from 'express';
import {
  createOrUpdateSession,
  trackPageView,
  trackProductView,
  endSession,
  getVisitorStats,
  getPopularContent,
  getUserInterests,
  getTimeSpentAnalysis,
  getActiveSessions,
} from '../controllers/analyticsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes - for tracking
router.post('/session', createOrUpdateSession);
router.post('/pageview', trackPageView);
router.post('/productview', trackProductView);
router.post('/session/end', endSession);

// Admin routes - for viewing analytics
router.get('/stats', protect, admin, getVisitorStats);
router.get('/popular', protect, admin, getPopularContent);
router.get('/interests', protect, admin, getUserInterests);
router.get('/timespent', protect, admin, getTimeSpentAnalysis);
router.get('/active', protect, admin, getActiveSessions);

export default router;
