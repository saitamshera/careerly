const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().toLowerCase().email('Please provide a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128)
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please provide a valid email'),
  password: z.string().min(1, 'Password is required')
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please provide a valid email address')
});

const verifyResetOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please provide a valid email address'),
  otp: z.string().trim().length(6, 'OTP must be exactly 6 digits')
});

const resetPasswordSchema = z.object({
  resetToken: z.string().min(1, 'Reset authorization token is required'),
  password: z.string().min(6, 'New password must be at least 6 characters').max(128)
});

const googleAuthSchema = z.object({
  credential: z.string().min(1).optional(),
  idToken: z.string().min(1).optional(),
  code: z.string().min(1).optional()
}).refine((data) => data.credential || data.idToken || data.code, {
  message: 'Google credential or token is required'
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
  googleAuthSchema
};
