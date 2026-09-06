require('dotenv').config();
const http = require('http');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

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

async function runAdversarialTests() {
  console.log('\n================================================================');
  console.log('🛡️  IRONFORGE FINAL QA: PRODUCTION ADVERSARIAL & SECURITY SUITE');
  console.log('================================================================\n');

  const ts = Date.now();
  const jwtSecret = process.env.JWT_SECRET || 'IronForgeSecretKey2026ProductionJWTTokenSecurityKey';

  // -----------------------------------------------------------------
  // 1. AUTHENTICATION & SESSION ATTACK VECTORS
  // -----------------------------------------------------------------
  console.log('\n--- 1. Authentication & Session Attack Tests ---');

  // Test 1.1: Login with non-existent user
  const fakeUserLogin = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: `nonexistent_${ts}@ironforge.test`, password: 'SomePassword123' }
  );
  assert(fakeUserLogin.status === 401, '1.1 Non-existent user login rejected with HTTP 401');
  assert(fakeUserLogin.data.success === false, '1.1 Error response envelope has success: false');

  // Test 1.2: Login with incorrect password
  const wrongPassLogin = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'admin@ironforge.test', password: 'WrongPassword@999' }
  );
  assert(wrongPassLogin.status === 401, '1.2 Incorrect password login rejected with HTTP 401');

  // Test 1.3: Login with missing required fields
  const emptyLogin = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: '' }
  );
  assert(emptyLogin.status === 400, '1.3 Missing login credentials rejected with HTTP 400');

  // Test 1.4: Protected endpoint without auth cookie or header
  const unauthMe = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/me', method: 'GET' }
  );
  assert(unauthMe.status === 401, '1.4 Unauthenticated request to /api/auth/me rejected with HTTP 401');

  // Test 1.5: Malformed token in cookie
  const malformedCookieMe = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/me', method: 'GET', headers: { Cookie: 'token=not-a-valid-jwt-token' } }
  );
  assert(malformedCookieMe.status === 401, '1.5 Malformed JWT cookie rejected with HTTP 401');

  // Test 1.6: Forged JWT token signed with an invalid secret
  const forgedToken = jwt.sign({ id: '507f1f77bcf86cd799439011', role: 'admin' }, 'attacker-fake-secret-key-12345', { expiresIn: '1h' });
  const forgedTokenMe = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/me', method: 'GET', headers: { Cookie: `token=${forgedToken}` } }
  );
  assert(forgedTokenMe.status === 401, '1.6 Forged JWT signed with foreign secret rejected with HTTP 401');

  // Authenticate official test personas for subsequent test sections
  const adminRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'admin@ironforge.test', password: 'Admin@123' }
  );
  assert(adminRes.status === 200, '1.7 Admin login succeeds with HTTP 200');
  const adminCookie = extractCookie(adminRes.headers);

  const marcusRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'trainer@ironforge.test', password: 'Trainer@123' }
  );
  assert(marcusRes.status === 200, '1.8 Trainer Marcus login succeeds with HTTP 200');
  const marcusCookie = extractCookie(marcusRes.headers);

  const elenaRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'elena@ironforge.test', password: 'Trainer@123' }
  );
  assert(elenaRes.status === 200, '1.9 Trainer Elena login succeeds with HTTP 200');
  const elenaCookie = extractCookie(elenaRes.headers);

  const rahulRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'member@ironforge.test', password: 'Member@123' }
  );
  assert(rahulRes.status === 200, '1.10 Member Rahul login succeeds with HTTP 200');
  const rahulCookie = extractCookie(rahulRes.headers);

  const sarahRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'sarah@ironforge.test', password: 'Member@123' }
  );
  assert(sarahRes.status === 200, '1.11 Member Sarah login succeeds with HTTP 200');
  const sarahCookie = extractCookie(sarahRes.headers);

  // Retrieve persona member and trainer documents
  const allMembersRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/members',
    method: 'GET',
    headers: { Cookie: adminCookie },
  });
  const membersList = allMembersRes.data.data.members;
  const rahulDoc = membersList.find((m) => m.user && m.user.email === 'member@ironforge.test');
  const sarahDoc = membersList.find((m) => m.user && m.user.email === 'sarah@ironforge.test');
  assert(!!rahulDoc && !!sarahDoc, '1.12 Member documents retrieved for Rahul and Sarah');

  const allTrainersRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/trainers',
    method: 'GET',
    headers: { Cookie: adminCookie },
  });
  const trainersList = allTrainersRes.data.data.trainers;
  const marcusDoc = trainersList.find((t) => t.user && t.user.email === 'trainer@ironforge.test');
  const elenaDoc = trainersList.find((t) => t.user && t.user.email === 'elena@ironforge.test');
  assert(!!marcusDoc && !!elenaDoc, '1.13 Trainer documents retrieved for Marcus and Elena');

  // Test 1.14: Inactive user gating
  const inactiveMemberRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/members', method: 'POST', headers: { Cookie: adminCookie, 'Content-Type': 'application/json' } },
    {
      name: `Inactive Member ${ts}`,
      email: `inactive_${ts}@ironforge.test`,
      password: 'InactivePass@123',
      status: 'inactive',
    }
  );
  assert(inactiveMemberRes.status === 201, '1.14 Created inactive member account for gating verification');
  const inactiveMemberId = inactiveMemberRes.data.data.member._id;

  const inactiveLoginAttempt = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: `inactive_${ts}@ironforge.test`, password: 'InactivePass@123' }
  );
  assert(inactiveLoginAttempt.status === 401, '1.15 Inactive account login rejected with HTTP 401');

  // -----------------------------------------------------------------
  // 2. RBAC BOUNDARY ENFORCEMENT & PRIVILEGE ESCALATION ATTACKS
  // -----------------------------------------------------------------
  console.log('\n--- 2. RBAC Boundary & Privilege Escalation Tests ---');

  // 2.1 Member attempting Admin operations
  const memberCreateMember = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/members', method: 'POST', headers: { Cookie: rahulCookie, 'Content-Type': 'application/json' } },
    { name: 'Hacker Member', email: `hacker_${ts}@ironforge.test`, password: 'HackerPass@123' }
  );
  assert(memberCreateMember.status === 403, '2.1 Member blocked from creating members (HTTP 403)');

  const memberDeleteMember = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/members/${sarahDoc._id}`, method: 'DELETE', headers: { Cookie: rahulCookie } }
  );
  assert(memberDeleteMember.status === 403, '2.2 Member blocked from deleting other members (HTTP 403)');

  const memberCreatePlan = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/membership-plans', method: 'POST', headers: { Cookie: rahulCookie, 'Content-Type': 'application/json' } },
    { name: `Unauthorized Plan ${ts}`, price: 10, duration: 1 }
  );
  assert(memberCreatePlan.status === 403, '2.3 Member blocked from creating membership plans (HTTP 403)');

  const memberGetAllPayments = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments', method: 'GET', headers: { Cookie: rahulCookie } }
  );
  assert(memberGetAllPayments.status === 403, '2.4 Member blocked from accessing gym-wide payment ledger (HTTP 403)');

  const memberGetPaymentStats = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments/stats', method: 'GET', headers: { Cookie: rahulCookie } }
  );
  assert(memberGetPaymentStats.status === 403, '2.5 Member blocked from accessing payment revenue statistics (HTTP 403)');

  const memberManualPayment = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments/manual', method: 'POST', headers: { Cookie: rahulCookie, 'Content-Type': 'application/json' } },
    { memberId: rahulDoc._id, amount: 100, paymentMethod: 'cash' }
  );
  assert(memberManualPayment.status === 403, '2.6 Member blocked from recording manual payments (HTTP 403)');

  const memberGetAttendanceStats = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/attendance/stats', method: 'GET', headers: { Cookie: rahulCookie } }
  );
  assert(memberGetAttendanceStats.status === 403, '2.7 Member blocked from accessing gym attendance statistics (HTTP 403)');

  // 2.2 Member attempting Trainer operations
  const memberCreateTrainingPlan = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/training-plans', method: 'POST', headers: { Cookie: rahulCookie, 'Content-Type': 'application/json' } },
    { title: 'Illegal Workout Plan', memberId: rahulDoc._id }
  );
  assert(memberCreateTrainingPlan.status === 403, '2.8 Member blocked from creating training plans (HTTP 403)');

  const memberTrainerAttendance = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/attendance/trainer', method: 'GET', headers: { Cookie: rahulCookie } }
  );
  assert(memberTrainerAttendance.status === 403, '2.9 Member blocked from accessing trainer roster attendance (HTTP 403)');

  // 2.3 Trainer attempting Admin operations
  const trainerCreateMember = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/members', method: 'POST', headers: { Cookie: marcusCookie, 'Content-Type': 'application/json' } },
    { name: 'Trainer Created Member', email: `trainercreated_${ts}@ironforge.test`, password: 'TrainerPass@123' }
  );
  assert(trainerCreateMember.status === 403, '2.10 Trainer blocked from creating member accounts (HTTP 403)');

  const trainerDeleteTrainer = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/trainers/${elenaDoc._id}`, method: 'DELETE', headers: { Cookie: marcusCookie } }
  );
  assert(trainerDeleteTrainer.status === 403, '2.11 Trainer blocked from deleting other trainers (HTTP 403)');

  const trainerGetAllPayments = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments', method: 'GET', headers: { Cookie: marcusCookie } }
  );
  assert(trainerGetAllPayments.status === 403, '2.12 Trainer blocked from accessing financial payments (HTTP 403)');

  const trainerManualPayment = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments/manual', method: 'POST', headers: { Cookie: marcusCookie, 'Content-Type': 'application/json' } },
    { memberId: rahulDoc._id, amount: 500, paymentMethod: 'cash' }
  );
  assert(trainerManualPayment.status === 403, '2.13 Trainer blocked from recording manual payments (HTTP 403)');

  // 2.4 Trainer attempting Member self-service operations
  const trainerCheckIn = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/attendance/check-in', method: 'POST', headers: { Cookie: marcusCookie } }
  );
  assert(trainerCheckIn.status === 403, '2.14 Trainer blocked from member check-in route (HTTP 403)');

  const trainerMyProgress = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/progress/me', method: 'GET', headers: { Cookie: marcusCookie } }
  );
  assert(trainerMyProgress.status === 403, '2.15 Trainer blocked from member personal progress route (HTTP 403)');

  // -----------------------------------------------------------------
  // 3. IDOR & MULTI-TENANT DATA ISOLATION ATTACKS
  // -----------------------------------------------------------------
  console.log('\n--- 3. IDOR & Multi-Tenant Data Isolation Tests ---');

  // 3.1 Member Rahul attempting to view Member Sarah's progress records
  const rahulAccessSarahProgress = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/progress/member/${sarahDoc._id}`,
    method: 'GET',
    headers: { Cookie: rahulCookie },
  });
  assert(rahulAccessSarahProgress.status === 403, '3.1 Member blocked from viewing another member’s progress (IDOR - HTTP 403)');

  // 3.2 Member Rahul attempting to log progress on Sarah's profile
  const rahulLogProgress = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/progress', method: 'POST', headers: { Cookie: rahulCookie, 'Content-Type': 'application/json' } },
    { memberId: sarahDoc._id, weight: 80.5, notes: 'Rahul self-recorded progress' }
  );
  assert(rahulLogProgress.status === 201, '3.2 Member progress creation succeeds (HTTP 201)');
  const rahulProgressId = rahulLogProgress.data.data.progress._id;
  assert(rahulLogProgress.data.data.progress.member._id.toString() === rahulDoc._id.toString(), '3.3 Created progress record belongs strictly to Rahul, not Sarah (IDOR Prevention)');

  // 3.3 Trainer Marcus attempting to view progress of Sarah (who is assigned to Trainer Elena)
  const marcusAccessSarahProgress = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/progress/member/${sarahDoc._id}`,
    method: 'GET',
    headers: { Cookie: marcusCookie },
  });
  assert(marcusAccessSarahProgress.status === 403, '3.4 Trainer blocked from viewing progress of unassigned member (HTTP 403)');

  // 3.4 Trainer Marcus attempting to log progress for Sarah (unassigned)
  const marcusLogSarahProgress = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/progress', method: 'POST', headers: { Cookie: marcusCookie, 'Content-Type': 'application/json' } },
    { memberId: sarahDoc._id, weight: 65, notes: 'Marcus attempting unauthorized progress entry' }
  );
  assert(marcusLogSarahProgress.status === 403, '3.5 Trainer blocked from recording progress for unassigned member (HTTP 403)');

  // 3.5 Notification Isolation & Cross-Account Modification
  const elenaNotifsRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/notifications',
    method: 'GET',
    headers: { Cookie: elenaCookie },
  });
  assert(elenaNotifsRes.status === 200, '3.6 Trainer Elena retrieved notifications successfully');
  const elenaNotifs = elenaNotifsRes.data.data.notifications;

  if (elenaNotifs && elenaNotifs.length > 0) {
    const elenaNotifId = elenaNotifs[0]._id;
    const rahulReadElenaNotif = await request({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/notifications/${elenaNotifId}/read`,
      method: 'PATCH',
      headers: { Cookie: rahulCookie },
    });
    assert(rahulReadElenaNotif.status === 404, '3.7 Member blocked from marking another user’s notification as read (HTTP 404 unauthorized)');

    const rahulDeleteElenaNotif = await request({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/notifications/${elenaNotifId}`,
      method: 'DELETE',
      headers: { Cookie: rahulCookie },
    });
    assert(rahulDeleteElenaNotif.status === 404, '3.8 Member blocked from deleting another user’s notification (HTTP 404 unauthorized)');
  } else {
    const dummyNotifId = '507f1f77bcf86cd799439011';
    const rahulReadDummy = await request({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/notifications/${dummyNotifId}/read`,
      method: 'PATCH',
      headers: { Cookie: rahulCookie },
    });
    assert(rahulReadDummy.status === 404, '3.7 Member cannot mark non-owned notification as read (HTTP 404)');
  }

  // -----------------------------------------------------------------
  // 4. INPUT VALIDATION, TYPE SAFETY & INJECTION RESISTANCE
  // -----------------------------------------------------------------
  console.log('\n--- 4. Input Validation & Type Safety Tests ---');

  // 4.1 Malformed MongoDB ObjectId in URL parameters
  const badIdMember = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/members/not-a-valid-mongo-id-12345',
    method: 'GET',
    headers: { Cookie: adminCookie },
  });
  assert(badIdMember.status === 404 || badIdMember.status === 400, '4.1 Malformed ObjectId in /api/members/:id handled safely (HTTP 404/400, no 500 crash)');

  const badIdProgress = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/progress/member/not-a-valid-mongo-id-12345',
    method: 'GET',
    headers: { Cookie: adminCookie },
  });
  assert(badIdProgress.status === 400, '4.2 Malformed ObjectId in /api/progress/member/:id rejected with HTTP 400');

  const badIdPayment = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/payments/not-a-valid-mongo-id-12345',
    method: 'GET',
    headers: { Cookie: adminCookie },
  });
  assert(badIdPayment.status === 404 || badIdPayment.status === 400, '4.3 Malformed ObjectId in /api/payments/:id handled safely (HTTP 404/400)');

  // 4.2 Negative & Out-of-Range Fitness Metrics
  const negWeightRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/progress', method: 'POST', headers: { Cookie: rahulCookie, 'Content-Type': 'application/json' } },
    { weight: -50 }
  );
  assert(negWeightRes.status === 400, '4.4 Negative weight (-50kg) rejected with HTTP 400');

  const absurdBodyFatRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/progress', method: 'POST', headers: { Cookie: rahulCookie, 'Content-Type': 'application/json' } },
    { bodyFatPercentage: 150 }
  );
  assert(absurdBodyFatRes.status === 400, '4.5 Out-of-range body fat percentage (150%) rejected with HTTP 400');

  const zeroMetricsRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/progress', method: 'POST', headers: { Cookie: rahulCookie, 'Content-Type': 'application/json' } },
    { notes: 'Only notes, no measurements' }
  );
  assert(zeroMetricsRes.status === 400, '4.6 Progress entry with zero numeric measurements rejected with HTTP 400');

  // 4.3 Negative price in Membership Plan creation
  const negPricePlan = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/membership-plans', method: 'POST', headers: { Cookie: adminCookie, 'Content-Type': 'application/json' } },
    { name: `Negative Price Plan ${ts}`, price: -150, duration: 1 }
  );
  assert(negPricePlan.status === 400, '4.7 Membership plan with negative price rejected with HTTP 400');

  // 4.4 Duplicate Unique Constraint Integrity
  const duplicatePlanName = `Standard Gold ${ts}`;
  const planA = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/membership-plans', method: 'POST', headers: { Cookie: adminCookie, 'Content-Type': 'application/json' } },
    { name: duplicatePlanName, price: 99, duration: 3 }
  );
  assert(planA.status === 201, '4.8 First membership plan created successfully');

  const planB = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/membership-plans', method: 'POST', headers: { Cookie: adminCookie, 'Content-Type': 'application/json' } },
    { name: duplicatePlanName, price: 120, duration: 6 }
  );
  assert(planB.status === 409, '4.9 Duplicate membership plan name rejected with HTTP 409 Conflict');

  // -----------------------------------------------------------------
  // 5. PAYMENT GATEWAY INTEGRITY & WEBHOOK SECURITY ATTACKS
  // -----------------------------------------------------------------
  console.log('\n--- 5. Payment Gateway & Webhook Security Tests ---');

  // 5.1 Client amount tampering in order creation
  const orderRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments/create-order', method: 'POST', headers: { Cookie: rahulCookie, 'Content-Type': 'application/json' } },
    { planId: planA.data.data.plan._id, amount: 1 }
  );
  assert(orderRes.status === 201, '5.1 Order creation request succeeded (HTTP 201)');
  assert(orderRes.data.data.amount === 99, '5.2 Order amount calculated strictly from DB plan ($99.00), ignoring client tampering ($1)');
  assert(orderRes.data.data.amountInPaise === 9900, '5.3 Order amountInPaise is exactly 9900');

  // 5.2 Order creation with invalid plan ID
  const invalidPlanOrder = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments/create-order', method: 'POST', headers: { Cookie: rahulCookie, 'Content-Type': 'application/json' } },
    { planId: '507f1f77bcf86cd799439011' }
  );
  assert(invalidPlanOrder.status === 404, '5.4 Order creation with non-existent plan ID rejected with HTTP 404');

  // 5.3 Payment verification with forged / tampered HMAC signature
  const forgedVerify = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments/verify-payment', method: 'POST', headers: { Cookie: rahulCookie, 'Content-Type': 'application/json' } },
    {
      razorpay_order_id: orderRes.data.data.orderId,
      razorpay_payment_id: `pay_fake_${ts}`,
      razorpay_signature: 'forged_hmac_signature_that_does_not_match_secret',
      planId: planA.data.data.plan._id,
    }
  );
  assert(forgedVerify.status === 400, '5.5 Payment verification with forged signature rejected with HTTP 400');

  // 5.4 Payment verification with genuine matching signature
  const genuinePaymentId = `pay_real_${ts}`;
  const orderId = orderRes.data.data.orderId;
  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET || 'IronForgeRazorpaySecret2026Key';
  const validSignature = crypto
    .createHmac('sha256', razorpaySecret)
    .update(`${orderId}|${genuinePaymentId}`)
    .digest('hex');

  const genuineVerify = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments/verify-payment', method: 'POST', headers: { Cookie: rahulCookie, 'Content-Type': 'application/json' } },
    {
      razorpay_order_id: orderId,
      razorpay_payment_id: genuinePaymentId,
      razorpay_signature: validSignature,
      planId: planA.data.data.plan._id,
    }
  );
  assert(genuineVerify.status === 200, '5.6 Genuine signature payment verification succeeded with HTTP 200');
  assert(genuineVerify.data.data.payment.status === 'paid', '5.7 Payment record status is paid');

  // 5.5 Duplicate payment verification (Idempotency)
  const replayVerify = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments/verify-payment', method: 'POST', headers: { Cookie: rahulCookie, 'Content-Type': 'application/json' } },
    {
      razorpay_order_id: orderId,
      razorpay_payment_id: genuinePaymentId,
      razorpay_signature: validSignature,
      planId: planA.data.data.plan._id,
    }
  );
  assert(replayVerify.status === 200, '5.8 Replayed payment verification handled idempotently with HTTP 200');

  // 5.6 Webhook attack without signature header
  const webhookNoSig = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments/webhook', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { event: 'payment.captured', payload: { payment: { entity: { id: `pay_webhook_${ts}`, amount: 9900 } } } }
  );
  assert(webhookNoSig.status === 400, '5.9 Webhook without x-razorpay-signature rejected with HTTP 400');

  // 5.7 Webhook attack with invalid signature
  const webhookBadSig = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/payments/webhook',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': 'invalid_hex_signature' },
    },
    { event: 'payment.captured', payload: { payment: { entity: { id: `pay_webhook_${ts}`, amount: 9900 } } } }
  );
  assert(webhookBadSig.status === 400, '5.10 Webhook with invalid signature rejected with HTTP 400');

  // -----------------------------------------------------------------
  // 6. REFERENTIAL INTEGRITY & SAFE DELETION GUARDS
  // -----------------------------------------------------------------
  console.log('\n--- 6. Referential Integrity & Deletion Guard Tests ---');

  // 6.1 Attempt to delete Member Rahul who has payment and progress records
  const deleteRahulAttempt = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/members/${rahulDoc._id}`,
    method: 'DELETE',
    headers: { Cookie: adminCookie },
  });
  assert(deleteRahulAttempt.status === 409, '6.1 Deletion of member with financial/progress history blocked with HTTP 409 Conflict');

  // 6.2 Attempt to delete Trainer Marcus who has assigned members
  const deleteMarcusAttempt = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/trainers/${marcusDoc._id}`,
    method: 'DELETE',
    headers: { Cookie: adminCookie },
  });
  assert(deleteMarcusAttempt.status === 409, '6.2 Deletion of trainer with assigned members blocked with HTTP 409 Conflict');

  // 6.3 Deletion of membership plan subscribed by active members soft-deactivates instead of breaking records
  const deletePlanWithSubscribers = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/membership-plans/${planA.data.data.plan._id}`,
    method: 'DELETE',
    headers: { Cookie: adminCookie },
  });
  assert(deletePlanWithSubscribers.status === 200, '6.3 Membership plan with subscribed members safely deactivated instead of corrupting foreign keys');

  // -----------------------------------------------------------------
  // 7. ATTENDANCE & CONCURRENCY INTEGRITY
  // -----------------------------------------------------------------
  console.log('\n--- 7. Attendance & Check-In Integrity Tests ---');

  // 7.1 Today's status check
  const todayStatusRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/attendance/me/today',
    method: 'GET',
    headers: { Cookie: rahulCookie },
  });
  assert(todayStatusRes.status === 200, '7.1 Member retrieved today attendance status (HTTP 200)');

  // 7.2 Duplicate check-in on the same calendar day returns HTTP 409 Conflict
  if (todayStatusRes.data.data.isCheckedIn) {
    const dupCheckIn = await request(
      { hostname: '127.0.0.1', port: 5000, path: '/api/attendance/check-in', method: 'POST', headers: { Cookie: rahulCookie } }
    );
    assert(dupCheckIn.status === 409, '7.2 Duplicate same-day check-in rejected with HTTP 409 Conflict');
  } else {
    const firstCheckIn = await request(
      { hostname: '127.0.0.1', port: 5000, path: '/api/attendance/check-in', method: 'POST', headers: { Cookie: rahulCookie } }
    );
    assert(firstCheckIn.status === 201, '7.2 First check-in succeeded (HTTP 201)');

    const dupCheckIn = await request(
      { hostname: '127.0.0.1', port: 5000, path: '/api/attendance/check-in', method: 'POST', headers: { Cookie: rahulCookie } }
    );
    assert(dupCheckIn.status === 409, '7.3 Immediate duplicate check-in rejected with HTTP 409 Conflict');
  }

  // -----------------------------------------------------------------
  // 8. API HEALTH & PRODUCTION ERROR SUPPRESSION
  // -----------------------------------------------------------------
  console.log('\n--- 8. API Health & Production Response Hygiene ---');

  // 8.1 API Health Check
  const healthRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/health',
    method: 'GET',
  });
  assert(healthRes.status === 200, '8.1 /api/health responded with HTTP 200');
  assert(healthRes.data.data.status === 'online', '8.2 Health payload status is online');
  assert(healthRes.data.data.database.status === 'connected', '8.3 Database status is connected');

  // 8.2 Non-existent route 404 handling
  const notFoundRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/completely-nonexistent-endpoint-xyz',
    method: 'GET',
  });
  assert(notFoundRes.status === 404, '8.4 Unknown route returned standard HTTP 404');
  assert(notFoundRes.data.success === false, '8.5 404 response follows standardized { success: false } envelope');

  // -----------------------------------------------------------------
  // CLEANUP / POST-AUDIT
  // -----------------------------------------------------------------
  if (rahulProgressId) {
    await request({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/progress/${rahulProgressId}`,
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
  }

  if (inactiveMemberId) {
    await request({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/members/${inactiveMemberId}`,
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
  }

  console.log('\n================================================================');
  console.log(`🎉 FINAL ADVERSARIAL QA SUITE COMPLETED: ${passedCount} / ${totalCount} PASSED (100%)`);
  console.log('================================================================\n');
}

runAdversarialTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
