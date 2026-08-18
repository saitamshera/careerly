const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { env } = require('../config/env');
const { ApiError } = require('../utils/apiError');
const { sendMail, isMailerConfigured } = require('../utils/mailer');
const {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserRefreshToken,
  updateUserEmailVerificationToken,
  updateUserPasswordResetToken,
  updateUserPassword,
  markUserEmailVerified,
  findUserByPasswordResetToken,
  findUserByEmailVerificationToken
} = require('../repositories/user.repository');

function createAuthTokens(userId) {
  const accessToken = jwt.sign({ sub: userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN
  });

  const refreshToken = jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN
  });

  return { accessToken, refreshToken };
}

function createOneTimeToken() {
  return jwt.sign({}, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getSafeUser(user) {
  return sanitizeUser(user);
}

async function registerUser(payload) {
  const existingUser = await findUserByEmail(payload.email);

  if (existingUser) {
    throw new ApiError(409, 'Email already registered');
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);
  const emailVerificationToken = createOneTimeToken();
  const user = await createUser({
    ...payload,
    password: hashedPassword,
    emailVerificationToken,
    emailVerificationExpiresAt: new Date(Date.now() + 15 * 60 * 1000)
  });
  const tokens = createAuthTokens(user._id.toString());
  await updateUserRefreshToken(user._id, hashToken(tokens.refreshToken));

  await sendMail({
    to: user.email,
    subject: 'Verify your AI Placement Companion account',
    text: `Verify your email using this token: ${emailVerificationToken}`,
    html: `<p>Verify your email using this token: <strong>${emailVerificationToken}</strong></p>`
  });

  return {
    user: getSafeUser(user),
    ...tokens
  };
}

async function loginUser({ email, password }) {
  const user = await findUserByEmail(email).select('+password');

  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const tokens = createAuthTokens(user._id.toString());
  await updateUserRefreshToken(user._id, hashToken(tokens.refreshToken));

  return {
    user: getSafeUser(user),
    ...tokens
  };
}

async function getProfile(userId) {
  const user = await findUserById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return user;
}

async function refreshSession(refreshToken) {
  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token required');
  }

  let decoded;

  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch (_error) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const user = await findUserById(decoded.sub);

  if (!user || user.refreshToken !== hashToken(refreshToken)) {
    throw new ApiError(401, 'Refresh token mismatch');
  }

  const tokens = createAuthTokens(user._id.toString());
  await updateUserRefreshToken(user._id, hashToken(tokens.refreshToken));

  return {
    user: getSafeUser(user),
    ...tokens
  };
}

async function logoutUser(userId) {
  await updateUserRefreshToken(userId, '');
}

async function verifyGoogleCredential({ token, code }) {
  const { OAuth2Client } = require('google-auth-library');
  const client = new OAuth2Client(
    env.GOOGLE_CLIENT_ID || undefined,
    env.GOOGLE_CLIENT_SECRET || undefined,
    'postmessage'
  );

  let idToken = token;

  if (!idToken && code) {
    try {
      const { tokens } = await client.getToken(code);
      idToken = tokens.id_token;
    } catch (err) {
      console.error('[Google Auth] Failed to exchange authorization code for tokens:', err.message);
      throw new ApiError(401, `Failed to exchange Google authorization code: ${err.message}`);
    }
  }

  if (!idToken) throw new ApiError(400, 'Google token or authorization code is required');

  // Try verification via googleapis OAuth2Client first
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID || undefined
    });
    const payload = ticket.getPayload();
    if (payload && payload.email) {
      return {
        email: payload.email.toLowerCase(),
        name: payload.name || payload.email.split('@')[0],
        googleId: payload.sub,
        picture: payload.picture || '',
        emailVerified: Boolean(payload.email_verified)
      };
    }
  } catch (_libErr) {
    // Fallback to Google tokeninfo public verification endpoint
    try {
      const axios = require('axios');
      const res = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, { timeout: 6000 });
      if (res.data && res.data.email) {
        return {
          email: res.data.email.toLowerCase(),
          name: res.data.name || res.data.email.split('@')[0],
          googleId: res.data.sub,
          picture: res.data.picture || '',
          emailVerified: Boolean(res.data.email_verified)
        };
      }
    } catch (_httpErr) {
      throw new ApiError(401, 'Invalid Google credentials. Signature verification failed.');
    }
  }

  throw new ApiError(401, 'Unable to verify Google authentication token');
}

