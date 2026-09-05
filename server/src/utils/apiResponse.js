/**
 * Standardized API response utilities
 */

const successResponse = (res, message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString(),
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

const errorResponse = (res, message, error = null, statusCode = 500) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  if (error && process.env.NODE_ENV === 'development') {
    response.error = typeof error === 'object' ? error.message || error : error;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  errorResponse,
};
