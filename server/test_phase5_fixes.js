const http = require('http');

async function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

async function runTests() {
  console.log('\n==================================================');
  console.log('🧪 RUNNING PHASE 5 BACKEND DATA INTEGRITY & RBAC TEST SUITE');
  console.log('==================================================\n');

  // Step 1: Log in all 3 personas
  const adminLogin = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'admin@ironforge.test', password: 'Admin@123' }
  );
  assert(adminLogin.status === 200, 'Admin login succeeded');
  const adminCookie = adminLogin.headers['set-cookie'];

  const trainerLogin = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'trainer@ironforge.test', password: 'Trainer@123' }
  );
  assert(trainerLogin.status === 200, 'Trainer login succeeded');
  const trainerCookie = trainerLogin.headers['set-cookie'];

  const memberLogin = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'member@ironforge.test', password: 'Member@123' }
  );
  assert(memberLogin.status === 200, 'Member login succeeded');
  const memberCookie = memberLogin.headers['set-cookie'];

  // Fetch reference fixtures
  const exercisesRes = await request({ hostname: 'localhost', port: 5000, path: '/api/exercises', method: 'GET', headers: { Cookie: adminCookie } });
  const benchPress = exercisesRes.data.data.exercises.find((e) => e.name === 'Barbell Bench Press');
  assert(!!benchPress, 'Found seeded exercise: Barbell Bench Press');

  const membersRes = await request({ hostname: 'localhost', port: 5000, path: '/api/members', method: 'GET', headers: { Cookie: adminCookie } });
  const rahul = membersRes.data.data.members.find((m) => m.user?.name === 'Rahul Patel');
  const sarah = membersRes.data.data.members.find((m) => m.user?.name === 'Sarah Jenkins');
  assert(!!rahul && !!sarah, 'Found seeded members: Rahul Patel and Sarah Jenkins');

  const trainersRes = await request({ hostname: 'localhost', port: 5000, path: '/api/trainers', method: 'GET', headers: { Cookie: adminCookie } });
  const marcus = trainersRes.data.data.trainers.find((t) => t.user?.name === 'Marcus Vance');
  assert(!!marcus, 'Found seeded trainer: Marcus Vance');

  // Create temporary test member for non-destructive testing
  const tempMemberRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/members', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    {
      name: 'Temp Test Athlete',
      email: 'temp.athlete@ironforge.test',
      password: 'Member@123',
      assignedTrainer: marcus._id,
    }
  );
  assert(tempMemberRes.status === 201, 'Created temporary test athlete');
  const tempMemberId = tempMemberRes.data.data.member._id;

  console.log('\n--- TEST GROUP 1: restTime NORMALIZATION ---');

  // Test 1.1: Create training plan with restTime explicitly set to 0
  const planWithZeroRest = await request(
    { hostname: 'localhost', port: 5000, path: '/api/training-plans', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    {
      memberId: tempMemberId,
      planName: 'Test Zero Rest Split',
      goal: 'Fat Loss',
      exercises: [
        {
          exercise: benchPress._id,
          sets: 4,
          reps: 12,
          restTime: 0,
        },
      ],
    }
  );
  assert(planWithZeroRest.status === 201, 'Training plan with restTime=0 created (HTTP 201)');
  const storedZeroRest = planWithZeroRest.data.data.plan.exercises[0].restTime;
  assert(storedZeroRest === 0, `stored restTime is 0 (actual: ${storedZeroRest})`);
  assert(!isNaN(storedZeroRest), 'stored restTime is not NaN');
  assert(storedZeroRest !== 60, 'stored restTime did not get overwritten to 60');

  // Test 1.2: Create training plan with restTime omitted (undefined)
  const planWithOmittedRest = await request(
    { hostname: 'localhost', port: 5000, path: '/api/training-plans', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    {
      memberId: tempMemberId,
      planName: 'Test Omitted Rest Split',
      goal: 'Hypertrophy',
      exercises: [
        {
          exercise: benchPress._id,
          sets: 3,
          reps: 10,
          // restTime omitted
        },
      ],
    }
  );
  assert(planWithOmittedRest.status === 201, 'Training plan with omitted restTime created (HTTP 201)');
  const storedDefaultRest = planWithOmittedRest.data.data.plan.exercises[0].restTime;
  assert(storedDefaultRest === 60, `omitted restTime defaults to 60 (actual: ${storedDefaultRest})`);
  assert(!isNaN(storedDefaultRest), 'stored default restTime is not NaN');

  // Clean up Test 1 test plans
  await request({ hostname: 'localhost', port: 5000, path: `/api/training-plans/${planWithZeroRest.data.data.plan._id}`, method: 'DELETE', headers: { Cookie: adminCookie } });
  await request({ hostname: 'localhost', port: 5000, path: `/api/training-plans/${planWithOmittedRest.data.data.plan._id}`, method: 'DELETE', headers: { Cookie: adminCookie } });

  console.log('\n--- TEST GROUP 2: ADMIN trainerId VALIDATION ---');

  // Test 2.1: Admin creates plan with valid active trainer
  const planValidTrainer = await request(
    { hostname: 'localhost', port: 5000, path: '/api/training-plans', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    {
      memberId: tempMemberId,
      trainerId: marcus._id,
      planName: 'Admin Valid Trainer Split',
      goal: 'Strength',
      exercises: [{ exercise: benchPress._id, sets: 3, reps: 8 }],
    }
  );
  assert(planValidTrainer.status === 201, 'Admin plan creation with valid active trainer succeeded (HTTP 201)');
  await request({ hostname: 'localhost', port: 5000, path: `/api/training-plans/${planValidTrainer.data.data.plan._id}`, method: 'DELETE', headers: { Cookie: adminCookie } });

  // Test 2.2: Admin attempts to create plan with nonexistent trainer ObjectId
  const nonexistentTrainerId = '507f1f77bcf86cd799439011';
  const planNonexistentTrainer = await request(
    { hostname: 'localhost', port: 5000, path: '/api/training-plans', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    {
      memberId: tempMemberId,
      trainerId: nonexistentTrainerId,
      planName: 'Admin Nonexistent Trainer Split',
      exercises: [{ exercise: benchPress._id, sets: 3, reps: 8 }],
    }
  );
  assert(planNonexistentTrainer.status === 404, `Admin creation with nonexistent trainer fails with HTTP 404 (actual: ${planNonexistentTrainer.status})`);
  assert(planNonexistentTrainer.data.message === 'Selected trainer does not exist.', `Error message matches requirement: "${planNonexistentTrainer.data.message}"`);

  // Test 2.3: Admin attempts to create plan with inactive trainer
  const inactiveTrainerUser = await request(
    { hostname: 'localhost', port: 5000, path: '/api/trainers', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    {
      name: 'Temp Inactive Coach',
      email: 'temp.inactive@ironforge.test',
      password: 'Trainer@123',
      specialization: 'Recovery',
      status: 'inactive',
    }
  );
  const inactiveTrainerId = inactiveTrainerUser.data.data.trainer._id;

  const planInactiveTrainer = await request(
    { hostname: 'localhost', port: 5000, path: '/api/training-plans', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    {
      memberId: tempMemberId,
      trainerId: inactiveTrainerId,
      planName: 'Admin Inactive Trainer Split',
      exercises: [{ exercise: benchPress._id, sets: 3, reps: 8 }],
    }
  );
  assert(planInactiveTrainer.status === 400, `Admin creation with inactive trainer fails with HTTP 400 (actual: ${planInactiveTrainer.status})`);
  assert(planInactiveTrainer.data.message.includes('Selected trainer is inactive'), `Error message mentions inactive trainer: "${planInactiveTrainer.data.message}"`);

  // Clean up temp inactive trainer & temp member
  await request({ hostname: 'localhost', port: 5000, path: `/api/trainers/${inactiveTrainerId}`, method: 'DELETE', headers: { Cookie: adminCookie } });
  await request({ hostname: 'localhost', port: 5000, path: `/api/members/${tempMemberId}`, method: 'DELETE', headers: { Cookie: adminCookie } });

  console.log('\n--- TEST GROUP 3: PREVENT ORPHANED EXERCISE REFERENCES ---');

  // Test 3.1: Attempt to delete an exercise referenced in an active training plan (Barbell Bench Press)
  const deleteUsedExercise = await request(
    { hostname: 'localhost', port: 5000, path: `/api/exercises/${benchPress._id}`, method: 'DELETE', headers: { Cookie: adminCookie } }
  );
  assert(deleteUsedExercise.status === 409, `Deleting referenced exercise blocked with HTTP 409 (actual: ${deleteUsedExercise.status})`);
  assert(
    deleteUsedExercise.data.message.includes('currently used by one or more training plans'),
    `409 message explains conflict: "${deleteUsedExercise.data.message}"`
  );

  // Verify Barbell Bench Press still exists in database
  const checkBench = await request(
    { hostname: 'localhost', port: 5000, path: `/api/exercises/${benchPress._id}`, method: 'GET', headers: { Cookie: adminCookie } }
  );
  assert(checkBench.status === 200 && checkBench.data.data.exercise.name === 'Barbell Bench Press', 'Exercise remains intact in database');

  // Test 3.2: Create an unused exercise and delete it
  const tempExercise = await request(
    { hostname: 'localhost', port: 5000, path: '/api/exercises', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    {
      name: 'Unused Test Movement',
      category: 'Flexibility',
      muscleGroup: 'Full Body',
      equipment: 'None',
      difficulty: 'Beginner',
      defaultSets: 2,
      defaultReps: 10,
    }
  );
  assert(tempExercise.status === 201, 'Created unused test exercise');
  const tempExId = tempExercise.data.data.exercise._id;

  const deleteUnused = await request(
    { hostname: 'localhost', port: 5000, path: `/api/exercises/${tempExId}`, method: 'DELETE', headers: { Cookie: adminCookie } }
  );
  assert(deleteUnused.status === 200, 'Deleting unused exercise succeeded with HTTP 200');

  // Verify it no longer exists
  const checkDeleted = await request(
    { hostname: 'localhost', port: 5000, path: `/api/exercises/${tempExId}`, method: 'GET', headers: { Cookie: adminCookie } }
  );
  assert(checkDeleted.status === 404, 'Deleted exercise no longer found (HTTP 404)');

  console.log('\n--- REGRESSION CHECKS: RBAC & DASHBOARDS ---');

  // Check 1: Trainer cannot assign plan to Sarah Jenkins (assigned to Elena Rostova)
  const trainerUnauthorizedPlan = await request(
    { hostname: 'localhost', port: 5000, path: '/api/training-plans', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: trainerCookie } },
    {
      memberId: sarah._id,
      planName: 'Unauthorized Coach Split',
      exercises: [{ exercise: benchPress._id, sets: 3, reps: 10 }],
    }
  );
  assert(trainerUnauthorizedPlan.status === 403, 'Trainer cross-assignment to unassigned member blocked (HTTP 403)');

  // Check 2: Member cannot create training plan
  const memberCreatePlan = await request(
    { hostname: 'localhost', port: 5000, path: '/api/training-plans', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: memberCookie } },
    {
      memberId: rahul._id,
      planName: 'Member Unauthorized Create',
      exercises: [{ exercise: benchPress._id, sets: 3, reps: 10 }],
    }
  );
  assert(memberCreatePlan.status === 403, 'Member role blocked from creating training plan (HTTP 403)');

  // Check 3: Non-admin cannot create exercise
  const trainerCreateEx = await request(
    { hostname: 'localhost', port: 5000, path: '/api/exercises', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: trainerCookie } },
    {
      name: 'Trainer Unauthorized Exercise',
      category: 'Strength',
      muscleGroup: 'Chest',
    }
  );
  assert(trainerCreateEx.status === 403, 'Trainer role blocked from creating exercise in library (HTTP 403)');

  // Check 4: Member dashboard returns active plan
  const memberDash = await request({ hostname: 'localhost', port: 5000, path: '/api/dashboard/member', method: 'GET', headers: { Cookie: memberCookie } });
  assert(memberDash.status === 200 && !!memberDash.data.data.activeTrainingPlan, 'Member dashboard loads active workout routine successfully');

  console.log('\n==================================================');
  console.log('🎉 ALL TEST GROUPS & REGRESSIONS PASSED CLEANLY (100%)');
  console.log('==================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST SUITE RUNNER ERROR:', err);
  process.exit(1);
});
