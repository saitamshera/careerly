const mongoose = require('mongoose');

const roadmapTaskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  category: {
    type: String,
    enum: ['DSA', 'Project', 'Resume', 'Interview', 'Application', 'Core', 'System Design'],
    default: 'Core'
  },
  task: { type: String, required: true },
  estimatedHours: { type: Number, default: 2 },
  completed: { type: Boolean, default: false }
});

const roadmapResourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  link: { type: String, default: '' },
  type: { type: String, default: 'Documentation' }
});

const roadmapWeekSchema = new mongoose.Schema({
  weekNumber: { type: Number, required: true },
  title: { type: String, required: true },
  phase: { type: String, default: 'Preparation' },
  objective: { type: String, default: '' },
  estimatedHours: { type: Number, default: 15 },
  priority: {
    type: String,
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    default: 'HIGH'
  },
  tasks: [roadmapTaskSchema],
  resources: [roadmapResourceSchema],
  expectedOutcome: { type: String, default: '' }
});

const roadmapGapSchema = new mongoose.Schema({
  area: { type: String, required: true },
  reason: { type: String, default: '' },
  priority: {
    type: String,
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    default: 'HIGH'
  }
});

const exitCriterionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  target: { type: String, required: true },
  current: { type: String, required: true },
  met: { type: Boolean, default: false }
});

const stageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tagline: { type: String, default: '' },
  goal: { type: String, default: '' },
  progress: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['completed', 'in_progress', 'locked'],
    default: 'locked'
  },
  exitCriteria: [exitCriterionSchema]
});

const gapBenchmarkSchema = new mongoose.Schema({
  metric: { type: String, required: true },
  current: { type: Number, default: 0 },
  target: { type: Number, default: 0 },
  gap: { type: Number, default: 0 },
  label: { type: String, default: '' },
  unit: { type: String, default: '' }
});

const roadmapSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    targetRole: { type: String, required: true, default: 'Software Engineer' },
    targetCompany: { type: String, default: '' },
    monthsRemaining: { type: Number, default: 3 },
    hoursDaily: { type: Number, default: 4 },
    currentStage: {
      type: String,
      enum: ['foundation', 'interview_prep', 'placement_execution'],
      default: 'foundation'
    },
    stages: {
      foundation: stageSchema,
      interview_prep: stageSchema,
      placement_execution: stageSchema
    },
    gapsBenchmark: [gapBenchmarkSchema],
    profileSnapshot: {
      currentSkills: [{ type: String }],
      projects: [{ type: String }],
      resumeScore: { type: Number, default: 0 },
      dsaProgress: { type: Number, default: 0 },
      dsaProblemsSolved: { type: Number, default: 0 },
      leetcodeSolved: { type: Number, default: 0 },
      githubConnected: { type: Boolean, default: false },
      githubRepos: { type: Number, default: 0 },
      applicationsSubmitted: { type: Number, default: 0 },
      interviewHistory: { type: Number, default: 0 },
      weakTopics: [{ type: String }],
      strongTopics: [{ type: String }]
    },
    readiness: {
      score: { type: Number, required: true, default: 50 },
      level: {
        type: String,
        enum: ['Needs Work', 'Developing', 'Interview Ready', 'Strong Position'],
        default: 'Developing'
      },
      breakdown: {
        resume: { type: Number, default: 0 },
        dsa: { type: Number, default: 0 },
        projects: { type: Number, default: 0 },
        interview: { type: Number, default: 0 },
        coding: { type: Number, default: 0 }
      }
    },
    workload: {
      plannedHours: { type: Number, default: 0 },
      availableHours: { type: Number, default: 0 },
      weeklyHours: { type: Number, default: 24 },
      totalWeeks: { type: Number, default: 12 }
    },
    summary: { type: String, default: '' },
    aiExplanation: { type: String, default: '' },
    biggestGaps: [roadmapGapSchema],
    weeks: [roadmapWeekSchema],
    recommendations: [{ type: String }],
    risks: [
      {
        risk: { type: String },
        mitigation: { type: String }
      }
    ],
    completedTaskIds: [{ type: String }],
    lastGeneratedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const Roadmap = mongoose.model('Roadmap', roadmapSchema);

module.exports = { Roadmap };
