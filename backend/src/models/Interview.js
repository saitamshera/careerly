const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      required: true,
      enum: ['technical', 'behavioral', 'system-design', 'resume-based', 'hr']
    },
    difficulty: { type: String, required: true },
    topic: { type: String, default: '' },
    targetRole: { type: String, default: 'SDE-1' },
    targetCompany: { type: String, default: '' },
    companyIntel: { type: String, default: '' },
    jobDescription: { type: String, default: '' },
    status: { type: String, enum: ['in-progress', 'completed'], default: 'in-progress' },
    questions: [{ type: String }],
    answers: [{ type: String }],
    transcript: [
      {
        speaker: { type: String, enum: ['interviewer', 'candidate'] },
        message: { type: String },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    structuredMemory: {
      technologiesMentioned: [{ type: String }],
      projectsMentioned: [{ type: String }],
      claimsMade: [
        {
          claim: { type: String },
          turnIndex: { type: Number },
          challenged: { type: Boolean, default: false }
        }
      ],
      decisionsMade: [{ type: String }],
      weakAreas: [{ type: String }],
      strongAreas: [{ type: String }],
      topicsCovered: [{ type: String }],
      currentTopic: { type: String, default: '' },
      topicTurnCount: { type: Number, default: 0 },
      adaptedDifficulty: { type: String, default: 'medium' }
    },
    // Top-level legacy score fields for backwards compatibility
    score: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    technicalKnowledge: { type: Number, default: 0 },
    problemSolving: { type: Number, default: 0 },
    behavioralScore: { type: Number, default: 0 },
    correctness: { type: Number, default: 0 },
    overallRating: { type: Number, default: 0 },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    suggestions: [{ type: String }],
    keyImprovement: { type: String, default: '' },
    sampleImprovements: [
      {
        question: { type: String },
        candidateAnswer: { type: String },
        betterAnswer: { type: String }
      }
    ],
    feedback: { type: String, default: '' },
    
    // Comprehensive Bar-Raiser Report Object
    evaluationReport: {
      overallScore: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      technicalKnowledge: { type: Number, default: 0 },
      problemSolving: { type: Number, default: 0 },
      clarity: { type: Number, default: 0 },
      confidence: { type: Number, default: 0 },
      relevance: { type: Number, default: 0 },
      conciseness: { type: Number, default: 0 },
      starStructure: { type: Number, default: 0 },
      ownership: { type: Number, default: 0 },
      technicalDepth: { type: Number, default: 0 },
      architectureScore: { type: Number, default: 0 },
      tradeoffAnalysis: { type: Number, default: 0 },
      strengths: [{ type: String }],
      areasToImprove: [{ type: String }],
      struggledQuestions: [
        {
          question: { type: String },
          candidateAnswer: { type: String },
          analysis: { type: String }
        }
      ],
      strongestAnswer: {
        question: { type: String, default: '' },
        candidateAnswer: { type: String, default: '' },
        reason: { type: String, default: '' }
      },
      weakestAnswer: {
        question: { type: String, default: '' },
        candidateAnswer: { type: String, default: '' },
        missing: { type: String, default: '' }
      },
      verdict: { type: String, default: '' },
      executiveSummary: { type: String, default: '' },
      keyImprovement: { type: String, default: '' },
      keyObservations: [{ type: String }],
      strongestDefendedClaim: {
        claim: { type: String, default: '' },
        technology: { type: String, default: '' },
        defenseSummary: { type: String, default: '' }
      },
      weakestDefendedClaim: {
        claim: { type: String, default: '' },
        technology: { type: String, default: '' },
        issue: { type: String, default: '' }
      },
      strongestTechnicalDecision: {
        decision: { type: String, default: '' },
        justification: { type: String, default: '' }
      },
      weakestTradeoffAnalysis: {
        decision: { type: String, default: '' },
        missingTradeoff: { type: String, default: '' }
      },
      depthGaps: [{ type: String }],
      recommendedPracticeAreas: [{ type: String }],
      sampleImprovements: [
        {
          question: { type: String },
          candidateAnswer: { type: String },
          betterAnswer: { type: String }
        }
      ]
    }
  },
  { timestamps: true }
);

interviewSchema.index({ userId: 1, createdAt: -1 });

const Interview = mongoose.model('Interview', interviewSchema);

module.exports = { Interview };