const { errorResponse } = require('../utils/apiResponse');

const notFoundHandler = (req, res, next) => {
  return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, null, 404);
};

module.exports = notFoundHandler;
