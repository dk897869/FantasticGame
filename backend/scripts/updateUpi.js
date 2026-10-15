import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Setting } from '../models/Setting.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  let setting = await Setting.findOne();
  if (!setting) {
    setting = new Setting({});
  }
  setting.upiId = 'deepakut43287@naviaxis';
  setting.merchantName = 'Fantastic Game';
  await setting.save();
  console.log('✅ Updated UPI config:', setting.upiId, setting.merchantName);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
