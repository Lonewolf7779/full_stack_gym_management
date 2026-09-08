const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Trainer = require('../models/Trainer');
const connectDB = require('../config/db');

const ADMIN_USER_DATA = {
  name: 'System Administrator',
  email: 'admin@ironforge.test',
  password: 'Santosh@777',
  role: 'admin',
  status: 'active',
};

const seedProductionAdmin = async () => {
  console.log('================================================================');
  console.log('🛡️  IRONFORGE PRODUCTION DATA SEED: ADMIN ACCOUNT');
  console.log('================================================================\n');

  try {
    console.log('[1/4] Connecting to MongoDB...');
    const conn = await connectDB();
    if (!conn || mongoose.connection.readyState !== 1) {
      throw new Error('Failed to establish active MongoDB connection.');
    }

    const dbHost = mongoose.connection.host;
    const dbName = mongoose.connection.name;
    console.log(`[Database] Connected successfully to host: "${dbHost}", database: "${dbName}"\n`);

    console.log('[2/4] Processing Admin record idempotently...');
    let adminUser = await User.findOne({ email: ADMIN_USER_DATA.email });
    let adminStatus = 'already_exists';

    if (!adminUser) {
      adminUser = new User({
        name: ADMIN_USER_DATA.name,
        email: ADMIN_USER_DATA.email,
        password: ADMIN_USER_DATA.password, // Pre-save hook will bcrypt hash this
        role: ADMIN_USER_DATA.role,
        status: ADMIN_USER_DATA.status,
      });
      await adminUser.save();
      adminStatus = 'created';
      console.log(`  + Created Admin User: ${adminUser.name} (${adminUser.email}) [ID: ${adminUser._id}]`);
    } else {
      adminUser.name = ADMIN_USER_DATA.name;
      adminUser.password = ADMIN_USER_DATA.password; // Setting password triggers isModified('password') in pre-save hook
      adminUser.role = ADMIN_USER_DATA.role;
      adminUser.status = ADMIN_USER_DATA.status;
      await adminUser.save();
      adminStatus = 'updated';
      console.log(`  = Updated Admin User: ${adminUser.name} (${adminUser.email}) [ID: ${adminUser._id}]`);
    }

    // 3. Validation & Audit of Database State
    console.log('\n[3/4] Performing post-seed database validation...');
    const allUsers = await User.find({}).select('+password');
    const allTrainers = await Trainer.find({}).populate('user');

    console.log(`  -> Total User documents: ${allUsers.length}`);
    for (const u of allUsers) {
      const isHashed = u.password && u.password.startsWith('$2') && u.password.length >= 59;
      let passMatch = false;
      if (u.role === 'admin') {
        passMatch = await u.comparePassword('Santosh@777');
      } else if (u.role === 'trainer') {
        passMatch = await u.comparePassword('Trainer@123');
      }
      console.log(`     * User: ${u.name} | ${u.email} | Role: ${u.role} | Status: ${u.status} | Password Hash: ${isHashed ? 'VALID BCRYPT' : 'INVALID/PLAINTEXT'} | Auth Verify: ${passMatch ? 'PASS' : 'FAIL'}`);
    }

    console.log(`  -> Total Trainer profile documents: ${allTrainers.length}`);
    for (const tr of allTrainers) {
      console.log(`     * Trainer: ${tr.user?.name} | Specialization: ${tr.specialization} | Experience: ${tr.experience} | Linked User ID: ${tr.user?._id}`);
    }

    // Check collection counts across database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n[4/4] Checking collection counts across database:');
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`     - Collection "${col.name}": ${count} documents`);
    }

    console.log('\n================================================================');
    console.log('✅ PRODUCTION ADMIN SEED COMPLETED SUCCESSFULLY');
    console.log('================================================================');
    console.log(`  - Admin Email:    ${ADMIN_USER_DATA.email}`);
    console.log(`  - Admin Role:     ${ADMIN_USER_DATA.role}`);
    console.log(`  - Status Action:  ${adminStatus}`);
    console.log(`  - Total Users:    ${allUsers.length}`);
    console.log(`  - Total Trainers: ${allTrainers.length}`);
    console.log('================================================================\n');

  } catch (err) {
    console.error(`\n❌ [Error] Production Admin Seeding Failed: ${err.message}`);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('[Database] Connection closed cleanly.');
    }
    process.exit(process.exitCode || 0);
  }
};

seedProductionAdmin();
