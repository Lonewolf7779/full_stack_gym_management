const { errorResponse } = require('../utils/apiResponse');

/**
 * Middleware to restrict access to specified roles
 * @param  {...string} roles - Permitted user roles ('admin', 'trainer', 'member')
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(
        res,
        'Authentication required before authorization check.',
        null,
        401
      );
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
        null,
        403
      );
    }

    next();
  };
};

module.exports = {
  authorizeRoles,
  authorize: authorizeRoles,
};
