import express from 'express';
import {
  getSettings,
  updateSettings,
  updateSettingSection,
  resetSettings,
} from '../controllers/settingsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route to get basic settings
router.get('/', getSettings);
router.get('/:section', getSettings); // Get settings by section (same handler will return public data)

// Admin routes
router.put('/', protect, admin, updateSettings);
router.patch('/:section', protect, admin, updateSettingSection);
router.post('/reset', protect, admin, resetSettings);

export default router;
