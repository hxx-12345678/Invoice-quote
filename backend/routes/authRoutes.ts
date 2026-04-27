import { Router } from 'express';
import { register, login, getMe, forgotPassword, exportData, deleteAccount } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/me', authMiddleware, getMe);

// GDPR Compliance routes
router.get('/export-data', authMiddleware, exportData);
router.delete('/account', authMiddleware, deleteAccount);

export default router;
