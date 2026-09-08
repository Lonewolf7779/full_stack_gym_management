const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Trainer = require('../models/Trainer');
const connectDB = require('../config/db');

// Exact 3 Production Trainers Dataset
const PRODUCTION_TRAINERS = [
  {
    name: 'Marcus Vance',
    email: 'trainer@ironforge.test',
    password: 'Trainer@123',
    phone: '+1 (555) 901-2345',
    specialization: 'Strength & Hypertrophy',
    experience: '9+ Years',
    certifications: ['CSCS', 'NASM Master Trainer', 'USAW Level 2'],
    bio: 'Specializes in progressive overload mechanics, compound barbell lifts, and competitive strength preparation.',
    status: 'active',
  },
  {
    name: 'Elena Rostova',
    email: 'elena@ironforge.test',
    password: 'Trainer@123',
    phone: '+1 (555) 902-3456',
    specialization: 'HIIT & Functional Conditioning',
    experience: '7+ Years',
    certifications: ['ACE-CPT', 'CrossFit Level 2', 'TRX Certified'],
    bio: 'High-intensity interval conditioning, functional athletic circuits, and cardiovascular performance.',
    status: 'active',
  },
  {
    name: 'Darius Thorne',
    email: 'darius@ironforge.test',
    password: 'Trainer@123',
    phone: '+1 (555) 903-4567',
    specialization: 'Powerlifting & Biomechanics',
    experience: '12+ Years',
    certifications: ['USAPL Senior Coach', 'CSCS', 'FMS Level 2'],
    bio: 'Competitive powerlifting specialist focusing on bar path optimization, deadlift lockout mechanics, and injury prehab.',
    status: 'active',
  },
];

const seedProductionTrainers = async () => {
  console.log('================================================================');
  console.log('🏋️  IRONFORGE PRODUCTION DATA SEED: 3 PRODUCTION TRAINERS');
  console.log('================================================================\n');

  try {
    console.log('[1/4] Connecting to MongoDB...');
    const conn = await connectDB();
    if (!conn || mongoose.connection.readyState !== 1) {
      throw new Error('Failed to establish active MongoDB connection.');
    }

    const dbName = mongoose.connection.name;
    console.log(`[Database] Connected successfully to database: "${dbName}"\n`);

    const summaryResults = [];

    console.log('[2/4] Processing production trainer records idempotently...');
    for (const trainerData of PRODUCTION_TRAINERS) {
      let userStatus = 'already_exists';
      let trainerProfileStatus = 'already_exists';

      // 1. Check if User exists by email
      let user = await User.findOne({ email: trainerData.email });
      if (!user) {
        user = new User({
          name: trainerData.name,
          email: trainerData.email,
          password: trainerData.password, // Mongoose pre-save hook will bcrypt hash this
          role: 'trainer',
          status: trainerData.status,
        });
        await user.save();
        userStatus = 'created';
        console.log(`  + Created User: ${trainerData.name} (${trainerData.email}) [role: ${user.role}]`);
      } else {
        // Ensure role is trainer and active
        let modified = false;
        if (user.role !== 'trainer') {
          user.role = 'trainer';
          modified = true;
        }
        if (user.status !== trainerData.status) {
          user.status = trainerData.status;
          modified = true;
        }
        if (user.name !== trainerData.name) {
          user.name = trainerData.name;
          modified = true;
        }
        if (modified) {
          await user.save();
          userStatus = 'updated';
        }
        console.log(`  = User already exists: ${trainerData.name} (${trainerData.email}) [role: ${user.role}]`);
      }

      // 2. Check if Trainer profile exists for this user ID
      let trainer = await Trainer.findOne({ user: user._id });
      if (!trainer) {
        trainer = new Trainer({
          user: user._id,
          phone: trainerData.phone,
          specialization: trainerData.specialization,
          experience: trainerData.experience,
          certifications: trainerData.certifications,
          bio: trainerData.bio,
          status: trainerData.status,
        });
        await trainer.save();
        trainerProfileStatus = 'created';
        console.log(`  + Created Trainer Profile: ${trainerData.name} [ID: ${trainer._id}]`);
      } else {
        trainer.phone = trainerData.phone;
        trainer.specialization = trainerData.specialization;
        trainer.experience = trainerData.experience;
        trainer.certifications = trainerData.certifications;
        trainer.bio = trainerData.bio;
        trainer.status = trainerData.status;
        await trainer.save();
        console.log(`  = Trainer Profile already exists: ${trainerData.name} [ID: ${trainer._id}]`);
      }

      summaryResults.push({
        name: trainerData.name,
        email: trainerData.email,
        userStatus,
        trainerProfileStatus,
        userId: user._id.toString(),
        trainerId: trainer._id.toString(),
        role: user.role,
        userActive: user.status,
        trainerActive: trainer.status,
      });
    }

    // 3. Validation & Audit of Database State
    console.log('\n[3/4] Performing post-seed database validation...');
    const allUsers = await User.find({}).select('+password');
    const allTrainers = await Trainer.find({}).populate('user');

    console.log(`  -> Total User documents: ${allUsers.length}`);
    for (const u of allUsers) {
      const isHashed = u.password && u.password.startsWith('$2') && u.password.length >= 59;
      const passMatch = await u.comparePassword('Trainer@123');
      console.log(`     * User: ${u.name} | ${u.email} | Role: ${u.role} | Status: ${u.status} | Password Hash: ${isHashed ? 'VALID BCRYPT' : 'INVALID/PLAINTEXT'} | Auth Verify: ${passMatch ? 'PASS' : 'FAIL'}`);
    }

    console.log(`  -> Total Trainer profile documents: ${allTrainers.length}`);
    for (const tr of allTrainers) {
      console.log(`     * Trainer: ${tr.user?.name} | Specialization: ${tr.specialization} | Experience: ${tr.experience} | Linked User ID: ${tr.user?._id}`);
    }

    // Check unrelated collection counts
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n[4/4] Checking collection counts across database:');
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`     - Collection "${col.name}": ${count} documents`);
    }

    console.log('\n================================================================');
    console.log('✅ PRODUCTION TRAINERS SEED COMPLETED SUCCESSFULLY');
    console.log('================================================================');
    console.log('\nSummary:');
    summaryResults.forEach((res) => {
      console.log(`  - ${res.name} (${res.email}): User [${res.userStatus}], Profile [${res.trainerProfileStatus}]`);
    });
    console.log(`  - Total Users: ${allUsers.length}`);
    console.log(`  - Total Trainer Profiles: ${allTrainers.length}`);
    console.log('================================================================\n');

  } catch (err) {
    console.error(`\n❌ [Error] Production Trainer Seeding Failed: ${err.message}`);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('[Database] Connection closed cleanly.');
    }
    process.exit(process.exitCode || 0);
  }
};

seedProductionTrainers();