async function googleAuthUser({ credential, idToken, code }) {
  const token = credential || idToken;
  if (!token && !code) {
    throw new ApiError(400, 'Google credential token or authorization code is required');
  }

  const googleProfile = await verifyGoogleCredential({ token, code });
  if (!googleProfile.email) {
    throw new ApiError(400, 'Google account does not provide a verified email address');
  }

  const { User } = require('../models/User');
  let user = await findUserByEmail(googleProfile.email);

  if (user) {
    // Account Linking: Link Google ID and mark email verified if not already
    const updates = {};
    if (!user.googleId) updates.googleId = googleProfile.googleId;
    if (!user.emailVerified) updates.emailVerified = true;
    if (!user.profileImage && googleProfile.picture) updates.profileImage = googleProfile.picture;
    if (user.authProvider !== 'google' && !user.authProvider) updates.authProvider = 'google';

    if (Object.keys(updates).length > 0) {
      user = await User.findByIdAndUpdate(user._id, updates, { new: true });
    }
  } else {
    // New user registration via Google
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    user = await createUser({
      name: googleProfile.name,
      email: googleProfile.email.toLowerCase(),
      password: hashedPassword,
      googleId: googleProfile.googleId,
      authProvider: 'google',
      profileImage: googleProfile.picture || '',
      emailVerified: true
    });
  }

  const tokens = createAuthTokens(user._id.toString());
  await updateUserRefreshToken(user._id, hashToken(tokens.refreshToken));

  return {
    user: getSafeUser(user),
    ...tokens
  };
}

async function sendPasswordResetOtp(email) {
  if (!email) {
    throw new ApiError(400, 'Email address is required');
  }

  if (!isMailerConfigured()) {
    throw new ApiError(503, 'Email service is not configured on the server. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in backend/.env to send OTP emails.');
  }

  const user = await findUserByEmail(email);
  if (!user) {
    // Prevent account enumeration by returning generic success message
    return { success: true, message: 'If an account exists for this email, an OTP has been sent.' };
  }

  // Generate cryptographically secure random 6-digit OTP (100000 - 999999)
  const otp = crypto.randomInt(100000, 1000000).toString();
  const hashedOtp = hashToken(otp);

  const mailResult = await sendMail({
    to: user.email,
    subject: 'Careerly - Password Reset OTP',
    text: `Your OTP for resetting your Careerly password is: ${otp}\n\nThis OTP expires in 10 minutes.\n\nIf you did not request this, you can safely ignore this email.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #059669; margin: 0; font-size: 22px; font-weight: 800;">Careerly</h2>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Password Reset Verification</p>
        </div>
        <p style="color: #334155; font-size: 13px; line-height: 1.5;">Hello,</p>
        <p style="color: #334155; font-size: 13px; line-height: 1.5;">We received a request to reset your Careerly workspace password. Enter this 6-digit One-Time Password (OTP) to continue:</p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; text-align: center; margin: 18px 0;">
          <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #047857; font-family: monospace;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 12px; line-height: 1.4;">This code is valid for <strong>10 minutes</strong> and can only be used once.</p>
        <p style="color: #94a3b8; font-size: 11px; margin-top: 20px; border-top: 1px solid #f1f5f9; pt: 12px;">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
      </div>
    `
  });

  if (!mailResult.success) {
    throw new ApiError(503, mailResult.error || 'Failed to deliver OTP email. Please check SMTP configuration.');
  }

  // Only persist OTP in DB after email has been delivered
  const { User } = require('../models/User');
  await User.findByIdAndUpdate(user._id, {
    passwordResetOtp: hashedOtp,
    passwordResetExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
    passwordResetOtpAttempts: 0
  });

  return { success: true, message: 'OTP sent to your email.' };
}

