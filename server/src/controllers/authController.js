const User = require('../models/User');
const Member = require('../models/Member');
const { sendTokenCookie, clearTokenCookie } = require('../utils/token');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Register a new member
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  let createdUser = null;
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return errorResponse(res, 'Please provide your full name.', null, 400);
    }

    if (!email || !email.trim()) {
      return errorResponse(res, 'Please provide an email address.', null, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return errorResponse(res, 'Please provide a valid email address format.', null, 400);
    }

    if (!password || password.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters long.', null, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already registered
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return errorResponse(res, 'An account with this email address already exists.', null, 409);
    }

    // Security: Enforce 'member' role for public registration
    createdUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'member',
      status: 'active',
    });

    // Create linked Member domain profile
    await Member.create({
      user: createdUser._id,
      status: 'active',
    });

    return sendTokenCookie(res, createdUser, 201, 'Registration successful. Welcome to IronForge!');
  } catch (error) {
    // Atomic Rollback: Clean up created User if profile creation fails
    if (createdUser && createdUser._id) {
      try {
        await User.findByIdAndDelete(createdUser._id);
      } catch (cleanupErr) {
        console.error('[Rollback Error] Failed to delete orphan user:', cleanupErr.message);
      }
    }
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token cookie
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return errorResponse(res, 'Please provide both email and password.', null, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user and include password field for verification
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return errorResponse(res, 'Invalid email or password.', null, 401);
    }

    // Check Account Status (Gating)
    if (user.status === 'inactive') {
      return errorResponse(
        res,
        'Your account is inactive. Please contact the gym administrator.',
        null,
        401
      );
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password.', null, 401);
    }

    return sendTokenCookie(res, user, 200, 'Login successful.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log out current user & clear cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logout = async (req, res) => {
  clearTokenCookie(res);
  return successResponse(res, 'Logged out successfully.');
};

/**
 * @desc    Get currently logged in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  const safeUserData = {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    status: req.user.status,
    createdAt: req.user.createdAt,
  };

  return successResponse(res, 'Current user profile retrieved.', { user: safeUserData });
};

module.exports = {
  register,
  login,
  logout,
  getMe,
};
