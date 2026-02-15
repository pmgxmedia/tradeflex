import express from 'express';
const router = express.Router();
import {
  registerProvider,
  getAllProviders,
  updateProviderStatus,
  createDeliveryJob,
  assignDelivery,
  getAllDeliveries,
  getAvailableJobs,
  respondToDelivery,
  updateDeliveryStatus,
  completeDelivery,
  getProviderDeliveryHistory,
  getDeliveryStatistics,
  updateProviderAvailability
} from '../controllers/deliveryController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

// Public routes
router.post('/providers/register', registerProvider);

// Admin routes
router.get('/admin/providers', protect, admin, getAllProviders);
router.put('/admin/providers/:id/status', protect, admin, updateProviderStatus);
router.post('/admin/jobs', protect, admin, createDeliveryJob);
router.put('/admin/jobs/:id/assign', protect, admin, assignDelivery);
router.get('/admin/jobs', protect, admin, getAllDeliveries);
router.get('/admin/statistics', protect, admin, getDeliveryStatistics);

// Provider routes
router.get('/provider/available-jobs', getAvailableJobs);
router.put('/provider/jobs/:id/respond', respondToDelivery);
router.put('/provider/jobs/:id/status', updateDeliveryStatus);
router.put('/provider/jobs/:id/complete', completeDelivery);
router.get('/provider/:providerId/history', getProviderDeliveryHistory);
router.put('/provider/:id/availability', updateProviderAvailability);

export default router;
