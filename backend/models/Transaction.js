import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['deposit', 'withdrawal', 'bet', 'win', 'bonus'], 
    required: true 
  },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'completed'], 
    default: 'pending' 
  },
  paymentMethod: { 
    type: String, 
    default: 'UPI'
  },
  utr: { type: String, trim: true, default: '' },
  upiId: { type: String, trim: true, default: '' },
  accountDetails: {
    holderName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifsc: { type: String, default: '' },
    upiId: { type: String, default: '' }
  },
  proofUrl: { type: String, default: '' },
  adminNote: { type: String, default: '' }
}, { timestamps: true });

export const Transaction = mongoose.model('Transaction', transactionSchema);
