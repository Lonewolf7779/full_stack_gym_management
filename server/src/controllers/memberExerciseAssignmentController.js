const mongoose = require('mongoose');
const MemberExerciseAssignment = require('../models/MemberExerciseAssignment');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');
const Exercise = require('../models/Exercise');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Trainer assigns an exercise to an assigned member
 * @route   POST /api/member-exercise-assignments
 * @access  Private (Trainer only)
 */
const createMemberExerciseAssignment = async (req, res, next) => {
  try {
    const {
      memberId,
      exerciseId,
      sets,
      reps,
      duration,
      restTime,
      targetWeight,
      instructions,
    } = req.body;

    if (!memberId) {
      return errorResponse(res, 'Member ID is required.', null, 400);
    }
    if (!exerciseId) {
      return errorResponse(res, 'Exercise ID is required.', null, 400);
    }

    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return errorResponse(res, 'Invalid Member ID format.', null, 400);
    }
    if (!mongoose.Types.ObjectId.isValid(exerciseId)) {
      return errorResponse(res, 'Invalid Exercise ID format.', null, 400);
    }

    // 1. Derive authenticated Trainer profile from req.user
    const trainerDoc = await Trainer.findOne({ user: req.user._id }).populate('user', 'name email');
    if (!trainerDoc) {
      return errorResponse(res, 'Trainer profile not found.', null, 404);
    }
    if (trainerDoc.status !== 'active') {
      return errorResponse(res, 'Your trainer account is inactive. Please contact administration.', null, 400);
    }

    // 2. Look up target Member and verify Roster Assignment
    const memberDoc = await Member.findById(memberId).populate('user', 'name email');
    if (!memberDoc) {
      return errorResponse(res, 'Target athlete not found.', null, 404);
    }

    // RBAC check: Trainer can only assign to members assigned to them
    if (
      !memberDoc.assignedTrainer ||
      memberDoc.assignedTrainer.toString() !== trainerDoc._id.toString()
    ) {
      return errorResponse(
        res,
        'Access denied: You can only assign exercises to athletes on your coaching roster.',
        null,
        403
      );
    }

    // 3. Look up target Exercise and check status
    const exerciseDoc = await Exercise.findById(exerciseId);
    if (!exerciseDoc) {
      return errorResponse(res, 'Exercise not found.', null, 404);
    }
    if (exerciseDoc.status !== 'active') {
      return errorResponse(
        res,
        'Cannot assign inactive exercise. Please select an active exercise from the library.',
        null,
        400
      );
    }

    // 4. Duplicate Prevention Check (409 Conflict)
    const existingAssignment = await MemberExerciseAssignment.findOne({
      member: memberId,
      exercise: exerciseId,
      status: 'active',
    });

    if (existingAssignment) {
      return errorResponse(
        res,
        `This exercise is already assigned to ${memberDoc.user?.name || 'this athlete'}.`,
        null,
        409
      );
    }

    // 5. Parse numerical fields safely with defaults
    const finalSets =
      sets !== undefined && sets !== null && sets !== '' && !isNaN(Number(sets))
        ? Math.max(1, Number(sets))
        : exerciseDoc.defaultSets || 3;

    const finalReps =
      reps !== undefined && reps !== null && reps !== '' && !isNaN(Number(reps))
        ? Math.max(0, Number(reps))
        : exerciseDoc.defaultReps || 10;

    const finalDuration =
      duration !== undefined && duration !== null && duration !== '' && !isNaN(Number(duration))
        ? Math.max(0, Number(duration))
        : exerciseDoc.defaultDuration || 0;

    const finalRestTime =
      restTime !== undefined && restTime !== null && restTime !== '' && !isNaN(Number(restTime))
        ? Math.max(0, Number(restTime))
        : exerciseDoc.defaultRestTime !== undefined
        ? exerciseDoc.defaultRestTime
        : 60;

    const finalTargetWeight =
      targetWeight !== undefined && targetWeight !== null && targetWeight !== '' && !isNaN(Number(targetWeight))
        ? Math.max(0, Number(targetWeight))
        : 0;

    // 6. Create Assignment
    const assignment = await MemberExerciseAssignment.create({
      member: memberId,
      trainer: trainerDoc._id,
      exercise: exerciseId,
      sets: finalSets,
      reps: finalReps,
      duration: finalDuration,
      restTime: finalRestTime,
      targetWeight: finalTargetWeight,
      instructions: typeof instructions === 'string' ? instructions.trim() : '',
      status: 'active',
      assignedAt: new Date(),
    });

    const populatedAssignment = await MemberExerciseAssignment.findById(assignment._id)
      .populate({
        path: 'member',
        populate: { path: 'user', select: 'name email' },
      })
      .populate({
        path: 'trainer',
        populate: { path: 'user', select: 'name email' },
      })
      .populate('exercise');

    return successResponse(
      res,
      `Exercise "${exerciseDoc.name}" assigned to ${memberDoc.user?.name || 'athlete'}.`,
      { assignment: populatedAssignment },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get member exercise assignments (RBAC filtered)
 * @route   GET /api/member-exercise-assignments
 * @access  Private (Admin, Trainer, Member)
 */
const getMemberExerciseAssignments = async (req, res, next) => {
  try {
    const { memberId, exerciseId, status } = req.query;
    const filter = {};

    if (req.user.role === 'trainer') {
      const trainerDoc = await Trainer.findOne({ user: req.user._id });
      if (!trainerDoc) {
        return successResponse(res, 'No assignments found.', { assignments: [], count: 0 });
      }
      filter.trainer = trainerDoc._id;
    } else if (req.user.role === 'member') {
      const memberDoc = await Member.findOne({ user: req.user._id });
      if (!memberDoc) {
        return successResponse(res, 'No assignments found.', { assignments: [], count: 0 });
      }
      filter.member = memberDoc._id;
    } else if (memberId) {
      if (!mongoose.Types.ObjectId.isValid(memberId)) {
        return errorResponse(res, 'Invalid Member ID format.', null, 400);
      }
      filter.member = memberId;
    }

    if (exerciseId) {
      if (!mongoose.Types.ObjectId.isValid(exerciseId)) {
        return errorResponse(res, 'Invalid Exercise ID format.', null, 400);
      }
      filter.exercise = exerciseId;
    }

    if (status) {
      filter.status = status;
    }

    const assignments = await MemberExerciseAssignment.find(filter)
      .populate({
        path: 'member',
        populate: { path: 'user', select: 'name email' },
      })
      .populate({
        path: 'trainer',
        populate: { path: 'user', select: 'name email' },
      })
      .populate('exercise')
      .sort({ createdAt: -1 });

    return successResponse(res, 'Member exercise assignments retrieved.', {
      assignments,
      count: assignments.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get exercise assignments for a specific member
 * @route   GET /api/member-exercise-assignments/member/:memberId
 * @access  Private (Admin, Assigned Trainer, or Owner Member)
 */
const getAssignmentsByMemberId = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return errorResponse(res, 'Invalid Member ID format.', null, 400);
    }

    const memberDoc = await Member.findById(memberId);
    if (!memberDoc) {
      return errorResponse(res, 'Member not found.', null, 404);
    }

    // RBAC Check
    if (req.user.role === 'trainer') {
      const trainerDoc = await Trainer.findOne({ user: req.user._id });
      if (
        !trainerDoc ||
        !memberDoc.assignedTrainer ||
        memberDoc.assignedTrainer.toString() !== trainerDoc._id.toString()
      ) {
        return errorResponse(res, 'Access denied: Athlete is not assigned to you.', null, 403);
      }
    } else if (req.user.role === 'member') {
      if (memberDoc.user.toString() !== req.user._id.toString()) {
        return errorResponse(res, 'Access denied: Cannot view another athlete’s assignments.', null, 403);
      }
    }

    const assignments = await MemberExerciseAssignment.find({
      member: memberId,
      status: 'active',
    })
      .populate({
        path: 'trainer',
        populate: { path: 'user', select: 'name email' },
      })
      .populate('exercise')
      .sort({ createdAt: -1 });

    return successResponse(res, 'Member assigned exercises retrieved.', {
      assignments,
      count: assignments.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete/Remove member exercise assignment
 * @route   DELETE /api/member-exercise-assignments/:id
 * @access  Private (Admin or Assigned Trainer)
 */
const deleteMemberExerciseAssignment = async (req, res, next) => {
  try {
    const assignment = await MemberExerciseAssignment.findById(req.params.id);
    if (!assignment) {
      return errorResponse(res, 'Assignment not found.', null, 404);
    }

    if (req.user.role === 'trainer') {
      const trainerDoc = await Trainer.findOne({ user: req.user._id });
      if (!trainerDoc || assignment.trainer.toString() !== trainerDoc._id.toString()) {
        return errorResponse(res, 'Access denied: You can only manage your own assignments.', null, 403);
      }
    }

    await MemberExerciseAssignment.findByIdAndDelete(req.params.id);

    return successResponse(res, 'Member exercise assignment deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMemberExerciseAssignment,
  getMemberExerciseAssignments,
  getAssignmentsByMemberId,
  deleteMemberExerciseAssignment,
};
