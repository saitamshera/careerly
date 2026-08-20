const { ApiError } = require('../utils/apiError');
const { logger } = require('../config/logger');

function errorHandler(error, _request, response, _next) {
  let statusCode = error instanceof ApiError ? error.statusCode : 500;
  let message = error.message || 'Internal Server Error';

  if (error.name === 'MulterError') {
    statusCode = 400;
    if (error.code === 'LIMIT_FILE_SIZE') {
      message = 'File is too large. Maximum size is 5 MB.';
    }
  } else if (error.message && (
    error.message.includes('Unsupported file type') ||
    error.message.includes('Only PDF') ||
    error.message.includes('Unable to read')
  )) {
    statusCode = 400;
  }

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
