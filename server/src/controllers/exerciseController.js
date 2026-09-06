const Exercise = require('../models/Exercise');
const TrainingPlan = require('../models/TrainingPlan');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Get all exercises with filters & search
 * @route   GET /api/exercises
 * @access  Private (Authenticated users: Admin, Trainer, Member)
 */
const getExercises = async (req, res, next) => {
  try {
    const { search, category, muscleGroup, equipment, difficulty, status } = req.query;
    const filter = {};

    // Filter by active status unless admin explicitly asks for inactive/all
    if (status) {
      filter.status = status;
    } else if (req.user.role !== 'admin') {
      filter.status = 'active';
    }

    if (category) {
      filter.category = category;
    }

    if (muscleGroup) {
      filter.muscleGroup = muscleGroup;
    }

    if (equipment) {
      filter.equipment = equipment;
    }

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (search && search.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    const exercises = await Exercise.find(filter).sort({ muscleGroup: 1, name: 1 });

    return successResponse(res, 'Exercises retrieved successfully.', {
      exercises,
      count: exercises.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single exercise by ID
 * @route   GET /api/exercises/:id
 * @access  Private
 */
const getExerciseById = async (req, res, next) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return errorResponse(res, 'Exercise not found.', null, 404);
    }

    return successResponse(res, 'Exercise details retrieved.', { exercise });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new exercise
 * @route   POST /api/exercises
 * @access  Private (Admin only)
 */
const createExercise = async (req, res, next) => {
  try {
    const {
      name,
      category,
      muscleGroup,
      description,
      instructions,
      equipment,
      difficulty,
      defaultSets,
      defaultReps,
      defaultDuration,
      defaultRestTime,
      status,
    } = req.body;

    if (!name || !name.trim()) {
      return errorResponse(res, 'Exercise name is required.', null, 400);
    }
    if (!category) {
      return errorResponse(res, 'Exercise category is required.', null, 400);
    }
    if (!muscleGroup) {
      return errorResponse(res, 'Primary muscle group is required.', null, 400);
    }

    const existingExercise = await Exercise.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });
    if (existingExercise) {
      return errorResponse(res, 'An exercise with this name already exists.', null, 409);
    }

    const exercise = await Exercise.create({
      name: name.trim(),
      category,
      muscleGroup,
      description: description ? description.trim() : '',
      instructions: Array.isArray(instructions)
        ? instructions.filter((i) => i && i.trim())
        : instructions
        ? [instructions.trim()]
        : [],
      equipment: equipment || 'None',
      difficulty: difficulty || 'Beginner',
      defaultSets: defaultSets !== undefined && defaultSets !== null && defaultSets !== '' && !isNaN(Number(defaultSets)) ? Number(defaultSets) : 3,
      defaultReps: defaultReps !== undefined && defaultReps !== null && defaultReps !== '' && !isNaN(Number(defaultReps)) ? Number(defaultReps) : 10,
      defaultDuration: defaultDuration !== undefined && defaultDuration !== null && defaultDuration !== '' && !isNaN(Number(defaultDuration)) ? Number(defaultDuration) : 0,
      defaultRestTime: defaultRestTime !== undefined && defaultRestTime !== null && defaultRestTime !== '' && !isNaN(Number(defaultRestTime)) ? Number(defaultRestTime) : 60,
      status: status || 'active',
    });

    return successResponse(res, 'Exercise created successfully.', { exercise }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update exercise
 * @route   PUT /api/exercises/:id
 * @access  Private (Admin only)
 */
const updateExercise = async (req, res, next) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return errorResponse(res, 'Exercise not found.', null, 404);
    }

    const {
      name,
      category,
      muscleGroup,
      description,
      instructions,
      equipment,
      difficulty,
      defaultSets,
      defaultReps,
      defaultDuration,
      defaultRestTime,
      status,
    } = req.body;

    if (name && name.trim() && name.trim().toLowerCase() !== exercise.name.toLowerCase()) {
      const duplicate = await Exercise.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      });
      if (duplicate) {
        return errorResponse(res, 'An exercise with this name already exists.', null, 409);
      }
      exercise.name = name.trim();
    }

    if (category) exercise.category = category;
    if (muscleGroup) exercise.muscleGroup = muscleGroup;
    if (description !== undefined) exercise.description = description.trim();
    if (instructions !== undefined) {
      exercise.instructions = Array.isArray(instructions)
        ? instructions.filter((i) => i && i.trim())
        : [instructions.trim()];
    }
    if (equipment) exercise.equipment = equipment;
    if (difficulty) exercise.difficulty = difficulty;
    if (defaultSets !== undefined && defaultSets !== null && defaultSets !== '' && !isNaN(Number(defaultSets))) {
      exercise.defaultSets = Number(defaultSets);
    }
    if (defaultReps !== undefined && defaultReps !== null && defaultReps !== '' && !isNaN(Number(defaultReps))) {
      exercise.defaultReps = Number(defaultReps);
    }
    if (defaultDuration !== undefined && defaultDuration !== null && defaultDuration !== '' && !isNaN(Number(defaultDuration))) {
      exercise.defaultDuration = Number(defaultDuration);
    }
    if (defaultRestTime !== undefined && defaultRestTime !== null && defaultRestTime !== '' && !isNaN(Number(defaultRestTime))) {
      exercise.defaultRestTime = Number(defaultRestTime);
    }
    if (status) exercise.status = status;

    await exercise.save();

    return successResponse(res, 'Exercise updated successfully.', { exercise });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete exercise
 * @route   DELETE /api/exercises/:id
 * @access  Private (Admin only)
 */
const deleteExercise = async (req, res, next) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return errorResponse(res, 'Exercise not found.', null, 404);
    }

    // Check if the exercise is currently referenced in any training plan
    const isReferenced = await TrainingPlan.exists({
      'exercises.exercise': exercise._id,
    });

    if (isReferenced) {
      return errorResponse(
        res,
        'This exercise is currently used by one or more training plans and cannot be deleted. Deactivate it instead.',
        null,
        409
      );
    }

    await Exercise.findByIdAndDelete(exercise._id);

    return successResponse(res, 'Exercise deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
};
