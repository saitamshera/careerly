const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, default: '' },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    version: { type: Number, default: 1 },
    atsScore: { type: Number, default: 0 },
    extractedText: { type: String, default: '' }
  },
  { timestamps: true }
);

resumeSchema.index({ userId: 1, createdAt: -1 });

const Resume = mongoose.model('Resume', resumeSchema);

module.exports = { Resume };