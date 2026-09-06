require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Trainer = require('../models/Trainer');
const Member = require('../models/Member');
const MembershipPlan = require('../models/MembershipPlan');
const Exercise = require('../models/Exercise');
const TrainingPlan = require('../models/TrainingPlan');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const MemberProgress = require('../models/MemberProgress');
const Notification = require('../models/Notification');
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
        status: 'active',
      });
      console.log('[Seed] Created Admin user: admin@ironforge.test');
    } else {
      adminUser.name = 'System Administrator';
      adminUser.password = 'Admin@123';
      adminUser.role = 'admin';
      adminUser.status = 'active';
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

    const trainerMap = {};
    for (const t of trainersData) {
      let user = await User.findOne({ email: t.email });
      if (!user) {
        user = await User.create({
          name: t.name,
          email: t.email,
          password: t.password,
          role: 'trainer',
          status: 'active',
        });
      } else {
        user.name = t.name;
        user.password = t.password;
        user.role = 'trainer';
        user.status = 'active';
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

    const memberMap = {};
    for (const m of membersData) {
      let user = await User.findOne({ email: m.email });
      if (!user) {
        user = await User.create({
          name: m.name,
          email: m.email,
          password: m.password,
          role: 'member',
          status: m.status === 'inactive' ? 'inactive' : 'active',
        });
      } else {
        user.name = m.name;
        user.password = m.password;
        user.role = 'member';
        user.status = m.status === 'inactive' ? 'inactive' : 'active';
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
      memberMap[m.name] = member;
    }

    // 4. Seed Exercise Library
    console.log('[Seed] Seeding Exercise Library...');
    const exercisesData = [
      {
        name: 'Barbell Bench Press',
        category: 'Strength',
        muscleGroup: 'Chest',
        equipment: 'Barbell',
        difficulty: 'Intermediate',
        defaultSets: 4,
        defaultReps: 8,
        defaultDuration: 0,
        defaultRestTime: 90,
        description: 'Primary horizontal compound pressing movement targeting pectoralis major, anterior deltoids, and triceps.',
        instructions: [
          'Lie flat on bench with eyes directly under the racked bar.',
          'Grip the bar slightly wider than shoulder-width, arch upper back, and pin shoulder blades together.',
          'Unrack, take a deep breath, and lower bar smoothly to mid-chest touching lightly.',
          'Drive feet firmly into the floor and press explosively back to starting position.',
        ],
        status: 'active',
      },
      {
        name: 'Incline Dumbbell Press',
        category: 'Strength',
        muscleGroup: 'Chest',
        equipment: 'Dumbbell',
        difficulty: 'Intermediate',
        defaultSets: 3,
        defaultReps: 10,
        defaultDuration: 0,
        defaultRestTime: 75,
        description: 'Upper chest development exercise performed on a 30-45 degree inclined bench.',
        instructions: [
          'Set adjustable bench to 30-45 degrees. Sit with dumbbells resting on thighs.',
          'Kick dumbbells up to shoulder level as you lean back.',
          'Press dumbbells upwards in an arc, converging near the top without banging.',
          'Lower under control until upper arms are parallel to the torso.',
        ],
        status: 'active',
      },
      {
        name: 'Barbell Back Squat',
        category: 'Strength',
        muscleGroup: 'Legs',
        equipment: 'Barbell',
        difficulty: 'Advanced',
        defaultSets: 4,
        defaultReps: 6,
        defaultDuration: 0,
        defaultRestTime: 120,
        description: 'The king of lower body compound lifts for quadriceps, hamstrings, glutes, and core stability.',
        instructions: [
          'Step under the bar resting it across upper trapezius or rear delts.',
          'Unrack, take two controlled steps back, setting feet shoulder-width with slight toe flare.',
          'Brace core tightly and initiate the descent by breaking hips and knees simultaneously.',
          'Descend until hip crease is below top of knees (parallel or deeper).',
          'Drive aggressively through midfoot to stand tall.',
        ],
        status: 'active',
      },
      {
        name: 'Romanian Deadlift (RDL)',
        category: 'Strength',
        muscleGroup: 'Legs',
        equipment: 'Barbell',
        difficulty: 'Intermediate',
        defaultSets: 3,
        defaultReps: 10,
        defaultDuration: 0,
        defaultRestTime: 90,
        description: 'Posterior chain builder emphasizing hamstrings, gluteus maximus, and spinal erectors with hip hinge.',
        instructions: [
          'Stand holding barbell at hip level with an overhand grip.',
          'Keep a soft knee bend and push hips directly backwards as you hinge at the waist.',
          'Lower bar close along the shins until a deep hamstring stretch is felt (just below knees).',
          'Squeeze glutes and thrust hips forward to return to standing lock.',
        ],
        status: 'active',
      },
      {
        name: 'Bulgarian Split Squat',
        category: 'Strength',
        muscleGroup: 'Legs',
        equipment: 'Dumbbell',
        difficulty: 'Intermediate',
        defaultSets: 3,
        defaultReps: 10,
        defaultDuration: 0,
        defaultRestTime: 60,
        description: 'Unilateral quad and glute exercise that addresses muscular imbalances and hip stability.',
        instructions: [
          'Stand 2 feet in front of a flat bench. Place top of one foot rearward onto the bench.',
          'Lower hips straight down until back knee hovers just above the floor.',
          'Keep front knee tracking in line with toes and chest upright.',
          'Push through front heel to return to top position.',
        ],
        status: 'active',
      },
      {
        name: 'Overhead Barbell Military Press',
        category: 'Strength',
        muscleGroup: 'Shoulders',
        equipment: 'Barbell',
        difficulty: 'Intermediate',
        defaultSets: 4,
        defaultReps: 8,
        defaultDuration: 0,
        defaultRestTime: 90,
        description: 'Standing overhead press developing anterior and lateral deltoids, upper chest, and core bracing.',
        instructions: [
          'Hold barbell in front rack position across collarbone, elbows slightly forward of bar.',
          'Tighten glutes and core, press bar vertically clearing head slightly backward.',
          'Once bar passes forehead, push head back through and lock out overhead with shoulders active.',
          'Lower slowly back to collarbone level.',
        ],
        status: 'active',
      },
      {
        name: 'Dumbbell Lateral Raise',
        category: 'Strength',
        muscleGroup: 'Shoulders',
        equipment: 'Dumbbell',
        difficulty: 'Beginner',
        defaultSets: 4,
        defaultReps: 12,
        defaultDuration: 0,
        defaultRestTime: 60,
        description: 'Isolation exercise targeting lateral head of the deltoid for capped shoulder width.',
        instructions: [
          'Stand tall holding dumbbells at sides with a neutral grip and slight elbow bend.',
          'Raise arms out to sides leading with elbows until parallel to the floor.',
          'Hold at peak contraction for a split second, then lower under steady control.',
        ],
        status: 'active',
      },
      {
        name: 'Conventional Deadlift',
        category: 'Olympic',
        muscleGroup: 'Full Body',
        equipment: 'Barbell',
        difficulty: 'Advanced',
        defaultSets: 3,
        defaultReps: 5,
        defaultDuration: 0,
        defaultRestTime: 150,
        description: 'Total body power movement engaging posterior chain, upper back, lats, and grip strength.',
        instructions: [
          'Stand with mid-foot under the barbell, feet hip-width apart.',
          'Hinge down and grip bar just outside knees with double overhand or mixed grip.',
          'Pull chest up, drop hips slightly, and wedge lats tight against torso.',
          'Drive the floor away with legs and lock out hips and knees simultaneously.',
        ],
        status: 'active',
      },
      {
        name: 'Wide-Grip Lat Pulldown',
        category: 'Strength',
        muscleGroup: 'Back',
        equipment: 'Cable',
        difficulty: 'Beginner',
        defaultSets: 3,
        defaultReps: 12,
        defaultDuration: 0,
        defaultRestTime: 60,
        description: 'Cable movement for latissimus dorsi width, upper back thickness, and biceps.',
        instructions: [
          'Sit at pulldown station with thighs secured firmly under roller pads.',
          'Grip wide bar with an overhand grip wider than shoulders.',
          'Lean torso back 10-15 degrees and pull bar down to upper chest, retracting shoulder blades.',
          'Control the ascent allowing full stretch at the top.',
        ],
        status: 'active',
      },
      {
        name: 'Barbell Bent-Over Row',
        category: 'Strength',
        muscleGroup: 'Back',
        equipment: 'Barbell',
        difficulty: 'Intermediate',
        defaultSets: 4,
        defaultReps: 8,
        defaultDuration: 0,
        defaultRestTime: 90,
        description: 'Heavy compound rowing lift building upper/mid back thickness, rhomboids, and rear delts.',
        instructions: [
          'Hinge at hips with back flat at a 45-degree angle, holding bar with shoulder-width grip.',
          'Pull barbell into lower ribcage/navel, squeezing shoulder blades together aggressively.',
          'Lower bar smoothly until arms are fully extended without rounding lower spine.',
        ],
        status: 'active',
      },
      {
        name: 'Bodyweight Pull-Ups',
        category: 'Bodyweight',
        muscleGroup: 'Back',
        equipment: 'Bodyweight',
        difficulty: 'Intermediate',
        defaultSets: 3,
        defaultReps: 8,
        defaultDuration: 0,
        defaultRestTime: 90,
        description: 'Fundamental calisthenic upper body pulling exercise for lats and functional relative strength.',
        instructions: [
          'Grip pull-up bar with overhand grip slightly wider than shoulders.',
          'Depress scapulae and pull chest up towards the bar until chin clears bar height.',
          'Lower under steady control until arms reach dead-hang position.',
        ],
        status: 'active',
      },
      {
        name: 'Cable Face Pulls',
        category: 'Strength',
        muscleGroup: 'Shoulders',
        equipment: 'Cable',
        difficulty: 'Beginner',
        defaultSets: 4,
        defaultReps: 15,
        defaultDuration: 0,
        defaultRestTime: 60,
        description: 'Postural and rotator cuff health movement for rear deltoids and external rotators.',
        instructions: [
          'Set cable pulley at eye level with rope attachment.',
          'Grip rope with thumbs facing backwards and step back into a stable split stance.',
          'Pull rope handles directly toward eyes/forehead, flaring elbows out and externally rotating shoulders.',
          'Squeeze rear delts for 1 second, then control back.',
        ],
        status: 'active',
      },
      {
        name: 'Standing Barbell Bicep Curl',
        category: 'Strength',
        muscleGroup: 'Arms',
        equipment: 'Barbell',
        difficulty: 'Beginner',
        defaultSets: 3,
        defaultReps: 10,
        defaultDuration: 0,
        defaultRestTime: 60,
        description: 'Direct biceps brachii hypertrophy builder with supinated barbell loading.',
        instructions: [
          'Hold straight barbell or EZ bar with shoulder-width underhand grip.',
          'Keep elbows pinned closely to sides of torso.',
          'Curl bar upwards toward upper chest while squeezing biceps at peak contraction.',
          'Lower bar slowly over 2-3 seconds for maximum eccentric tension.',
        ],
        status: 'active',
      },
      {
        name: 'EZ Bar Skull Crushers',
        category: 'Strength',
        muscleGroup: 'Arms',
        equipment: 'Barbell',
        difficulty: 'Intermediate',
        defaultSets: 3,
        defaultReps: 10,
        defaultDuration: 0,
        defaultRestTime: 60,
        description: 'Lying tricep extension targeting medial and long heads of the triceps brachii.',
        instructions: [
          'Lie back on flat bench holding EZ curl bar over chest with narrow grip.',
          'Keeping upper arms perpendicular to the floor, bend elbows to lower bar toward forehead/crown.',
          'Extend elbows forcefully to return bar to initial locked-out position.',
        ],
        status: 'active',
      },
      {
        name: 'Parallel Bar Dips',
        category: 'Bodyweight',
        muscleGroup: 'Arms',
        equipment: 'Bodyweight',
        difficulty: 'Intermediate',
        defaultSets: 3,
        defaultReps: 12,
        defaultDuration: 0,
        defaultRestTime: 75,
        description: 'Bodyweight pressing powerhouse for lower chest and tricep development.',
        instructions: [
          'Mount parallel dip bars with arms fully locked and torso slightly tilted forward.',
          'Lower body by bending elbows until upper arms are at least parallel to floor (90 degrees).',
          'Press through palms to lockout top position.',
        ],
        status: 'active',
      },
      {
        name: 'Hanging Leg Raises',
        category: 'Core',
        muscleGroup: 'Core',
        equipment: 'Bodyweight',
        difficulty: 'Intermediate',
        defaultSets: 3,
        defaultReps: 12,
        defaultDuration: 0,
        defaultRestTime: 60,
        description: 'Advanced core movement for lower rectus abdominis, hip flexors, and grip endurance.',
        instructions: [
          'Hang from a pull-up bar with overhand grip and legs straight.',
          'Engage core and raise legs straight in front until hips reach 90 degrees or touch bar.',
          'Avoid swinging momentum and lower legs with strict control.',
        ],
        status: 'active',
      },
      {
        name: 'Isometric Plank Hold',
        category: 'Core',
        muscleGroup: 'Core',
        equipment: 'None',
        difficulty: 'Beginner',
        defaultSets: 3,
        defaultReps: 1,
        defaultDuration: 60, // 60 seconds
        defaultRestTime: 45,
        description: 'Anti-extension core isometric exercise strengthening deep transverse abdominis and pelvic stability.',
        instructions: [
          'Rest on forearms and toes with elbows directly below shoulders.',
          'Maintain a straight rigid line from heels to crown of head.',
          'Tuck pelvis under, squeeze glutes, and brace core as if bracing for a punch.',
          'Hold position for specified target duration without sagging hips.',
        ],
        status: 'active',
      },
      {
        name: 'Kettlebell Russian Swings',
        category: 'Cardio',
        muscleGroup: 'Full Body',
        equipment: 'Kettlebell',
        difficulty: 'Intermediate',
        defaultSets: 4,
        defaultReps: 15,
        defaultDuration: 0,
        defaultRestTime: 45,
        description: 'Explosive posterior chain conditioning exercise for athletic hip drive and metabolic burn.',
        instructions: [
          'Stand with feet shoulder-width, kettlebell one foot in front on floor.',
          'Hinge down to grip kettlebell handle, hike bell between legs like a football snap.',
          'Snap hips forward explosively, driving kettlebell to chest level via momentum.',
          'Guide bell back through legs and repeat in continuous rhythmic cadence.',
        ],
        status: 'active',
      },
      {
        name: 'Concept2 Rowing 500m Intervals',
        category: 'Cardio',
        muscleGroup: 'Full Body',
        equipment: 'Machine',
        difficulty: 'Intermediate',
        defaultSets: 4,
        defaultReps: 1,
        defaultDuration: 120, // 120s / 2 min target
        defaultRestTime: 90,
        description: 'High-intensity full-body aerobic conditioning building VO2 max and anaerobic threshold.',
        instructions: [
          'Strap feet securely into footplates and set damper resistance to 5-6.',
          'Drive hard through legs first, lean back 10 degrees, then pull handle to lower sternum.',
          'Recover arms first, pivot torso forward, then slide knees back to catch position.',
          'Maintain steady stroke rate of 28-32 strokes per minute.',
        ],
        status: 'active',
      },
      {
        name: 'Treadmill Incline Sprint HIIT',
        category: 'Cardio',
        muscleGroup: 'Legs',
        equipment: 'Machine',
        difficulty: 'Advanced',
        defaultSets: 6,
        defaultReps: 1,
        defaultDuration: 45, // 45s sprint
        defaultRestTime: 45,
        description: 'Metabolic sprint intervals on 8-10% grade incline for maximum caloric expenditure and power.',
        instructions: [
          'Set treadmill to 8% incline at 10-12 mph.',
          'Straddle belt during rest, then mount belt smoothly into full sprint for 45 seconds.',
          'Keep posture upright and pump arms vigorously.',
          'Safely step off onto side rails for 45 seconds rest.',
        ],
        status: 'active',
      },
    ];

    const exerciseMap = {};
    for (const ex of exercisesData) {
      let exercise = await Exercise.findOne({ name: ex.name });
      if (!exercise) {
        exercise = await Exercise.create(ex);
        console.log(`[Seed] Created exercise: ${ex.name} (${ex.category} / ${ex.muscleGroup})`);
      } else {
        exercise.category = ex.category;
        exercise.muscleGroup = ex.muscleGroup;
        exercise.equipment = ex.equipment;
        exercise.difficulty = ex.difficulty;
        exercise.defaultSets = ex.defaultSets;
        exercise.defaultReps = ex.defaultReps;
        exercise.defaultDuration = ex.defaultDuration;
        exercise.defaultRestTime = ex.defaultRestTime;
        exercise.description = ex.description;
        exercise.instructions = ex.instructions;
        exercise.status = ex.status;
        await exercise.save();
      }
      exerciseMap[ex.name] = exercise;
    }

    // 5. Seed Training Plans
    console.log('[Seed] Seeding Training Plans...');
    const plansToSeed = [
      {
        memberName: 'Rahul Patel',
        trainerName: 'Marcus Vance',
        planName: 'Hypertrophy Upper/Lower Foundation',
        goal: 'Hypertrophy',
        status: 'active',
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 2, 1),
        description: 'Comprehensive 8-week progressive overload split designed to maximize lean muscle mass and compound strength.',
        notes: 'Focus on progressive overload: increase barbell load by 2.5kg whenever top rep target is met with clean form. Maintain 300 surplus calories.',
        exercises: [
          {
            exerciseName: 'Barbell Back Squat',
            sets: 4,
            reps: 6,
            duration: 0,
            restTime: 120,
            targetWeight: 100,
            instructions: 'Hit parallel depth every rep. Keep core tightly braced.',
          },
          {
            exerciseName: 'Barbell Bench Press',
            sets: 4,
            reps: 8,
            duration: 0,
            restTime: 90,
            targetWeight: 80,
            instructions: 'Touch mid-chest, pause for 0.5s, then drive up explosively.',
          },
          {
            exerciseName: 'Barbell Bent-Over Row',
            sets: 4,
            reps: 8,
            duration: 0,
            restTime: 90,
            targetWeight: 70,
            instructions: 'Pull to belly button, squeeze lats and rhomboids at top.',
          },
          {
            exerciseName: 'Overhead Barbell Military Press',
            sets: 3,
            reps: 8,
            duration: 0,
            restTime: 90,
            targetWeight: 50,
            instructions: 'Full lockout overhead with active shoulders.',
          },
          {
            exerciseName: 'Standing Barbell Bicep Curl',
            sets: 3,
            reps: 10,
            duration: 0,
            restTime: 60,
            targetWeight: 30,
            instructions: 'Strict form, 3-second negative descent on each repetition.',
          },
          {
            exerciseName: 'Isometric Plank Hold',
            sets: 3,
            reps: 1,
            duration: 60,
            restTime: 45,
            targetWeight: 0,
            instructions: 'Squeeze glutes and brace core tightly throughout the minute.',
          },
        ],
      },
      {
        memberName: 'Sarah Jenkins',
        trainerName: 'Elena Rostova',
        planName: 'Metabolic Conditioning & Functional Power',
        goal: 'Fat Loss',
        status: 'active',
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 15),
        endDate: new Date(now.getFullYear(), now.getMonth() + 2, 15),
        description: 'High-density functional athletic conditioning program targeting cardiovascular endurance, agility, and stamina.',
        notes: 'Rest strictly within programmed rest windows. Hydrate well before intervals.',
        exercises: [
          {
            exerciseName: 'Kettlebell Russian Swings',
            sets: 4,
            reps: 15,
            duration: 0,
            restTime: 45,
            targetWeight: 20,
            instructions: 'Explosive hip drive, maintain neutral spine throughout.',
          },
          {
            exerciseName: 'Concept2 Rowing 500m Intervals',
            sets: 4,
            reps: 1,
            duration: 115,
            restTime: 90,
            targetWeight: 0,
            instructions: 'Target sub-1:55/500m split pace on all 4 rounds.',
          },
          {
            exerciseName: 'Bodyweight Pull-Ups',
            sets: 3,
            reps: 8,
            duration: 0,
            restTime: 75,
            targetWeight: 0,
            instructions: 'Full chin over bar, controlled 2-second descent.',
          },
          {
            exerciseName: 'Treadmill Incline Sprint HIIT',
            sets: 5,
            reps: 1,
            duration: 45,
            restTime: 45,
            targetWeight: 0,
            instructions: '8% incline at 11.5 mph. Give 95% maximum effort.',
          },
          {
            exerciseName: 'Hanging Leg Raises',
            sets: 3,
            reps: 12,
            duration: 0,
            restTime: 60,
            targetWeight: 0,
            instructions: 'No swinging momentum. Control legs down.',
          },
        ],
      },
      {
        memberName: 'Priya Sharma',
        trainerName: 'Marcus Vance',
        planName: 'Total Body Hypertrophy & Sculpt',
        goal: 'Strength',
        status: 'active',
        startDate: new Date(now.getFullYear(), now.getMonth() - 2, 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        description: 'Targeted full-body hypertrophy routine focusing on posterior chain, shoulders, and back definition.',
        notes: 'Great progress on Romanian Deadlifts! Focus on slowing down the eccentric phase on Bulgarian Split Squats.',
        exercises: [
          {
            exerciseName: 'Romanian Deadlift (RDL)',
            sets: 4,
            reps: 10,
            duration: 0,
            restTime: 90,
            targetWeight: 60,
            instructions: 'Hinge deeply at hips, keep bar skimming along shins.',
          },
          {
            exerciseName: 'Bulgarian Split Squat',
            sets: 3,
            reps: 10,
            duration: 0,
            restTime: 60,
            targetWeight: 16,
            instructions: '16kg DB in each hand. Keep front knee tracked forward.',
          },
          {
            exerciseName: 'Wide-Grip Lat Pulldown',
            sets: 3,
            reps: 12,
            duration: 0,
            restTime: 60,
            targetWeight: 45,
            instructions: 'Drive elbows into back pockets, pause at collarbone.',
          },
          {
            exerciseName: 'Dumbbell Lateral Raise',
            sets: 4,
            reps: 12,
            duration: 0,
            restTime: 60,
            targetWeight: 8,
            instructions: 'Slow controlled reps, lead with elbows.',
          },
          {
            exerciseName: 'Cable Face Pulls',
            sets: 4,
            reps: 15,
            duration: 0,
            restTime: 60,
            targetWeight: 25,
            instructions: 'External rotation at peak, hold for 1 full second.',
          },
        ],
      },
    ];

    for (const seedPlan of plansToSeed) {
      const member = memberMap[seedPlan.memberName];
      const trainer = trainerMap[seedPlan.trainerName];

      if (!member || !trainer) {
        console.warn(`[Seed] Skipping plan ${seedPlan.planName}: missing member or trainer`);
        continue;
      }

      const formattedExercises = seedPlan.exercises
        .map((exItem, idx) => {
          const exDoc = exerciseMap[exItem.exerciseName];
          if (!exDoc) return null;
          return {
            exercise: exDoc._id,
            sets: exItem.sets,
            reps: exItem.reps,
            duration: exItem.duration,
            restTime: exItem.restTime,
            targetWeight: exItem.targetWeight,
            instructions: exItem.instructions,
            order: idx + 1,
          };
        })
        .filter(Boolean);

      let existingPlan = await TrainingPlan.findOne({
        member: member._id,
        planName: seedPlan.planName,
      });

      if (!existingPlan) {
        existingPlan = await TrainingPlan.create({
          member: member._id,
          trainer: trainer._id,
          planName: seedPlan.planName,
          goal: seedPlan.goal,
          status: seedPlan.status,
          startDate: seedPlan.startDate,
          endDate: seedPlan.endDate,
          description: seedPlan.description,
          notes: seedPlan.notes,
          exercises: formattedExercises,
        });
        console.log(`[Seed] Created Training Plan: "${seedPlan.planName}" for ${seedPlan.memberName} (Coach: ${seedPlan.trainerName})`);
      } else {
        existingPlan.trainer = trainer._id;
        existingPlan.goal = seedPlan.goal;
        existingPlan.status = seedPlan.status;
        existingPlan.startDate = seedPlan.startDate;
        existingPlan.endDate = seedPlan.endDate;
        existingPlan.description = seedPlan.description;
        existingPlan.notes = seedPlan.notes;
        existingPlan.exercises = formattedExercises;
        await existingPlan.save();
      }
    }

    // 6. Seed Attendance Records
    console.log('[Seed] Seeding Attendance Records...');
    const normalizeDate = (d) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
    const todayDate = normalizeDate(new Date());

    const attendanceToSeed = [
      // Rahul Patel (Primary member)
      {
        memberName: 'Rahul Patel',
        daysAgo: 5,
        inHour: 18,
        inMin: 0,
        outHour: 19,
        outMin: 30,
        status: 'completed',
        notes: 'Lower body hypertrophy session.',
      },
      {
        memberName: 'Rahul Patel',
        daysAgo: 3,
        inHour: 8,
        inMin: 30,
        outHour: 9,
        outMin: 45,
        status: 'completed',
        notes: 'Upper body power session.',
      },
      {
        memberName: 'Rahul Patel',
        daysAgo: 1,
        inHour: 9,
        inMin: 0,
        outHour: 10,
        outMin: 30,
        status: 'completed',
        notes: 'Heavy bench press and core training.',
      },
      // Sarah Jenkins
      {
        memberName: 'Sarah Jenkins',
        daysAgo: 4,
        inHour: 7,
        inMin: 30,
        outHour: 9,
        outMin: 0,
        status: 'completed',
        notes: 'Endurance conditioning.',
      },
      {
        memberName: 'Sarah Jenkins',
        daysAgo: 2,
        inHour: 7,
        inMin: 0,
        outHour: 8,
        outMin: 15,
        status: 'completed',
        notes: 'Cardio intervals & core recovery.',
      },
      {
        memberName: 'Sarah Jenkins',
        daysAgo: 0,
        inHour: 8,
        inMin: 0,
        outHour: 9,
        outMin: 15,
        status: 'completed',
        notes: 'Early morning conditioning circuit.',
      },
      // Priya Sharma
      {
        memberName: 'Priya Sharma',
        daysAgo: 1,
        inHour: 17,
        inMin: 0,
        outHour: 18,
        outMin: 45,
        status: 'completed',
        notes: 'Strength progression check-in.',
      },
      {
        memberName: 'Priya Sharma',
        daysAgo: 0,
        inHour: 10,
        inMin: 15,
        outHour: null,
        outMin: null,
        status: 'active',
        notes: 'Floor warm-up in progress.',
      },
      // David Miller
      {
        memberName: 'David Miller',
        daysAgo: 2,
        inHour: 14,
        inMin: 0,
        outHour: 15,
        outMin: 30,
        status: 'completed',
        notes: 'Independent squat session.',
      },
    ];

    for (const item of attendanceToSeed) {
      const member = memberMap[item.memberName];
      if (!member) continue;

      const recordDate = new Date(todayDate);
      recordDate.setUTCDate(recordDate.getUTCDate() - item.daysAgo);

      const checkIn = new Date(recordDate);
      checkIn.setUTCHours(item.inHour, item.inMin, 0, 0);

      let checkOut = null;
      if (item.outHour !== null) {
        checkOut = new Date(recordDate);
        checkOut.setUTCHours(item.outHour, item.outMin, 0, 0);
      }

      let existingAttendance = await Attendance.findOne({
        member: member._id,
        date: recordDate,
      });

      if (!existingAttendance) {
        await Attendance.create({
          member: member._id,
          date: recordDate,
          checkInTime: checkIn,
          checkOutTime: checkOut,
          status: item.status,
          markedBy: adminUser._id,
          notes: item.notes,
        });
        console.log(`[Seed] Created Attendance: ${item.memberName} on ${recordDate.toISOString().slice(0, 10)} (${item.status})`);
      } else {
        existingAttendance.checkInTime = checkIn;
        existingAttendance.checkOutTime = checkOut;
        existingAttendance.status = item.status;
        existingAttendance.notes = item.notes;
        await existingAttendance.save();
      }
    }

    // 6. Seed Payments & Membership Billing Records
    console.log('[Seed] Seeding Payments & Billing Records...');
    const paymentsData = [
      {
        receiptNumber: 'REC-SEED-RZP-001',
        memberName: 'Member Athlete', // member@ironforge.test
        planName: 'Standard Plan',
        amount: 59,
        currency: 'INR',
        paymentMethod: 'razorpay',
        status: 'paid',
        purpose: 'renewal',
        razorpayOrderId: 'order_seed_rzp_001',
        razorpayPaymentId: 'pay_seed_rzp_001',
        paymentDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 15),
        paidAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 15),
        notes: 'Verified online Razorpay renewal payment.',
      },
      {
        receiptNumber: 'REC-SEED-RZP-002',
        memberName: 'Member Athlete', // member@ironforge.test
        planName: 'Standard Plan',
        amount: 59,
        currency: 'INR',
        paymentMethod: 'razorpay',
        status: 'paid',
        purpose: 'membership',
        razorpayOrderId: 'order_seed_rzp_002',
        razorpayPaymentId: 'pay_seed_rzp_002',
        paymentDate: new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()),
        paidAt: new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()),
        notes: 'Initial standard membership subscription purchase.',
      },
      {
        receiptNumber: 'REC-SEED-CASH-001',
        memberName: 'David Miller',
        planName: 'Premium Elite',
        amount: 99,
        currency: 'INR',
        paymentMethod: 'cash',
        status: 'paid',
        purpose: 'membership',
        paymentDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10),
        paidAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10),
        notes: 'Paid cash in full at front desk to administrator.',
      },
      {
        receiptNumber: 'REC-SEED-UPI-001',
        memberName: 'Sarah Connor',
        planName: 'Basic Plan',
        amount: 29,
        currency: 'INR',
        paymentMethod: 'upi',
        status: 'paid',
        purpose: 'renewal',
        paymentDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5),
        paidAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5),
        notes: 'Direct gym UPI QR payment settled at counter.',
      },
      {
        receiptNumber: 'REC-SEED-CARD-001',
        memberName: 'Michael Scott',
        planName: 'Standard Plan',
        amount: 59,
        currency: 'INR',
        paymentMethod: 'card',
        status: 'paid',
        purpose: 'membership',
        paymentDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 22),
        paidAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 22),
        notes: 'Terminal POS swipe transaction.',
      },
      {
        receiptNumber: 'REC-SEED-PEND-001',
        memberName: 'Alex Wong',
        planName: 'Basic Plan',
        amount: 29,
        currency: 'INR',
        paymentMethod: 'razorpay',
        status: 'pending',
        purpose: 'renewal',
        razorpayOrderId: 'order_seed_rzp_pending_001',
        paymentDate: new Date(),
        notes: 'Pending checkout order session awaiting gateway completion.',
      },
    ];

    for (const item of paymentsData) {
      const member = memberMap[item.memberName];
      const plan = item.planName ? planMap[item.planName] : null;

      if (!member) continue;

      let payment = await Payment.findOne({ receiptNumber: item.receiptNumber });
      if (!payment) {
        await Payment.create({
          member: member._id,
          membershipPlan: plan ? plan._id : null,
          amount: item.amount,
          currency: item.currency || 'INR',
          paymentMethod: item.paymentMethod,
          status: item.status,
          purpose: item.purpose,
          razorpayOrderId: item.razorpayOrderId || null,
          razorpayPaymentId: item.razorpayPaymentId || null,
          receiptNumber: item.receiptNumber,
          paymentDate: item.paymentDate,
          paidAt: item.paidAt || null,
          notes: item.notes,
          recordedBy: adminUser._id,
        });
        console.log(`[Seed] Created Payment: ${item.receiptNumber} - ₹${item.amount} (${item.paymentMethod} / ${item.status}) for ${item.memberName}`);
      } else {
        payment.amount = item.amount;
        payment.status = item.status;
        payment.paymentMethod = item.paymentMethod;
        payment.notes = item.notes;
        await payment.save();
      }
    }

    // 8. Seed Member Progress Records
    console.log('[Seed] Seeding Member Progress Records...');
    const rahulMember = memberMap['Rahul Patel'];
    const sarahMember = memberMap['Sarah Jenkins'];
    const marcusTrainer = await Trainer.findOne({ 'specialization': { $exists: true } });

    if (rahulMember) {
      await MemberProgress.deleteMany({ member: rahulMember._id });
      const now = new Date();
      const progressEntries = [
        {
          member: rahulMember._id,
          recordedAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
          weight: 85.0,
          bodyFatPercentage: 22.0,
          chest: 104,
          waist: 92,
          hips: 102,
          arms: 35,
          thighs: 60,
          notes: 'Initial intake baseline assessment.',
          recordedBy: adminUser._id,
        },
        {
          member: rahulMember._id,
          recordedAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
          weight: 83.2,
          bodyFatPercentage: 20.5,
          chest: 105,
          waist: 89,
          hips: 100,
          arms: 36,
          thighs: 59,
          notes: 'Solid progress on nutrition plan and hypertrophy split.',
          recordedBy: marcusTrainer ? marcusTrainer.user : adminUser._id,
        },
        {
          member: rahulMember._id,
          recordedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          weight: 81.5,
          bodyFatPercentage: 19.0,
          chest: 106,
          waist: 86,
          hips: 99,
          arms: 37,
          thighs: 58.5,
          notes: 'Notable body recomposition, core narrowing and arm circumference growth.',
          recordedBy: marcusTrainer ? marcusTrainer.user : adminUser._id,
        },
        {
          member: rahulMember._id,
          recordedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          weight: 80.0,
          bodyFatPercentage: 17.5,
          chest: 107,
          waist: 84,
          hips: 98,
          arms: 38,
          thighs: 58,
          notes: 'Goal milestone achieved! 5kg total fat loss with significant strength gain.',
          recordedBy: marcusTrainer ? marcusTrainer.user : adminUser._id,
        },
      ];

      for (const entry of progressEntries) {
        await MemberProgress.create(entry);
      }
      console.log(`[Seed] Created ${progressEntries.length} fitness progress records for Rahul Patel`);
    }

    if (sarahMember) {
      await MemberProgress.deleteMany({ member: sarahMember._id });
      const now = new Date();
      await MemberProgress.create({
        member: sarahMember._id,
        recordedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        weight: 62.5,
        bodyFatPercentage: 21.0,
        chest: 90,
        waist: 70,
        hips: 94,
        arms: 28,
        thighs: 52,
        notes: 'Initial strength conditioning baseline.',
        recordedBy: adminUser._id,
      });
      console.log(`[Seed] Created baseline progress record for Sarah Jenkins`);
    }

    // 9. Seed Notifications
    console.log('[Seed] Seeding Notifications...');
    const demoMemberUser = await User.findOne({ email: 'member@ironforge.test' });
    const demoTrainerUser = await User.findOne({ email: 'trainer@ironforge.test' });

    if (demoMemberUser) {
      await Notification.deleteMany({ recipient: demoMemberUser._id });
      const now = Date.now();
      const memberNotifications = [
        {
          recipient: demoMemberUser._id,
          type: 'payment_success',
          title: 'Payment Received',
          message: 'Payment of $99 for Premium Elite was successful. Membership is active!',
          isRead: false,
          createdAt: new Date(now - 3600 * 1000 * 2), // 2 hrs ago
          idempotencyKey: `seed_notif_mem_1`,
        },
        {
          recipient: demoMemberUser._id,
          type: 'training_assigned',
          title: 'New Training Plan Assigned',
          message: 'A new workout program "Iron Hypertrophy Split" has been assigned to your profile.',
          isRead: false,
          createdAt: new Date(now - 3600 * 1000 * 24), // 1 day ago
          idempotencyKey: `seed_notif_mem_2`,
        },
        {
          recipient: demoMemberUser._id,
          type: 'progress_updated',
          title: 'New Fitness Metrics Logged',
          message: 'Coach Marcus Vance logged updated fitness measurements for your profile.',
          isRead: true,
          readAt: new Date(now - 3600 * 1000 * 12),
          createdAt: new Date(now - 3600 * 1000 * 48), // 2 days ago
          idempotencyKey: `seed_notif_mem_3`,
        },
        {
          recipient: demoMemberUser._id,
          type: 'exercise_assigned',
          title: 'New Exercise Assigned',
          message: 'Coach Marcus Vance assigned "Barbell Bench Press" to your routine.',
          isRead: true,
          readAt: new Date(now - 3600 * 1000 * 36),
          createdAt: new Date(now - 3600 * 1000 * 72), // 3 days ago
          idempotencyKey: `seed_notif_mem_4`,
        },
      ];

      for (const n of memberNotifications) {
        await Notification.create(n);
      }
      console.log(`[Seed] Created ${memberNotifications.length} notifications for demo member.`);
    }

    if (demoTrainerUser) {
      await Notification.deleteMany({ recipient: demoTrainerUser._id });
      await Notification.create({
        recipient: demoTrainerUser._id,
        type: 'exercise_assigned',
        title: 'New Exercise Assigned to Teaching Profile',
        message: 'Exercise "Barbell Bench Press" has been added to your coaching catalog.',
        isRead: false,
        createdAt: new Date(),
        idempotencyKey: `seed_notif_trn_1`,
      });
      console.log('[Seed] Created notification for demo trainer.');
    }

    if (adminUser) {
      await Notification.deleteMany({ recipient: adminUser._id });
      await Notification.create({
        recipient: adminUser._id,
        type: 'system',
        title: 'System Initialized',
        message: 'IronForge Gym Management System is operating with Phase 9 & 10 capabilities.',
        isRead: true,
        readAt: new Date(),
        createdAt: new Date(),
        idempotencyKey: `seed_notif_adm_1`,
      });
      console.log('[Seed] Created notification for admin.');
    }

    console.log('====================================================');
    console.log('🎉 Phase 9 Progress & Phase 10 Notifications Seeded:');
    console.log('----------------------------------------------------');
    console.log('📦 Membership Plans: 3 plans (Basic, Standard, Premium Elite)');
    console.log('🏋️ Trainers:         3 trainers (Marcus Vance, Elena Rostova, Darius Thorne)');
    console.log('🏃 Members:          6 members with active/inactive/expired statuses');
    console.log('📚 Exercise Catalog: 20 comprehensive exercises across all muscle groups');
    console.log('📋 Training Plans:   3 active workout routines assigned to members');
    console.log('⏱️ Attendance Logs:   9 verified historical & active check-in sessions');
    console.log('💳 Payment Ledgers:  6 verified transactions (Razorpay, Cash, UPI, Card, Pending)');
    console.log('📈 Fitness Progress: 5 chronological body composition logs');
    console.log('🔔 Notifications:    6 multi-type user notifications');
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
