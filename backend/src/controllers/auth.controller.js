const {
  registerUser,
  loginUser,
  googleAuthUser,
  getProfile,
  sanitizeUser,
  refreshSession,
  logoutUser,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  resetUserPasswordWithToken,
  verifyUserEmail,
  resendVerificationEmail
} = require('../services/auth.service');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiResponse } = require('../utils/apiResponse');

const register = asyncHandler(async (request, response) => {
  const result = await registerUser(request.body);
  response.status(201).json(new ApiResponse(201, { user: sanitizeUser(result.user), accessToken: result.accessToken, refreshToken: result.refreshToken }, 'User registered'));
});

const login = asyncHandler(async (request, response) => {
  const result = await loginUser(request.body);
  response.status(200).json(new ApiResponse(200, result, 'Login successful'));
});

const googleAuth = asyncHandler(async (request, response) => {
  const result = await googleAuthUser(request.body);
  response.status(200).json(new ApiResponse(200, result, 'Google authentication successful'));
});

const refresh = asyncHandler(async (request, response) => {
  const refreshToken = request.body.refreshToken || request.cookies?.refreshToken;
  const result = await refreshSession(refreshToken);

  response.status(200).json(new ApiResponse(200, result, 'Session refreshed'));
});

const me = asyncHandler(async (request, response) => {
  const user = await getProfile(request.user.id);
  response.status(200).json(new ApiResponse(200, sanitizeUser(user), 'Profile loaded'));
});

const logout = asyncHandler(async (request, response) => {
  await logoutUser(request.user.id);
  response.clearCookie('refreshToken');
  response.status(200).json(new ApiResponse(200, {}, 'Logged out'));
});

const forgotPassword = asyncHandler(async (request, response) => {
  const result = await sendPasswordResetOtp(request.body.email);
  response.status(200).json(new ApiResponse(200, result, result.message || 'If an account exists for this email, an OTP has been sent.'));
});

const verifyResetOtp = asyncHandler(async (request, response) => {
  const result = await verifyPasswordResetOtp(request.body);
  response.status(200).json(new ApiResponse(200, result, 'OTP verified successfully'));
});

const resetPassword = asyncHandler(async (request, response) => {
  const result = await resetUserPasswordWithToken({
    resetToken: request.body.resetToken || request.body.token,
    password: request.body.password || request.body.newPassword
  });
  response.status(200).json(new ApiResponse(200, result, 'Password reset successful'));
});

const verifyEmail = asyncHandler(async (request, response) => {
  await verifyUserEmail(request.query.token || request.body.token);
  response.status(200).json(new ApiResponse(200, {}, 'Email verified'));
});

const resendVerification = asyncHandler(async (request, response) => {
  await resendVerificationEmail(request.body.email);
  response.status(200).json(new ApiResponse(200, {}, 'Verification email sent'));
});

module.exports = {
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
};