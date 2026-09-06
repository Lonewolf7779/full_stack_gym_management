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
  console.log('🛡️ RUNNING PHASE 6: ACCOUNT & USER MANAGEMENT TEST SUITE');
  console.log('==================================================\n');

  const timestamp = Date.now();

  // --- SECTION 1: AUTHENTICATE ADMIN & VERIFY INITIAL STATE ---
  console.log('\n--- SECTION 1: Admin Authentication & Baseline ---');
  const adminLogin = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'admin@ironforge.test', password: 'Admin@123' }
  );
  assert(adminLogin.status === 200, '1. Admin login succeeded');
  const adminCookie = adminLogin.headers['set-cookie'];
  assert(adminLogin.data.data.user.role === 'admin', '2. Admin role verified');
  assert(adminLogin.data.data.user.status === 'active', '3. Admin status is active');

  // Load baseline plans
  const plansRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/membership-plans', method: 'GET', headers: { Cookie: adminCookie } }
  );
  assert(plansRes.status === 200 && plansRes.data.data.plans.length > 0, '4. Loaded membership plans fixture');
  const testPlan = plansRes.data.data.plans[0];

  // --- SECTION 2: INDEPENDENT TRAINER ACCOUNT CREATION & AUTHENTICATION ---
  console.log('\n--- SECTION 2: Independent Trainer Creation & Authentication ---');
  const trainerAEmail = `coach.alpha.${timestamp}@ironforge.test`;
  const trainerAPassword = 'AlphaTrainer@123';

  const createTrainerARes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/trainers', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    {
      name: 'Coach Alpha Vance',
      email: trainerAEmail,
      password: trainerAPassword,
      phone: '+1 (555) 101-2020',
      specialization: 'Olympic Weightlifting',
      experience: '4 Years',
      certifications: ['USAW-L2', 'CSCS'],
      bio: 'Olympic lifting specialist and strength coach.',
      status: 'active',
    }
  );
  assert(createTrainerARes.status === 201, '5. Admin successfully created Trainer Account A (201)');
  const trainerAProfile = createTrainerARes.data.data.trainer;
  assert(trainerAProfile.user.email === trainerAEmail, '6. Trainer A email matches created email');
  assert(trainerAProfile.user.role === 'trainer', '7. Trainer A role is trainer');
  assert(!createTrainerARes.data.data.password && !trainerAProfile.user.password, '8. Trainer creation response never leaks password or hash');

  // Trainer A Independent Login
  const trainerALogin = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: trainerAEmail, password: trainerAPassword }
  );
  assert(trainerALogin.status === 200, '9. Trainer A logged in successfully with own credentials');
  const trainerACookie = trainerALogin.headers['set-cookie'];
  assert(trainerALogin.data.data.user.email === trainerAEmail, '10. Trainer A login session returns correct email');
  assert(trainerALogin.data.data.user.role === 'trainer', '11. Trainer A login session has role: trainer');

  // Trainer A verifies own profile
  const trainerAOwnProfile = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/trainers/me/profile', method: 'GET', headers: { Cookie: trainerACookie } }
  );
  assert(trainerAOwnProfile.status === 200, '12. Trainer A retrieved own profile via /trainers/me/profile');
  assert(trainerAOwnProfile.data.data.trainer.specialization === 'Olympic Weightlifting', '13. Trainer A profile details match');

  // Admin creates Trainer Account B
  const trainerBEmail = `coach.beta.${timestamp}@ironforge.test`;
  const trainerBPassword = 'BetaTrainer@123';
  const createTrainerBRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/trainers', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    {
      name: 'Coach Beta Sterling',
      email: trainerBEmail,
      password: trainerBPassword,
      phone: '+1 (555) 202-3030',
      specialization: 'High-Intensity Conditioning',
      experience: '6 Years',
      status: 'active',
    }
  );
  assert(createTrainerBRes.status === 201, '14. Admin successfully created Trainer Account B');
  const trainerBProfile = createTrainerBRes.data.data.trainer;

  // Trainer B logs in independently
  const trainerBLogin = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: trainerBEmail, password: trainerBPassword }
  );
  assert(trainerBLogin.status === 200, '15. Trainer B logged in successfully with own distinct credentials');
  const trainerBCookie = trainerBLogin.headers['set-cookie'];
  assert(trainerBLogin.data.data.user.email === trainerBEmail, '16. Trainer B session is isolated from Trainer A');

  // --- SECTION 3: INDEPENDENT MEMBER ACCOUNT CREATION & AUTHENTICATION ---
  console.log('\n--- SECTION 3: Independent Member Creation & Authentication ---');
  const memberAEmail = `athlete.alpha.${timestamp}@ironforge.test`;
  const memberAPassword = 'AlphaAthlete@123';

  const createMemberARes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/members', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    {
      name: 'Athlete Alpha Thorne',
      email: memberAEmail,
      password: memberAPassword,
      phone: '+1 (555) 303-4040',
      gender: 'male',
      membershipPlan: testPlan._id,
      assignedTrainer: trainerAProfile._id,
      status: 'active',
    }
  );
  assert(createMemberARes.status === 201, '17. Admin successfully created Member Account A (201)');
  const memberAProfile = createMemberARes.data.data.member;
  assert(memberAProfile.user.email === memberAEmail, '18. Member A email matches created email');
  assert(memberAProfile.user.role === 'member', '19. Member A role is member');
  assert(memberAProfile.assignedTrainer?._id === trainerAProfile._id, '20. Member A assigned to Coach Alpha');
  assert(!createMemberARes.data.data.password && !memberAProfile.user.password, '21. Member creation response never leaks password');

  // Member A Independent Login
  const memberALogin = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: memberAEmail, password: memberAPassword }
  );
  assert(memberALogin.status === 200, '22. Member A logged in successfully with own credentials');
  const memberACookie = memberALogin.headers['set-cookie'];
  assert(memberALogin.data.data.user.email === memberAEmail, '23. Member A session email verified');
  assert(memberALogin.data.data.user.role === 'member', '24. Member A session role verified');

  // Member A verifies own profile
  const memberAOwnProfile = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/members/me/profile', method: 'GET', headers: { Cookie: memberACookie } }
  );
  assert(memberAOwnProfile.status === 200, '25. Member A retrieved own profile via /members/me/profile');
  assert(memberAOwnProfile.data.data.member.assignedTrainer?._id === trainerAProfile._id, '26. Member A sees assigned coach');

  // Admin creates Member Account B
  const memberBEmail = `athlete.beta.${timestamp}@ironforge.test`;
  const memberBPassword = 'BetaAthlete@123';
  const createMemberBRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/members', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    {
      name: 'Athlete Beta Cruz',
      email: memberBEmail,
      password: memberBPassword,
      membershipPlan: testPlan._id,
      assignedTrainer: trainerBProfile._id,
      status: 'active',
    }
  );
  assert(createMemberBRes.status === 201, '27. Admin successfully created Member Account B');
  const memberBProfile = createMemberBRes.data.data.member;

  // Member B logs in independently
  const memberBLogin = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: memberBEmail, password: memberBPassword }
  );
  assert(memberBLogin.status === 200, '28. Member B logged in successfully with distinct credentials');
  const memberBCookie = memberBLogin.headers['set-cookie'];
  assert(memberBLogin.data.data.user.email === memberBEmail, '29. Member B session is isolated from Member A');

  // --- SECTION 4: VALIDATION, CONSTRAINTS & ATOMIC ROLLBACK ---
  console.log('\n--- SECTION 4: Validation & Atomic Rollback ---');

  // Duplicate email registration rejected with 409
  const dupEmailTrainerRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/trainers', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    { name: 'Duplicate Email Coach', email: memberAEmail, password: 'Password@123' }
  );
  assert(dupEmailTrainerRes.status === 409, '30. Trainer creation with existing Member email rejected with 409');

  const dupEmailMemberRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/members', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    { name: 'Duplicate Email Member', email: trainerAEmail, password: 'Password@123' }
  );
  assert(dupEmailMemberRes.status === 409, '31. Member creation with existing Trainer email rejected with 409');

  // Short password rejected with 400
  const shortPassTrainerRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/trainers', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    { name: 'Short Pass Coach', email: `short.coach.${timestamp}@ironforge.test`, password: '123' }
  );
  assert(shortPassTrainerRes.status === 400, '32. Trainer creation with password < 6 chars rejected with 400');

  const shortPassMemberRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/members', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    { name: 'Short Pass Member', email: `short.member.${timestamp}@ironforge.test`, password: 'abc' }
  );
  assert(shortPassMemberRes.status === 400, '33. Member creation with password < 6 chars rejected with 400');

  // Inactive / Non-existent trainer assignment rejected with 400
  const inactiveTrainerRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/trainers', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    { name: 'Inactive Seed Coach', email: `inactive.coach.${timestamp}@ironforge.test`, password: 'Password@123', status: 'inactive' }
  );
  assert(inactiveTrainerRes.status === 201, '34. Created inactive trainer fixture');
  const inactiveTrainerId = inactiveTrainerRes.data.data.trainer._id;

  const assignInactiveTrainerRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/members', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    {
      name: 'Failed Assign Member',
      email: `fail.assign.${timestamp}@ironforge.test`,
      password: 'Password@123',
      assignedTrainer: inactiveTrainerId,
    }
  );
  assert(assignInactiveTrainerRes.status === 400, '35. Member creation with inactive assigned trainer rejected with 400');

  // Non-existent plan assignment rejected with 400
  const fakePlanMemberRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/members', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    {
      name: 'Fake Plan Member',
      email: `fake.plan.${timestamp}@ironforge.test`,
      password: 'Password@123',
      membershipPlan: '507f1f77bcf86cd799439011',
    }
  );
  assert(fakePlanMemberRes.status === 400, '36. Member creation with non-existent membershipPlan rejected with 400');

  // --- SECTION 5: ACCOUNT STATUS GATING (ACTIVE VS INACTIVE) ---
  console.log('\n--- SECTION 5: Account Status Gating (Active vs Inactive) ---');

  // Admin deactivates Trainer A
  const deactivateTrainerARes = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/users/${trainerAProfile.user._id}/status`, method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    { status: 'inactive' }
  );
  assert(deactivateTrainerARes.status === 200, '37. Admin deactivated Trainer A account (200)');
  assert(deactivateTrainerARes.data.data.user.status === 'inactive', '38. Deactivated User.status is inactive');

  // Trainer A attempts login -> MUST FAIL with 401 and inactive account message
  const inactiveTrainerALogin = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: trainerAEmail, password: trainerAPassword }
  );
  assert(inactiveTrainerALogin.status === 401, '39. Inactive Trainer A login rejected with HTTP 401');
  assert(
    inactiveTrainerALogin.data.message && inactiveTrainerALogin.data.message.includes('inactive'),
    '40. Inactive login message specifies account is inactive'
  );

  // Trainer A attempts to use previously issued cookie -> MUST FAIL with 401
  const inactiveTrainerAProfileReq = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/trainers/me/profile', method: 'GET', headers: { Cookie: trainerACookie } }
  );
  assert(inactiveTrainerAProfileReq.status === 401, '41. Inactive Trainer A protected API access blocked with 401');

  // Admin reactivates Trainer A
  const reactivateTrainerARes = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/users/${trainerAProfile.user._id}/status`, method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    { status: 'active' }
  );
  assert(reactivateTrainerARes.status === 200, '42. Admin reactivated Trainer A account (200)');

  // Trainer A logs in again -> SUCCEEDS
  const reactivatedTrainerALogin = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: trainerAEmail, password: trainerAPassword }
  );
  assert(reactivatedTrainerALogin.status === 200, '43. Reactivated Trainer A can log in again successfully (200)');

  // Admin deactivates Member A
  const deactivateMemberARes = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/users/${memberAProfile.user._id}/status`, method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    { status: 'inactive' }
  );
  assert(deactivateMemberARes.status === 200, '44. Admin deactivated Member A account (200)');

  // Member A attempts login -> MUST FAIL with 401
  const inactiveMemberALogin = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: memberAEmail, password: memberAPassword }
  );
  assert(inactiveMemberALogin.status === 401, '45. Inactive Member A login rejected with HTTP 401');

  // Admin reactivates Member A
  const reactivateMemberARes = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/users/${memberAProfile.user._id}/status`, method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    { status: 'active' }
  );
  assert(reactivateMemberARes.status === 200, '46. Admin reactivated Member A account (200)');

  // Admin cannot deactivate self
  const adminSelfDeactivateRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/users/${adminLogin.data.data.user.id}/status`, method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    { status: 'inactive' }
  );
  assert(adminSelfDeactivateRes.status === 400, '47. Admin prevented from deactivating own account (400)');

  // --- SECTION 6: ADMIN PASSWORD RESET ---
  console.log('\n--- SECTION 6: Admin Password Reset ---');
  const newMemberAPassword = 'NewAlphaAthlete@456';

  const resetMemberPassRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/users/${memberAProfile.user._id}/password`, method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    { password: newMemberAPassword }
  );
  assert(resetMemberPassRes.status === 200, '48. Admin reset password for Member A (200)');
  assert(!resetMemberPassRes.data.data?.password, '49. Password reset response does not leak hash');

  // Member A logs in with old password -> MUST FAIL with 401
  const oldPassMemberLogin = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: memberAEmail, password: memberAPassword }
  );
  assert(oldPassMemberLogin.status === 401, '50. Old password for Member A no longer works (401)');

  // Member A logs in with new password -> SUCCEEDS
  const newPassMemberLogin = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: memberAEmail, password: newMemberAPassword }
  );
  assert(newPassMemberLogin.status === 200, '51. Member A logged in with new password (200)');

  // --- SECTION 7: MEMBER-TO-TRAINER ROSTER MANAGEMENT ---
  console.log('\n--- SECTION 7: Member-to-Trainer Roster Management ---');

  // Trainer A sees Member A in roster
  const trainerARoster1 = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/members', method: 'GET', headers: { Cookie: trainerACookie } }
  );
  assert(trainerARoster1.status === 200, '52. Trainer A fetched assigned roster');
  assert(
    trainerARoster1.data.data.members.some((m) => m._id === memberAProfile._id),
    '53. Member A appears on Trainer A roster'
  );

  // Trainer B does NOT see Member A in roster
  const trainerBRoster1 = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/members', method: 'GET', headers: { Cookie: trainerBCookie } }
  );
  assert(
    !trainerBRoster1.data.data.members.some((m) => m._id === memberAProfile._id),
    '54. Member A does NOT appear on Trainer B roster (isolated coaching roster)'
  );

  // Admin reassigns Member A to Trainer B
  const reassignRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/members/${memberAProfile._id}`, method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    { assignedTrainer: trainerBProfile._id }
  );
  assert(reassignRes.status === 200, '55. Admin reassigned Member A to Trainer B');

  // Trainer B now sees Member A
  const trainerBRoster2 = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/members', method: 'GET', headers: { Cookie: trainerBCookie } }
  );
  assert(
    trainerBRoster2.data.data.members.some((m) => m._id === memberAProfile._id),
    '56. Member A now appears on Trainer B roster after reassignment'
  );

  // Trainer A no longer sees Member A
  const trainerARoster2 = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/members', method: 'GET', headers: { Cookie: trainerACookie } }
  );
  assert(
    !trainerARoster2.data.data.members.some((m) => m._id === memberAProfile._id),
    '57. Member A removed from Trainer A roster after reassignment'
  );

  // --- SECTION 8: STRICT RBAC & PRIVILEGE ESCALATION GUARDS ---
  console.log('\n--- SECTION 8: Strict RBAC & Privilege Escalation Guards ---');

  // Trainer cannot create trainer account
  const trainerCreateTrainerRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/trainers', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: trainerACookie } },
    { name: 'Unauthorized Coach', email: `unauth.${timestamp}@ironforge.test`, password: 'Password@123' }
  );
  assert(trainerCreateTrainerRes.status === 403, '58. Trainer blocked from creating Trainer account (403)');

  // Trainer cannot reset passwords
  const trainerResetPassRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/users/${memberAProfile.user._id}/password`, method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: trainerACookie } },
    { password: 'HackedPassword123' }
  );
  assert(trainerResetPassRes.status === 403, '59. Trainer blocked from resetting user passwords (403)');

  // Member cannot toggle status
  const memberToggleStatusRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/users/${trainerAProfile.user._id}/status`, method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: memberACookie } },
    { status: 'inactive' }
  );
  assert(memberToggleStatusRes.status === 403, '60. Member blocked from toggling user status (403)');

  // Public register with role: 'admin' is forced to 'member'
  const publicEscalateRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { name: 'Hacker User', email: `hacker.${timestamp}@ironforge.test`, password: 'HackerPassword123', role: 'admin' }
  );
  assert(publicEscalateRes.status === 201, '61. Public register succeeds');
  assert(publicEscalateRes.data.data.user.role === 'member', '62. Public registration role is forced to member (admin escalation denied)');

  // --- SECTION 8.1: ACCOUNT STATUS VS DOMAIN STATUS SEPARATION ---
  console.log('\n--- SECTION 8.1: Status Separation (User.status vs Domain Status) ---');

  // Verify Trainer A status initially: domain=active, user=active
  const tAGet1 = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/trainers/${trainerAProfile._id}`, method: 'GET', headers: { Cookie: adminCookie } }
  );
  assert(tAGet1.status === 200, '63. Fetched Trainer A details');
  assert(tAGet1.data.data.trainer.status === 'active', '64. Trainer A domain status is active');
  assert(tAGet1.data.data.trainer.user.status === 'active', '65. Trainer A user account status is active');

  // Deactivate Trainer A account status -> User.status becomes inactive, but Trainer.status remains active
  const deactTrainerAcc = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/users/${trainerAProfile.user._id}/status`, method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    { status: 'inactive' }
  );
  assert(deactTrainerAcc.status === 200, '66. Deactivated Trainer A User account');

  const tAGet2 = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/trainers/${trainerAProfile._id}`, method: 'GET', headers: { Cookie: adminCookie } }
  );
  assert(tAGet2.data.data.trainer.user.status === 'inactive', '67. Trainer A user account status updated to inactive');
  assert(tAGet2.data.data.trainer.status === 'active', '68. Trainer A domain status remained active (decoupled from User.status)');

  // Reactivate Trainer A account status
  await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/users/${trainerAProfile.user._id}/status`, method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    { status: 'active' }
  );

  // Update Trainer A domain status to inactive via PUT /api/trainers/:id -> Trainer.status becomes inactive, User.status remains active
  const deactTrainerDomain = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/trainers/${trainerAProfile._id}`, method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    { status: 'inactive' }
  );
  assert(deactTrainerDomain.status === 200, '69. Updated Trainer A domain status to inactive');

  const tAGet3 = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/trainers/${trainerAProfile._id}`, method: 'GET', headers: { Cookie: adminCookie } }
  );
  assert(tAGet3.data.data.trainer.status === 'inactive', '70. Trainer A domain status is now inactive');
  assert(tAGet3.data.data.trainer.user.status === 'active', '71. Trainer A User account status remained active (domain edit did not touch User.status)');

  // Trainer A can still log in because User.status is active
  const trainerALoginCheck = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: trainerAEmail, password: trainerAPassword }
  );
  assert(trainerALoginCheck.status === 200, '72. Trainer A can log in when domain status is inactive but account status is active');

  // Restore Trainer A domain status to active
  await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/trainers/${trainerAProfile._id}`, method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    { status: 'active' }
  );

  // Verify Member A separation: change Member A domain status to expired -> User.status remains active
  const setMemberExpired = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/members/${memberAProfile._id}`, method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    { status: 'expired' }
  );
  assert(setMemberExpired.status === 200, '73. Updated Member A domain status to expired');

  const mAGet1 = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/members/${memberAProfile._id}`, method: 'GET', headers: { Cookie: adminCookie } }
  );
  assert(mAGet1.data.data.member.status === 'expired', '74. Member A domain status is expired');
  assert(mAGet1.data.data.member.user.status === 'active', '75. Member A User account status remained active');

  // Member A can still log in (with new password)
  const memberALoginCheck = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: memberAEmail, password: newMemberAPassword }
  );
  assert(memberALoginCheck.status === 200, '76. Member A can log in when membership is expired but account is active');

  // Restore Member A domain status
  await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/members/${memberAProfile._id}`, method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    { status: 'active' }
  );

  // --- SECTION 8.2: DELETION REFERENCE INTEGRITY GUARDS (HTTP 409) ---
  console.log('\n--- SECTION 8.2: Deletion Reference Integrity Guards (HTTP 409) ---');

  // Trainer B is assigned to Member A. Attempt to delete Trainer B -> MUST return 409
  const deleteReferencedTrainerRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/trainers/${trainerBProfile._id}`, method: 'DELETE', headers: { Cookie: adminCookie } }
  );
  assert(deleteReferencedTrainerRes.status === 409, '77. Deleting Trainer with assigned members rejected with HTTP 409');
  assert(
    deleteReferencedTrainerRes.data.message && (deleteReferencedTrainerRes.data.message.includes('assignment') || deleteReferencedTrainerRes.data.message.includes('Deactivate') || deleteReferencedTrainerRes.data.message.includes('history')),
    '78. Conflict message explains active references exist and recommends deactivation'
  );

  // Assign exercise to Member A so Member A has references
  const exerciseFixtureRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/exercises', method: 'GET', headers: { Cookie: adminCookie } }
  );
  const exFixture = exerciseFixtureRes.data.data.exercises[0];

  if (exFixture) {
    await request(
      { hostname: '127.0.0.1', port: 5000, path: '/api/member-exercise-assignments', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: trainerBCookie } },
      { memberId: memberAProfile._id, exerciseId: exFixture._id, notes: 'Test assignment' }
    );
  }

  // Attempt to delete Member A with exercise assignment / history -> MUST return 409
  const deleteReferencedMemberRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/members/${memberAProfile._id}`, method: 'DELETE', headers: { Cookie: adminCookie } }
  );
  assert(deleteReferencedMemberRes.status === 409, '79. Deleting Member with exercise assignments/plans rejected with HTTP 409');
  assert(
    deleteReferencedMemberRes.data.message && (deleteReferencedMemberRes.data.message.includes('assigned') || deleteReferencedMemberRes.data.message.includes('history') || deleteReferencedMemberRes.data.message.includes('training')),
    '80. Member conflict message recommends deactivation instead of deletion'
  );

  // Create clean unreferenced Trainer C and unreferenced Member C, then successfully delete them (HTTP 200)
  const cleanTrainerRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/trainers', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    { name: 'Clean Coach Gamma', email: `clean.coach.${timestamp}@ironforge.test`, password: 'Password@123' }
  );
  assert(cleanTrainerRes.status === 201, '81. Created clean Trainer C fixture');
  const cleanTrainerId = cleanTrainerRes.data.data.trainer._id;

  const deleteCleanTrainerRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/trainers/${cleanTrainerId}`, method: 'DELETE', headers: { Cookie: adminCookie } }
  );
  assert(deleteCleanTrainerRes.status === 200, '82. Deleting unreferenced Trainer C succeeds with HTTP 200');

  const cleanMemberRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/members', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    { name: 'Clean Member Gamma', email: `clean.member.${timestamp}@ironforge.test`, password: 'Password@123' }
  );
  assert(cleanMemberRes.status === 201, '83. Created clean Member C fixture');
  const cleanMemberId = cleanMemberRes.data.data.member._id;

  const deleteCleanMemberRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/members/${cleanMemberId}`, method: 'DELETE', headers: { Cookie: adminCookie } }
  );
  assert(deleteCleanMemberRes.status === 200, '84. Deleting unreferenced Member C succeeds with HTTP 200');

  // --- SECTION 9: REGRESSION & CORE DASHBOARD HEALTH ---
  console.log('\n--- SECTION 9: Regression & System Health ---');
  const healthRes = await request({ hostname: '127.0.0.1', port: 5000, path: '/api/health', method: 'GET' });
  assert(healthRes.status === 200 && healthRes.data.data.status === 'online', '85. /api/health returns 200 OK (online)');

  const adminStatsRes = await request({ hostname: '127.0.0.1', port: 5000, path: '/api/dashboard/stats', method: 'GET', headers: { Cookie: adminCookie } });
  assert(adminStatsRes.status === 200 && (adminStatsRes.data.data.stats?.totalMembers >= 2 || adminStatsRes.data.data.totalMembers >= 2), '86. /api/dashboard/stats returns 200 with total members');

  console.log('\n==================================================');
  console.log(`🎉 ALL ${passedCount}/${totalCount} PHASE 6 TESTS PASSED SUCCESSFULLY!`);
  console.log('==================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
