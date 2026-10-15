import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Setting } from '../models/Setting.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Update setting signup bonus to 50
  let setting = await Setting.findOne();
  if (!setting) setting = new Setting({});
  setting.signupBonus = 50;
  await setting.save();
  console.log('✅ Setting signupBonus set to 50');

  // Ensure only dk897869@gmail.com is admin with password C97ffywc@
  const adminEmail = 'dk897869@gmail.com';
  const adminPass = 'C97ffywc@';

  // Demote any other admin
  await User.updateMany({ email: { $ne: adminEmail }, role: 'admin' }, { role: 'user' });

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(adminPass, salt);

  let adminUser = await User.findOne({ email: adminEmail });
  if (!adminUser) {
    adminUser = new User({
      name: 'Deepak Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      balance: 999999
    });
  } else {
    adminUser.name = 'Deepak Admin';
    adminUser.role = 'admin';
    adminUser.password = hashedPassword;
  }
  await adminUser.save();
  console.log('✅ Admin account configured successfully:', adminEmail);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
