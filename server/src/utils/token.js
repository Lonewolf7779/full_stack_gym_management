const jwt = require('jsonwebtoken');
const { successResponse } = require('./apiResponse');

/**
 * Generate a signed JWT token
 */
const generateToken = (userId, role) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('Server configuration error: JWT_SECRET environment variable is missing.');
  }

  return jwt.sign(
    { id: userId, role },
    jwtSecret,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

/**
 * Configure cookie options
 */
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/',
  };
};

/**
 * Send JWT in an HTTP-only cookie and return safe user data
 */
const sendTokenCookie = (res, user, statusCode = 200, message = 'Success') => {
  const token = generateToken(user._id, user.role);
  const cookieOptions = getCookieOptions();

  res.cookie('token', token, cookieOptions);

  const safeUserData = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status || 'active',
    createdAt: user.createdAt,
  };

  return successResponse(res, message, { user: safeUserData }, statusCode);
};

/**
 * Clear the authentication cookie upon logout
 */
const clearTokenCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
  });
};

module.exports = {
  generateToken,
  sendTokenCookie,
  clearTokenCookie,
};
