import { User } from '../models/User.js';
import { GameRound } from '../models/GameRound.js';
import { Bet } from '../models/Bet.js';

// Calculate result for Win Go based on number (0-9)
export const calculateWinGoOutcome = (number) => {
  let color = 'green';
  if (number === 0) color = 'red-violet';
  else if (number === 5) color = 'green-violet';
  else if ([1, 3, 7, 9].includes(number)) color = 'green';
  else if ([2, 4, 6, 8].includes(number)) color = 'red';

  const size = number >= 5 ? 'big' : 'small';
  return { number, color, size };
};

export const placeBet = async (req, res) => {
  try {
    const { gameType, period, selection, amount } = req.body;
    const betAmount = Number(amount);

    if (!betAmount || betAmount < 1) {
      return res.status(400).json({ success: false, message: 'Invalid bet amount' });
    }

    const user = await User.findById(req.user._id);
    if (user.balance < betAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // Deduct user balance
    user.balance -= betAmount;
    await user.save();

    // Calculate payout multiplier based on selection
    let multiplier = 2;
    if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(selection)) {
      multiplier = 9;
    } else if (selection === 'violet') {
      multiplier = 4.5;
    } else {
      multiplier = 1.96; // green, red, big, small (2% platform commission)
    }

    const bet = await Bet.create({
      user: user._id,
      gameType: gameType || 'wingo_1m',
      period,
      selection,
      amount: betAmount,
      payoutMultiplier: multiplier,
      status: 'pending'
    });

    return res.status(201).json({
      success: true,
      message: 'Bet placed successfully!',
      newBalance: user.balance,
      bet
    });
  } catch (error) {
    console.error('Place bet error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getGameHistory = async (req, res) => {
  try {
    const { gameType = 'wingo_1m', limit = 20 } = req.query;

    const rounds = await GameRound.find({ gameType, status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return res.json({ success: true, rounds });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyBets = async (req, res) => {
  try {
    const { gameType, limit = 20 } = req.query;
    const filter = { user: req.user._id };
    if (gameType) filter.gameType = gameType;

    const bets = await Bet.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return res.json({ success: true, bets });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Play instant games (Dice, Wheel, Aviator simulation)
export const playInstantGame = async (req, res) => {
  try {
    const { gameType, amount, prediction } = req.body;
    const betAmount = Number(amount);

    if (!betAmount || betAmount < 1) {
      return res.status(400).json({ success: false, message: 'Invalid bet amount' });
    }

    const user = await User.findById(req.user._id);
    if (user.balance < betAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    user.balance -= betAmount;

    let won = false;
    let winAmount = 0;
    let outcome = {};

    if (gameType === 'dice') {
      // 7 Up 7 Down or 1-6 Dice
      const dice1 = Math.floor(Math.random() * 6) + 1;
      const dice2 = Math.floor(Math.random() * 6) + 1;
      const total = dice1 + dice2;
      outcome = { dice1, dice2, total };

      if (prediction === 'down' && total < 7) {
        won = true;
        winAmount = betAmount * 2;
      } else if (prediction === 'up' && total > 7) {
        won = true;
        winAmount = betAmount * 2;
      } else if (prediction === 'seven' && total === 7) {
        won = true;
        winAmount = betAmount * 5;
      }
    } else if (gameType === 'wheel') {
      // 10 segment wheel
      const segments = [
        { label: '0x', mult: 0, color: '#ef4444' },
        { label: '1.5x', mult: 1.5, color: '#3b82f6' },
        { label: '2x', mult: 2, color: '#10b981' },
        { label: '0x', mult: 0, color: '#ef4444' },
        { label: '3x', mult: 3, color: '#8b5cf6' },
        { label: '1.2x', mult: 1.2, color: '#06b6d4' },
        { label: '5x', mult: 5, color: '#f59e0b' },
        { label: '0.5x', mult: 0.5, color: '#64748b' },
        { label: '10x', mult: 10, color: '#ec4899' },
        { label: '2x', mult: 2, color: '#10b981' }
      ];
      const selectedIndex = Math.floor(Math.random() * segments.length);
      const chosen = segments[selectedIndex];
      outcome = { index: selectedIndex, segment: chosen };
      winAmount = Math.floor(betAmount * chosen.mult);
      won = winAmount > 0;
    } else if (gameType === 'crash') {
      // Aviator cashout calculation
      const targetCashout = Number(prediction) || 1.5;
      // Crash point generation algorithm
      const rand = Math.random();
      const crashPoint = Math.max(1.0, parseFloat((0.95 / (1 - rand)).toFixed(2)));
      outcome = { crashPoint, targetCashout };

      if (targetCashout <= crashPoint) {
        won = true;
        winAmount = Math.floor(betAmount * targetCashout);
      }
    }

    if (won) {
      user.balance += winAmount;
    }

    await user.save();

    const betRecord = await Bet.create({
      user: user._id,
      gameType,
      period: Date.now().toString(),
      selection: JSON.stringify(prediction),
      amount: betAmount,
      winAmount,
      status: won ? 'won' : 'lost',
      resultDetails: outcome
    });

    return res.json({
      success: true,
      won,
      winAmount,
      outcome,
      newBalance: user.balance,
      betRecord
    });
  } catch (error) {
    console.error('Instant game error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
