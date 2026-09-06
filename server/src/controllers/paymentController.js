const crypto = require('crypto');
const Razorpay = require('razorpay');
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const WebhookEvent = require('../models/WebhookEvent');
const Member = require('../models/Member');
const MembershipPlan = require('../models/MembershipPlan');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationHelper');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Initialize Razorpay instance safely
 */
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_IronForgeGym2026Test';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'IronForgeRazorpaySecret2026Key';

  try {
    return new Razorpay({ key_id, key_secret });
  } catch (err) {
    console.warn('[Razorpay] Initialization warning:', err.message);
    return null;
  }
};

/**
 * Helper to safely create an order with fallback for local unit tests / sandbox
 */
const createGatewayOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  const amountInPaise = Math.round(amount * 100);
  const rzp = getRazorpayInstance();

  // If real/test Razorpay API credentials can be queried
  if (rzp && process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes('placeholder')) {
    try {
      const order = await rzp.orders.create({
        amount: amountInPaise,
        currency,
        receipt: receipt.substring(0, 40), // Razorpay receipt max 40 chars
        notes,
      });
      return { id: order.id, amount: order.amount, currency: order.currency, receipt: order.receipt };
    } catch (apiErr) {
      console.warn('[Razorpay API] SDK order creation error (using standardized sandbox order):', apiErr.message);
    }
  }

  // Standardized Sandbox/Test order generation
  const hash = crypto.createHash('md5').update(`${receipt}_${Date.now()}`).digest('hex').substring(0, 14);
  return {
    id: `order_${hash}`,
    amount: amountInPaise,
    currency,
    receipt,
  };
};

/**
 * Helper to generate unique receipt numbers
 */
const generateReceiptNumber = (prefix = 'REC') => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Fulfill membership for a paid payment record (Idempotent & Safe)
 */
const fulfillMembership = async (payment) => {
  if (!payment || !payment.member) {
    throw new Error('Cannot fulfill membership: missing payment or member reference');
  }

  const member = await Member.findById(payment.member);
  if (!member) {
    throw new Error(`Member with ID ${payment.member} not found during fulfillment`);
  }

  // If payment has an associated membership plan
  if (payment.membershipPlan) {
    const plan = await MembershipPlan.findById(payment.membershipPlan);
    if (plan) {
      const now = new Date();
      let newStartDate = now;
      let newEndDate = new Date();

      // Check if current membership is still active (renewal extension)
      const isRenewal = member.membershipEndDate && new Date(member.membershipEndDate) > now;
      if (isRenewal) {
        newStartDate = member.membershipStartDate || now;
        newEndDate = new Date(member.membershipEndDate);
      }

      // Add plan duration in months to end date
      const durationMonths = Number(plan.duration) || 1;
      newEndDate.setMonth(newEndDate.getMonth() + durationMonths);

      member.membershipPlan = plan._id;
      member.membershipStartDate = newStartDate;
      member.membershipEndDate = newEndDate;
      member.status = 'active';

      await member.save();

      // Dispatch real-time in-app notification to member
      if (member.user) {
        const notifType = isRenewal ? 'membership_renewed' : 'payment_success';
        const notifTitle = isRenewal ? 'Membership Renewed' : 'Payment Received';
        const notifMsg = isRenewal
          ? `Your ${plan.name} membership has been renewed until ${newEndDate.toLocaleDateString()}.`
          : `Payment of $${payment.amount} for ${plan.name} was successful. Membership is active!`;

        await createNotification({
          recipient: member.user._id || member.user,
          type: notifType,
          title: notifTitle,
          message: notifMsg,
          relatedEntityType: 'Payment',
          relatedEntityId: payment._id,
          idempotencyKey: `pay_ful_${payment._id}`,
        });
      }
    }
  }

  return member;
};

/**
 * @route   GET /api/payments/config
 * @desc    Get public Razorpay configuration (Key ID only - NEVER secrets)
 * @access  Protected (Authenticated Users)
 */
const getPaymentConfig = async (req, res) => {
  try {
    return successResponse(res, 'Payment configuration retrieved', {
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_IronForgeGym2026Test',
      currency: 'INR',
    });
  } catch (error) {
    return errorResponse(res, 'Error fetching payment configuration', error, 500);
  }
};

/**
 * @route   POST /api/payments/create-order
 * @desc    Create a Razorpay Order for a Membership Plan (Authoritative DB Pricing)
 * @access  Protected (Member / Admin)
 */
