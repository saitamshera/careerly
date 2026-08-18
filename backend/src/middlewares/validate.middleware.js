const { z } = require('zod');
const { ApiError } = require('../utils/apiError');

/**
 * Reusable Zod validation middleware.
 * Usage: router.post('/route', validate(schema), controller)
 */
function validate(schema) {
  return (req, _res, next) => {
    try {
      const result = schema.parse(req.body);
      req.body = result; // Replace with parsed (cleaned) values
      return next();
    } catch (error) {
      if (error instanceof z.ZodError || error.name === 'ZodError' || Array.isArray(error.issues) || Array.isArray(error.errors)) {
        const issues = error.issues || error.errors || [];
        const messages = issues.map((e) => `${(e.path || []).join('.') || 'body'}: ${e.message}`).join('; ');
        return next(new ApiError(400, `Validation failed — ${messages || error.message}`));
      }
      return next(error);
    }
  };
}

module.exports = { validate };
