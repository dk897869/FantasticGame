import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  siteName: { type: String, default: 'FantasticGame' },
  upiId: { type: String, default: 'payee@okaxis' },
  merchantName: { type: String, default: 'FantasticGame Entertainment' },
  qrCodeUrl: { type: String, default: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=payee@okaxis&pn=FantasticGame' },
  minDeposit: { type: Number, default: 100 },
  maxDeposit: { type: Number, default: 50000 },
  minWithdrawal: { type: Number, default: 200 },
  maxWithdrawal: { type: Number, default: 20000 },
  signupBonus: { type: Number, default: 50 },
  referralBonus: { type: Number, default: 50 },
  noticeBanner: { type: String, default: 'Welcome to FantasticGame! Instant deposits via PhonePe, Google Pay, Paytm, BHIM and Navi with 24/7 fast approval!' },
  upiEnabled: { type: Boolean, default: true }
}, { timestamps: true });

export const Setting = mongoose.model('Setting', settingSchema);