const createRazorpayOrder = async (req, res) => {
  try {
    const { planId, memberId } = req.body;

    // Gating check: User must be active
    if (req.user.status === 'inactive') {
      return errorResponse(res, 'Your account is inactive. Payment initiation is disabled.', null, 403);
    }

    // Determine target member
    let member = null;
    if (req.user.role === 'member') {
      member = await Member.findOne({ user: req.user._id });
    } else if (req.user.role === 'admin' && memberId) {
      if (!mongoose.Types.ObjectId.isValid(memberId)) {
        return errorResponse(res, 'Invalid Member ID provided', null, 400);
      }
      member = await Member.findById(memberId);
    } else {
      member = await Member.findOne({ user: req.user._id });
    }

    if (!member) {
      return errorResponse(res, 'Member profile not found for this account', null, 404);
    }

    // Validate Membership Plan
    if (!planId || !mongoose.Types.ObjectId.isValid(planId)) {
      return errorResponse(res, 'Please provide a valid Membership Plan ID', null, 400);
    }

    const plan = await MembershipPlan.findById(planId);
    if (!plan) {
      return errorResponse(res, 'Selected Membership Plan does not exist', null, 404);
    }

    if (plan.status !== 'active') {
      return errorResponse(res, 'Selected Membership Plan is currently not active for purchase', null, 400);
    }

    // Authoritative Price from DB - Ignore any client supplied amount
    const authoritativeAmount = Number(plan.price);
    if (!Number.isFinite(authoritativeAmount) || authoritativeAmount <= 0) {
      return errorResponse(res, 'Authoritative plan price is invalid and must be greater than 0', null, 400);
    }

    // Generate unique receipt number
    const receiptNumber = generateReceiptNumber('REC-RZP');

    // Create Razorpay Order via Orders API
    const rzpOrder = await createGatewayOrder({
      amount: authoritativeAmount,
      currency: 'INR',
      receipt: receiptNumber,
      notes: {
        memberId: member._id.toString(),
        planId: plan._id.toString(),
        userId: req.user._id.toString(),
      },
    });

    // Create Pending Payment record in Database
    const isRenewal = Boolean(member.membershipPlan);
    const payment = await Payment.create({
      member: member._id,
      membershipPlan: plan._id,
      amount: authoritativeAmount,
      currency: 'INR',
      paymentMethod: 'razorpay',
      status: 'pending',
      purpose: isRenewal ? 'renewal' : 'membership',
      razorpayOrderId: rzpOrder.id,
      receiptNumber,
      paymentDate: new Date(),
      notes: `Online checkout order created for ${plan.name} ($${authoritativeAmount})`,
      recordedBy: req.user._id,
    });

    return successResponse(
      res,
      'Razorpay order created successfully',
      {
        orderId: rzpOrder.id,
        amount: authoritativeAmount,
        amountInPaise: rzpOrder.amount,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_IronForgeGym2026Test',
        receiptNumber,
        paymentId: payment._id,
        plan: {
          id: plan._id,
          name: plan.name,
          price: plan.price,
          duration: plan.duration,
        },
      },
      201
    );
  } catch (error) {
    return errorResponse(res, 'Error creating payment order', error, 500);
  }
};

/**
 * @route   POST /api/payments/verify-payment
 * @desc    Verify Razorpay payment signature & fulfill membership
 * @access  Protected (Member / Admin)
 */
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return errorResponse(
        res,
        'Incomplete payment verification payload. Order ID, Payment ID, and Signature are required.',
        null,
        400
      );
    }

    // Locate pending Payment record by Razorpay Order ID
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) {
      return errorResponse(res, 'Payment record matching this order was not found', null, 404);
    }

    // Verify ownership if caller is a member
    if (req.user.role === 'member') {
      const member = await Member.findOne({ user: req.user._id });
      if (!member || payment.member.toString() !== member._id.toString()) {
        return errorResponse(res, 'Unauthorized to verify payment belonging to another athlete', null, 403);
      }
    }

    // Cryptographic HMAC-SHA256 Signature Verification
    const secret = process.env.RAZORPAY_KEY_SECRET || 'IronForgeRazorpaySecret2026Key';
    const payloadToSign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(payloadToSign).digest('hex');

    const isSignatureValid =
      expectedSignature.length === razorpay_signature.length &&
      crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpay_signature));

    if (!isSignatureValid) {
      payment.status = 'failed';
      payment.notes = `Signature verification failed at ${new Date().toISOString()}`;
      await payment.save();

      return errorResponse(
        res,
        'Invalid payment signature. Transaction could not be verified.',
        { razorpayOrderId: razorpay_order_id },
        400
      );
    }

    // Idempotency: If already marked paid with same details, return immediately without duplicate fulfillment
    if (payment.status === 'paid') {
      const currentMember = await Member.findById(payment.member).populate('membershipPlan');
      return successResponse(res, 'Payment has already been verified and processed', {
        payment: payment.toReceiptJSON(),
        member: currentMember,
        alreadyProcessed: true,
      });
    }

    // Guard against payment transaction ID re-use across distinct orders
    const existingPaidTx = await Payment.findOne({
      razorpayPaymentId: razorpay_payment_id,
      _id: { $ne: payment._id },
      status: 'paid',
    });
    if (existingPaidTx) {
      return errorResponse(res, 'This Razorpay payment transaction ID has already been credited to another order.', null, 400);
    }

    // Mark payment as paid
    payment.status = 'paid';
    payment.paidAt = new Date();
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.notes = (payment.notes ? payment.notes + ' | ' : '') + 'Verified successfully via server signature check';
    await payment.save();

    // Authoritatively fulfill membership
    const updatedMember = await fulfillMembership(payment);
    const populatedMember = await Member.findById(updatedMember._id).populate('membershipPlan');

    return successResponse(res, 'Payment verified successfully. Membership activated!', {
      payment: payment.toReceiptJSON(),
      member: populatedMember,
    });
  } catch (error) {
    return errorResponse(res, 'Error verifying payment signature', error, 500);
  }
};

