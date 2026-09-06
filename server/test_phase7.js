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
  console.log('⏱️ RUNNING PHASE 7: ATTENDANCE & CHECK-IN MANAGEMENT TEST SUITE');
  console.log('==================================================\n');

  const timestamp = Date.now();

  // --- SECTION 1: UNAUTHENTICATED GATING ---
  console.log('\n--- SECTION 1: Unauthenticated Gating (401 Checks) ---');
  const unauthCheckIn = await request({ hostname: '127.0.0.1', port: 5000, path: '/api/attendance/check-in', method: 'POST' });
  assert(unauthCheckIn.status === 401, '1. Unauthenticated check-in blocked with 401');

  const unauthCheckOut = await request({ hostname: '127.0.0.1', port: 5000, path: '/api/attendance/check-out', method: 'PATCH' });
  assert(unauthCheckOut.status === 401, '2. Unauthenticated check-out blocked with 401');

  const unauthToday = await request({ hostname: '127.0.0.1', port: 5000, path: '/api/attendance/me/today', method: 'GET' });
  assert(unauthToday.status === 401, '3. Unauthenticated today status blocked with 401');

  const unauthMe = await request({ hostname: '127.0.0.1', port: 5000, path: '/api/attendance/me', method: 'GET' });
  assert(unauthMe.status === 401, '4. Unauthenticated personal history blocked with 401');

  const unauthTrainer = await request({ hostname: '127.0.0.1', port: 5000, path: '/api/attendance/trainer', method: 'GET' });
  assert(unauthTrainer.status === 401, '5. Unauthenticated trainer attendance blocked with 401');

  const unauthAdminAll = await request({ hostname: '127.0.0.1', port: 5000, path: '/api/attendance', method: 'GET' });
  assert(unauthAdminAll.status === 401, '6. Unauthenticated admin attendance list blocked with 401');

  const unauthAdminStats = await request({ hostname: '127.0.0.1', port: 5000, path: '/api/attendance/stats', method: 'GET' });
  assert(unauthAdminStats.status === 401, '7. Unauthenticated admin stats blocked with 401');

  // --- SECTION 2: AUTHENTICATE ALL ROLES ---
  console.log('\n--- SECTION 2: Authentication of Test Accounts ---');
  // Admin Login
  const adminLogin = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'admin@ironforge.test', password: 'Admin@123' }
  );
  assert(adminLogin.status === 200, '8. Admin login succeeded');
  const adminCookie = adminLogin.headers['set-cookie'];

  // Trainer Login (Marcus Vance)
  const trainerLogin = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'trainer@ironforge.test', password: 'Trainer@123' }
  );
  assert(trainerLogin.status === 200, '9. Trainer login succeeded');
  const trainerCookie = trainerLogin.headers['set-cookie'];

  // Member Login (Rahul Patel)
  const memberLogin = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'member@ironforge.test', password: 'Member@123' }
  );
  assert(memberLogin.status === 200, '10. Member login succeeded');
  const memberCookie = memberLogin.headers['set-cookie'];

  // Register fresh member for isolated check-in / check-out flow
  const freshEmail = `test.athlete.${timestamp}@ironforge.test`;
  const freshMemberReg = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { name: 'Test Athlete', email: freshEmail, password: 'Member@123' }
  );
  assert(freshMemberReg.status === 201, '11. Fresh member account registered');
  const freshMemberCookie = freshMemberReg.headers['set-cookie'];

  // --- SECTION 3: MEMBER SELF CHECK-IN & CHECK-OUT FLOW ---
  console.log('\n--- SECTION 3: Member Self-Service Check-In & Check-Out ---');
  // Check today status before check-in
  const freshTodayBefore = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/attendance/me/today', method: 'GET', headers: { Cookie: freshMemberCookie } }
  );
  assert(freshTodayBefore.status === 200, '12. Retrieved today status before check-in');
  assert(freshTodayBefore.data.data.isCheckedIn === false, '13. Fresh member is initially not checked in');

  // Perform Self Check-In
  const checkInRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/attendance/check-in', method: 'POST', headers: { Cookie: freshMemberCookie } }
  );
  assert(checkInRes.status === 201, '14. Member self check-in succeeded with HTTP 201');
  assert(checkInRes.data.data.attendance.status === 'active', '15. Attendance record created with status "active"');
  assert(checkInRes.data.data.attendance.checkInTime !== null, '16. Attendance record contains check-in timestamp');

  // Verify Duplicate Check-In Prevention (409 Conflict)
  const dupCheckIn = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/attendance/check-in', method: 'POST', headers: { Cookie: freshMemberCookie } }
  );
  assert(dupCheckIn.status === 409, '17. Same-day duplicate check-in rejected with HTTP 409 Conflict');
  assert(dupCheckIn.data.message.includes('already checked in today'), '18. Conflict message clearly informs user of existing check-in');

  // Check today status after check-in
  const freshTodayDuring = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/attendance/me/today', method: 'GET', headers: { Cookie: freshMemberCookie } }
  );
  assert(freshTodayDuring.status === 200, '19. Today status during workout is checked in');
  assert(freshTodayDuring.data.data.isCheckedIn === true, '20. isCheckedIn is true');
  assert(freshTodayDuring.data.data.isCompleted === false, '21. isCompleted is false while session active');

  // Perform Self Check-Out
  const checkOutRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/attendance/check-out', method: 'PATCH', headers: { Cookie: freshMemberCookie } }
  );
  assert(checkOutRes.status === 200, '22. Member self check-out succeeded with HTTP 200');
  assert(checkOutRes.data.data.attendance.status === 'completed', '23. Attendance status transitioned to "completed"');
  assert(checkOutRes.data.data.attendance.checkOutTime !== null, '24. Check-out timestamp recorded');

  // Repeated check-out on completed record
  const dupCheckOut = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/attendance/check-out', method: 'PATCH', headers: { Cookie: freshMemberCookie } }
  );
  assert(dupCheckOut.status === 400, '25. Repeated check-out on completed record rejected with HTTP 400');

  // Fetch Member Attendance History & Stats
  const historyRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/attendance/me', method: 'GET', headers: { Cookie: freshMemberCookie } }
  );
  assert(historyRes.status === 200, '26. Member attendance history retrieved');
  assert(historyRes.data.data.records.length >= 1, '27. Member history contains recorded check-in');
  assert(historyRes.data.data.stats.totalDays >= 1, '28. Member stats calculate total days');
  assert(historyRes.data.data.stats.completedSessions >= 1, '29. Member stats calculate completed sessions');

  // Member RBAC Restrictions
  const memberTryTrainer = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/attendance/trainer', method: 'GET', headers: { Cookie: memberCookie } }
  );
  assert(memberTryTrainer.status === 403, '30. Member denied access to /api/attendance/trainer with 403');

  const memberTryAdminAll = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/attendance', method: 'GET', headers: { Cookie: memberCookie } }
  );
  assert(memberTryAdminAll.status === 403, '31. Member denied access to admin /api/attendance list with 403');

  // --- SECTION 4: TRAINER ROSTER ATTENDANCE & RBAC ISOLATION ---
  console.log('\n--- SECTION 4: Trainer Roster Attendance & Cross-Coach Isolation ---');
  const trainerAttRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/attendance/trainer', method: 'GET', headers: { Cookie: trainerCookie } }
  );
  assert(trainerAttRes.status === 200, '32. Trainer successfully fetched assigned roster attendance');
  assert(trainerAttRes.data.data.records !== undefined, '33. Trainer response contains attendance records');
  assert(trainerAttRes.data.data.stats !== undefined, '34. Trainer response contains roster presence statistics');

  // Find an unassigned member (e.g. Sarah Jenkins or fresh member)
  const adminMembers = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/members', method: 'GET', headers: { Cookie: adminCookie } }
  );
  const unassignedMember = adminMembers.data.data.members.find(
    (m) => !m.assignedTrainer || m.assignedTrainer.user?.email !== 'trainer@ironforge.test'
  );

  if (unassignedMember) {
    const crossAccessTry = await request(
      { hostname: '127.0.0.1', port: 5000, path: `/api/attendance/trainer?memberId=${unassignedMember._id}`, method: 'GET', headers: { Cookie: trainerCookie } }
    );
    assert(crossAccessTry.status === 403, '35. Trainer denied access to attendance of unassigned athlete (403 Forbidden)');
  }

  const trainerTryAdminStats = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/attendance/stats', method: 'GET', headers: { Cookie: trainerCookie } }
  );
  assert(trainerTryAdminStats.status === 403, '36. Trainer denied access to gym-wide stats (403 Forbidden)');

  // --- SECTION 5: ADMIN ATTENDANCE MANAGEMENT & CRUD ---
  console.log('\n--- SECTION 5: Admin Attendance Management & CRUD Operations ---');
  const adminStatsRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/attendance/stats', method: 'GET', headers: { Cookie: adminCookie } }
  );
  assert(adminStatsRes.status === 200, '37. Admin retrieved gym-wide attendance statistics');
  assert(adminStatsRes.data.data.stats.totalRecords >= 1, '38. Total records metric is present');
  assert(adminStatsRes.data.data.stats.todayCheckIns >= 1, '39. Today check-ins metric is present');

  // Admin filter by status
  const adminFilterActive = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/attendance?status=active', method: 'GET', headers: { Cookie: adminCookie } }
  );
  assert(adminFilterActive.status === 200, '40. Admin filtered attendance by status=active');

  // Admin filter by search
  const adminSearchRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/attendance?search=Rahul', method: 'GET', headers: { Cookie: adminCookie } }
  );
  assert(adminSearchRes.status === 200, '41. Admin filtered attendance by search keyword');

  // Admin Manual Creation of past attendance record
  const primaryMember = adminMembers.data.data.members.find((m) => m.user?.email === 'member@ironforge.test');
  assert(primaryMember !== undefined, '42. Found primary member for admin test');

  // Choose a past date where no record exists (e.g. 20 days ago)
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 20);
  const pastDateStr = pastDate.toISOString().slice(0, 10);

  const adminCreateRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/attendance', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    {
      memberId: primaryMember._id,
      date: pastDateStr,
      checkInTime: new Date(pastDate.setHours(10, 0, 0, 0)),
      checkOutTime: new Date(pastDate.setHours(11, 30, 0, 0)),
      status: 'completed',
      notes: 'Admin manual backdated entry for testing',
    }
  );
  assert(adminCreateRes.status === 201, '43. Admin successfully created manual attendance record');
  const createdRecordId = adminCreateRes.data.data.attendance._id;

  // Admin duplicate creation on same date -> 409
  const adminDupCreate = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/attendance', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    {
      memberId: primaryMember._id,
      date: pastDateStr,
      checkInTime: new Date(),
      status: 'active',
    }
  );
  assert(adminDupCreate.status === 409, '44. Admin duplicate creation on same date rejected with 409 Conflict');

  // Admin update / correction of attendance record
  const adminUpdateRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/attendance/${createdRecordId}`, method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    { notes: 'Corrected notes: 90-minute hypertrophy workout' }
  );
  assert(adminUpdateRes.status === 200, '45. Admin updated/corrected attendance record');
  assert(adminUpdateRes.data.data.attendance.notes.includes('Corrected notes'), '46. Updated notes saved properly');

  // Admin Delete Attendance Record
  const adminDeleteRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/attendance/${createdRecordId}`, method: 'DELETE', headers: { Cookie: adminCookie } }
  );
  assert(adminDeleteRes.status === 200, '47. Admin deleted attendance record successfully');

  // Verify deletion (404)
  const getDeleted = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/attendance/${createdRecordId}`, method: 'GET', headers: { Cookie: adminCookie } }
  );
  assert(getDeleted.status === 404, '48. Deleted record lookup returns HTTP 404');

  // --- SECTION 6: DELETION REFERENCE PROTECTION ---
  console.log('\n--- SECTION 6: Member Deletion Reference Protection (409 Conflict) ---');
  // freshMember created a check-in today, so deleting this member must be rejected with 409 Conflict
  const freshMemberProfile = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/members/me/profile', method: 'GET', headers: { Cookie: freshMemberCookie } }
  );
  assert(freshMemberProfile.status === 200, '49. Retrieved fresh member profile');
  const freshMemberId = freshMemberProfile.data.data.member._id;

  const deleteMemberWithAttendance = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/members/${freshMemberId}`, method: 'DELETE', headers: { Cookie: adminCookie } }
  );
  assert(deleteMemberWithAttendance.status === 409, '50. Deletion of member with attendance history blocked with HTTP 409 Conflict');
  assert(deleteMemberWithAttendance.data.message.includes('attendance history'), '51. Conflict message explicitly references attendance history protection');

  console.log('\n==================================================');
  console.log(`🎉 ALL ${passedCount} PHASE 7 INTEGRATION TESTS PASSED SUCCESSFULLY!`);
  console.log('==================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test Suite Aborted due to error:', err);
  process.exit(1);
});
