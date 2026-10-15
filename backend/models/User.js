import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true, sparse: true },
  phone: { type: String, trim: true, sparse: true },
  password: { type: String },
  googleId: { type: String, sparse: true },
  avatar: { type: String, default: 'https://api.dicebear.com/7.x/bottts/svg?seed=user' },
  balance: { type: Number, default: 50, min: 0 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  invitationCode: { type: String, unique: true, index: true },
  invitedBy: { type: String, default: null },
  referralEarnings: { type: Number, default: 0 },
  totalDeposited: { type: Number, default: 0 },
  totalWithdrawn: { type: Number, default: 0 },
  isBlocked: { type: Boolean, default: false },
  bankDetails: {
    holderName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifsc: { type: String, default: '' },
    upiId: { type: String, default: '' }
  }
}, { timestamps: true });

// Helper to generate referral code
userSchema.pre('save', function(next) {
  if (!this.invitationCode) {
    this.invitationCode = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  }
  next();
});

export const User = mongoose.model('User', userSchema);