/**
 * @route   POST /api/payments/webhook
 * @desc    Razorpay Webhook Handler with raw-body signature validation and idempotency
 * @access  Public (Signature Verified)
 */
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'IronForgeWebhookSecret2026Secure';

    if (!signature) {
      return errorResponse(res, 'Missing X-Razorpay-Signature header', null, 400);
    }

    // Use raw request body buffer
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
    const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

    const isSignatureValid =
      expectedSignature.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));

    if (!isSignatureValid) {
      return errorResponse(res, 'Invalid webhook signature', null, 400);
    }

    // Webhook Idempotency Check using event ID
    const eventId = req.headers['x-razorpay-event-id'] || req.body?.event_id || req.body?.id;
    if (eventId) {
      const existingEvent = await WebhookEvent.findOne({ eventId });
      if (existingEvent) {
        return successResponse(res, 'Webhook event already processed (idempotent)', { eventId });
      }

      try {
        await WebhookEvent.create({
          eventId,
          eventType: req.body?.event || 'unknown',
          status: 'processed',
        });
      } catch (err) {
        if (err.code === 11000) {
          return successResponse(res, 'Webhook event duplicate ignored', { eventId });
        }
      }
    }

    const event = req.body?.event;
    const payload = req.body?.payload;

    // Process payment.captured / order.paid
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload?.payment?.entity;
      const orderId = paymentEntity?.order_id || payload?.order?.entity?.id;
      const paymentId = paymentEntity?.id;

      if (orderId) {
        const payment = await Payment.findOne({ razorpayOrderId: orderId });
        if (payment && payment.status !== 'paid') {
          payment.status = 'paid';
          payment.paidAt = paymentEntity?.created_at ? new Date(paymentEntity.created_at * 1000) : new Date();
          if (paymentId) payment.razorpayPaymentId = paymentId;
          payment.notes = (payment.notes ? payment.notes + ' | ' : '') + `Captured via Webhook event: ${event}`;
          await payment.save();

          await fulfillMembership(payment);
        }
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      if (orderId) {
        const payment = await Payment.findOne({ razorpayOrderId: orderId });
        if (payment && payment.status === 'pending') {
          payment.status = 'failed';
          payment.notes = paymentEntity?.error_description || 'Payment failed (Webhook)';
          await payment.save();
        }
      }
    }

    return successResponse(res, 'Webhook processed successfully', { received: true, event });
  } catch (error) {
    return errorResponse(res, 'Error processing webhook', error, 500);
  }
};

/**
 * @route   POST /api/payments/manual
 * @desc    Record manual/offline payment (Cash, UPI, Card, etc.) & fulfill membership
 * @access  Protected (Admin Only)
 */
