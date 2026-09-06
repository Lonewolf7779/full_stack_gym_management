const mongoose = require('mongoose');
const MemberProgress = require('../models/MemberProgress');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationHelper');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Helper to compute progress statistics from chronological records
 */
const calculateProgressStats = (records) => {
  if (!records || records.length === 0) {
    return {
      totalRecords: 0,
      currentWeight: null,
      startingWeight: null,
      weightChange: null,
      currentBodyFat: null,
      startingBodyFat: null,
      bodyFatChange: null,
      latestChest: null,
      latestWaist: null,
      latestHips: null,
      latestArms: null,
      latestThighs: null,
      lastRecordedDate: null,
    };
  }

  // records are sorted descending (latest first)
  const latest = records[0];
  // find earliest valid weight
  const recordsWithWeight = records.filter((r) => r.weight !== null && r.weight !== undefined && Number.isFinite(r.weight));
  const latestWeightRec = recordsWithWeight[0];
  const earliestWeightRec = recordsWithWeight[recordsWithWeight.length - 1];

  const currentWeight = latestWeightRec ? latestWeightRec.weight : null;
  const startingWeight = earliestWeightRec ? earliestWeightRec.weight : null;
  const weightChange =
    currentWeight !== null && startingWeight !== null && recordsWithWeight.length > 1
      ? Number((currentWeight - startingWeight).toFixed(2))
      : null;

  // body fat %
  const recordsWithBF = records.filter(
    (r) => r.bodyFatPercentage !== null && r.bodyFatPercentage !== undefined && Number.isFinite(r.bodyFatPercentage)
  );
  const latestBFRec = recordsWithBF[0];
  const earliestBFRec = recordsWithBF[recordsWithBF.length - 1];

  const currentBodyFat = latestBFRec ? latestBFRec.bodyFatPercentage : null;
  const startingBodyFat = earliestBFRec ? earliestBFRec.bodyFatPercentage : null;
  const bodyFatChange =
    currentBodyFat !== null && startingBodyFat !== null && recordsWithBF.length > 1
      ? Number((currentBodyFat - startingBodyFat).toFixed(2))
      : null;

  // Find latest measurements
  const latestChest = records.find((r) => Number.isFinite(r.chest))?.chest || null;
  const latestWaist = records.find((r) => Number.isFinite(r.waist))?.waist || null;
  const latestHips = records.find((r) => Number.isFinite(r.hips))?.hips || null;
  const latestArms = records.find((r) => Number.isFinite(r.arms))?.arms || null;
  const latestThighs = records.find((r) => Number.isFinite(r.thighs))?.thighs || null;

  return {
    totalRecords: records.length,
    currentWeight,
    startingWeight,
    weightChange,
    currentBodyFat,
    startingBodyFat,
    bodyFatChange,
    latestChest,
    latestWaist,
    latestHips,
    latestArms,
    latestThighs,
    lastRecordedDate: latest.recordedAt,
  };
};

/**
 * @desc    Create a new progress record for a member
 * @route   POST /api/progress
 * @access  Private (Member [self] / Trainer [assigned] / Admin)
 */
