import express from 'express';
import { register, login, googleAuth, getMe, updateBankDetails, adminLogin } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/admin-login', adminLogin);
router.get('/me', protect, getMe);
router.post('/bank-details', protect, updateBankDetails);

export default router;