const recordManualPayment = async (req, res) => {
  try {
    const { memberId, planId, amount, paymentMethod, paymentDate, notes, receiptNumber, purpose } = req.body;

    if (!memberId || !mongoose.Types.ObjectId.isValid(memberId)) {
      return errorResponse(res, 'Please specify a valid Member ID', null, 400);
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return errorResponse(res, 'Member not found', null, 404);
    }

    let plan = null;
    if (planId) {
      if (!mongoose.Types.ObjectId.isValid(planId)) {
        return errorResponse(res, 'Invalid Membership Plan ID', null, 400);
      }
      plan = await MembershipPlan.findById(planId);
      if (!plan) {
        return errorResponse(res, 'Membership plan not found', null, 404);
      }
    }

    // Determine amount: explicit amount or fallback to plan price
    let finalAmount;
    if (amount !== undefined && amount !== null && amount !== '') {
      const parsedAmount = Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return errorResponse(res, 'Payment amount must be a valid positive number greater than 0', null, 400);
      }
      finalAmount = parsedAmount;
    } else if (plan) {
      const planPrice = Number(plan.price);
      if (!Number.isFinite(planPrice) || planPrice <= 0) {
        return errorResponse(res, 'Authoritative plan price must be a valid positive number', null, 400);
      }
      finalAmount = planPrice;
    } else {
      return errorResponse(res, 'Payment amount is required and must be a positive number', null, 400);
    }

    const validMethods = ['cash', 'upi', 'card', 'bank_transfer', 'other'];
    if (paymentMethod && !validMethods.includes(paymentMethod)) {
      return errorResponse(res, `Invalid payment method '${paymentMethod}'. Supported methods: ${validMethods.join(', ')}`, null, 400);
    }
    const method = paymentMethod || 'cash';

    const finalReceiptNumber = receiptNumber?.trim() || generateReceiptNumber('REC-MAN');

    // Check duplicate receipt number if custom provided
    if (receiptNumber) {
      const existingReceipt = await Payment.findOne({ receiptNumber: finalReceiptNumber });
      if (existingReceipt) {
        return errorResponse(res, `Receipt number ${finalReceiptNumber} already exists in records`, null, 409);
      }
    }

    const parsedDate = paymentDate ? new Date(paymentDate) : new Date();

    const payment = await Payment.create({
      member: member._id,
      membershipPlan: plan ? plan._id : null,
      amount: finalAmount,
      currency: 'INR',
      paymentMethod: method,
      status: 'paid',
      purpose: purpose || (member.membershipPlan ? 'renewal' : 'membership'),
      receiptNumber: finalReceiptNumber,
      paymentDate: parsedDate,
      paidAt: parsedDate,
      notes: notes || `Manual ${method.toUpperCase()} payment recorded by Administrator`,
      recordedBy: req.user._id,
    });

    // Fulfill membership if plan is linked
    if (plan) {
      await fulfillMembership(payment);
    }

    const populatedPayment = await Payment.findById(payment._id)
      .populate({ path: 'member', populate: { path: 'user', select: 'name email' } })
      .populate('membershipPlan')
      .populate('recordedBy', 'name email');

    return successResponse(
      res,
      `Manual payment of ₹${finalAmount} recorded successfully`,
      { payment: populatedPayment },
      201
    );
  } catch (error) {
    return errorResponse(res, 'Error recording manual payment', error, 500);
  }
};

/**
 * @route   GET /api/payments/my-payments
 * @desc    Get authenticated member's payment history
 * @access  Protected (Member)
 */
