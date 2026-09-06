require('dotenv').config();
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

function extractCookie(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return '';
  const match = setCookie[0].match(/token=([^;]+)/);
  return match ? `token=${match[1]}` : '';
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
  console.log('🏋️ RUNNING PHASE 9 & 10: PROGRESS & NOTIFICATIONS TEST SUITE');
  console.log('==================================================\n');

  const timestamp = Date.now();

  // ----------------------------------------------------
  // SECTION 1: AUTHENTICATION SETUP
  // ----------------------------------------------------
  console.log('\n--- SECTION 1: Authentication & Account Logins ---');

  const adminLogin = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'admin@ironforge.test', password: 'Admin@123' }
  );
  assert(adminLogin.status === 200, '1. Admin login succeeded (HTTP 200)');
  const adminCookie = extractCookie(adminLogin.headers);
  assert(!!adminCookie, '2. Admin auth token cookie extracted');

  const trainerMarcusLogin = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'trainer@ironforge.test', password: 'Trainer@123' }
  );
  assert(trainerMarcusLogin.status === 200, '3. Trainer Marcus login succeeded (HTTP 200)');
  const marcusCookie = extractCookie(trainerMarcusLogin.headers);

  const trainerElenaLogin = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'elena@ironforge.test', password: 'Trainer@123' }
  );
  assert(trainerElenaLogin.status === 200, '4. Trainer Elena login succeeded (HTTP 200)');
  const elenaCookie = extractCookie(trainerElenaLogin.headers);

  const memberRahulLogin = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'member@ironforge.test', password: 'Member@123' }
  );
  assert(memberRahulLogin.status === 200, '5. Member Rahul login succeeded (HTTP 200)');
  const rahulCookie = extractCookie(memberRahulLogin.headers);

  const memberSarahLogin = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'sarah@ironforge.test', password: 'Member@123' }
  );
  assert(memberSarahLogin.status === 200, '6. Member Sarah login succeeded (HTTP 200)');
  const sarahCookie = extractCookie(memberSarahLogin.headers);

  // Retrieve Rahul's Member Document ID from Admin API
  const membersRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/members',
    method: 'GET',
    headers: { Cookie: adminCookie },
  });
  const membersList = membersRes.data.data.members || [];
  const rahulMember = membersList.find((m) => m.user?.email === 'member@ironforge.test');
  const sarahMember = membersList.find((m) => m.user?.email === 'sarah@ironforge.test');
  assert(!!rahulMember, '7. Found Rahul Patel member record');
  assert(!!sarahMember, '8. Found Sarah Jenkins member record');

  // ----------------------------------------------------
  // SECTION 2: MEMBER SELF-SERVICE FITNESS PROGRESS
  // ----------------------------------------------------
  console.log('\n--- SECTION 2: Member Self-Service Fitness Progress ---');

  // 2.1 Get Rahul's seeded progress and stats
  const rahulProgress = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/progress/my-progress',
    method: 'GET',
    headers: { Cookie: rahulCookie },
  });
  assert(rahulProgress.status === 200, '9. Rahul retrieved my-progress (HTTP 200)');
  assert(Array.isArray(rahulProgress.data.data.records), '10. My progress returns records array');
  assert(rahulProgress.data.data.stats !== undefined, '11. My progress returns calculated stats object');
  assert(rahulProgress.data.data.stats.totalRecords >= 1, '12. Seeded logs reflected in stats totalRecords');

  // 2.2 Validation: Empty progress payload rejected
  const emptyLog = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/progress', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: rahulCookie } },
    { notes: 'Just some notes without numbers' }
  );
  assert(emptyLog.status === 400, '13. Empty progress payload (no measurements) rejected with HTTP 400');

  // 2.3 Validation: Out of bounds weight rejected
  const invalidWeightLog = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/progress', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: rahulCookie } },
    { weight: 650 }
  );
  assert(invalidWeightLog.status === 400, '14. Weight exceeding 500kg rejected with HTTP 400');

  // 2.4 Validation: Out of bounds body fat rejected
  const invalidBfLog = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/progress', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: rahulCookie } },
    { bodyFatPercentage: 85 }
  );
  assert(invalidBfLog.status === 400, '15. Body fat exceeding 75% rejected with HTTP 400');

  // 2.5 Rahul logs valid new progress entry
  const newProgressPayload = {
    weight: 81.2,
    bodyFatPercentage: 16.0,
    chest: 104.5,
    waist: 83.0,
    hips: 97.5,
    arms: 37.5,
    thighs: 59.0,
    notes: `Test progress entry at ${timestamp}`,
  };
  const createProgressRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/progress', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: rahulCookie } },
    newProgressPayload
  );
  assert(createProgressRes.status === 201, '16. Rahul successfully logged valid progress entry (HTTP 201)');
  const createdLog = createProgressRes.data.data.progress || createProgressRes.data.data;
  assert(createdLog.weight === 81.2, '17. Created log weight matches payload');
  assert(createdLog.chest === 104.5, '18. Created log chest circumference matches payload');

  // 2.6 Rahul updates the progress entry
  const updateProgressRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/progress/${createdLog._id}`, method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: rahulCookie } },
    { weight: 80.9, notes: 'Updated notes after morning weigh-in' }
  );
  assert(updateProgressRes.status === 200, '19. Rahul updated progress entry (HTTP 200)');
  const updatedLog = updateProgressRes.data.data.progress || updateProgressRes.data.data;
  assert(updatedLog.weight === 80.9, '20. Updated weight reflected correctly');

  // ----------------------------------------------------
  // SECTION 3: CROSS-MEMBER PRIVACY & ISOLATION
  // ----------------------------------------------------
  console.log('\n--- SECTION 3: Cross-Member Privacy & Isolation ---');

  // Sarah attempts to update Rahul's progress entry
  const sarahUnauthorizedUpdate = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/progress/${createdLog._id}`, method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: sarahCookie } },
    { weight: 99.0 }
  );
  assert(sarahUnauthorizedUpdate.status === 403, '21. Member cannot update another member progress (HTTP 403 Forbidden)');

  // Sarah attempts to delete Rahul's progress entry
  const sarahUnauthorizedDelete = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/progress/${createdLog._id}`, method: 'DELETE', headers: { Cookie: sarahCookie } }
  );
  assert(sarahUnauthorizedDelete.status === 403, '22. Member cannot delete another member progress (HTTP 403 Forbidden)');

  // ----------------------------------------------------
  // SECTION 4: TRAINER ROSTER RESTRICTIONS & RBAC
  // ----------------------------------------------------
  console.log('\n--- SECTION 4: Trainer Roster Restrictions & RBAC ---');

  // 4.1 Marcus is Rahul's assigned coach -> Can view Rahul's progress
  const marcusViewRahul = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/progress/member/${rahulMember._id}`,
    method: 'GET',
    headers: { Cookie: marcusCookie },
  });
  assert(marcusViewRahul.status === 200, '23. Assigned coach (Marcus) can view athlete progress (HTTP 200)');
  assert(marcusViewRahul.data.data.records.length > 0, '24. Assigned coach receives athlete progress records');

  // 4.2 Marcus logs progress for Rahul
  const marcusLogRahul = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/progress', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: marcusCookie } },
    { memberId: rahulMember._id, weight: 80.5, bodyFatPercentage: 15.8, notes: 'Coach Marcus assessment' }
  );
  assert(marcusLogRahul.status === 201, '25. Assigned coach logged progress for athlete (HTTP 201)');
  const coachCreatedLog = marcusLogRahul.data.data.progress || marcusLogRahul.data.data;

  // 4.3 Elena is NOT Rahul's assigned coach (she coaches Sarah) -> 403 Forbidden on Rahul
  const elenaViewRahul = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/progress/member/${rahulMember._id}`,
    method: 'GET',
    headers: { Cookie: elenaCookie },
  });
  assert(elenaViewRahul.status === 403, '26. Unassigned coach (Elena) blocked from viewing athlete progress (HTTP 403)');

  const elenaLogRahul = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/progress', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: elenaCookie } },
    { memberId: rahulMember._id, weight: 79.9, notes: 'Unauthorized log attempt' }
  );
  assert(elenaLogRahul.status === 403, '27. Unassigned coach blocked from logging progress for athlete (HTTP 403)');

  // ----------------------------------------------------
  // SECTION 5: ADMIN GYM-WIDE PROGRESS & REFERENTIAL INTEGRITY
  // ----------------------------------------------------
  console.log('\n--- SECTION 5: Admin Gym-Wide Progress & Referential Integrity ---');

  // 5.1 Admin gym-wide query
  const adminAllProgress = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/progress/admin/all',
    method: 'GET',
    headers: { Cookie: adminCookie },
  });
  assert(adminAllProgress.status === 200, '28. Admin gym-wide progress list accessible (HTTP 200)');
  assert(adminAllProgress.data.data.total >= 2, '29. Gym-wide progress total count accurate');

  // 5.2 Admin filter by member
  const adminFilterMember = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/progress/admin/all?memberId=${rahulMember._id}`,
    method: 'GET',
    headers: { Cookie: adminCookie },
  });
  assert(adminFilterMember.status === 200, '30. Admin filtered progress by memberId (HTTP 200)');
  assert(adminFilterMember.data.data.records.every((r) => r.member?._id === rahulMember._id || r.member === rahulMember._id), '31. All returned records match filtered member');

  // 5.3 Non-admin blocked from gym-wide endpoint
  const memberAdminEndpoint = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/progress/admin/all',
    method: 'GET',
    headers: { Cookie: rahulCookie },
  });
  assert(memberAdminEndpoint.status === 403, '32. Member blocked from admin gym-wide progress endpoint (HTTP 403)');

  // 5.4 Referential Integrity: Deleting member with progress records returns HTTP 409 Conflict
  const deleteMemberConflict = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/members/${rahulMember._id}`,
    method: 'DELETE',
    headers: { Cookie: adminCookie },
  });
  assert(deleteMemberConflict.status === 409, '33. Referential Integrity: Deleting member with progress records blocked with HTTP 409 Conflict');

  // ----------------------------------------------------
  // SECTION 6: NOTIFICATION SYSTEM & REAL-TIME POLLING
  // ----------------------------------------------------
  console.log('\n--- SECTION 6: Notification System & Real-Time Polling ---');

  // 6.1 Rahul checks unread notifications count
  const unreadCountRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/notifications/unread-count',
    method: 'GET',
    headers: { Cookie: rahulCookie },
  });
  assert(unreadCountRes.status === 200, '34. Unread count endpoint returned HTTP 200');
  const unreadVal = unreadCountRes.data.data?.count ?? unreadCountRes.data.data?.unreadCount;
  assert(typeof unreadVal === 'number', '35. Unread count is a numeric value');

  // 6.2 Rahul gets notifications list
  const rahulNotificationsRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/notifications',
    method: 'GET',
    headers: { Cookie: rahulCookie },
  });
  assert(rahulNotificationsRes.status === 200, '36. Notifications list retrieved (HTTP 200)');
  assert(Array.isArray(rahulNotificationsRes.data.data.notifications), '37. Returned notifications list is an array');
  const notifList = rahulNotificationsRes.data.data.notifications;
  assert(notifList.length > 0, '38. Seeded notifications present in recipient feed');

  const targetNotif = notifList[0];

  // 6.3 Mark single notification as read
  const markReadRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/notifications/${targetNotif._id}/read`,
    method: 'PATCH',
    headers: { Cookie: rahulCookie },
  });
  assert(markReadRes.status === 200, '39. Mark single notification as read succeeded (HTTP 200)');
  const updatedNotif = markReadRes.data.data.notification || markReadRes.data.data;
  assert(updatedNotif.isRead === true, '40. Notification isRead marked true');
  assert(!!updatedNotif.readAt, '41. readAt timestamp populated');

  // 6.4 Cross-user notification security: Sarah cannot mark Rahul's notification as read
  const sarahMarkRahulNotif = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/notifications/${targetNotif._id}/read`,
    method: 'PATCH',
    headers: { Cookie: sarahCookie },
  });
  assert(sarahMarkRahulNotif.status === 404 || sarahMarkRahulNotif.status === 403, '42. Cross-user notification update blocked (HTTP 403/404)');

  // 6.5 Mark all notifications as read
  const markAllReadRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/notifications/read-all',
    method: 'PATCH',
    headers: { Cookie: rahulCookie },
  });
  assert(markAllReadRes.status === 200, '43. Mark all notifications as read succeeded (HTTP 200)');

  const unreadCountAfter = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/notifications/unread-count',
    method: 'GET',
    headers: { Cookie: rahulCookie },
  });
  const unreadAfterVal = unreadCountAfter.data.data?.count ?? unreadCountAfter.data.data?.unreadCount;
  assert(unreadAfterVal === 0, '44. Unread count dropped to 0 after mark-all-read');

  // ----------------------------------------------------
  // SECTION 7: BUSINESS EVENT NOTIFICATION TRIGGERS
  // ----------------------------------------------------
  console.log('\n--- SECTION 7: Business Event Notification Triggers ---');

  // 7.1 Payment Fulfillment Trigger
  // Record manual offline cash payment by Admin for Rahul
  const plansRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/membership-plans',
    method: 'GET',
  });
  const plan = plansRes.data.data.plans[0];
  assert(!!plan, '45. Retrieved membership plan for payment trigger test');

  const manualPayRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments/manual', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    {
      memberId: rahulMember._id,
      planId: plan._id,
      amount: plan.price,
      paymentMethod: 'cash',
      paymentDate: new Date().toISOString().slice(0, 10),
      notes: `Test trigger automated notification ${timestamp}`,
    }
  );
  assert(manualPayRes.status === 201, '46. Admin recorded manual payment for member (HTTP 201)');

  // Rahul checks notifications for payment success notification
  const rahulPayNotifs = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/notifications',
    method: 'GET',
    headers: { Cookie: rahulCookie },
  });
  const payNotif = rahulPayNotifs.data.data.notifications.find((n) => n.type === 'payment_success' || n.type === 'membership_renewed');
  assert(!!payNotif, '47. Member received automated payment_success / membership_renewed notification upon fulfillment');
  assert(payNotif.title.includes('Payment') || payNotif.title.includes('Membership'), '48. Payment notification title formatted correctly');

  // 7.2 Training Plan Assignment Trigger
  const createPlanRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/training-plans', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: marcusCookie } },
    {
      planName: `Hypertrophy Blast ${timestamp}`,
      description: 'Test workout plan notification trigger',
      memberId: rahulMember._id,
      goal: 'Hypertrophy',
      exercises: [],
      status: 'active',
    }
  );
  if (createPlanRes.status !== 201) {
    console.error('DEBUG createPlanRes:', createPlanRes.status, createPlanRes.data || createPlanRes.raw);
  }
  assert(createPlanRes.status === 201, '49. Trainer created and assigned training plan to athlete (HTTP 201)');

  const rahulPlanNotifs = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/notifications',
    method: 'GET',
    headers: { Cookie: rahulCookie },
  });
  const planNotif = rahulPlanNotifs.data.data.notifications.find((n) => n.type === 'training_assigned');
  assert(!!planNotif, '50. Member received automated training_assigned notification');

  // 7.3 User Account Status Trigger
  // Admin updates Sarah's status to inactive and back to active
  const statusUpdateRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/users/${sarahMember.user?._id || sarahMember.user}/status`, method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    { status: 'inactive' }
  );
  assert(statusUpdateRes.status === 200, '51. Admin toggled user status to inactive (HTTP 200)');

  // Restore Sarah to active so Sarah can authenticate and view notifications
  const statusRestoreRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/users/${sarahMember.user?._id || sarahMember.user}/status`, method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    { status: 'active' }
  );
  assert(statusRestoreRes.status === 200, '52. Admin restored user status to active (HTTP 200)');

  const sarahNotifs = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/notifications',
    method: 'GET',
    headers: { Cookie: sarahCookie },
  });
  const statusNotif = sarahNotifs.data.data.notifications.find((n) => n.type === 'account_status');
  assert(!!statusNotif, '53. User received automated account_status notification');

  // ----------------------------------------------------
  // SECTION 8: CLEANUP & RECORD DELETION
  // ----------------------------------------------------
  console.log('\n--- SECTION 8: Cleanup & Record Deletions ---');

  // Rahul deletes created progress record
  const deleteRahulLog = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/progress/${createdLog._id}`,
    method: 'DELETE',
    headers: { Cookie: rahulCookie },
  });
  assert(deleteRahulLog.status === 200, '53. Rahul deleted their own progress entry (HTTP 200)');

  // Admin deletes coach-created progress record
  const deleteCoachLog = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/progress/${coachCreatedLog._id}`,
    method: 'DELETE',
    headers: { Cookie: adminCookie },
  });
  assert(deleteCoachLog.status === 200, '54. Admin deleted coach-created progress entry (HTTP 200)');

  // Rahul deletes a notification
  const deleteNotifRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/notifications/${payNotif._id}`,
    method: 'DELETE',
    headers: { Cookie: rahulCookie },
  });
  assert(deleteNotifRes.status === 200, '55. Member deleted notification item (HTTP 200)');

  console.log('\n==================================================');
  console.log(`🎉 ALL ${passedCount} OF ${totalCount} PHASE 9 & 10 TESTS PASSED PERFECTLY!`);
  console.log('==================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED WITH ERROR:', err);
  process.exit(1);
});
