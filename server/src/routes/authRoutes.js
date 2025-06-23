import express from 'express';
import { registerUser, loginUser, getMe, getUsersForDashboard } from '../controllers/authController.js'; // Ajoutez getUsersForDashboard
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/dashboard-users', protect, getUsersForDashboard); // NOUVELLE ROUTE

export default router;