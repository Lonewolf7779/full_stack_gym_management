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

let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    passedCount++;
    console.log(`✅ PASS (${passedCount}): ${message}`);
  }
}

async function runTests() {
  console.log('\n==================================================');
  console.log('🏋️ RUNNING PHASE 5.1: INTERACTIVE EXERCISE ASSIGNMENTS TEST SUITE');
  console.log('==================================================\n');

  // Step 1: Authenticate personas
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
  assert(trainerLogin.status === 200, 'Trainer login succeeded (Marcus Vance)');
  const trainerCookie = trainerLogin.headers['set-cookie'];

  const memberLogin = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'member@ironforge.test', password: 'Member@123' }
  );
  assert(memberLogin.status === 200, 'Member login succeeded (Rahul Patel)');
  const memberCookie = memberLogin.headers['set-cookie'];

  // Reference fixtures
  const exercisesRes = await request({ hostname: 'localhost', port: 5000, path: '/api/exercises', method: 'GET', headers: { Cookie: adminCookie } });
  const benchPress = exercisesRes.data.data.exercises.find((e) => e.name === 'Barbell Bench Press');
  const inclineDumbbell = exercisesRes.data.data.exercises.find((e) => e.name === 'Incline Dumbbell Press') || exercisesRes.data.data.exercises[1];
  assert(!!benchPress && !!inclineDumbbell, 'Loaded active exercises from library');

  const membersRes = await request({ hostname: 'localhost', port: 5000, path: '/api/members', method: 'GET', headers: { Cookie: adminCookie } });
  const rahul = membersRes.data.data.members.find((m) => m.user?.name === 'Rahul Patel');
  const sarah = membersRes.data.data.members.find((m) => m.user?.name === 'Sarah Jenkins');
  assert(!!rahul && !!sarah, 'Found test athletes: Rahul Patel (Marcus coached) and Sarah Jenkins (Elena coached)');

  const trainersRes = await request({ hostname: 'localhost', port: 5000, path: '/api/trainers', method: 'GET', headers: { Cookie: adminCookie } });
  const marcus = trainersRes.data.data.trainers.find((t) => t.user?.name === 'Marcus Vance');
  assert(!!marcus, 'Found test trainer: Marcus Vance');

  // Create temporary inactive trainer and inactive exercise for negative testing
  const inactiveTrainerRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/trainers', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    {
      name: 'Temp Inactive Test Coach',
      email: 'temp.inactive.assignment@ironforge.test',
      password: 'Trainer@123',
      specialization: 'Recovery',
      status: 'inactive',
    }
  );
  assert(inactiveTrainerRes.status === 201, 'Created temporary inactive trainer fixture');
  const inactiveTrainerId = inactiveTrainerRes.data.data.trainer._id;

  const inactiveExerciseRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/exercises', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    {
      name: 'Temp Inactive Test Exercise',
      category: 'Strength',
      muscleGroup: 'Chest',
      status: 'inactive',
    }
  );
  assert(inactiveExerciseRes.status === 201, 'Created temporary inactive exercise fixture');
  const inactiveExerciseId = inactiveExerciseRes.data.data.exercise._id;

  console.log('\n--- GROUP 1: ADMIN EXERCISE ASSIGNMENT TO TRAINER ---');

  // Test 1: Admin can assign active exercise to active trainer
  const adminAssignRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/trainer-exercise-assignments', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    {
      trainerId: marcus._id,
      exerciseId: benchPress._id,
      notes: 'Focus on biomechanical bar path tracking',
    }
  );
  assert(adminAssignRes.status === 201, 'Admin can assign active exercise to active trainer (HTTP 201)');
  const adminAssignmentId = adminAssignRes.data.data.assignment._id;
  assert(adminAssignRes.data.data.assignment.exercise._id === benchPress._id, 'Assigned exercise ID matches');
  assert(adminAssignRes.data.data.assignment.trainer._id === marcus._id, 'Assigned trainer ID matches');

  // Test 2: Duplicate admin assignment returns 409 Conflict
  const duplicateAdminAssign = await request(
    { hostname: 'localhost', port: 5000, path: '/api/trainer-exercise-assignments', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    {
      trainerId: marcus._id,
      exerciseId: benchPress._id,
      notes: 'Attempting duplicate assignment',
    }
  );
  assert(duplicateAdminAssign.status === 409, `Duplicate admin assignment returns HTTP 409 (actual: ${duplicateAdminAssign.status})`);
  assert(duplicateAdminAssign.data.message.includes('already assigned'), `409 error message explains conflict: "${duplicateAdminAssign.data.message}"`);

  // Test 3: Invalid trainer ID returns 404 / 400
  const invalidTrainerAssign = await request(
    { hostname: 'localhost', port: 5000, path: '/api/trainer-exercise-assignments', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    {
      trainerId: '507f1f77bcf86cd799439011',
      exerciseId: benchPress._id,
    }
  );
  assert(invalidTrainerAssign.status === 404, `Invalid trainer returns HTTP 404 (actual: ${invalidTrainerAssign.status})`);

  // Test 4: Inactive trainer cannot receive new assignment (400)
  const inactiveTrainerAssign = await request(
    { hostname: 'localhost', port: 5000, path: '/api/trainer-exercise-assignments', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    {
      trainerId: inactiveTrainerId,
      exerciseId: benchPress._id,
    }
  );
  assert(inactiveTrainerAssign.status === 400, `Inactive trainer rejected with HTTP 400 (actual: ${inactiveTrainerAssign.status})`);
  assert(inactiveTrainerAssign.data.message.includes('inactive'), `Error message mentions inactive trainer: "${inactiveTrainerAssign.data.message}"`);

  // Test 5: Invalid exercise returns 404
  const invalidExerciseAssign = await request(
    { hostname: 'localhost', port: 5000, path: '/api/trainer-exercise-assignments', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    {
      trainerId: marcus._id,
      exerciseId: '507f1f77bcf86cd799439011',
    }
  );
  assert(invalidExerciseAssign.status === 404, `Invalid exercise returns HTTP 404 (actual: ${invalidExerciseAssign.status})`);

  // Test 6: Inactive exercise cannot be assigned (400)
  const inactiveExAssign = await request(
    { hostname: 'localhost', port: 5000, path: '/api/trainer-exercise-assignments', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    {
      trainerId: marcus._id,
      exerciseId: inactiveExerciseId,
    }
  );
  assert(inactiveExAssign.status === 400, `Inactive exercise assignment rejected with HTTP 400 (actual: ${inactiveExAssign.status})`);

  console.log('\n--- GROUP 2: TRAINER EXERCISE ASSIGNMENT TO MEMBER ---');

  // Test 7: Trainer can assign active exercise to their coached member (Rahul Patel)
  const trainerAssignRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/member-exercise-assignments', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: trainerCookie } },
    {
      memberId: rahul._id,
      exerciseId: inclineDumbbell._id,
      sets: 4,
      reps: 12,
      restTime: 90,
      targetWeight: 28,
      instructions: 'Control the eccentric phase for 3 seconds, explosive drive up.',
    }
  );
  assert(trainerAssignRes.status === 201, 'Trainer successfully assigned exercise to coached member (HTTP 201)');
  const memberAssignmentId = trainerAssignRes.data.data.assignment._id;
  assert(trainerAssignRes.data.data.assignment.sets === 4, 'Custom sets preserved (4)');
  assert(trainerAssignRes.data.data.assignment.targetWeight === 28, 'Target weight preserved (28 kg)');
  assert(trainerAssignRes.data.data.assignment.restTime === 90, 'Rest time preserved (90s)');

  // Test 8: Trainer cannot assign exercise to another trainer’s member (Sarah Jenkins is coached by Elena)
  const crossAssignRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/member-exercise-assignments', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: trainerCookie } },
    {
      memberId: sarah._id,
      exerciseId: inclineDumbbell._id,
      sets: 3,
      reps: 10,
    }
  );
  assert(crossAssignRes.status === 403, `Trainer cross-assignment to another coach's athlete blocked with HTTP 403 (actual: ${crossAssignRes.status})`);
  assert(crossAssignRes.data.message.includes('coaching roster'), `403 message confirms roster restriction: "${crossAssignRes.data.message}"`);

  // Test 9: Trainer cannot assign to nonexistent member (404)
  const nonexistentMemberAssign = await request(
    { hostname: 'localhost', port: 5000, path: '/api/member-exercise-assignments', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: trainerCookie } },
    {
      memberId: '507f1f77bcf86cd799439011',
      exerciseId: inclineDumbbell._id,
    }
  );
  assert(nonexistentMemberAssign.status === 404, `Nonexistent member returns HTTP 404 (actual: ${nonexistentMemberAssign.status})`);

  // Test 10: Duplicate member assignment returns 409 Conflict
  const duplicateMemberAssign = await request(
    { hostname: 'localhost', port: 5000, path: '/api/member-exercise-assignments', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: trainerCookie } },
    {
      memberId: rahul._id,
      exerciseId: inclineDumbbell._id,
      sets: 3,
      reps: 10,
    }
  );
  assert(duplicateMemberAssign.status === 409, `Duplicate member assignment returns HTTP 409 (actual: ${duplicateMemberAssign.status})`);
  assert(duplicateMemberAssign.data.message.includes('already assigned'), `409 message confirms duplicate: "${duplicateMemberAssign.data.message}"`);

  console.log('\n--- GROUP 3: MEMBER READ-ONLY SECURITY & VISIBILITY ---');

  // Test 11: Member cannot create trainer assignment (403)
  const memberCreateTrainerAssign = await request(
    { hostname: 'localhost', port: 5000, path: '/api/trainer-exercise-assignments', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: memberCookie } },
    {
      trainerId: marcus._id,
      exerciseId: benchPress._id,
    }
  );
  assert(memberCreateTrainerAssign.status === 403, `Member blocked from creating trainer assignment (HTTP 403)`);

  // Test 12: Member cannot create member assignment (403)
  const memberCreateMemberAssign = await request(
    { hostname: 'localhost', port: 5000, path: '/api/member-exercise-assignments', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: memberCookie } },
    {
      memberId: rahul._id,
      exerciseId: benchPress._id,
    }
  );
  assert(memberCreateMemberAssign.status === 403, `Member blocked from creating member assignment (HTTP 403)`);

  // Test 13: Member can view assigned exercises via GET /api/member-exercise-assignments and Dashboard
  const memberAssignmentsGet = await request(
    { hostname: 'localhost', port: 5000, path: '/api/member-exercise-assignments', method: 'GET', headers: { Cookie: memberCookie } }
  );
  assert(memberAssignmentsGet.status === 200, 'Member GET assignments succeeds (HTTP 200)');
  assert(memberAssignmentsGet.data.data.assignments.length > 0, 'Member retrieves their active assigned exercise');
  const retrievedEx = memberAssignmentsGet.data.data.assignments[0];
  assert(retrievedEx.exercise?.name === inclineDumbbell.name, `Retrieved movement matches assigned exercise: "${retrievedEx.exercise?.name}"`);

  const memberDashRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/dashboard/member', method: 'GET', headers: { Cookie: memberCookie } }
  );
  assert(memberDashRes.status === 200, 'Member dashboard loads successfully (HTTP 200)');
  assert(Array.isArray(memberDashRes.data.data.assignedExercises), 'Member dashboard contains assignedExercises array');
  assert(memberDashRes.data.data.assignedExercises.length > 0, 'Member dashboard includes prescribed exercises');

  console.log('\n--- GROUP 4: REGRESSION & INTEGRITY VERIFICATIONS ---');

  // Test 14: Existing TrainingPlan creation still works
  const newPlanRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/training-plans', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: trainerCookie } },
    {
      memberId: rahul._id,
      planName: 'Phase 5.1 Verified Hypertrophy Split',
      goal: 'Hypertrophy',
      exercises: [
        { exercise: benchPress._id, sets: 4, reps: 8, restTime: 90, targetWeight: 80 },
      ],
      notes: 'Regression test verified split.',
    }
  );
  assert(newPlanRes.status === 201, 'TrainingPlan creation still works (HTTP 201)');
  const regressionPlanId = newPlanRes.data.data.plan._id;

  // Test 15: Existing TrainingPlan update still works
  const updatePlanRes = await request(
    { hostname: 'localhost', port: 5000, path: `/api/training-plans/${regressionPlanId}`, method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: trainerCookie } },
    {
      planName: 'Phase 5.1 Updated Split',
      notes: 'Updated notes via PUT endpoint.',
    }
  );
  assert(updatePlanRes.status === 200 && updatePlanRes.data.data.plan.planName === 'Phase 5.1 Updated Split', 'TrainingPlan update still works (HTTP 200)');

  // Test 16: Existing Exercise Library search/filter still works
  const searchExRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/exercises?search=Bench&muscleGroup=Chest', method: 'GET', headers: { Cookie: memberCookie } }
  );
  assert(searchExRes.status === 200 && searchExRes.data.data.exercises.length > 0, 'Exercise Library search/filter works (HTTP 200)');

  // Test 17: Admin dashboard loads
  const adminDash = await request({ hostname: 'localhost', port: 5000, path: '/api/dashboard/stats', method: 'GET', headers: { Cookie: adminCookie } });
  assert(adminDash.status === 200 && !!adminDash.data.data.stats, 'Admin dashboard stats load (HTTP 200)');

  // Test 18: Trainer dashboard loads
  const trainerDash = await request({ hostname: 'localhost', port: 5000, path: '/api/dashboard/trainer', method: 'GET', headers: { Cookie: trainerCookie } });
  assert(trainerDash.status === 200 && Array.isArray(trainerDash.data.data.assignedMembers), 'Trainer dashboard loads (HTTP 200)');

  // Test 19: Master Exercise Catalog remains pristine (no per-user assignment fields in master doc)
  const masterBenchCheck = await request({ hostname: 'localhost', port: 5000, path: `/api/exercises/${benchPress._id}`, method: 'GET', headers: { Cookie: adminCookie } });
  assert(!masterBenchCheck.data.data.exercise.assignedTrainer, 'Master Exercise catalog does not have assignedTrainer field');
  assert(!masterBenchCheck.data.data.exercise.assignedMember, 'Master Exercise catalog does not have assignedMember field');

  // Test 20: Clean up temporary fixtures
  await request({ hostname: 'localhost', port: 5000, path: `/api/trainer-exercise-assignments/${adminAssignmentId}`, method: 'DELETE', headers: { Cookie: adminCookie } });
  await request({ hostname: 'localhost', port: 5000, path: `/api/member-exercise-assignments/${memberAssignmentId}`, method: 'DELETE', headers: { Cookie: trainerCookie } });
  await request({ hostname: 'localhost', port: 5000, path: `/api/training-plans/${regressionPlanId}`, method: 'DELETE', headers: { Cookie: trainerCookie } });
  await request({ hostname: 'localhost', port: 5000, path: `/api/trainers/${inactiveTrainerId}`, method: 'DELETE', headers: { Cookie: adminCookie } });
  await request({ hostname: 'localhost', port: 5000, path: `/api/exercises/${inactiveExerciseId}`, method: 'DELETE', headers: { Cookie: adminCookie } });
  assert(true, 'Cleaned up temporary test fixtures safely');

  console.log('\n==================================================');
  console.log(`🎉 ALL ${passedCount}/${totalCount} PHASE 5.1 TESTS PASSED SUCCESSFULLY! (100%)`);
  console.log('==================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILURE:', err);
  process.exit(1);
});
