const mongoose = require('mongoose');
const TrainerExerciseAssignment = require('../models/TrainerExerciseAssignment');
const Trainer = require('../models/Trainer');
const Exercise = require('../models/Exercise');
const { createNotification } = require('../utils/notificationHelper');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Assign an exercise to a trainer
 * @route   POST /api/trainer-exercise-assignments
 * @access  Private (Admin only)
 */
const createTrainerExerciseAssignment = async (req, res, next) => {
  try {
    const { trainerId, exerciseId, notes } = req.body;

    if (!trainerId) {
      return errorResponse(res, 'Trainer ID is required.', null, 400);
    }
    if (!exerciseId) {
      return errorResponse(res, 'Exercise ID is required.', null, 400);
    }

    if (!mongoose.Types.ObjectId.isValid(trainerId)) {
      return errorResponse(res, 'Invalid Trainer ID format.', null, 400);
    }
    if (!mongoose.Types.ObjectId.isValid(exerciseId)) {
      return errorResponse(res, 'Invalid Exercise ID format.', null, 400);
    }

    // 1. Verify Trainer exists and is active
    const trainer = await Trainer.findById(trainerId).populate('user', 'name email');
    if (!trainer) {
      return errorResponse(res, 'Trainer not found.', null, 404);
    }
    if (trainer.status !== 'active') {
      return errorResponse(
        res,
        'Cannot assign exercise: Selected trainer is inactive.',
        null,
        400
      );
    }

    // 2. Verify Exercise exists and is active
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise) {
      return errorResponse(res, 'Exercise not found.', null, 404);
    }
    if (exercise.status !== 'active') {
      return errorResponse(
        res,
        'Cannot assign inactive exercise. Please activate the exercise first.',
        null,
        400
      );
    }

    // 3. Duplicate Prevention Check (409 Conflict)
    const existingAssignment = await TrainerExerciseAssignment.findOne({
      trainer: trainerId,
      exercise: exerciseId,
      status: 'active',
    });

    if (existingAssignment) {
      return errorResponse(
        res,
        `This exercise is already assigned to ${trainer.user?.name || 'this trainer'}.`,
        null,
        409
      );
    }

    // 4. Create assignment
    const assignment = await TrainerExerciseAssignment.create({
      trainer: trainerId,
      exercise: exerciseId,
      assignedBy: req.user._id,
      notes: notes ? notes.trim() : '',
      status: 'active',
      assignedAt: new Date(),
    });

    const populatedAssignment = await TrainerExerciseAssignment.findById(assignment._id)
      .populate({
        path: 'trainer',
        populate: { path: 'user', select: 'name email' },
      })
      .populate('exercise')
      .populate('assignedBy', 'name email');

    // Notify trainer
    if (trainer?.user?._id) {
      await createNotification({
        recipient: trainer.user._id,
        type: 'exercise_assigned',
        title: 'New Exercise Assigned to Teaching Profile',
        message: `Exercise "${exercise.name}" has been added to your coaching catalog.`,
        relatedEntityType: 'Trainer',
        relatedEntityId: trainer._id,
        idempotencyKey: `tea_${assignment._id}`,
      });
    }

    return successResponse(
      res,
      `Exercise "${exercise.name}" successfully assigned to trainer ${trainer.user?.name || ''}.`,
      { assignment: populatedAssignment },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get trainer exercise assignments
 * @route   GET /api/trainer-exercise-assignments
 * @access  Private (Admin, Trainer)
 */
const getTrainerExerciseAssignments = async (req, res, next) => {
  try {
    const { trainerId, exerciseId, status } = req.query;
    const filter = {};

    if (req.user.role === 'trainer') {
      const trainerDoc = await Trainer.findOne({ user: req.user._id });
      if (!trainerDoc) {
        return successResponse(res, 'No assignments found.', { assignments: [], count: 0 });
      }
      filter.trainer = trainerDoc._id;
    } else if (trainerId) {
      if (!mongoose.Types.ObjectId.isValid(trainerId)) {
        return errorResponse(res, 'Invalid Trainer ID format.', null, 400);
      }
      filter.trainer = trainerId;
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

    const assignments = await TrainerExerciseAssignment.find(filter)
      .populate({
        path: 'trainer',
        populate: { path: 'user', select: 'name email' },
      })
      .populate('exercise')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    return successResponse(res, 'Trainer exercise assignments retrieved.', {
      assignments,
      count: assignments.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete/Remove trainer exercise assignment
 * @route   DELETE /api/trainer-exercise-assignments/:id
 * @access  Private (Admin only)
 */
const deleteTrainerExerciseAssignment = async (req, res, next) => {
  try {
    const assignment = await TrainerExerciseAssignment.findById(req.params.id);
    if (!assignment) {
      return errorResponse(res, 'Assignment not found.', null, 404);
    }

    await TrainerExerciseAssignment.findByIdAndDelete(req.params.id);

    return successResponse(res, 'Trainer exercise assignment deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTrainerExerciseAssignment,
  getTrainerExerciseAssignments,
  deleteTrainerExerciseAssignment,
};
