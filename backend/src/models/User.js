const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    googleId: { type: String, default: '' },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    college: { type: String, default: '' },
    branch: { type: String, default: '' },
    graduationYear: { type: Number },
    profileImage: { type: String, default: '' },
    skills: [{ type: String }],
    targetCompanies: [{ type: String }],
    dailyGoal: { type: Number, default: 3 },
    leetcodeUsername: { type: String, default: '' },
    leetcodeStats: {
      totalSolved: { type: Number, default: 0 },
      easySolved: { type: Number, default: 0 },
      mediumSolved: { type: Number, default: 0 },
      hardSolved: { type: Number, default: 0 },
      ranking: { type: Number, default: 0 },
      streak: { type: Number, default: 0 },
      lastSynced: { type: Date }
    },
    githubUrl: { type: String, default: '' },
    linkedinUrl: { type: String, default: '' },
    gmailConnected: { type: Boolean, default: false },
    gmailTokens: { type: String, select: false, default: '' },
    gmailOAuthState: { type: String, default: '' },
    emailVerified: { type: Boolean, default: false },
    refreshToken: { type: String, default: '' },
    emailVerificationToken: { type: String, default: '' },
    emailVerificationExpiresAt: { type: Date },
    passwordResetToken: { type: String, default: '' },
    passwordResetOtp: { type: String, select: false, default: '' },
    passwordResetOtpAttempts: { type: Number, default: 0 },
    passwordResetExpiresAt: { type: Date }
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

module.exports = { User };