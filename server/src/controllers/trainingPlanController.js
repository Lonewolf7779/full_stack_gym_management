const mongoose = require('mongoose');
const TrainingPlan = require('../models/TrainingPlan');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Helper to normalize and format training plan exercises
 * Prevents NaN and ensures proper defaults (restTime = 60 if omitted, preserving 0)
 */
const formatPlanExercises = (exercises) => {
  if (!Array.isArray(exercises)) return [];
  return exercises
    .filter((e) => e && (e.exercise || e._id))
    .map((e, index) => {
      const sets =
        e.sets !== undefined && e.sets !== null && e.sets !== '' && !isNaN(Number(e.sets))
          ? Number(e.sets)
          : 3;
      const reps =
        e.reps !== undefined && e.reps !== null && e.reps !== '' && !isNaN(Number(e.reps))
          ? Number(e.reps)
          : 10;
      const duration =
        e.duration !== undefined && e.duration !== null && e.duration !== '' && !isNaN(Number(e.duration))
          ? Number(e.duration)
          : 0;
      const restTime =
        e.restTime !== undefined && e.restTime !== null && e.restTime !== '' && !isNaN(Number(e.restTime))
          ? Number(e.restTime)
          : 60;
      const targetWeight =
        e.targetWeight !== undefined && e.targetWeight !== null && e.targetWeight !== '' && !isNaN(Number(e.targetWeight))
          ? Number(e.targetWeight)
          : 0;
      const order =
        e.order !== undefined && e.order !== null && e.order !== '' && !isNaN(Number(e.order))
          ? Number(e.order)
          : index + 1;

      return {
        exercise: e.exercise || e._id,
        sets: Math.max(1, sets),
        reps: Math.max(0, reps),
        duration: Math.max(0, duration),
        restTime: Math.max(0, restTime),
        targetWeight: Math.max(0, targetWeight),
        instructions: typeof e.instructions === 'string' ? e.instructions.trim() : '',
        order,
      };
    });
};

/**
 * @desc    Get training plans (RBAC filtered)
 * @route   GET /api/training-plans
 * @access  Private (Admin, Trainer, Member)
 */
