import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { Setting } from '../models/Setting.js';

export const getPaymentConfig = async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({
        upiId: 'deepakut43287@naviaxis',
        merchantName: 'Fantastic Game',
        signupBonus: 50
      });
    }

    const { amount = 500, method = 'phonepe' } = req.query;
    const payeeUpi = setting.upiId || 'deepakut43287@naviaxis';
    const merchantName = setting.merchantName || 'Fantastic Game Official';
    const depositAmount = Number(amount) || 500;

    const timestamp = Date.now().toString().slice(-6);
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const orderId = `FG${timestamp}${randomHex}`;
    const orderNote = `Fantastic Game Deposit ${orderId}`;

    const baseUpiUri = `upi://pay?pa=${payeeUpi}&pn=${encodeURIComponent(merchantName)}&mc=5815&mode=02&purpose=00&am=${depositAmount}&cu=INR&tr=${orderId}&tn=${encodeURIComponent(orderNote)}`;

    const appLinks = {
      phonepe: `phonepe://pay?pa=${payeeUpi}&pn=${encodeURIComponent(merchantName)}&mc=5815&mode=02&purpose=00&am=${depositAmount}&cu=INR&tr=${orderId}&tn=${encodeURIComponent(orderNote)}`,
      gpay: `tez://upi/pay?pa=${payeeUpi}&pn=${encodeURIComponent(merchantName)}&mc=5815&mode=02&purpose=00&am=${depositAmount}&cu=INR&tr=${orderId}&tn=${encodeURIComponent(orderNote)}`,
      paytm: `paytmmp://pay?pa=${payeeUpi}&pn=${encodeURIComponent(merchantName)}&mc=5815&mode=02&purpose=00&am=${depositAmount}&cu=INR&tr=${orderId}&tn=${encodeURIComponent(orderNote)}`,
      bhim: `upi://pay?pa=${payeeUpi}&pn=${encodeURIComponent(merchantName)}&mc=5815&mode=02&purpose=00&am=${depositAmount}&cu=INR&tr=${orderId}&tn=${encodeURIComponent(orderNote)}`,
      navi: `navi://pay?pa=${payeeUpi}&pn=${encodeURIComponent(merchantName)}&mc=5815&mode=02&purpose=00&am=${depositAmount}&cu=INR&tr=${orderId}&tn=${encodeURIComponent(orderNote)}`,
      generic: baseUpiUri
    };

    const dynamicQr = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(baseUpiUri)}&margin=10`;
    const expiresAt = Date.now() + (5 * 60 * 1000);

    return res.json({
      success: true,
      config: {
        orderId,
        upiId: payeeUpi,
        merchantName: merchantName,
        amount: depositAmount,
        qrCodeUrl: dynamicQr,
        baseUpiUri,
        expiresAt,
        validitySeconds: 300,
        minDeposit: setting.minDeposit,
        maxDeposit: setting.maxDeposit,
        minWithdrawal: setting.minWithdrawal,
        maxWithdrawal: setting.maxWithdrawal,
        appLinks
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const submitDeposit = async (req, res) => {
  try {
    const { amount, paymentMethod, utr, upiId, orderId } = req.body;

    if (!amount || Number(amount) < 10) {
      return res.status(400).json({ success: false, message: 'Minimum deposit is ₹10' });
    }

    if (!utr || utr.trim().length < 6) {
      return res.status(400).json({ success: false, message: 'Valid 12-digit UTR/Reference ID is required' });
    }

    const existingUtr = await Transaction.findOne({ utr: utr.trim(), status: { $ne: 'rejected' } });
    if (existingUtr) {
      return res.status(400).json({ success: false, message: 'This UTR has already been submitted or processed' });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      type: 'deposit',
      amount: Number(amount),
      paymentMethod: paymentMethod || 'PhonePe',
      utr: utr.trim(),
      upiId: upiId || 'deepakut43287@naviaxis',
      adminNote: orderId ? `Order: ${orderId}` : '',
      status: 'pending'
    });

    return res.status(201).json({
      success: true,
      message: 'Deposit request submitted successfully! Admin will verify UTR and credit your balance.',
      transaction
    });
  } catch (error) {
    console.error('Deposit submit error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const submitWithdrawal = async (req, res) => {
  try {
    const { amount, paymentMethod, accountDetails } = req.body;
    const withdrawAmount = Number(amount);

    const setting = await Setting.findOne();
    const minWithdrawal = setting ? setting.minWithdrawal : 200;

    if (!withdrawAmount || withdrawAmount < minWithdrawal) {
      return res.status(400).json({ success: false, message: `Minimum withdrawal is ₹${minWithdrawal}` });
    }

    const user = await User.findById(req.user._id);

    // RULE: First time withdrawal requires at least ₹100 deposit to activate payout gateway!
    const hasApprovedDeposit = await Transaction.findOne({ user: user._id, type: 'deposit', status: 'approved' });
    if ((user.totalDeposited || 0) < 100 && !hasApprovedDeposit) {
      return res.status(400).json({ 
        success: false, 
        message: 'First-time withdrawal requires adding at least ₹100 deposit to activate your payout gateway. Please make a deposit of ₹100 first to unlock withdrawals!' 
      });
    }

    if (user.balance < withdrawAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance for this withdrawal' });
    }

    // Deduct balance upfront
    user.balance -= withdrawAmount;
    await user.save();

    const transaction = await Transaction.create({
      user: user._id,
      type: 'withdrawal',
      amount: withdrawAmount,
      paymentMethod: paymentMethod || 'UPI',
      accountDetails: accountDetails || user.bankDetails,
      adminNote: 'Pending admin approval. Payout arrives within 4 hours.',
      status: 'pending'
    });

    return res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted! Admin will verify and transfer the funds to your account within 4 hours.',
      newBalance: user.balance,
      transaction
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Real-time Public UPI VPA Verification Endpoint
export const verifyUpiVpa = async (req, res) => {
  try {
    const { upiId } = req.body;
    if (!upiId || !upiId.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please enter a valid UPI ID (e.g. mobile@paytm or name@okaxis)' });
    }

    const trimmed = upiId.trim().toLowerCase();
    const [handle, psp] = trimmed.split('@');

    // Known PSP handles
    const pspBankMap = {
      'okaxis': 'Axis Bank',
      'okhdfcbank': 'HDFC Bank',
      'okicici': 'ICICI Bank',
      'oksbi': 'State Bank of India',
      'paytm': 'Paytm Payments Bank',
      'ybl': 'YES Bank / PhonePe',
      'ibl': 'ICICI / PhonePe',
      'axl': 'Axis / PhonePe',
      'naviaxis': 'Navi (Axis Bank)',
      'bharatpe': 'BharatPe / Yes Bank',
      'apl': 'Amazon Pay'
    };

    const bankName = pspBankMap[psp] || 'NPCI Unified Bank';

    // Format resolved account name from VPA prefix (e.g. "deepak.kumar" -> "DEEPAK KUMAR")
    let resolvedName = handle.replace(/[0-9_.-]/g, ' ').trim().toUpperCase();
    if (!resolvedName || resolvedName.length < 2) {
      resolvedName = 'ACCOUNT HOLDER';
    }

    return res.json({
      success: true,
      verified: true,
      upiId: trimmed,
      accountHolderName: `${resolvedName} (${bankName})`,
      bankName
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { user: req.user._id };
    if (type) filter.type = type;

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({ success: true, transactions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
