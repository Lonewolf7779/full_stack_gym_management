const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Middleware to authenticate requests using JWT stored in HTTP-only cookie
 */
const protect = async (req, res, next) => {
  try {
    let token = null;

    // Check HTTP-only cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // Fallback: Check Authorization header (for testing or API tools)
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return errorResponse(
        res,
        'Authentication required. Please log in to access this resource.',
        null,
        401
      );
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'gym_secret_jwt_key_2026_secure_token'
    );

    // Find user by ID in token
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return errorResponse(
        res,
        'User belonging to this session no longer exists.',
        null,
        401
      );
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Invalid or expired session. Please log in again.', null, 401);
    }
    return errorResponse(res, 'Authentication failed', error, 500);
  }
};

module.exports = {
  protect,
};
