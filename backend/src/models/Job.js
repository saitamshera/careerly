const mongoose = require('mongoose');

const companyFeedbackSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  statusStage: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});

const interviewRoundSchema = new mongoose.Schema({
  round: { type: Number, default: 1 },
  type: { type: String, enum: ['technical', 'hr', 'system-design', 'behavioral', 'coding'] },
  date: { type: Date },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' }
});

const jobSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    location: { type: String, default: '' },
    salary: { type: String, default: '' },
    dateApplied: { type: Date, default: Date.now },
    deadline: { type: Date },
    oaDate: { type: Date },
    oaPlatform: { type: String, default: 'HackerRank' },
    status: {
      type: String,
      enum: [
        'saved',
        'wishlist',
        'applied',
        'resume_review',
        'oa',
        'interview',
        'technical_1',
        'technical_2',
        'system_design',
        'manager',
        'hr',
        'offer',
        'rejected',
        'accepted'
      ],
      default: 'applied',
      index: true
    },
    skills: [{ type: String }],
    interviewRounds: [interviewRoundSchema],
    source: { type: String, enum: ['manual', 'gmail', 'search'], default: 'manual' },
    gmailThreadId: { type: String, default: '' },
    companyLogo: { type: String, default: '' },
    recruiterName: { type: String, default: '' },
    recruiterEmail: { type: String, default: '' },
    interviewDate: { type: Date },
    resumeVersion: { type: String, default: 'v1.0 (Master)' },
    coverLetterVersion: { type: String, default: 'Standard Tech' },
    notes: { type: String, default: '' },
    jobLink: { type: String, default: '' },
    referral: { type: String, default: '' },
    companyFeedback: [companyFeedbackSchema],
    reminders: [
      {
        reminderDate: { type: Date },
        title: { type: String },
        completed: { type: Boolean, default: false }
      }
    ]
  },
  { timestamps: true }
);

jobSchema.index({ userId: 1, status: 1, oaDate: 1 });

const Job = mongoose.model('Job', jobSchema);

module.exports = { Job };