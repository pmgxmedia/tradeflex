import express from 'express';
import { makeUserAdmin, getAllUsers } from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Development only - make any user admin by email
router.post('/make-admin/:email', makeUserAdmin);

// Get all users (admin only)
router.get('/users', protect, admin, getAllUsers);

export default router;
