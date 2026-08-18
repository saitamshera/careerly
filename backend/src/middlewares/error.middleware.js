const { ApiError } = require('../utils/apiError');
const { logger } = require('../config/logger');

function errorHandler(error, _request, response, _next) {
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message = error.message || 'Internal Server Error';

  // Log server errors at error level, client errors at warn level
  if (statusCode >= 500) {
    logger.error(message, { statusCode, stack: error.stack });
  } else {
    logger.warn(message, { statusCode });
  }

  response.status(statusCode).json({
    success: false,
    message,
    error: {
      code: error.code || (error instanceof ApiError ? 'REQUEST_ERROR' : 'INTERNAL_ERROR'),
      message,
      details: error.details || undefined
    },
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
  });
}

module.exports = { errorHandler };
