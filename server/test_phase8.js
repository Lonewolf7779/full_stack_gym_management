require('dotenv').config();
const http = require('http');
const crypto = require('crypto');

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
  console.log('💳 RUNNING PHASE 8: PAYMENTS & BILLING TEST SUITE');
  console.log('==================================================\n');

  const timestamp = Date.now();
  const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'IronForgeRazorpaySecret2026Key';
  const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'IronForgeWebhookSecret2026Secure';

  // --- SECTION 1: PUBLIC & UNAUTHENTICATED GATING ---
  console.log('\n--- SECTION 1: Public Config & Unauthenticated Gating ---');
  
  // Public config endpoint should be accessible without auth
  const publicConfig = await request({ hostname: '127.0.0.1', port: 5000, path: '/api/payments/config', method: 'GET' });
  assert(publicConfig.status === 200, '1. Public payment config is accessible (HTTP 200)');
  assert(publicConfig.data.data.keyId !== undefined, '2. Public config returns keyId');
  assert(publicConfig.data.data.currency === 'INR', '3. Public config returns currency INR');
  assert(publicConfig.data.data.keySecret === undefined, '4. Public config NEVER exposes keySecret');
  assert(publicConfig.data.data.webhookSecret === undefined, '5. Public config NEVER exposes webhookSecret');

  // Unauthenticated requests to protected endpoints -> 401
  const unauthMy = await request({ hostname: '127.0.0.1', port: 5000, path: '/api/payments/my-payments', method: 'GET' });
  assert(unauthMy.status === 401, '6. Unauthenticated my-payments blocked with 401');

  const unauthOrder = await request({ hostname: '127.0.0.1', port: 5000, path: '/api/payments/create-order', method: 'POST' });
  assert(unauthOrder.status === 401, '7. Unauthenticated create-order blocked with 401');

  const unauthVerify = await request({ hostname: '127.0.0.1', port: 5000, path: '/api/payments/verify', method: 'POST' });
  assert(unauthVerify.status === 401, '8. Unauthenticated verify blocked with 401');

  const unauthManual = await request({ hostname: '127.0.0.1', port: 5000, path: '/api/payments/manual', method: 'POST' });
  assert(unauthManual.status === 401, '9. Unauthenticated manual payment blocked with 401');

  const unauthAll = await request({ hostname: '127.0.0.1', port: 5000, path: '/api/payments', method: 'GET' });
  assert(unauthAll.status === 401, '10. Unauthenticated admin payment list blocked with 401');

  const unauthStats = await request({ hostname: '127.0.0.1', port: 5000, path: '/api/payments/stats', method: 'GET' });
  assert(unauthStats.status === 401, '11. Unauthenticated payment stats blocked with 401');

  // --- SECTION 2: AUTHENTICATION OF TEST ACCOUNTS ---
  console.log('\n--- SECTION 2: Authentication of Test Roles ---');
  
  // Admin Login
  const adminLogin = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'admin@ironforge.test', password: 'Admin@123' }
  );
  assert(adminLogin.status === 200, '12. Admin login succeeded');
  const adminCookie = adminLogin.headers['set-cookie'];

  // Trainer Login
  const trainerLogin = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'trainer@ironforge.test', password: 'Trainer@123' }
  );
  assert(trainerLogin.status === 200, '13. Trainer login succeeded');
  const trainerCookie = trainerLogin.headers['set-cookie'];

  // Member Login (Rahul Patel)
  const memberLogin = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'member@ironforge.test', password: 'Member@123' }
  );
  assert(memberLogin.status === 200, '14. Member login succeeded');
  const memberCookie = memberLogin.headers['set-cookie'];

  // Register Fresh Member for isolated payment lifecycle
  const freshEmail = `test.pay.athlete.${timestamp}@ironforge.test`;
  const freshMemberReg = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { name: 'Fresh Payment Athlete', email: freshEmail, password: 'Member@123' }
  );
  assert(freshMemberReg.status === 201, '15. Fresh member registered');
  const freshMemberCookie = freshMemberReg.headers['set-cookie'];

  // Retrieve plans list
  const plansRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/membership-plans', method: 'GET', headers: { Cookie: adminCookie } }
  );
  assert(plansRes.status === 200, '16. Retrieved membership plans');
  const plans = plansRes.data.data.plans;
  assert(plans.length >= 1, '17. At least one membership plan exists');
  const testPlan = plans[0]; // e.g. Basic / Pro Plan

  // --- SECTION 3: RBAC ISOLATION ---
  console.log('\n--- SECTION 3: Role-Based Access Control (RBAC) Restrictions ---');

  // Trainer blocked from payment endpoints
  const trainerTryAll = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments', method: 'GET', headers: { Cookie: trainerCookie } }
  );
  assert(trainerTryAll.status === 403, '18. Trainer denied gym-wide payments list (HTTP 403)');

  const trainerTryStats = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments/stats', method: 'GET', headers: { Cookie: trainerCookie } }
  );
  assert(trainerTryStats.status === 403, '19. Trainer denied payment statistics (HTTP 403)');

  const trainerTryManual = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments/manual', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: trainerCookie } },
    { memberId: '507f1f77bcf86cd799439011', planId: testPlan._id, amount: 1000, paymentMethod: 'cash' }
  );
  assert(trainerTryManual.status === 403, '20. Trainer denied recording manual payment (HTTP 403)');

  const trainerTryCreateOrder = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments/create-order', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: trainerCookie } },
    { planId: testPlan._id }
  );
  assert(trainerTryCreateOrder.status === 403, '21. Trainer denied create-order endpoint (HTTP 403)');

  // Member blocked from admin endpoints
  const memberTryAll = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments', method: 'GET', headers: { Cookie: memberCookie } }
  );
  assert(memberTryAll.status === 403, '22. Member denied gym-wide payments list (HTTP 403)');

  const memberTryStats = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments/stats', method: 'GET', headers: { Cookie: memberCookie } }
  );
  assert(memberTryStats.status === 403, '23. Member denied payment statistics (HTTP 403)');

  const memberTryManual = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments/manual', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: memberCookie } },
    { memberId: '507f1f77bcf86cd799439011', planId: testPlan._id, amount: 1000, paymentMethod: 'cash' }
  );
  assert(memberTryManual.status === 403, '24. Member denied recording manual payment (HTTP 403)');

  // --- SECTION 4: SERVER-SIDE PRICE AUTHORITY & RAZORPAY ORDERS ---
  console.log('\n--- SECTION 4: Server-Side Price Authority & Razorpay Orders ---');

  // Attempt to tamper with price: send amount: 1 or amount: 999999
  const orderRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments/create-order', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: freshMemberCookie } },
    { planId: testPlan._id, amount: 1, purpose: 'membership' } // Client tries to pay ₹1
  );
  assert(orderRes.status === 201, '25. Razorpay order created successfully (HTTP 201)');
  assert(orderRes.data.data.orderId !== undefined, '26. Response contains orderId');
  assert(orderRes.data.data.amount === testPlan.price, '27. Server enforced authoritative plan price, ignoring tampered client amount');
  assert(orderRes.data.data.currency === 'INR', '28. Order currency is INR');
  assert(orderRes.data.data.receiptNumber !== undefined, '29. Order assigned unique receipt number');
  
  const createdOrderId = orderRes.data.data.orderId;
  const createdPaymentDocId = orderRes.data.data.paymentId;

  // Non-existent plan ID order creation -> 404
  const invalidPlanOrder = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments/create-order', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: freshMemberCookie } },
    { planId: '507f1f77bcf86cd799439011' }
  );
  assert(invalidPlanOrder.status === 404, '30. Non-existent plan rejected with HTTP 404');

  // --- SECTION 5: HMAC-SHA256 SIGNATURE VERIFICATION ---
  console.log('\n--- SECTION 5: HMAC-SHA256 Signature Verification & Membership Fulfillment ---');

  const fakePaymentId = `pay_test_${timestamp}`;

  // 1. Submit TAMPERED signature -> 400 Bad Request
  const badVerify = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments/verify', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: freshMemberCookie } },
    {
      razorpay_order_id: createdOrderId,
      razorpay_payment_id: fakePaymentId,
      razorpay_signature: 'fake_tampered_signature_hex_string_12345'
    }
  );
  assert(badVerify.status === 400, '31. Tampered signature rejected with HTTP 400');
  assert(badVerify.data.success === false, '32. Verification failure response');

  // 2. Submit AUTHENTIC HMAC-SHA256 signature
  const validSignature = crypto
    .createHmac('sha256', RAZORPAY_SECRET)
    .update(`${createdOrderId}|${fakePaymentId}`)
    .digest('hex');

  const goodVerify = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments/verify', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: freshMemberCookie } },
    {
      razorpay_order_id: createdOrderId,
      razorpay_payment_id: fakePaymentId,
      razorpay_signature: validSignature
    }
  );
  assert(goodVerify.status === 200, '33. Authentic HMAC-SHA256 signature accepted with HTTP 200');
  assert(goodVerify.data.data.payment.status === 'paid', '34. Payment status transitioned to "paid"');
  assert(goodVerify.data.data.payment.paidAt !== null, '35. paidAt timestamp recorded');

  // 3. Verify Member Membership was automatically fulfilled
  const checkMemberProfile = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/members/me/profile', method: 'GET', headers: { Cookie: freshMemberCookie } }
  );
  assert(checkMemberProfile.status === 200, '36. Member profile retrieved');
  const updatedMember = checkMemberProfile.data.data.member;
  assert(updatedMember.status === 'active', '37. Member status updated to "active"');
  assert(updatedMember.membershipPlan?._id?.toString() === testPlan._id.toString() || updatedMember.membershipPlan?.toString() === testPlan._id.toString(), '38. Member membershipPlan set to purchased plan');
  assert(updatedMember.membershipStartDate !== null, '39. Member membershipStartDate initialized');
  assert(updatedMember.membershipEndDate !== null, '40. Member membershipEndDate calculated properly');

  // 4. Verify Idempotent repeat verification on already paid order -> 200 OK
  const repeatVerify = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments/verify', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: freshMemberCookie } },
    {
      razorpay_order_id: createdOrderId,
      razorpay_payment_id: fakePaymentId,
      razorpay_signature: validSignature
    }
  );
  assert(repeatVerify.status === 200, '41. Duplicate verification call handled idempotently with HTTP 200');

  // --- SECTION 6: WEBHOOK SIGNATURE & IDEMPOTENCY ---
  console.log('\n--- SECTION 6: Raw-Body Webhooks & Event Idempotency ---');

  // Create another pending order for webhook fulfillment test
  const webhookOrderRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments/create-order', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: freshMemberCookie } },
    { planId: testPlan._id, purpose: 'renewal' }
  );
  assert(webhookOrderRes.status === 201, '42. Secondary order created for webhook test');
  const webhookOrderId = webhookOrderRes.data.data.orderId;
  const webhookPaymentId = `pay_wh_${timestamp}`;

  const webhookPayload = JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: webhookPaymentId,
          order_id: webhookOrderId,
          amount: testPlan.price * 100,
          currency: 'INR',
          status: 'captured',
          method: 'upi'
        }
      }
    }
  });

  const eventId = `evt_test_${timestamp}`;

  // 1. Webhook with invalid signature -> 400
  const badWebhook = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/payments/webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'bad_webhook_sig_hex_string',
        'x-razorpay-event-id': eventId
      }
    },
    webhookPayload
  );
  assert(badWebhook.status === 400, '43. Invalid webhook signature rejected with HTTP 400');

  // 2. Webhook with valid signature
  const validWebhookSig = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(webhookPayload)
    .digest('hex');

  const goodWebhook = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/payments/webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': validWebhookSig,
        'x-razorpay-event-id': eventId
      }
    },
    webhookPayload
  );
  assert(goodWebhook.status === 200, '44. Valid webhook accepted with HTTP 200');
  assert(goodWebhook.data.data.received === true, '45. Webhook response confirms receipt');

  // 3. Webhook idempotency: send same event again -> 200 with idempotent message
  const dupWebhook = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/payments/webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': validWebhookSig,
        'x-razorpay-event-id': eventId
      }
    },
    webhookPayload
  );
  assert(dupWebhook.status === 200, '46. Duplicate webhook event handled idempotently with HTTP 200');
  assert(dupWebhook.data.message.includes('idempotent'), '47. Response message indicates idempotent handling');

  // --- SECTION 7: ADMIN MANUAL PAYMENTS (CASH, UPI, CARD) ---
  console.log('\n--- SECTION 7: Admin Manual Offline Payments ---');

  // Find a member for manual payment (distinct from fresh member to test cross-access isolation)
  const membersList = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/members', method: 'GET', headers: { Cookie: adminCookie } }
  );
  assert(membersList.status === 200, '48. Admin retrieved members list');
  const targetMember = membersList.data.data.members.find(m => m.user?.email === 'member@ironforge.test') || 
                       membersList.data.data.members.find(m => m.user?.email !== freshEmail);
  assert(targetMember !== undefined, 'Found distinct target member for manual payment');

  // Record Cash Payment
  const manualCash = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments/manual', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    {
      memberId: targetMember._id,
      planId: testPlan._id,
      amount: testPlan.price,
      paymentMethod: 'cash',
      notes: 'Test cash receipt at front desk'
    }
  );
  assert(manualCash.status === 201, '49. Admin recorded manual Cash payment (HTTP 201)');
  assert(manualCash.data.data.payment.status === 'paid', '50. Manual payment is immediately status "paid"');
  assert(manualCash.data.data.payment.paymentMethod === 'cash', '51. Payment method stored as "cash"');
  assert(manualCash.data.data.payment.receiptNumber.startsWith('REC-'), '52. Receipt number format is REC-XXXXXX');

  const manualPaymentId = manualCash.data.data.payment._id;

  // Record UPI Payment
  const manualUpi = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments/manual', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    {
      memberId: targetMember._id,
      planId: testPlan._id,
      amount: testPlan.price,
      paymentMethod: 'upi',
      notes: 'Test UPI QR scan transaction'
    }
  );
  assert(manualUpi.status === 201, '53. Admin recorded manual UPI payment (HTTP 201)');
  assert(manualUpi.data.data.payment.paymentMethod === 'upi', '54. Payment method stored as "upi"');

  // Validation: Missing memberId -> 400
  const badManual = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments/manual', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    { planId: testPlan._id, amount: 500, paymentMethod: 'cash' }
  );
  assert(badManual.status === 400, '55. Manual payment without memberId rejected with HTTP 400');

  // --- SECTION 8: MEMBER PAYMENT ISOLATION & AUDITING ---
  console.log('\n--- SECTION 8: Member History & Cross-Account Isolation ---');

  // Member retrieves personal payment history
  const myPaymentsRes = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments/my-payments', method: 'GET', headers: { Cookie: freshMemberCookie } }
  );
  assert(myPaymentsRes.status === 200, '56. Member fetched personal payment history');
  assert(myPaymentsRes.data.data.payments.length >= 1, '57. History contains member payments');

  // Member fetches their own single payment
  const mySinglePayment = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/payments/${createdPaymentDocId}`, method: 'GET', headers: { Cookie: freshMemberCookie } }
  );
  assert(mySinglePayment.status === 200, '58. Member retrieved own payment detail');

  // Member attempts to fetch another member's payment -> 403 Forbidden
  const otherMemberTryAccess = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/payments/${manualPaymentId}`, method: 'GET', headers: { Cookie: freshMemberCookie } }
  );
  assert(otherMemberTryAccess.status === 403, '59. Member blocked from accessing another athlete payment receipt (HTTP 403)');

  // --- SECTION 9: ADMIN STATS, FILTERS, NOTES & REFERENCE INTEGRITY ---
  console.log('\n--- SECTION 9: Admin Analytics, Filters, Notes & Reference Protection ---');

  // Admin stats
  const adminStats = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments/stats', method: 'GET', headers: { Cookie: adminCookie } }
  );
  assert(adminStats.status === 200, '60. Admin retrieved payment stats');
  assert(adminStats.data.data.stats.totalRevenue > 0, '61. Stats totalRevenue is greater than 0');
  assert(adminStats.data.data.stats.paidTransactions >= 1, '62. Stats paidTransactions is greater than or equal to 1');

  // Admin filter by status
  const filterPaid = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments?status=paid', method: 'GET', headers: { Cookie: adminCookie } }
  );
  assert(filterPaid.status === 200, '63. Admin filtered payments by status=paid');
  assert(filterPaid.data.data.payments.every(p => p.status === 'paid'), '64. All filtered payments have status "paid"');

  // Admin filter by paymentMethod
  const filterCash = await request(
    { hostname: '127.0.0.1', port: 5000, path: '/api/payments?paymentMethod=cash', method: 'GET', headers: { Cookie: adminCookie } }
  );
  assert(filterCash.status === 200, '65. Admin filtered payments by paymentMethod=cash');
  assert(filterCash.data.data.payments.every(p => p.paymentMethod === 'cash'), '66. All filtered payments have method "cash"');

  // Admin update payment notes
  const updateNotes = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/payments/${manualPaymentId}/notes`, method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
    { notes: 'Updated notes via audit process' }
  );
  assert(updateNotes.status === 200, '67. Admin updated payment notes');
  assert(updateNotes.data.data.payment.notes === 'Updated notes via audit process', '68. Notes updated in payment document');

  // Member trying to update notes -> 403
  const memberTryUpdateNotes = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/payments/${manualPaymentId}/notes`, method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: freshMemberCookie } },
    { notes: 'Hacker note' }
  );
  assert(memberTryUpdateNotes.status === 403, '69. Member denied updating payment notes (HTTP 403)');

  // Reference Integrity: Attempting to delete a member who has payments must fail with 409 Conflict
  const tryDeleteMember = await request(
    { hostname: '127.0.0.1', port: 5000, path: `/api/members/${targetMember._id}`, method: 'DELETE', headers: { Cookie: adminCookie } }
  );
  assert(tryDeleteMember.status === 409, '70. Deleting member with payment history rejected with HTTP 409 Conflict');
  assert(tryDeleteMember.data.message.includes('payment records'), '71. Conflict message clearly references payment records');

  console.log('\n==================================================');
  console.log(`🎉 ALL ${passedCount}/${totalCount} PHASE 8 TESTS PASSED SUCCESSFULLY!`);
  console.log('==================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test Suite Aborted with Error:', err);
  process.exit(1);
});