const getMyPayments = async (req, res) => {
  try {
    const member = await Member.findOne({ user: req.user._id }).populate('membershipPlan');
    if (!member) {
      return errorResponse(res, 'Member record not found for this user', null, 404);
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = { member: member._id };

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('membershipPlan', 'name duration price')
        .sort({ paymentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(query),
    ]);

    // Calculate member payment summary stats
    const totalPaidSum = await Payment.aggregate([
      { $match: { member: member._id, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    const summary = {
      totalSpent: totalPaidSum[0]?.total || 0,
      totalPaidTransactions: totalPaidSum[0]?.count || 0,
      currentPlan: member.membershipPlan,
      membershipStartDate: member.membershipStartDate,
      membershipEndDate: member.membershipEndDate,
      memberStatus: member.status,
    };

    return successResponse(res, 'Member payment history retrieved', {
      payments,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      summary,
    });
  } catch (error) {
    return errorResponse(res, 'Error fetching member payment history', error, 500);
  }
};

/**
 * @route   GET /api/payments/all
 * @desc    Get gym-wide payments with filtering & pagination
 * @access  Protected (Admin Only)
 */
const getAllPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const { status, paymentMethod, memberId, planId, startDate, endDate, search } = req.query;

    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (paymentMethod && paymentMethod !== 'all') {
      filter.paymentMethod = paymentMethod;
    }

    if (memberId && mongoose.Types.ObjectId.isValid(memberId)) {
      filter.member = memberId;
    }

    if (planId && mongoose.Types.ObjectId.isValid(planId)) {
      filter.membershipPlan = planId;
    }

    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        filter.paymentDate.$lte = eDate;
      }
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const matchingUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      }).select('_id');
      const userIds = matchingUsers.map((u) => u._id);

      const matchingMembers = await Member.find({
        $or: [{ user: { $in: userIds } }, { phone: searchRegex }],
      }).select('_id');
      const memberIds = matchingMembers.map((m) => m._id);

      filter.$or = [
        { receiptNumber: searchRegex },
        { razorpayPaymentId: searchRegex },
        { razorpayOrderId: searchRegex },
        { member: { $in: memberIds } },
      ];
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate({ path: 'member', populate: { path: 'user', select: 'name email' } })
        .populate('membershipPlan', 'name price duration')
        .populate('recordedBy', 'name email')
        .sort({ paymentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(filter),
    ]);

    return successResponse(res, 'Payments retrieved successfully', {
      payments,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    return errorResponse(res, 'Error fetching payment records', error, 500);
  }
};

/**
 * @route   GET /api/payments/stats
 * @desc    Get authoritative financial & billing statistics
 * @access  Protected (Admin Only)
 */
const getPaymentStats = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));

    const [
      totalRevenueResult,
      todayRevenueResult,
      monthRevenueResult,
      statusCounts,
      methodBreakdown,
      totalCount,
    ] = await Promise.all([
      // Total Revenue
      Payment.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Today's Revenue
      Payment.aggregate([
        { $match: { status: 'paid', paidAt: { $gte: todayStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Month Revenue
      Payment.aggregate([
        { $match: { status: 'paid', paidAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Status Counts
      Payment.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      // Method Breakdown
      Payment.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      // Total Transactions Count
      Payment.countDocuments(),
    ]);

    const statusMap = {
      paid: 0,
      pending: 0,
      failed: 0,
      refunded: 0,
      cancelled: 0,
    };
    statusCounts.forEach((s) => {
      if (s._id) statusMap[s._id] = s.count;
    });

    const stats = {
      totalRevenue: totalRevenueResult[0]?.total || 0,
      todayRevenue: todayRevenueResult[0]?.total || 0,
      thisMonthRevenue: monthRevenueResult[0]?.total || 0,
      totalTransactions: totalCount,
      paidTransactions: statusMap.paid,
      pendingTransactions: statusMap.pending,
      failedTransactions: statusMap.failed,
      refundedTransactions: statusMap.refunded,
      methodBreakdown: methodBreakdown.map((m) => ({
        method: m._id,
        revenue: m.total,
        count: m.count,
      })),
    };

    return successResponse(res, 'Payment statistics calculated successfully', { stats });
  } catch (error) {
    return errorResponse(res, 'Error calculating payment statistics', error, 500);
  }
};

/**
 * @route   GET /api/payments/:id
 * @desc    Get payment receipt/details by ID with RBAC ownership check
 * @access  Protected (Member [own] / Admin)
 */
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid payment ID format', null, 400);
    }

    const payment = await Payment.findById(id)
      .populate({ path: 'member', populate: { path: 'user', select: 'name email role status' } })
      .populate('membershipPlan')
      .populate('recordedBy', 'name email');

    if (!payment) {
      return errorResponse(res, 'Payment record not found', null, 404);
    }

    // Role-based access control
    if (req.user.role === 'member') {
      const currentMember = await Member.findOne({ user: req.user._id });
      if (!currentMember || payment.member?._id.toString() !== currentMember._id.toString()) {
        return errorResponse(res, 'Access denied to this payment receipt', null, 403);
      }
    } else if (req.user.role === 'trainer') {
      return errorResponse(res, 'Trainers are not authorized to view financial payment records', null, 403);
    }

    return successResponse(res, 'Payment record retrieved', { payment: payment.toReceiptJSON() });
  } catch (error) {
    return errorResponse(res, 'Error retrieving payment record', error, 500);
  }
};

/**
 * @route   PATCH /api/payments/:id/notes
 * @desc    Update administrative notes for a payment record
 * @access  Protected (Admin Only)
 */
const updatePaymentNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid payment ID format', null, 400);
    }

    const payment = await Payment.findById(id);
    if (!payment) {
      return errorResponse(res, 'Payment record not found', null, 404);
    }

    payment.notes = typeof notes === 'string' ? notes.trim() : payment.notes;
    await payment.save();

    return successResponse(res, 'Payment notes updated successfully', { payment: payment.toReceiptJSON() });
  } catch (error) {
    return errorResponse(res, 'Error updating payment notes', error, 500);
  }
};

module.exports = {
  getPaymentConfig,
  createRazorpayOrder,
  verifyPayment,
  handleWebhook,
  recordManualPayment,
  getMyPayments,
  getAllPayments,
  getPaymentStats,
  getPaymentById,
  updatePaymentNotes,
  fulfillMembership,
  generateReceiptNumber,
};
