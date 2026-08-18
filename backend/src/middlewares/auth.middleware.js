const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { ApiError } = require('../utils/apiError');

function protect(request, _response, next) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication required'));
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    request.user = { id: decoded.sub };
    return next();
  } catch (error) {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
}

module.exports = { protect };