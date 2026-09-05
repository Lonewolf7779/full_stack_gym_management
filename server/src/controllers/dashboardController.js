const Member = require('../models/Member');
const Trainer = require('../models/Trainer');
const MembershipPlan = require('../models/MembershipPlan');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Get real aggregation statistics for Admin Dashboard
 * @route   GET /api/dashboard/stats
 * @access  Private (Admin only)
 */
const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalMembers,
      activeMembers,
      inactiveMembers,
      expiredMembers,
      totalTrainers,
      activeTrainers,
      totalPlans,
      activeMemberships,
    ] = await Promise.all([
      Member.countDocuments(),
      Member.countDocuments({ status: 'active' }),
      Member.countDocuments({ status: 'inactive' }),
      Member.countDocuments({ status: 'expired' }),
      Trainer.countDocuments(),
      Trainer.countDocuments({ status: 'active' }),
      MembershipPlan.countDocuments(),
      Member.countDocuments({ membershipPlan: { $ne: null }, status: 'active' }),
    ]);

    // 5 Most recent members
    const recentMembers = await Member.find()
      .populate('user', 'name email createdAt')
      .populate('membershipPlan', 'name price')
      .populate({
        path: 'assignedTrainer',
        populate: { path: 'user', select: 'name' },
      })
      .sort({ createdAt: -1 })
      .limit(5);

    // 5 Most recent trainers
    const recentTrainers = await Trainer.find()
      .populate('user', 'name email createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Membership Plan Distribution
    const plans = await MembershipPlan.find({ status: 'active' }).select('name price duration');
    const planDistribution = await Promise.all(
      plans.map(async (plan) => {
        const memberCount = await Member.countDocuments({ membershipPlan: plan._id });
        return {
          planId: plan._id,
          name: plan.name,
          price: plan.price,
          memberCount,
        };
      })
    );

    return successResponse(res, 'Admin statistics loaded successfully.', {
      stats: {
        totalMembers,
        activeMembers,
        inactiveMembers,
        expiredMembers,
        totalTrainers,
        activeTrainers,
        totalPlans,
        activeMemberships,
      },
      recentMembers,
      recentTrainers,
      planDistribution,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get real data for Trainer Dashboard
 * @route   GET /api/dashboard/trainer
 * @access  Private (Trainer only)
 */
const getTrainerDashboardData = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id }).populate(
      'user',
      'name email role'
    );

    if (!trainer) {
      return errorResponse(res, 'Trainer profile not found.', null, 404);
    }

    const assignedMembers = await Member.find({ assignedTrainer: trainer._id })
      .populate('user', 'name email createdAt')
      .populate('membershipPlan', 'name price duration features')
      .sort({ createdAt: -1 });

    const totalAssigned = assignedMembers.length;
    const activeAssigned = assignedMembers.filter((m) => m.status === 'active').length;
    const expiredAssigned = assignedMembers.filter((m) => m.status === 'expired').length;

    return successResponse(res, 'Trainer dashboard data retrieved.', {
      trainer,
      assignedMembers,
      stats: {
        totalAssigned,
        activeAssigned,
        expiredAssigned,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get real data for Member Dashboard
 * @route   GET /api/dashboard/member
 * @access  Private (Member only)
 */
const getMemberDashboardData = async (req, res, next) => {
  try {
    let member = await Member.findOne({ user: req.user._id })
      .populate('user', 'name email role createdAt')
      .populate('membershipPlan', 'name price duration features status description')
      .populate({
        path: 'assignedTrainer',
        populate: { path: 'user', select: 'name email' },
      });

    if (!member) {
      member = await Member.create({
        user: req.user._id,
        status: 'active',
      });
      member = await Member.findById(member._id).populate('user', 'name email role createdAt');
    }

    let daysRemaining = 0;
    let isExpiringSoon = false;

    if (member.membershipEndDate) {
      const diffMs = new Date(member.membershipEndDate) - new Date();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;
    }

    return successResponse(res, 'Member dashboard data retrieved.', {
      member,
      membership: {
        plan: member.membershipPlan,
        startDate: member.membershipStartDate,
        endDate: member.membershipEndDate,
        status: member.status,
        daysRemaining,
        isExpiringSoon,
      },
      trainer: member.assignedTrainer,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
  getTrainerDashboardData,
  getMemberDashboardData,
};
