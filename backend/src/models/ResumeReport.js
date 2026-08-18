const mongoose = require('mongoose');

const resumeReportSchema = new mongoose.Schema(
  {
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    atsScore: { type: Number, required: true },
    grammar: { type: Number, required: true },
    keywords: [{ type: String }],
    missingSkills: [{ type: String }],
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    suggestions: [{ type: String }],
    targetJobDescription: { type: String, default: '' },
    matchedKeywords: [{ type: String }],
    atsKeywordMatch: { type: Number, default: 0 },
    sourceText: { type: String, default: '' }
  },
  { timestamps: true }
);

resumeReportSchema.index({ userId: 1, resumeId: 1, createdAt: -1 });

const ResumeReport = mongoose.model('ResumeReport', resumeReportSchema);

module.exports = { ResumeReport };
