require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const demoUsers = [
  {
    name: 'System Administrator',
    email: 'admin@ironforge.test',
    password: 'Admin@123',
    role: 'admin',
  },
  {
    name: 'Marcus Vance (Trainer)',
    email: 'trainer@ironforge.test',
    password: 'Trainer@123',
    role: 'trainer',
  },
  {
    name: 'Rahul Patel (Member)',
    email: 'member@ironforge.test',
    password: 'Member@123',
    role: 'member',
  },
];

const seedUsers = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await connectDB();

    console.log('[Seed] Seeding demo users...');

    for (const userData of demoUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        console.log(`[Seed] User already exists: ${userData.email} (${userData.role}) - updating password.`);
        existing.name = userData.name;
        existing.password = userData.password; // Triggers pre-save bcrypt hash
        existing.role = userData.role;
        await existing.save();
      } else {
        await User.create(userData);
        console.log(`[Seed] Created new user: ${userData.email} (${userData.role})`);
      }
    }

    console.log('====================================================');
    console.log('🎉 Demo Users Seeded Successfully:');
    console.log('----------------------------------------------------');
    console.log('👤 Admin:   admin@ironforge.test   | Pass: Admin@123');
    console.log('🏋️ Trainer: trainer@ironforge.test | Pass: Trainer@123');
    console.log('🏃 Member:  member@ironforge.test  | Pass: Member@123');
    console.log('====================================================');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedUsers();
