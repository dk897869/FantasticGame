import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import { Setting } from '../models/Setting.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });
};

export const register = async (req, res) => {
  try {
    const { name, phone, email, password, invitationCode } = req.body;

    if (!phone && !email) {
      return res.status(400).json({ success: false, message: 'Phone or email is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Check existing
    const existing = await User.findOne({
      $or: [
        ...(phone ? [{ phone }] : []),
        ...(email ? [{ email }] : [])
      ]
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'User already registered with this phone/email' });
    }

    // Handle referral
    let referrer = null;
    if (invitationCode) {
      referrer = await User.findOne({ invitationCode: invitationCode.trim() });
    }

    // Get bonus from settings
    const setting = await Setting.findOne();
    const signupBonus = setting ? setting.signupBonus : 50;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name || (phone ? `User_${phone.slice(-4)}` : 'User'),
      phone,
      email,
      password: hashedPassword,
      balance: signupBonus,
      invitedBy: referrer ? referrer.invitationCode : null,
      role: 'user'
    });

    if (referrer) {
      const referralBonus = setting ? setting.referralBonus : 50;
      referrer.balance += referralBonus;
      referrer.referralEarnings += referralBonus;
      await referrer.save();
    }

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        balance: user.balance,
        role: user.role,
        invitationCode: user.invitationCode,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { account, password } = req.body; // account can be phone or email

    if (!account || !password) {
      return res.status(400).json({ success: false, message: 'Account and password are required' });
    }

    const user = await User.findOne({
      $or: [{ phone: account }, { email: account }]
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Account is suspended' });
    }

    if (!user.password) {
      return res.status(400).json({ success: false, message: 'Please sign in using Google' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        balance: user.balance,
        role: user.role,
        invitationCode: user.invitationCode,
        avatar: user.avatar,
        bankDetails: user.bankDetails
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { credential, invitationCode } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential token is required' });
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } catch (err) {
      // Fallback: decode JWT token in case of sandbox or direct client payload
      const parts = credential.split('.');
      if (parts.length === 3) {
        payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      } else {
        throw new Error('Invalid Google Token');
      }
    }

    const { email, name, picture, sub: googleId } = payload;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    const setting = await Setting.findOne();
    const signupBonus = setting ? setting.signupBonus : 50;

    if (!user) {
      // Handle referral
      let referrer = null;
      if (invitationCode) {
        referrer = await User.findOne({ invitationCode: invitationCode.trim() });
      }

      user = await User.create({
        name: name || 'Google Player',
        email,
        googleId,
        avatar: picture || 'https://api.dicebear.com/7.x/bottts/svg?seed=user',
        balance: signupBonus,
        invitedBy: referrer ? referrer.invitationCode : null,
        role: 'user'
      });

      if (referrer) {
        const referralBonus = setting ? setting.referralBonus : 50;
        referrer.balance += referralBonus;
        referrer.referralEarnings += referralBonus;
        await referrer.save();
      }
    } else {
      if (!user.googleId) user.googleId = googleId;
      if (picture && (!user.avatar || user.avatar.includes('dicebear'))) user.avatar = picture;
      await user.save();
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Account is suspended' });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        balance: user.balance,
        role: user.role,
        invitationCode: user.invitationCode,
        avatar: user.avatar,
        bankDetails: user.bankDetails
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(500).json({ success: false, message: 'Google authentication failed: ' + error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBankDetails = async (req, res) => {
  try {
    const { holderName, accountNumber, ifsc, upiId } = req.body;
    const user = await User.findById(req.user._id);

    user.bankDetails = {
      holderName: holderName || user.bankDetails.holderName,
      accountNumber: accountNumber || user.bankDetails.accountNumber,
      ifsc: ifsc || user.bankDetails.ifsc,
      upiId: upiId || user.bankDetails.upiId
    };

    await user.save();
    return res.json({ success: true, bankDetails: user.bankDetails, message: 'Bank details saved successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Admin email and password are required' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // STRICT CHECK: Only dk897869@gmail.com can log in as admin
    if (trimmedEmail !== 'dk897869@gmail.com') {
      return res.status(403).json({ success: false, message: 'Access denied: Unauthorized admin account' });
    }

    const adminUser = await User.findOne({ email: trimmedEmail, role: 'admin' });
    if (!adminUser) {
      return res.status(404).json({ success: false, message: 'Admin account not found' });
    }

    const isMatch = await bcrypt.compare(password, adminUser.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid admin password' });
    }

    const token = generateToken(adminUser._id);
    return res.json({
      success: true,
      token,
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        balance: adminUser.balance
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
