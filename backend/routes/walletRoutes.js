import express from 'express';
import { getPaymentConfig, submitDeposit, submitWithdrawal, getTransactions, verifyUpiVpa } from '../controllers/walletController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/config', protect, getPaymentConfig);
router.post('/deposit', protect, submitDeposit);
router.post('/withdraw', protect, submitWithdrawal);
router.post('/verify-upi', protect, verifyUpiVpa);
router.get('/transactions', protect, getTransactions);

export default router;
