const jwt = require('jsonwebtoken');
const { successResponse } = require('./apiResponse');

/**
 * Generate a signed JWT token
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'gym_secret_jwt_key_2026_secure_token',
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
    sameSite: 'lax',
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
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
};

module.exports = {
  generateToken,
  sendTokenCookie,
  clearTokenCookie,
};
