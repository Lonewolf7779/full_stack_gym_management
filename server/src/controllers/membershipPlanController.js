const MembershipPlan = require('../models/MembershipPlan');
const Member = require('../models/Member');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Get all membership plans
 * @route   GET /api/membership-plans
 * @access  Public / Authenticated
 */
const getMembershipPlans = async (req, res, next) => {
  try {
    const filter = {};
    // If not admin or not explicitly asking for all, show only active plans
    if (!req.user || req.user.role !== 'admin' || req.query.activeOnly === 'true') {
      filter.status = 'active';
    }

    const plans = await MembershipPlan.find(filter).sort({ price: 1 });
    return successResponse(res, 'Membership plans retrieved successfully.', { plans });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single membership plan by ID
 * @route   GET /api/membership-plans/:id
 * @access  Public / Authenticated
 */
const getMembershipPlanById = async (req, res, next) => {
  try {
    const plan = await MembershipPlan.findById(req.params.id);
    if (!plan) {
      return errorResponse(res, 'Membership plan not found.', null, 404);
    }
    return successResponse(res, 'Membership plan retrieved.', { plan });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new membership plan
 * @route   POST /api/membership-plans
 * @access  Private (Admin only)
 */
const createMembershipPlan = async (req, res, next) => {
  try {
    const { name, description, duration, price, features, status } = req.body;

    if (!name || !name.trim()) {
      return errorResponse(res, 'Plan name is required.', null, 400);
    }

    if (price === undefined || price === null || price < 0) {
      return errorResponse(res, 'A valid non-negative price is required.', null, 400);
    }

    const existingPlan = await MembershipPlan.findOne({ name: name.trim() });
    if (existingPlan) {
      return errorResponse(res, 'A plan with this name already exists.', null, 409);
    }

    const plan = await MembershipPlan.create({
      name: name.trim(),
      description: description || '',
      duration: duration || 1,
      price,
      features: Array.isArray(features) ? features : typeof features === 'string' ? features.split(',').map(f => f.trim()) : [],
      status: status || 'active',
    });

    return successResponse(res, 'Membership plan created successfully.', { plan }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update membership plan
 * @route   PUT /api/membership-plans/:id
 * @access  Private (Admin only)
 */
const updateMembershipPlan = async (req, res, next) => {
  try {
    const { name, description, duration, price, features, status } = req.body;

    const plan = await MembershipPlan.findById(req.params.id);
    if (!plan) {
      return errorResponse(res, 'Membership plan not found.', null, 404);
    }

    if (name && name.trim() !== plan.name) {
      const duplicate = await MembershipPlan.findOne({ name: name.trim() });
      if (duplicate && duplicate._id.toString() !== plan._id.toString()) {
        return errorResponse(res, 'Another plan with this name already exists.', null, 409);
      }
      plan.name = name.trim();
    }

    if (description !== undefined) plan.description = description;
    if (duration !== undefined) plan.duration = duration;
    if (price !== undefined) plan.price = price;
    if (features !== undefined) {
      plan.features = Array.isArray(features) ? features : typeof features === 'string' ? features.split(',').map(f => f.trim()) : [];
    }
    if (status !== undefined) plan.status = status;

    await plan.save();

    return successResponse(res, 'Membership plan updated successfully.', { plan });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete membership plan
 * @route   DELETE /api/membership-plans/:id
 * @access  Private (Admin only)
 */
const deleteMembershipPlan = async (req, res, next) => {
  try {
    const plan = await MembershipPlan.findById(req.params.id);
    if (!plan) {
      return errorResponse(res, 'Membership plan not found.', null, 404);
    }

    // Check if any members currently subscribe to this plan
    const activeMemberCount = await Member.countDocuments({ membershipPlan: plan._id });
    if (activeMemberCount > 0) {
      // Soft-delete by marking as inactive instead of breaking relational integrity
      plan.status = 'inactive';
      await plan.save();
      return successResponse(res, `Plan has ${activeMemberCount} subscribed members. It has been deactivated instead of permanently deleted to preserve records.`, { plan });
    }

    await MembershipPlan.findByIdAndDelete(req.params.id);
    return successResponse(res, 'Membership plan permanently deleted.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMembershipPlans,
  getMembershipPlanById,
  createMembershipPlan,
  updateMembershipPlan,
  deleteMembershipPlan,
};
