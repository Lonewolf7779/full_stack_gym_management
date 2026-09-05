const Trainer = require('../models/Trainer');
const User = require('../models/User');
const Member = require('../models/Member');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Get all trainers
 * @route   GET /api/trainers
 * @access  Public / Authenticated
 */
const getTrainers = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    let trainers = await Trainer.find(filter)
      .populate('user', 'name email role createdAt')
      .sort({ createdAt: -1 });

    // Client/search filter by name or specialization if provided
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      trainers = trainers.filter(
        (t) =>
          (t.user && searchRegex.test(t.user.name)) ||
          searchRegex.test(t.specialization) ||
          searchRegex.test(t.bio)
      );
    }

    // Attach active assigned members count to each trainer
    const trainersWithCounts = await Promise.all(
      trainers.map(async (trainer) => {
        const assignedMembersCount = await Member.countDocuments({
          assignedTrainer: trainer._id,
        });
        const activeMembersCount = await Member.countDocuments({
          assignedTrainer: trainer._id,
          status: 'active',
        });
        return {
          ...trainer.toObject(),
          assignedMembersCount,
          activeMembersCount,
        };
      })
    );

    return successResponse(res, 'Trainers retrieved successfully.', {
      trainers: trainersWithCounts,
      count: trainersWithCounts.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single trainer by ID
 * @route   GET /api/trainers/:id
 * @access  Authenticated
 */
const getTrainerById = async (req, res, next) => {
  try {
    const trainer = await Trainer.findById(req.params.id).populate(
      'user',
      'name email role createdAt'
    );
    if (!trainer) {
      return errorResponse(res, 'Trainer not found.', null, 404);
    }

    const assignedMembers = await Member.find({ assignedTrainer: trainer._id })
      .populate('user', 'name email')
      .populate('membershipPlan', 'name');

    return successResponse(res, 'Trainer details retrieved.', {
      trainer: {
        ...trainer.toObject(),
        assignedMembers,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in trainer's own profile
 * @route   GET /api/trainers/me/profile
 * @access  Private (Trainer only)
 */
const getTrainerProfile = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id }).populate(
      'user',
      'name email role createdAt'
    );

    if (!trainer) {
      return errorResponse(res, 'Trainer profile not found for this account.', null, 404);
    }

    const assignedMembers = await Member.find({ assignedTrainer: trainer._id })
      .populate('user', 'name email')
      .populate('membershipPlan', 'name price duration');

    const activeCount = assignedMembers.filter((m) => m.status === 'active').length;

    return successResponse(res, 'Trainer profile retrieved.', {
      trainer: {
        ...trainer.toObject(),
        assignedMembers,
        totalAssigned: assignedMembers.length,
        activeAssigned: activeCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new trainer (User + Trainer profile)
 * @route   POST /api/trainers
 * @access  Private (Admin only)
 */
const createTrainer = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      specialization,
      experience,
      certifications,
      bio,
      status,
    } = req.body;

    // Validate user credentials
    if (!name || !name.trim()) {
      return errorResponse(res, 'Trainer name is required.', null, 400);
    }
    if (!email || !email.trim()) {
      return errorResponse(res, 'Trainer email is required.', null, 400);
    }
    if (!password || password.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters.', null, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return errorResponse(res, 'An account with this email already exists.', null, 409);
    }

    // Create User with role 'trainer'
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'trainer',
    });

    // Create Trainer Profile
    const certArray = Array.isArray(certifications)
      ? certifications
      : typeof certifications === 'string'
      ? certifications.split(',').map((c) => c.trim())
      : [];

    const trainer = await Trainer.create({
      user: user._id,
      phone: phone || '',
      specialization: specialization || 'General Fitness',
      experience: experience || '1 Year',
      certifications: certArray,
      bio: bio || '',
      status: status || 'active',
    });

    const populatedTrainer = await Trainer.findById(trainer._id).populate(
      'user',
      'name email role'
    );

    return successResponse(
      res,
      'Trainer created successfully.',
      { trainer: populatedTrainer },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update trainer
 * @route   PUT /api/trainers/:id
 * @access  Private (Admin or Owner Trainer)
 */
const updateTrainer = async (req, res, next) => {
  try {
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) {
      return errorResponse(res, 'Trainer not found.', null, 404);
    }

    // Role check: Only admin or the specific trainer can update
    if (
      req.user.role !== 'admin' &&
      trainer.user.toString() !== req.user._id.toString()
    ) {
      return errorResponse(
        res,
        'Access denied: You can only update your own trainer profile.',
        null,
        403
      );
    }

    const {
      name,
      phone,
      specialization,
      experience,
      certifications,
      bio,
      status,
    } = req.body;

    // Update User name if provided and admin/owner
    if (name && name.trim()) {
      await User.findByIdAndUpdate(trainer.user, { name: name.trim() });
    }

    if (phone !== undefined) trainer.phone = phone;
    if (specialization !== undefined) trainer.specialization = specialization;
    if (experience !== undefined) trainer.experience = experience;
    if (bio !== undefined) trainer.bio = bio;

    if (certifications !== undefined) {
      trainer.certifications = Array.isArray(certifications)
        ? certifications
        : typeof certifications === 'string'
        ? certifications.split(',').map((c) => c.trim())
        : [];
    }

    // Only admin can change status
    if (status !== undefined && req.user.role === 'admin') {
      trainer.status = status;
    }

    await trainer.save();

    const updatedTrainer = await Trainer.findById(trainer._id).populate(
      'user',
      'name email role'
    );

    return successResponse(res, 'Trainer updated successfully.', {
      trainer: updatedTrainer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete trainer
 * @route   DELETE /api/trainers/:id
 * @access  Private (Admin only)
 */
const deleteTrainer = async (req, res, next) => {
  try {
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) {
      return errorResponse(res, 'Trainer not found.', null, 404);
    }

    // Unassign members assigned to this trainer so relationships stay clean
    await Member.updateMany(
      { assignedTrainer: trainer._id },
      { assignedTrainer: null }
    );

    // Delete Trainer profile and linked User
    const userId = trainer.user;
    await Trainer.findByIdAndDelete(trainer._id);
    if (userId) {
      await User.findByIdAndDelete(userId);
    }

    return successResponse(
      res,
      'Trainer and associated user account deleted successfully.'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTrainers,
  getTrainerById,
  getTrainerProfile,
  createTrainer,
  updateTrainer,
  deleteTrainer,
};
