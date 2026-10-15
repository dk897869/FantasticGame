import mongoose from 'mongoose';

const betSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gameType: { type: String, required: true },
  period: { type: String, required: true },
  // selection can be: 'green', 'red', 'violet', 'big', 'small', or numbers '0'-'9'
  selection: { type: String, required: true },
  amount: { type: Number, required: true },
  fee: { type: Number, default: 0 },
  payoutMultiplier: { type: Number, default: 2 },
  winAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'won', 'lost', 'refunded'], default: 'pending' },
  resultDetails: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

export const Bet = mongoose.model('Bet', betSchema);