async function verifyPasswordResetOtp({ email, otp }) {
  if (!email || !otp) {
    throw new ApiError(400, 'Email and 6-digit OTP are required');
  }

  const cleanOtp = String(otp).trim();
  if (cleanOtp.length !== 6) {
    throw new ApiError(400, 'OTP must be exactly 6 digits');
  }

  const { User } = require('../models/User');
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordResetOtp');

  if (!user || !user.passwordResetOtp) {
    throw new ApiError(400, 'Invalid or expired OTP. Please request a new code.');
  }

  if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() < Date.now()) {
    await User.findByIdAndUpdate(user._id, { passwordResetOtp: '', passwordResetExpiresAt: null });
    throw new ApiError(400, 'OTP has expired. Please request a new code.');
  }

  if ((user.passwordResetOtpAttempts || 0) >= 5) {
    await User.findByIdAndUpdate(user._id, { passwordResetOtp: '', passwordResetExpiresAt: null });
    throw new ApiError(429, 'Too many failed attempts. This OTP has been invalidated for security. Please request a new one.');
  }

  const hashedInput = hashToken(cleanOtp);
  if (user.passwordResetOtp !== hashedInput) {
    await User.findByIdAndUpdate(user._id, { $inc: { passwordResetOtpAttempts: 1 } });
    throw new ApiError(400, 'Incorrect OTP. Please check your email and try again.');
  }

  // Single-use: clear OTP and issue a short-lived reset authorization token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedResetToken = hashToken(resetToken);

  await User.findByIdAndUpdate(user._id, {
    passwordResetOtp: '',
    passwordResetToken: hashedResetToken,
    passwordResetExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins to complete reset
    passwordResetOtpAttempts: 0
  });

  return {
    resetToken,
    message: 'OTP verified successfully. You may now set your new password.'
  };
}

async function resetUserPasswordWithToken({ resetToken, password }) {
  if (!resetToken || !password) {
    throw new ApiError(400, 'Reset token and new password are required');
  }

  if (password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters');
  }

  const hashedToken = hashToken(resetToken);
  const { User } = require('../models/User');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiresAt: { $gt: new Date() }
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired password reset session. Please request a new OTP.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.findByIdAndUpdate(user._id, {
    password: hashedPassword,
    passwordResetToken: '',
    passwordResetExpiresAt: null,
    refreshToken: '' // Invalidate existing sessions for security
  });

  return { message: 'Password updated successfully. Please sign in with your new password.' };
}

async function verifyUserEmail(token) {
  if (!token) {
    throw new ApiError(400, 'Verification token is required');
  }

  const user = await findUserByEmailVerificationToken(token);

  if (!user || user.emailVerificationToken !== token) {
    throw new ApiError(400, 'Invalid verification token');
  }

  if (user.emailVerificationExpiresAt && user.emailVerificationExpiresAt.getTime() < Date.now()) {
    throw new ApiError(400, 'Verification token expired');
  }

  await markUserEmailVerified(user._id);
  return { verified: true };
}

async function resendVerificationEmail(email) {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const emailVerificationToken = createOneTimeToken();
  await updateUserEmailVerificationToken(user._id, {
    emailVerificationToken,
    emailVerificationExpiresAt: new Date(Date.now() + 15 * 60 * 1000)
  });

  await sendMail({
    to: user.email,
    subject: 'Verify your AI Placement Companion account',
    text: `Verify your email using this token: ${emailVerificationToken}`,
    html: `<p>Verify your email using this token: <strong>${emailVerificationToken}</strong></p>`
  });

  return { sent: true };
}



async function getCurrentUserSession(userId) {
  const user = await findUserById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return getSafeUser(user);
}

function sanitizeUser(user) {
  const plainUser = user.toObject ? user.toObject() : user;
  delete plainUser.password;
  delete plainUser.refreshToken;
  delete plainUser.emailVerificationToken;
  delete plainUser.emailVerificationExpiresAt;
  delete plainUser.passwordResetToken;
  delete plainUser.passwordResetOtp;
  delete plainUser.passwordResetOtpAttempts;
  delete plainUser.passwordResetExpiresAt;
  return plainUser;
}

module.exports = {
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
  sendPasswordResetLink: sendPasswordResetOtp,
  resetUserPassword: resetUserPasswordWithToken,
  verifyUserEmail,
  resendVerificationEmail,
  getCurrentUserSession
};