const getTrainingPlans = async (req, res, next) => {
  try {
    const { status, goal, memberId, search } = req.query;
    const filter = {};

    if (req.user.role === 'trainer') {
      const trainerDoc = await Trainer.findOne({ user: req.user._id });
      if (!trainerDoc) {
        return successResponse(res, 'No training plans found.', { plans: [], count: 0 });
      }
      filter.trainer = trainerDoc._id;
    } else if (req.user.role === 'member') {
      const memberDoc = await Member.findOne({ user: req.user._id });
      if (!memberDoc) {
        return successResponse(res, 'No training plans found.', { plans: [], count: 0 });
      }
      filter.member = memberDoc._id;
    }

    if (status) {
      filter.status = status;
    }

    if (goal) {
      filter.goal = goal;
    }

    if (memberId && req.user.role !== 'member') {
      filter.member = memberId;
    }

    let plans = await TrainingPlan.find(filter)
      .populate({
        path: 'member',
        populate: [
          { path: 'user', select: 'name email' },
          { path: 'membershipPlan', select: 'name' },
        ],
      })
      .populate({
        path: 'trainer',
        populate: { path: 'user', select: 'name email' },
      })
      .populate('exercises.exercise')
      .sort({ createdAt: -1 });

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      plans = plans.filter(
        (p) =>
          searchRegex.test(p.planName) ||
          searchRegex.test(p.goal) ||
          (p.member && p.member.user && searchRegex.test(p.member.user.name)) ||
          (p.trainer && p.trainer.user && searchRegex.test(p.trainer.user.name))
      );
    }

    return successResponse(res, 'Training plans retrieved successfully.', {
      plans,
      count: plans.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single training plan by ID
 * @route   GET /api/training-plans/:id
 * @access  Private (Admin, Assigned Trainer, or Owner Member)
 */
const getTrainingPlanById = async (req, res, next) => {
  try {
    const plan = await TrainingPlan.findById(req.params.id)
      .populate({
        path: 'member',
        populate: [
          { path: 'user', select: 'name email' },
          { path: 'membershipPlan', select: 'name duration price' },
        ],
      })
      .populate({
        path: 'trainer',
        populate: { path: 'user', select: 'name email' },
      })
      .populate('exercises.exercise');

    if (!plan) {
      return errorResponse(res, 'Training plan not found.', null, 404);
    }

    // Role-based authorization check
    if (req.user.role === 'trainer') {
      const trainerDoc = await Trainer.findOne({ user: req.user._id });
      if (!trainerDoc || !plan.trainer || plan.trainer._id.toString() !== trainerDoc._id.toString()) {
        return errorResponse(res, 'Access denied: You are not the trainer for this plan.', null, 403);
      }
    } else if (req.user.role === 'member') {
      const memberDoc = await Member.findOne({ user: req.user._id });
      if (!memberDoc || !plan.member || plan.member._id.toString() !== memberDoc._id.toString()) {
        return errorResponse(res, 'Access denied: You can only view your own training plan.', null, 403);
      }
    }

    return successResponse(res, 'Training plan retrieved successfully.', { plan });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get training plans for a specific member
 * @route   GET /api/training-plans/member/:memberId
 * @access  Private (Admin, Assigned Trainer, or Owner Member)
 */
const getMemberPlans = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const memberDoc = await Member.findById(memberId);
    if (!memberDoc) {
      return errorResponse(res, 'Member not found.', null, 404);
    }

    // Authorization check
    if (req.user.role === 'trainer') {
      const trainerDoc = await Trainer.findOne({ user: req.user._id });
      if (
        !trainerDoc ||
        !memberDoc.assignedTrainer ||
        memberDoc.assignedTrainer.toString() !== trainerDoc._id.toString()
      ) {
        return errorResponse(res, 'Access denied: Member is not assigned to you.', null, 403);
      }
    } else if (req.user.role === 'member') {
      if (memberDoc.user.toString() !== req.user._id.toString()) {
        return errorResponse(res, 'Access denied: Cannot view another member’s plans.', null, 403);
      }
    }

    const plans = await TrainingPlan.find({ member: memberId })
      .populate('trainer', 'specialization experience')
      .populate({
        path: 'trainer',
        populate: { path: 'user', select: 'name email' },
      })
      .populate('exercises.exercise')
      .sort({ status: 1, createdAt: -1 });

    return successResponse(res, 'Member training plans retrieved.', {
      plans,
      count: plans.length,
      activePlan: plans.find((p) => p.status === 'active') || null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new training plan
 * @route   POST /api/training-plans
 * @access  Private (Admin or Trainer)
 */
const createTrainingPlan = async (req, res, next) => {
  try {
    const {
      memberId,
      trainerId,
      planName,
      description,
      goal,
      status,
      startDate,
      endDate,
      exercises,
      notes,
    } = req.body;

    if (!memberId) {
      return errorResponse(res, 'Member ID is required to create a training plan.', null, 400);
    }
    if (!planName || !planName.trim()) {
      return errorResponse(res, 'Plan name is required.', null, 400);
    }

    const memberDoc = await Member.findById(memberId);
    if (!memberDoc) {
      return errorResponse(res, 'Target member not found.', null, 404);
    }

    let finalTrainerId = null;

    if (req.user.role === 'trainer') {
      const trainerDoc = await Trainer.findOne({ user: req.user._id });
      if (!trainerDoc) {
        return errorResponse(res, 'Trainer profile not found.', null, 404);
      }

      // Security Check: Trainer can only create plan for members assigned to them
      if (
        !memberDoc.assignedTrainer ||
        memberDoc.assignedTrainer.toString() !== trainerDoc._id.toString()
      ) {
        return errorResponse(
          res,
          'Access denied: You can only assign training plans to members on your coaching roster.',
          null,
          403
        );
      }

      finalTrainerId = trainerDoc._id;
    } else if (req.user.role === 'admin') {
      if (trainerId) {
        if (!mongoose.Types.ObjectId.isValid(trainerId)) {
          return errorResponse(res, 'Selected trainer does not exist.', null, 400);
        }
        const trainerDoc = await Trainer.findById(trainerId);
        if (!trainerDoc) {
          return errorResponse(res, 'Selected trainer does not exist.', null, 404);
        }
        if (trainerDoc.status !== 'active') {
          return errorResponse(
            res,
            'Selected trainer is inactive. Please choose an active trainer.',
            null,
            400
          );
        }
        finalTrainerId = trainerDoc._id;
      } else if (memberDoc.assignedTrainer) {
        const assignedTrainerDoc = await Trainer.findById(memberDoc.assignedTrainer);
        if (assignedTrainerDoc && assignedTrainerDoc.status === 'active') {
          finalTrainerId = assignedTrainerDoc._id;
        } else {
          const anyTrainer = await Trainer.findOne({ status: 'active' });
          if (anyTrainer) {
            finalTrainerId = anyTrainer._id;
          } else {
            return errorResponse(res, 'No active trainer available. Please assign a trainer first.', null, 400);
          }
        }
      } else {
        const anyTrainer = await Trainer.findOne({ status: 'active' });
        if (anyTrainer) {
          finalTrainerId = anyTrainer._id;
        } else {
          return errorResponse(res, 'No active trainer available. Please assign a trainer first.', null, 400);
        }
      }
    }

    // Format exercise array safely
    const formattedExercises = formatPlanExercises(exercises);

    const planStatus = status || 'active';

    // If new plan is active, archive other active plans for this member
    if (planStatus === 'active') {
      await TrainingPlan.updateMany(
        { member: memberId, status: 'active' },
        { status: 'archived' }
      );
    }

    const plan = await TrainingPlan.create({
      member: memberId,
      trainer: finalTrainerId,
      planName: planName.trim(),
      description: description ? description.trim() : '',
      goal: goal || 'General Fitness',
      status: planStatus,
      startDate: startDate || new Date(),
      endDate: endDate || null,
      exercises: formattedExercises,
      notes: notes ? notes.trim() : '',
    });

    const populatedPlan = await TrainingPlan.findById(plan._id)
      .populate({
        path: 'member',
        populate: [
          { path: 'user', select: 'name email' },
          { path: 'membershipPlan', select: 'name' },
        ],
      })
      .populate({
        path: 'trainer',
        populate: { path: 'user', select: 'name email' },
      })
      .populate('exercises.exercise');

    return successResponse(
      res,
      'Training plan created successfully.',
      { plan: populatedPlan },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update training plan
 * @route   PUT /api/training-plans/:id
 * @access  Private (Admin or Trainer)
 */
const updateTrainingPlan = async (req, res, next) => {
  try {
    const plan = await TrainingPlan.findById(req.params.id);
    if (!plan) {
      return errorResponse(res, 'Training plan not found.', null, 404);
    }

    // Role check
    if (req.user.role === 'trainer') {
      const trainerDoc = await Trainer.findOne({ user: req.user._id });
      if (!trainerDoc || plan.trainer.toString() !== trainerDoc._id.toString()) {
        return errorResponse(res, 'Access denied: You can only edit your own assigned plans.', null, 403);
      }
    }

    const {
      trainerId,
      planName,
      description,
      goal,
      status,
      startDate,
      endDate,
      exercises,
      notes,
    } = req.body;

    if (req.user.role === 'admin' && trainerId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(trainerId)) {
        return errorResponse(res, 'Selected trainer does not exist.', null, 400);
      }
      const trainerDoc = await Trainer.findById(trainerId);
      if (!trainerDoc) {
        return errorResponse(res, 'Selected trainer does not exist.', null, 404);
      }
      if (trainerDoc.status !== 'active') {
        return errorResponse(
          res,
          'Selected trainer is inactive. Please choose an active trainer.',
          null,
          400
        );
      }
      plan.trainer = trainerDoc._id;
    }

    if (planName !== undefined) plan.planName = planName.trim();
    if (description !== undefined) plan.description = description.trim();
    if (goal !== undefined) plan.goal = goal;
    if (status !== undefined) plan.status = status;
    if (startDate !== undefined) plan.startDate = startDate;
    if (endDate !== undefined) plan.endDate = endDate;
    if (notes !== undefined) plan.notes = notes.trim();

    if (exercises !== undefined) {
      plan.exercises = formatPlanExercises(exercises);
    }

    await plan.save();

    const updatedPlan = await TrainingPlan.findById(plan._id)
      .populate({
        path: 'member',
        populate: [
          { path: 'user', select: 'name email' },
          { path: 'membershipPlan', select: 'name' },
        ],
      })
      .populate({
        path: 'trainer',
        populate: { path: 'user', select: 'name email' },
      })
      .populate('exercises.exercise');

    return successResponse(res, 'Training plan updated successfully.', { plan: updatedPlan });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete or archive training plan
 * @route   DELETE /api/training-plans/:id
 * @access  Private (Admin or Trainer)
 */
const deleteTrainingPlan = async (req, res, next) => {
  try {
    const plan = await TrainingPlan.findById(req.params.id);
    if (!plan) {
      return errorResponse(res, 'Training plan not found.', null, 404);
    }

    if (req.user.role === 'trainer') {
      const trainerDoc = await Trainer.findOne({ user: req.user._id });
      if (!trainerDoc || plan.trainer.toString() !== trainerDoc._id.toString()) {
        return errorResponse(res, 'Access denied: You can only delete your own assigned plans.', null, 403);
      }
    }

    await TrainingPlan.findByIdAndDelete(plan._id);

    return successResponse(res, 'Training plan deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTrainingPlans,
  getTrainingPlanById,
  getMemberPlans,
  createTrainingPlan,
  updateTrainingPlan,
  deleteTrainingPlan,
};
