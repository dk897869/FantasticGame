import mongoose from 'mongoose';

const gameRoundSchema = new mongoose.Schema({
  gameType: { 
    type: String, 
    enum: ['wingo_30s', 'wingo_1m', 'wingo_3m', 'wingo_5m', 'aviator', 'dice', 'wheel'],
    required: true 
  },
  period: { type: String, required: true, unique: true },
  outcome: {
    number: { type: Number },
    color: { type: String, enum: ['green', 'red', 'violet', 'green-violet', 'red-violet'] },
    size: { type: String, enum: ['big', 'small'] },
    multiplier: { type: Number },
    diceValue: { type: Number }
  },
  status: { type: String, enum: ['betting', 'calculating', 'completed'], default: 'betting' },
  totalBets: { type: Number, default: 0 },
  totalBetAmount: { type: Number, default: 0 },
  totalWinAmount: { type: Number, default: 0 },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date, required: true }
}, { timestamps: true });

export const GameRound = mongoose.model('GameRound', gameRoundSchema);
