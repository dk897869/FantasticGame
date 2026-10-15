import express from 'express';
import { 
  getDashboardStats, 
  getDeposits, 
  verifyDeposit, 
  getWithdrawals, 
  verifyWithdrawal, 
  getUsers, 
  updateUserBalance, 
  transferBalanceBetweenAccounts,
  toggleBlockUser, 
  getSettings, 
  updateSettings 
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/stats', getDashboardStats);
router.get('/deposits', getDeposits);
router.post('/deposits/:id/verify', verifyDeposit);
router.get('/withdrawals', getWithdrawals);
router.post('/withdrawals/:id/verify', verifyWithdrawal);
router.get('/users', getUsers);
router.post('/users/:id/balance', updateUserBalance);
router.post('/transfer', transferBalanceBetweenAccounts);
router.post('/users/:id/toggle-block', toggleBlockUser);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

export default router;
