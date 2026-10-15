import { GameRound } from '../models/GameRound.js';
import { Bet } from '../models/Bet.js';
import { User } from '../models/User.js';
import { calculateWinGoOutcome } from '../controllers/gameController.js';

let ioInstance = null;

// Game mode states
const games = {
  wingo_30s: {
    duration: 30,
    timeLeft: 30,
    currentPeriod: null
  },
  wingo_1m: {
    duration: 60,
    timeLeft: 60,
    currentPeriod: null
  }
};

export const initGameEngine = (io) => {
  ioInstance = io;

  // Initialize periods
  generateNextPeriod('wingo_30s');
  generateNextPeriod('wingo_1m');

  // Main 1-second loop
  setInterval(async () => {
    for (const [gameType, state] of Object.entries(games)) {
      state.timeLeft--;

      if (state.timeLeft <= 0) {
        await settleRound(gameType, state.currentPeriod);
        generateNextPeriod(gameType);
        state.timeLeft = state.duration;
      }

      if (ioInstance) {
        ioInstance.emit(`timer_tick_${gameType}`, {
          gameType,
          period: state.currentPeriod,
          timeLeft: state.timeLeft,
          isFrozen: state.timeLeft <= 5
        });

        // Also emit legacy timer_tick for default 30s / active game
        if (gameType === 'wingo_30s') {
          ioInstance.emit('timer_tick', {
            gameType: 'wingo_30s',
            period: state.currentPeriod,
            timeLeft: state.timeLeft,
            isFrozen: state.timeLeft <= 5
          });
        }
      }
    }
  }, 1000);
};

const generatePeriodNumber = (duration) => {
  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const mm = (now.getMonth() + 1).toString().padStart(2, '0');
  const dd = now.getDate().toString().padStart(2, '0');
  const totalSecondsToday = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const roundIndex = Math.floor(totalSecondsToday / duration) + 1;
  const prefix = duration === 30 ? '30' : '01';
  return `${yyyy}${mm}${dd}${prefix}${roundIndex.toString().padStart(4, '0')}`;
};

const generateNextPeriod = async (gameType) => {
  const state = games[gameType];
  state.currentPeriod = generatePeriodNumber(state.duration);

  try {
    const existing = await GameRound.findOne({ period: state.currentPeriod, gameType });
    if (!existing) {
      await GameRound.create({
        gameType,
        period: state.currentPeriod,
        endTime: new Date(Date.now() + state.duration * 1000),
        status: 'betting'
      });
    }
  } catch (err) {
    console.error(`Error creating round for ${gameType}:`, err.message);
  }
};

const settleRound = async (gameType, period) => {
  try {
    const round = await GameRound.findOne({ period, gameType });
    if (!round || round.status === 'completed') return;

    // Generate random winning number 0-9
    const winningNumber = Math.floor(Math.random() * 10);
    const outcome = calculateWinGoOutcome(winningNumber);

    round.outcome = outcome;
    round.status = 'completed';

    // Settle all bets for this period and gameType
    const bets = await Bet.find({ period, status: 'pending' });

    let totalBetsCount = bets.length;
    let totalBetAmount = 0;
    let totalWinAmount = 0;

    for (const bet of bets) {
      totalBetAmount += bet.amount;
      let won = false;
      let multiplier = 0;

      const sel = bet.selection.toLowerCase();

      // Check number match
      if (sel === winningNumber.toString()) {
        won = true;
        multiplier = 9;
      }
      // Check color match
      else if (sel === 'green' && (outcome.color === 'green' || outcome.color === 'green-violet')) {
        won = true;
        multiplier = outcome.color === 'green-violet' ? 1.5 : 2;
      } else if (sel === 'red' && (outcome.color === 'red' || outcome.color === 'red-violet')) {
        won = true;
        multiplier = outcome.color === 'red-violet' ? 1.5 : 2;
      } else if (sel === 'violet' && (winningNumber === 0 || winningNumber === 5)) {
        won = true;
        multiplier = 4.5;
      }
      // Check size match
      else if (sel === outcome.size) {
        won = true;
        multiplier = 2;
      }

      if (won) {
        const win = Math.floor(bet.amount * multiplier * 0.98); // 2% service charge
        bet.winAmount = win;
        bet.status = 'won';
        totalWinAmount += win;

        // Credit winning player
        await User.findByIdAndUpdate(bet.user, { $inc: { balance: win } });
      } else {
        bet.status = 'lost';
      }

      bet.resultDetails = outcome;
      await bet.save();
    }

    round.totalBets = totalBetsCount;
    round.totalBetAmount = totalBetAmount;
    round.totalWinAmount = totalWinAmount;
    await round.save();

    // Broadcast round settlement
    if (ioInstance) {
      ioInstance.emit('round_settled', {
        gameType,
        period,
        outcome,
        totalWinAmount
      });
      ioInstance.emit(`round_settled_${gameType}`, {
        gameType,
        period,
        outcome,
        totalWinAmount
      });
    }
  } catch (error) {
    console.error(`Error settling ${gameType} round:`, error);
  }
};
