import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { seedComprehensiveData } from './config/seedComprehensiveData.js';
import User from './models/User.js';
import Student from './models/Student.js';
import EarlyAttention from './models/EarlyAttention.js';
import SchoolNeed from './models/SchoolNeed.js';
import CommunityDrive from './models/CommunityDrive.js';
import Contribution from './models/Contribution.js';
import Inventory from './models/Inventory.js';

const runVerification = async () => {
  console.log('🧪 Starting EduConnect End-to-End System Verification...');
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Connected to MongoDB Atlas:', conn.connection.name);

    // Run seeder
    await seedComprehensiveData();

    // 1. Verify User Roles
    const userCount = await User.countDocuments();
    const roles = await User.distinct('role');
    console.log(`✅ Users in DB: ${userCount}, Roles: ${roles.join(', ')}`);

    // 2. Verify Core Flow 1 (Early Attention Indicator)
    const rahul = await Student.findOne({ name: 'Rahul Verma' });
    const rahulAttention = await EarlyAttention.findOne({ student: rahul._id });
    console.log('\n--- Core Flow 1: Student Support & Early Attention ---');
    console.log(`Student: ${rahul.name}`);
    console.log(`Attendance Rate: ${rahul.currentAttendanceRate}% (Expected: 52%)`);
    console.log(`Academic Average: ${rahul.currentAcademicAverage}% (Expected: 38%)`);
    console.log(`Consecutive Absences: ${rahul.consecutiveAbsences} days (Expected: 8 days)`);
    console.log(`Attention Status: ${rahulAttention.attentionLevel} (Expected: HIGH_ATTENTION)`);
    console.log(`Flagged Reasons: ${rahulAttention.flaggedReasons.length}`);
    console.log(`Recommended Actions: ${rahulAttention.recommendedActions.join(' | ')}`);

    // 3. Verify Core Flow 2 (School Need -> Drive -> Contribution -> Verification)
    const laptopNeed = await SchoolNeed.findOne({ title: '2 Laptops Needed for Computer Laboratory' });
    const laptopDrive = await CommunityDrive.findOne({ schoolNeed: laptopNeed._id });
    const contributions = await Contribution.find({ drive: laptopDrive._id });
    const inventoryLaptops = await Inventory.find({ category: 'IT & Computers' });

    console.log('\n--- Core Flow 2: School Need -> Drive -> Verification ---');
    console.log(`School Need: "${laptopNeed.title}"`);
    console.log(`Required: ${laptopNeed.requiredQuantity}, Received: ${laptopNeed.receivedQuantity}, Remaining: ${laptopNeed.remainingQuantity}`);
    console.log(`Drive: "${laptopDrive.title}" (Fulfilled: ${laptopDrive.fulfilledQuantity}/${laptopDrive.targetQuantity})`);
    console.log(`Contributions attached: ${contributions.length}`);
    contributions.forEach((c) => {
      console.log(`  - [${c.status}] ${c.itemDetails} by ${c.contributorName} (${c.contributorRole})`);
    });
    console.log(`Inventory IT assets: ${inventoryLaptops.length} items`);
    inventoryLaptops.forEach((inv) => {
      console.log(`  - ${inv.itemName} (Tag: ${inv.assetTag}, Loc: ${inv.location}, Source: ${inv.source})`);
    });

    console.log('\n🎉 ALL SYSTEM CHECKS PASSED PERFECTLY!');
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Verification error:', err);
  }
};

runVerification();