const createProgress = async (req, res, next) => {
  try {
    const { memberId, recordedAt, weight, bodyFatPercentage, chest, waist, hips, arms, thighs, notes } = req.body;

    let targetMember = null;

    if (req.user.role === 'member') {
      targetMember = await Member.findOne({ user: req.user._id });
      if (!targetMember) {
        return errorResponse(res, 'Member profile not found for this account', null, 404);
      }
    } else if (req.user.role === 'trainer') {
      if (!memberId || !mongoose.Types.ObjectId.isValid(memberId)) {
        return errorResponse(res, 'Please provide a valid athlete member ID', null, 400);
      }

      const trainer = await Trainer.findOne({ user: req.user._id });
      if (!trainer) {
        return errorResponse(res, 'Trainer profile not found', null, 404);
      }

      targetMember = await Member.findById(memberId);
      if (!targetMember) {
        return errorResponse(res, 'Athlete not found', null, 404);
      }

      // Verify trainer assignment
      if (!targetMember.assignedTrainer || targetMember.assignedTrainer.toString() !== trainer._id.toString()) {
        return errorResponse(
          res,
          'Access denied: You can only record progress for athletes on your coaching roster.',
          null,
          403
        );
      }
    } else if (req.user.role === 'admin') {
      if (!memberId || !mongoose.Types.ObjectId.isValid(memberId)) {
        return errorResponse(res, 'Please provide a valid Member ID', null, 400);
      }

      targetMember = await Member.findById(memberId);
      if (!targetMember) {
        return errorResponse(res, 'Member not found', null, 404);
      }
    }

    // Numerical validation helper
    const parseNumber = (val, min, max, name) => {
      if (val === undefined || val === null || val === '') return null;
      const num = Number(val);
      if (!Number.isFinite(num) || isNaN(num)) {
        throw new Error(`${name} must be a valid finite number.`);
      }
      if (num < min || num > max) {
        throw new Error(`${name} must be between ${min} and ${max}.`);
      }
      return num;
    };

    let pWeight = null;
    let pBodyFat = null;
    let pChest = null;
    let pWaist = null;
    let pHips = null;
    let pArms = null;
    let pThighs = null;

    try {
      pWeight = parseNumber(weight, 20, 500, 'Weight (kg)');
      pBodyFat = parseNumber(bodyFatPercentage, 1, 75, 'Body fat percentage');
      pChest = parseNumber(chest, 20, 250, 'Chest measurement (cm)');
      pWaist = parseNumber(waist, 20, 250, 'Waist measurement (cm)');
      pHips = parseNumber(hips, 20, 250, 'Hips measurement (cm)');
      pArms = parseNumber(arms, 10, 100, 'Arms measurement (cm)');
      pThighs = parseNumber(thighs, 15, 150, 'Thighs measurement (cm)');
    } catch (valErr) {
      return errorResponse(res, valErr.message, null, 400);
    }

    // Ensure at least one metric is present
    const hasAnyMetric = [pWeight, pBodyFat, pChest, pWaist, pHips, pArms, pThighs].some((v) => v !== null);
    if (!hasAnyMetric) {
      return errorResponse(
        res,
        'At least one fitness measurement (weight, body fat %, chest, waist, hips, arms, or thighs) must be provided.',
        null,
        400
      );
    }

    const progressDate = recordedAt ? new Date(recordedAt) : new Date();
    if (isNaN(progressDate.getTime())) {
      return errorResponse(res, 'Invalid recordedAt date format', null, 400);
    }

    const progress = await MemberProgress.create({
      member: targetMember._id,
      recordedAt: progressDate,
      weight: pWeight,
      bodyFatPercentage: pBodyFat,
      chest: pChest,
      waist: pWaist,
      hips: pHips,
      arms: pArms,
      thighs: pThighs,
      notes: typeof notes === 'string' ? notes.trim() : '',
      recordedBy: req.user._id,
    });

    const populatedProgress = await MemberProgress.findById(progress._id)
      .populate({ path: 'member', populate: { path: 'user', select: 'name email' } })
      .populate('recordedBy', 'name email role');

    // Notify member if recorded by a Coach or Admin
    if (req.user.role !== 'member' && targetMember.user) {
      const coachTitle = req.user.role === 'trainer' ? 'Coach' : 'Administrator';
      await createNotification({
        recipient: targetMember.user,
        type: 'progress_updated',
        title: 'New Fitness Metrics Logged',
        message: `${coachTitle} ${req.user.name} logged updated fitness measurements for your profile.`,
        relatedEntityType: 'MemberProgress',
        relatedEntityId: progress._id,
        idempotencyKey: `prog_${progress._id}`,
      });
    }

    return successResponse(res, 'Fitness progress record created successfully.', { progress: populatedProgress }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get authenticated member's progress history & statistics
 * @route   GET /api/progress/me
 * @access  Private (Member only)
 */
const getMyProgress = async (req, res, next) => {
  try {
    const member = await Member.findOne({ user: req.user._id });
    if (!member) {
      return errorResponse(res, 'Member profile not found', null, 404);
    }

    const records = await MemberProgress.find({ member: member._id })
      .populate('recordedBy', 'name email role')
      .sort({ recordedAt: -1, createdAt: -1 });

    const stats = calculateProgressStats(records);
    const trendPoints = records
      .slice()
      .reverse()
      .map((r) => ({
        id: r._id,
        date: r.recordedAt,
        weight: r.weight,
        bodyFat: r.bodyFatPercentage,
      }));

    return successResponse(res, 'Personal progress history retrieved successfully.', {
      records,
      stats,
      trendPoints,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get progress history & stats for a specific member
 * @route   GET /api/progress/member/:memberId
 * @access  Private (Member [own] / Trainer [assigned] / Admin)
 */
const getMemberProgress = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    if (!memberId || !mongoose.Types.ObjectId.isValid(memberId)) {
      return errorResponse(res, 'Invalid Member ID provided', null, 400);
    }

    const member = await Member.findById(memberId)
      .populate('user', 'name email status')
      .populate('assignedTrainer');

    if (!member) {
      return errorResponse(res, 'Member not found', null, 404);
    }

    // Role-based access control
    if (req.user.role === 'member') {
      if (member.user?._id.toString() !== req.user._id.toString()) {
        return errorResponse(res, 'Access denied to another member’s fitness progress', null, 403);
      }
    } else if (req.user.role === 'trainer') {
      const trainer = await Trainer.findOne({ user: req.user._id });
      if (!trainer || !member.assignedTrainer || member.assignedTrainer._id?.toString() !== trainer._id.toString()) {
        return errorResponse(res, 'Access denied: You can only view progress for athletes on your roster.', null, 403);
      }
    }

    const records = await MemberProgress.find({ member: member._id })
      .populate('recordedBy', 'name email role')
      .sort({ recordedAt: -1, createdAt: -1 });

    const stats = calculateProgressStats(records);
    const trendPoints = records
      .slice()
      .reverse()
      .map((r) => ({
        id: r._id,
        date: r.recordedAt,
        weight: r.weight,
        bodyFat: r.bodyFatPercentage,
      }));

    return successResponse(res, 'Member progress records retrieved successfully.', {
      member: {
        _id: member._id,
        user: member.user,
        status: member.status,
      },
      records,
      stats,
      trendPoints,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get gym-wide progress records with search and pagination
 * @route   GET /api/progress
 * @access  Private (Admin only)
 */
const getAllProgress = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const { memberId, search, startDate, endDate } = req.query;
    const filter = {};

    if (memberId && mongoose.Types.ObjectId.isValid(memberId)) {
      filter.member = memberId;
    }

    if (startDate || endDate) {
      filter.recordedAt = {};
      if (startDate) filter.recordedAt.$gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        filter.recordedAt.$lte = eDate;
      }
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const matchingUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      }).select('_id');
      const userIds = matchingUsers.map((u) => u._id);

      const matchingMembers = await Member.find({ user: { $in: userIds } }).select('_id');
      const memberIds = matchingMembers.map((m) => m._id);

      filter.$or = [{ member: { $in: memberIds } }, { notes: searchRegex }];
    }

    const [records, total] = await Promise.all([
      MemberProgress.find(filter)
        .populate({ path: 'member', populate: { path: 'user', select: 'name email' } })
        .populate('recordedBy', 'name email role')
        .sort({ recordedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      MemberProgress.countDocuments(filter),
    ]);

    return successResponse(res, 'Gym-wide progress records retrieved successfully.', {
      records,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single progress record by ID
 * @route   GET /api/progress/:id
 * @access  Private (Member [own] / Trainer [assigned] / Admin)
 */
const getProgressById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid progress record ID', null, 400);
    }

    const progress = await MemberProgress.findById(id)
      .populate({ path: 'member', populate: { path: 'user', select: 'name email' } })
      .populate('recordedBy', 'name email role');

    if (!progress) {
      return errorResponse(res, 'Progress record not found', null, 404);
    }

    // RBAC check
    if (req.user.role === 'member') {
      const currentMember = await Member.findOne({ user: req.user._id });
      if (!currentMember || progress.member?._id?.toString() !== currentMember._id.toString()) {
        return errorResponse(res, 'Access denied to this progress record', null, 403);
      }
    } else if (req.user.role === 'trainer') {
      const trainer = await Trainer.findOne({ user: req.user._id });
      const targetMember = await Member.findById(progress.member?._id);
      if (!trainer || !targetMember?.assignedTrainer || targetMember.assignedTrainer.toString() !== trainer._id.toString()) {
        return errorResponse(res, 'Access denied: Athlete is not on your coaching roster', null, 403);
      }
    }

    return successResponse(res, 'Progress record retrieved successfully.', { progress });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing progress record
 * @route   PUT /api/progress/:id
 * @access  Private (Admin / Recorder Trainer / Member for own)
 */
const updateProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid progress record ID', null, 400);
    }

    const progress = await MemberProgress.findById(id);
    if (!progress) {
      return errorResponse(res, 'Progress record not found', null, 404);
    }

    // RBAC check
    if (req.user.role === 'member') {
      const currentMember = await Member.findOne({ user: req.user._id });
      if (!currentMember || progress.member.toString() !== currentMember._id.toString()) {
        return errorResponse(res, 'Access denied to modify this record', null, 403);
      }
    } else if (req.user.role === 'trainer') {
      const trainer = await Trainer.findOne({ user: req.user._id });
      const targetMember = await Member.findById(progress.member);
      if (!trainer || !targetMember?.assignedTrainer || targetMember.assignedTrainer.toString() !== trainer._id.toString()) {
        return errorResponse(res, 'Access denied: Athlete is not on your coaching roster', null, 403);
      }
    }

    const { weight, bodyFatPercentage, chest, waist, hips, arms, thighs, notes, recordedAt } = req.body;

    const parseNumber = (val, min, max, name) => {
      if (val === undefined || val === null || val === '') return null;
      const num = Number(val);
      if (!Number.isFinite(num) || isNaN(num)) {
        throw new Error(`${name} must be a valid finite number.`);
      }
      if (num < min || num > max) {
        throw new Error(`${name} must be between ${min} and ${max}.`);
      }
      return num;
    };

    try {
      if (weight !== undefined) progress.weight = parseNumber(weight, 20, 500, 'Weight (kg)');
      if (bodyFatPercentage !== undefined) progress.bodyFatPercentage = parseNumber(bodyFatPercentage, 1, 75, 'Body fat percentage');
      if (chest !== undefined) progress.chest = parseNumber(chest, 20, 250, 'Chest measurement (cm)');
      if (waist !== undefined) progress.waist = parseNumber(waist, 20, 250, 'Waist measurement (cm)');
      if (hips !== undefined) progress.hips = parseNumber(hips, 20, 250, 'Hips measurement (cm)');
      if (arms !== undefined) progress.arms = parseNumber(arms, 10, 100, 'Arms measurement (cm)');
      if (thighs !== undefined) progress.thighs = parseNumber(thighs, 15, 150, 'Thighs measurement (cm)');
    } catch (valErr) {
      return errorResponse(res, valErr.message, null, 400);
    }

    if (notes !== undefined) progress.notes = typeof notes === 'string' ? notes.trim() : progress.notes;
    if (recordedAt !== undefined) {
      const date = new Date(recordedAt);
      if (!isNaN(date.getTime())) progress.recordedAt = date;
    }

    await progress.save();

    const populated = await MemberProgress.findById(progress._id)
      .populate({ path: 'member', populate: { path: 'user', select: 'name email' } })
      .populate('recordedBy', 'name email role');

    return successResponse(res, 'Progress record updated successfully.', { progress: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a progress record
 * @route   DELETE /api/progress/:id
 * @access  Private (Admin / Creator)
 */
const deleteProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid progress record ID', null, 400);
    }

    const progress = await MemberProgress.findById(id);
    if (!progress) {
      return errorResponse(res, 'Progress record not found', null, 404);
    }

    // RBAC check
    if (req.user.role === 'member') {
      const currentMember = await Member.findOne({ user: req.user._id });
      if (!currentMember || progress.member.toString() !== currentMember._id.toString()) {
        return errorResponse(res, 'Access denied to delete this record', null, 403);
      }
    } else if (req.user.role === 'trainer') {
      if (progress.recordedBy.toString() !== req.user._id.toString()) {
        return errorResponse(res, 'Access denied: You can only delete records you created', null, 403);
      }
    }

    await MemberProgress.findByIdAndDelete(id);
    return successResponse(res, 'Progress record deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProgress,
  getMyProgress,
  getMemberProgress,
  getAllProgress,
  getProgressById,
  updateProgress,
  deleteProgress,
};