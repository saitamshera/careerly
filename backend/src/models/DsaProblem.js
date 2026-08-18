const mongoose = require('mongoose');

const dsaProblemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    difficulty: { type: String, required: true, enum: ['easy', 'medium', 'hard'] },
    topic: { type: String, required: true, trim: true },
    platform: { type: String, default: 'LeetCode' },
    status: { type: String, enum: ['unsolved', 'solved'], default: 'solved' },
    revisionCount: { type: Number, default: 0 },
    timeTaken: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    leetcodeId: { type: Number, default: 0 },
    link: { type: String, default: '' },
    companies: [{ type: String }],
    approach: { type: String, default: '' },
    language: { type: String, default: '' },
    tags: [{ type: String }],
    solvedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

dsaProblemSchema.index({ userId: 1, topic: 1, difficulty: 1, status: 1 });

const DsaProblem = mongoose.model('DsaProblem', dsaProblemSchema);

module.exports = { DsaProblem };