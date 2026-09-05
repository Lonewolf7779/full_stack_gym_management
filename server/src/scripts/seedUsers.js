require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Trainer = require('../models/Trainer');
const Member = require('../models/Member');
const MembershipPlan = require('../models/MembershipPlan');
const connectDB = require('../config/db');

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await connectDB();

    console.log('[Seed] Seeding membership plans...');
    const plansData = [
      {
        name: 'Basic Plan',
        description: 'Essential gym floor and free weights access with standard amenities.',
        duration: 1, // 1 month
        price: 29,
        features: [
          'Full Gym Floor Access',
          'Standard Locker Room & Showers',
          'Free Fitness Assessment',
          'Mobile Member Portal Access',
        ],
        status: 'active',
      },
      {
        name: 'Standard Plan',
        description: 'Our most popular plan for committed athletes seeking balanced results.',
        duration: 3, // 3 months
        price: 59,
        features: [
          'Full Gym Floor Access',
          'Unlimited Group Studio Classes',
          '1 Complimentary PT Session / Month',
          'Customized Workout Plan',
          '1 Free Monthly Guest Pass',
        ],
        status: 'active',
      },
      {
        name: 'Premium Elite',
        description: 'VIP tier with 24/7 RFID access, dedicated coach, and recovery suite.',
        duration: 12, // 12 months
        price: 99,
        features: [
          '24/7 Unlimited RFID Keycard Access',
          'Dedicated Assigned Personal Coach',
          'Infrared Sauna & Recovery Lounge',
          'Weekly Split & Progress Reviews',
          'Unlimited Guest Passes',
        ],
        status: 'active',
      },
    ];

    const planMap = {};
    for (const p of plansData) {
      let plan = await MembershipPlan.findOne({ name: p.name });
      if (!plan) {
        plan = await MembershipPlan.create(p);
        console.log(`[Seed] Created plan: ${plan.name} ($${plan.price}/mo)`);
      } else {
        plan.description = p.description;
        plan.duration = p.duration;
        plan.price = p.price;
        plan.features = p.features;
        plan.status = p.status;
        await plan.save();
      }
      planMap[plan.name] = plan;
    }

    // 1. Seed Admin User
    console.log('[Seed] Seeding Admin user...');
    let adminUser = await User.findOne({ email: 'admin@ironforge.test' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'System Administrator',
        email: 'admin@ironforge.test',
        password: 'Admin@123',
        role: 'admin',
      });
      console.log('[Seed] Created Admin user: admin@ironforge.test');
    } else {
      adminUser.name = 'System Administrator';
      adminUser.password = 'Admin@123';
      adminUser.role = 'admin';
      await adminUser.save();
    }

    // 2. Seed Trainers
    console.log('[Seed] Seeding Trainers...');
    const trainersData = [
      {
        name: 'Marcus Vance',
        email: 'trainer@ironforge.test', // Primary demo trainer
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
        certifications: ['ACSM-CPT', 'FMS Level 2', 'CrossFit L2'],
        bio: 'Dedicated to athletic agility drills, metabolic conditioning, and mobility recovery for functional longevity.',
        status: 'active',
      },
      {
        name: 'Darius Thorne',
        email: 'darius@ironforge.test',
        password: 'Trainer@123',
        phone: '+1 (555) 903-4567',
        specialization: 'Body Recomposition & Calisthenics',
        experience: '8+ Years',
        certifications: ['ISSA Master Coach', 'Precision Nutrition L1'],
        bio: 'Focuses on sustainable body recomposition, macro-nutrient balancing, and raw gymnastics strength.',
        status: 'active',
      },
    ];

    const trainerMap = {};
    for (const t of trainersData) {
      let user = await User.findOne({ email: t.email });
      if (!user) {
        user = await User.create({
          name: t.name,
          email: t.email,
          password: t.password,
          role: 'trainer',
        });
      } else {
        user.name = t.name;
        user.password = t.password;
        user.role = 'trainer';
        await user.save();
      }

      let trainer = await Trainer.findOne({ user: user._id });
      if (!trainer) {
        trainer = await Trainer.create({
          user: user._id,
          phone: t.phone,
          specialization: t.specialization,
          experience: t.experience,
          certifications: t.certifications,
          bio: t.bio,
          status: t.status,
        });
        console.log(`[Seed] Created Trainer profile: ${t.name} (${t.email})`);
      } else {
        trainer.phone = t.phone;
        trainer.specialization = t.specialization;
        trainer.experience = t.experience;
        trainer.certifications = t.certifications;
        trainer.bio = t.bio;
        trainer.status = t.status;
        await trainer.save();
      }
      trainerMap[t.name] = trainer;
    }

    // 3. Seed Members
    console.log('[Seed] Seeding Members...');
    const now = new Date();
    const membersData = [
      {
        name: 'Rahul Patel',
        email: 'member@ironforge.test', // Primary demo member
        password: 'Member@123',
        phone: '+1 (555) 234-5678',
        gender: 'male',
        dateOfBirth: new Date('1998-04-15'),
        address: '742 Evergreen Terrace, Sector 4, Metro City',
        emergencyContact: { name: 'Priya Patel', phone: '+1 (555) 987-6543', relation: 'Spouse' },
        planName: 'Standard Plan',
        trainerName: 'Marcus Vance',
        status: 'active',
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 2, 1),
        notes: 'Goal: +30 lbs Squat PR and lean bulking phase.',
      },
      {
        name: 'Sarah Jenkins',
        email: 'sarah@ironforge.test',
        password: 'Member@123',
        phone: '+1 (555) 345-6789',
        gender: 'female',
        dateOfBirth: new Date('1995-09-22'),
        address: '108 Olympic Way, Apt 3B, Metro City',
        emergencyContact: { name: 'Mark Jenkins', phone: '+1 (555) 876-5432', relation: 'Brother' },
        planName: 'Premium Elite',
        trainerName: 'Elena Rostova',
        status: 'active',
        startDate: new Date(now.getFullYear(), now.getMonth() - 2, 10),
        endDate: new Date(now.getFullYear() + 1, now.getMonth() - 2, 10),
        notes: 'Marathon conditioning and functional core stamina.',
      },
      {
        name: 'David Miller',
        email: 'david@ironforge.test',
        password: 'Member@123',
        phone: '+1 (555) 456-7890',
        gender: 'male',
        dateOfBirth: new Date('2000-01-18'),
        address: '52 Pine Street, Metro City',
        emergencyContact: { name: 'Karen Miller', phone: '+1 (555) 765-4321', relation: 'Mother' },
        planName: 'Basic Plan',
        trainerName: null,
        status: 'active',
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        notes: 'Independent powerlifting floor access.',
      },
      {
        name: 'Priya Sharma',
        email: 'priya@ironforge.test',
        password: 'Member@123',
        phone: '+1 (555) 567-8901',
        gender: 'female',
        dateOfBirth: new Date('1997-11-05'),
        address: '88 Lakeview Boulevard, Metro City',
        emergencyContact: { name: 'Vikram Sharma', phone: '+1 (555) 654-3210', relation: 'Father' },
        planName: 'Premium Elite',
        trainerName: 'Marcus Vance',
        status: 'active',
        startDate: new Date(now.getFullYear(), now.getMonth() - 4, 15),
        endDate: new Date(now.getFullYear() + 1, now.getMonth() - 4, 15),
        notes: 'Strength training and body composition coaching.',
      },
      {
        name: 'John Doe',
        email: 'johndoe@ironforge.test',
        password: 'Member@123',
        phone: '+1 (555) 678-9012',
        gender: 'male',
        dateOfBirth: new Date('1992-06-30'),
        address: '12 Elm Street, Metro City',
        emergencyContact: { name: 'Jane Doe', phone: '+1 (555) 543-2109', relation: 'Sister' },
        planName: 'Basic Plan',
        trainerName: null,
        status: 'inactive',
        startDate: null,
        endDate: null,
        notes: 'Account paused on request.',
      },
      {
        name: 'Alex Wong',
        email: 'alex@ironforge.test',
        password: 'Member@123',
        phone: '+1 (555) 789-0123',
        gender: 'other',
        dateOfBirth: new Date('1999-12-12'),
        address: '330 Broadway Ave, Metro City',
        emergencyContact: { name: 'Lisa Wong', phone: '+1 (555) 432-1098', relation: 'Mother' },
        planName: 'Standard Plan',
        trainerName: 'Darius Thorne',
        status: 'expired',
        startDate: new Date(now.getFullYear(), now.getMonth() - 5, 1),
        endDate: new Date(now.getFullYear(), now.getMonth() - 2, 1),
        notes: 'Quarterly membership expired. Follow up for renewal.',
      },
    ];

    for (const m of membersData) {
      let user = await User.findOne({ email: m.email });
      if (!user) {
        user = await User.create({
          name: m.name,
          email: m.email,
          password: m.password,
          role: 'member',
        });
      } else {
        user.name = m.name;
        user.password = m.password;
        user.role = 'member';
        await user.save();
      }

      const planDoc = m.planName ? planMap[m.planName] : null;
      const trainerDoc = m.trainerName ? trainerMap[m.trainerName] : null;

      let member = await Member.findOne({ user: user._id });
      if (!member) {
        member = await Member.create({
          user: user._id,
          phone: m.phone,
          gender: m.gender,
          dateOfBirth: m.dateOfBirth,
          address: m.address,
          emergencyContact: m.emergencyContact,
          membershipPlan: planDoc ? planDoc._id : null,
          membershipStartDate: m.startDate,
          membershipEndDate: m.endDate,
          assignedTrainer: trainerDoc ? trainerDoc._id : null,
          status: m.status,
          notes: m.notes,
        });
        console.log(`[Seed] Created Member profile: ${m.name} (${m.email}) - Plan: ${m.planName || 'None'}`);
      } else {
        member.phone = m.phone;
        member.gender = m.gender;
        member.dateOfBirth = m.dateOfBirth;
        member.address = m.address;
        member.emergencyContact = m.emergencyContact;
        member.membershipPlan = planDoc ? planDoc._id : null;
        member.membershipStartDate = m.startDate;
        member.membershipEndDate = m.endDate;
        member.assignedTrainer = trainerDoc ? trainerDoc._id : null;
        member.status = m.status;
        member.notes = m.notes;
        await member.save();
      }
    }

    console.log('====================================================');
    console.log('🎉 Phase 4 Core Data Seeded Successfully:');
    console.log('----------------------------------------------------');
    console.log('📦 Membership Plans: 3 plans (Basic, Standard, Premium Elite)');
    console.log('🏋️ Trainers:         3 trainers (Marcus Vance, Elena Rostova, Darius Thorne)');
    console.log('🏃 Members:          6 members with active/inactive/expired statuses');
    console.log('👤 Demo Admin:       admin@ironforge.test   | Pass: Admin@123');
    console.log('🏋️ Demo Trainer:     trainer@ironforge.test | Pass: Trainer@123');
    console.log('🏃 Demo Member:      member@ironforge.test  | Pass: Member@123');
    console.log('====================================================');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedDatabase();
