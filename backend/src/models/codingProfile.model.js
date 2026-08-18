const mongoose = require('mongoose');

const codingProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    platform: {
      type: String,
      required: true,
      enum: ['leetcode', 'codeforces', 'codechef', 'hackerrank', 'atcoder', 'geeksforgeeks', 'github']
    },
    username: {
      type: String,
      required: true,
      trim: true
    },
    profileUrl: {
      type: String,
      default: ''
    },
    isSelfReported: {
      type: Boolean,
      default: false
    },
    stats: {
      totalSolved: { type: Number, default: 0 },
      easySolved: { type: Number, default: 0 },
      mediumSolved: { type: Number, default: 0 },
      hardSolved: { type: Number, default: 0 },
      currentRating: { type: Number, default: 0 },
      maxRating: { type: Number, default: 0 },
      globalRank: { type: String, default: 'N/A' },
      badges: [{ type: String }],
      lastActiveDate: { type: String, default: '' },
      publicRepos: { type: Number, default: 0 },
      followers: { type: Number, default: 0 },
      following: { type: Number, default: 0 },
      starsReceived: { type: Number, default: 0 },
      totalCommits: { type: Number, default: 0 },
      languages: { type: Map, of: Number, default: {} }
    },
    featuredRepos: [{ type: String }], // Array of pinned repository names for genuine persistence
    lastSyncedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

codingProfileSchema.index({ userId: 1, platform: 1 }, { unique: true });

const CodingProfile = mongoose.model('CodingProfile', codingProfileSchema);

module.exports = { CodingProfile };
