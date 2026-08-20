const { User } = require('../models/User');

function findUserByEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  return User.findOne({ email: normalizedEmail });
}

async function findUserById(userId) {
  return User.findById(userId);
}

async function createUser(userData) {
  return User.create(userData);
}

async function updateUserRefreshToken(userId, refreshToken) {
  return User.findByIdAndUpdate(userId, { refreshToken }, { new: true });
}

async function updateUserEmailVerificationToken(userId, tokenData) {
  return User.findByIdAndUpdate(userId, tokenData, { new: true });
}

async function updateUserPasswordResetToken(userId, tokenData) {
  return User.findByIdAndUpdate(userId, tokenData, { new: true });
}

async function updateUserPassword(userId, password) {
  return User.findByIdAndUpdate(userId, { password }, { new: true });
}

async function markUserEmailVerified(userId) {
  return User.findByIdAndUpdate(
    userId,
    {
      emailVerified: true,
      emailVerificationToken: '',
      emailVerificationExpiresAt: null
    },
    { new: true }
  );
}

async function findUserByPasswordResetToken(token) {
  return User.findOne({ passwordResetToken: token });
}

async function findUserByEmailVerificationToken(token) {
  return User.findOne({ emailVerificationToken: token });
}

module.exports = {
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
};