const { errorResponse } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  console.error('[Server Error]', err.stack || err.message);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return errorResponse(res, 'Validation Error', messages.join(', '), 400);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return errorResponse(res, `Duplicate entry for field: ${field}`, null, 409);
  }

  // Mongoose cast error (invalid ObjectID)
  if (err.name === 'CastError') {
    return errorResponse(res, `Resource not found with id: ${err.value}`, null, 404);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid authentication token', null, 401);
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Authentication token expired', null, 401);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return errorResponse(res, message, err, statusCode);
};

module.exports = errorHandler;
