const mongoose = require('mongoose');
const User = require('../models/User');
const Trainer = require('../models/Trainer');
const Member = require('../models/Member');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Update user account status (Activate / Deactivate)
 * @route   PATCH /api/users/:id/status
 * @access  Private (Admin only)
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status || !['active', 'inactive'].includes(status)) {
      return errorResponse(res, 'Status must be either "active" or "inactive".', null, 400);
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return errorResponse(res, 'Invalid user ID format.', null, 400);
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return errorResponse(res, 'User account not found.', null, 404);
    }

    // Protection: Prevent Admin from deactivating their own currently authenticated account
    if (req.user._id.toString() === user._id.toString() && status === 'inactive') {
      return errorResponse(res, 'Cannot deactivate your own administrator account.', null, 400);
    }

    user.status = status;
    await user.save();

    // Sync domain profile status
    if (user.role === 'trainer') {
      await Trainer.findOneAndUpdate({ user: user._id }, { status });
    } else if (user.role === 'member') {
      // If active, reactivate member profile; if inactive, deactivate member profile
      await Member.findOneAndUpdate(
        { user: user._id },
        { status: status === 'inactive' ? 'inactive' : 'active' }
      );
    }

    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      updatedAt: user.updatedAt,
    };

    return successResponse(
      res,
      `Account for ${user.name} has been ${status === 'active' ? 'activated' : 'deactivated'}.`,
      { user: safeUser }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin reset password for a user account
 * @route   PATCH /api/users/:id/password
 * @access  Private (Admin only)
 */
const resetUserPassword = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return errorResponse(res, 'New password must be at least 6 characters long.', null, 400);
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return errorResponse(res, 'Invalid user ID format.', null, 400);
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return errorResponse(res, 'User account not found.', null, 404);
    }

    // Set new password (pre-save hook will hash it)
    user.password = password;
    await user.save();

    return successResponse(
      res,
      `Password for ${user.name} (${user.email}) has been successfully updated.`
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateUserStatus,
  resetUserPassword,
};
