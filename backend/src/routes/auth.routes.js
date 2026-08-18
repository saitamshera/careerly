const express = require('express');
const {
  register,
  login,
  googleAuth,
  refresh,
  me,
  logout,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  verifyEmail,
  resendVerification
} = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema
} = require('../schemas/auth.schema');

const authRoutes = express.Router();

authRoutes.post('/register', validate(registerSchema), register);
authRoutes.post('/login', validate(loginSchema), login);
authRoutes.post('/google', validate(googleAuthSchema), googleAuth);
authRoutes.post('/refresh', refresh);
authRoutes.post('/logout', logout);
authRoutes.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
authRoutes.post('/verify-reset-otp', validate(verifyResetOtpSchema), verifyResetOtp);
authRoutes.post('/reset-password', validate(resetPasswordSchema), resetPassword);
authRoutes.post('/verify-email', verifyEmail);
authRoutes.post('/resend-verification', resendVerification);
authRoutes.get('/me', protect, me);

module.exports = { authRoutes };