import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { Setting } from '../models/Setting.js';
import { GameRound } from '../models/GameRound.js';
import { Bet } from '../models/Bet.js';

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const pendingDeposits = await Transaction.countDocuments({ type: 'deposit', status: 'pending' });
    const pendingWithdrawals = await Transaction.countDocuments({ type: 'withdrawal', status: 'pending' });

    const depositStats = await Transaction.aggregate([
      { $match: { type: 'deposit', status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const withdrawalStats = await Transaction.aggregate([
      { $match: { type: 'withdrawal', status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalBets = await Bet.countDocuments();
    const recentDeposits = await Transaction.find({ type: 'deposit' })
      .populate('user', 'name phone email')
      .sort({ createdAt: -1 })
      .limit(10);

    return res.json({
      success: true,
      stats: {
        totalUsers,
        pendingDeposits,
        pendingWithdrawals,
        totalDepositAmount: depositStats[0]?.total || 0,
        totalWithdrawalAmount: withdrawalStats[0]?.total || 0,
        totalBets,
        recentDeposits
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getDeposits = async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 100 } = req.query;
    const filter = { type: 'deposit' };
    if (status !== 'all') filter.status = status;

    const deposits = await Transaction.find(filter)
      .populate('user', 'name phone email balance totalDeposited')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Transaction.countDocuments(filter);

    return res.json({ success: true, deposits, total });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, adminNote } = req.body;

    const tx = await Transaction.findById(id).populate('user');
    if (!tx || tx.type !== 'deposit') {
      return res.status(404).json({ success: false, message: 'Deposit request not found' });
    }

    if (tx.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Deposit is already ${tx.status}` });
    }

    if (action === 'approve') {
      tx.status = 'approved';
      tx.adminNote = adminNote || 'UTR Verified and Approved';
      await tx.save();

      // Credit user's wallet balance
      const user = await User.findById(tx.user._id);
      user.balance += tx.amount;
      user.totalDeposited = (user.totalDeposited || 0) + tx.amount;
      await user.save();

      return res.json({
        success: true,
        message: `Deposit of ₹${tx.amount} approved! Player balance credited.`,
        transaction: tx,
        userBalance: user.balance
      });
    } else if (action === 'reject') {
      tx.status = 'rejected';
      tx.adminNote = adminNote || 'Invalid UTR or payment not received';
      await tx.save();

      return res.json({
        success: true,
        message: 'Deposit request rejected.',
        transaction: tx
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action. Must be approve or reject' });
    }
  } catch (error) {
    console.error('Verify deposit error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getWithdrawals = async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 100 } = req.query;
    const filter = { type: 'withdrawal' };
    if (status !== 'all') filter.status = status;

    const withdrawals = await Transaction.find(filter)
      .populate('user', 'name phone email balance bankDetails totalDeposited')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Transaction.countDocuments(filter);

    return res.json({ success: true, withdrawals, total });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, utr, adminNote } = req.body;

    const tx = await Transaction.findById(id).populate('user');
    if (!tx || tx.type !== 'withdrawal') {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    }

    if (tx.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Withdrawal is already ${tx.status}` });
    }

    if (action === 'approve') {
      tx.status = 'approved';
      tx.utr = utr || `PAYOUT_${Date.now()}`;
      tx.adminNote = adminNote || 'Payout transferred to Bank/UPI. Arrives within 4 hours.';
      await tx.save();

      const user = await User.findById(tx.user._id);
      user.totalWithdrawn = (user.totalWithdrawn || 0) + tx.amount;
      await user.save();

      return res.json({ 
        success: true, 
        message: 'Withdrawal approved! Funds marked as transferred.', 
        transaction: tx 
      });
    } else if (action === 'reject') {
      tx.status = 'rejected';
      tx.adminNote = adminNote || 'Withdrawal rejected - funds refunded to wallet';
      await tx.save();

      // Refund deducted balance back to user
      const user = await User.findById(tx.user._id);
      user.balance += tx.amount;
      await user.save();

      return res.json({ 
        success: true, 
        message: 'Withdrawal rejected and refunded back to player balance', 
        transaction: tx 
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 100 } = req.query;
    const query = { role: 'user' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { invitationCode: search }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    return res.json({ success: true, users, total });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserBalance = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, action } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const num = Number(amount);
    if (isNaN(num)) return res.status(400).json({ success: false, message: 'Invalid amount' });

    if (action === 'add') user.balance += num;
    else if (action === 'deduct') user.balance = Math.max(0, user.balance - num);
    else if (action === 'set') user.balance = Math.max(0, num);

    await user.save();
    return res.json({ success: true, message: `User balance updated to ₹${user.balance}`, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin Account-to-Account Money Transfer
export const transferBalanceBetweenAccounts = async (req, res) => {
  try {
    const { fromUserId, toUserId, amount, note } = req.body;
    const transferAmount = Number(amount);

    if (!transferAmount || transferAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Transfer amount must be greater than ₹0' });
    }

    if (fromUserId === toUserId) {
      return res.status(400).json({ success: false, message: 'Source and Destination accounts cannot be the same' });
    }

    const fromUser = await User.findById(fromUserId);
    const toUser = await User.findById(toUserId);

    if (!fromUser || !toUser) {
      return res.status(404).json({ success: false, message: 'One or both accounts could not be found' });
    }

    if (fromUser.balance < transferAmount) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient balance! ${fromUser.name} only has ₹${fromUser.balance}` 
      });
    }

    // Perform atomic-like balance transfer
    fromUser.balance -= transferAmount;
    toUser.balance += transferAmount;

    await fromUser.save();
    await toUser.save();

    // Create audit transaction records for both users
    await Transaction.create({
      user: fromUser._id,
      type: 'bonus',
      amount: -transferAmount,
      status: 'completed',
      adminNote: `Admin Transfer to ${toUser.name} (${toUser.phone || toUser.email}): ${note || 'Transferred by Admin'}`
    });

    await Transaction.create({
      user: toUser._id,
      type: 'bonus',
      amount: transferAmount,
      status: 'completed',
      adminNote: `Admin Transfer from ${fromUser.name} (${fromUser.phone || fromUser.email}): ${note || 'Transferred by Admin'}`
    });

    return res.json({
      success: true,
      message: `Successfully transferred ₹${transferAmount} from ${fromUser.name} to ${toUser.name}!`,
      fromUser: { id: fromUser._id, name: fromUser.name, balance: fromUser.balance },
      toUser: { id: toUser._id, name: toUser.name, balance: toUser.balance }
    });
  } catch (error) {
    console.error('Transfer error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleBlockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isBlocked = !user.isBlocked;
    await user.save();

    return res.json({ success: true, message: `User is now ${user.isBlocked ? 'blocked' : 'active'}`, isBlocked: user.isBlocked });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSettings = async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({
        upiId: 'deepakut43287@naviaxis',
        merchantName: 'Fantastic Game',
        signupBonus: 50
      });
    }
    return res.json({ success: true, setting });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) setting = new Setting({});

    const fields = ['upiId', 'merchantName', 'qrCodeUrl', 'minDeposit', 'maxDeposit', 'minWithdrawal', 'maxWithdrawal', 'signupBonus', 'referralBonus', 'noticeBanner', 'upiEnabled'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) setting[f] = req.body[f];
    });

    await setting.save();
    return res.json({ success: true, message: 'Settings updated successfully', setting });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
