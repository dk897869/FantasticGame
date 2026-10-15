import express from 'express';
import { placeBet, getGameHistory, getMyBets, playInstantGame } from '../controllers/gameController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/bet', protect, placeBet);
router.get('/history', getGameHistory);
router.get('/my-bets', protect, getMyBets);
router.post('/instant', protect, playInstantGame);

export default router;
