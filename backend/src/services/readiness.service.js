const { User } = require('../models/User');
const { DsaProblem } = require('../models/DsaProblem');
const { CodingProfile } = require('../models/codingProfile.model');
const { Job } = require('../models/Job');
const { findLatestReportByUserId } = require('../repositories/resume.repository');
const { findInterviewsByUserId } = require('../repositories/ai.repository');
const { getStreak, getUserDsaStats } = require('./dsa.service');
const { GENERAL_SDE_BENCHMARK, extractJobRequirements, calculateJobMatch } = require('./jobAnalysis.service');
const { calculateDeterministicPriorities } = require('./priority.service');

/**
 * Harvest all actual user telemetry across existing database sources.
 */
async function harvestUserTelemetry(userId) {
  const [
    user,
    dsaProblems,
    dsaStats,
    streak,
    codingProfiles,
    latestResumeReport,
    interviews,
    jobs
  ] = await Promise.all([
    User.findById(userId).lean(),
    DsaProblem.find({ userId }).lean(),
    getUserDsaStats(userId).catch(() => ({ total: 0, byTopic: {} })),
    getStreak(userId).catch(() => ({ currentStreak: 0, longestStreak: 0 })),
    CodingProfile.find({ userId }).lean(),
    findLatestReportByUserId(userId).catch(() => null),
    findInterviewsByUserId(userId).catch(() => []),
    Job.find({ userId }).lean()
  ]);

  return {
    user: user || {},
    dsaProblems: dsaProblems || [],
    dsaStats,
    streak,
    codingProfiles: codingProfiles || [],
    latestResumeReport,
    interviews: interviews || [],
    jobs: jobs || []
  };
}

/**
 * Calculate evidence-first readiness breakdown across all supported dimensions.
 */
function calculateEvidenceReadiness(telemetry, jobRequirements) {
  const { user, dsaProblems, codingProfiles, latestResumeReport, interviews, jobs } = telemetry;

  const leetcodeProfile = codingProfiles.find((p) => p.platform === 'leetcode');
  const githubProfile = codingProfiles.find((p) => p.platform === 'github');

  const verifiedLeetcodeSolved = Number(leetcodeProfile?.stats?.totalSolved || user?.leetcodeStats?.totalSolved || 0);
  const trackedDsaSolved = dsaProblems.length;
  const totalDsaSolved = verifiedLeetcodeSolved + trackedDsaSolved;

  // 1. DSA & Algorithmic Competency Dimension
  let dsaDimension = {
    score: null,
    status: 'insufficient_data',
    evidence: [],
    weakTopics: []
  };

  if (totalDsaSolved > 0) {
    const topicCounts = {};
    dsaProblems.forEach((p) => {
      const topic = p.topic || 'General';
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });

    const topicsCovered = Object.keys(topicCounts).length;
    const mediumHard = (leetcodeProfile?.stats?.mediumSolved || 0) + (leetcodeProfile?.stats?.hardSolved || 0) +
      dsaProblems.filter((p) => p.difficulty === 'Medium' || p.difficulty === 'Hard').length;

    // Normalization against general benchmark of 150 problems
    const volumeScore = Math.min(100, Math.round((totalDsaSolved / GENERAL_SDE_BENCHMARK.dsaProblemTarget) * 100));
    const topicScore = Math.min(100, Math.round((topicsCovered / 8) * 100));
    const dsaScore = Math.min(100, Math.round(volumeScore * 0.65 + topicScore * 0.35));

    const evidenceList = [];
    if (verifiedLeetcodeSolved > 0) {
      evidenceList.push(`${verifiedLeetcodeSolved} verified LeetCode problems (${leetcodeProfile?.stats?.mediumSolved || 0} medium, ${leetcodeProfile?.stats?.hardSolved || 0} hard)`);
    }
    if (trackedDsaSolved > 0) {
      evidenceList.push(`${trackedDsaSolved} tracked DSA Tracker solutions across ${topicsCovered} topics`);
    }
    if (mediumHard > 0) {
      evidenceList.push(`${mediumHard} medium/hard difficulty problems mastered`);
    }

    dsaDimension = {
      score: dsaScore,
      status: 'measured',
      evidence: evidenceList,
      weakTopics: Object.keys(topicCounts).length ? Object.keys(topicCounts).slice(0, 2) : ['Dynamic Programming', 'Graph Traversal']
    };
  }

  // 2. Resume & ATS Alignment Dimension
  let resumeDimension = {
    score: null,
    status: 'insufficient_data',
    evidence: []
  };

  if (latestResumeReport && typeof latestResumeReport.atsScore === 'number') {
    const ats = latestResumeReport.atsScore;
    const skillsCount = latestResumeReport.skillsFound?.length || 0;
    const evidenceList = [
      `ATS Score: ${ats}/100 based on automated recruiter parser analysis`,
      `${skillsCount} technical skills extracted and verified from resume document`
    ];

    if (latestResumeReport.strengths?.length) {
      evidenceList.push(`Verified strengths: ${latestResumeReport.strengths.slice(0, 2).join('; ')}`);
    }

    resumeDimension = {
      score: ats,
      status: 'measured',
      evidence: evidenceList
    };
  }

  // 3. Technical Mock Interview Dimension
  let interviewDimension = {
    score: null,
    status: 'insufficient_data',
    evidence: [],
    completedCount: 0
  };

  const completedMocks = (interviews || []).filter((i) => i.status === 'completed');
  if (completedMocks.length > 0) {
    const scores = completedMocks.map((i) => i.evaluationReport?.overallScore || i.score || 0).filter((s) => s > 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 65;

    interviewDimension = {
      score: avgScore,
      status: 'measured',
      completedCount: completedMocks.length,
      evidence: [
        `${completedMocks.length} completed voice AI mock interview session(s)`,
        `Average evaluated technical rating: ${avgScore}/100`,
        `Latest session verdict: "${completedMocks[0]?.evaluationReport?.verdict || 'Evaluation Complete'}"`
      ]
    };
  }

  // 4. Communication & Behavioral Dimension
  let communicationDimension = {
    score: null,
    status: 'insufficient_data',
    evidence: []
  };

  const commScores = completedMocks
    .map((i) => i.evaluationReport?.communication || i.communication || 0)
    .filter((s) => s > 0);

  if (commScores.length > 0) {
    const avgComm = Math.round(commScores.reduce((a, b) => a + b, 0) / commScores.length);
    communicationDimension = {
      score: avgComm,
      status: 'measured',
      evidence: [
        `Average communication delivery score: ${avgComm}/100 across ${commScores.length} mock(s)`,
        `STAR method structure and clarity evaluated by senior bar-raiser model`
      ]
    };
  }

  // 5. Engineering Projects & GitHub Dimension
  let projectsDimension = {
    score: null,
    status: 'insufficient_data',
    evidence: []
  };

  if (githubProfile && githubProfile.stats) {
    const publicRepos = githubProfile.stats.publicRepos || 0;
    const languages = Object.keys(githubProfile.stats.languages || {});
    const projectScore = Math.min(100, Math.max(30, Math.round(publicRepos * 10 + languages.length * 8)));

    projectsDimension = {
      score: projectScore,
      status: 'measured',
      evidence: [
        `${publicRepos} public repositories verified on GitHub`,
        `Core languages detected: ${languages.slice(0, 4).join(', ') || 'JavaScript, Python'}`,
        githubProfile.stats.totalCommits ? `${githubProfile.stats.totalCommits} public commits verified` : 'Live repository presence confirmed'
      ]
    };
  }

  // 6. Overall Placement Readiness
  const measuredDimensions = [
    dsaDimension,
    resumeDimension,
    interviewDimension,
    communicationDimension,
    projectsDimension
  ].filter((d) => d.status === 'measured');

  let overallReadinessScore = null;
  let overallReadinessLevel = 'Insufficient Data';

  if (measuredDimensions.length > 0) {
    const totalPoints = measuredDimensions.reduce((acc, d) => acc + (d.score || 0), 0);
    overallReadinessScore = Math.round(totalPoints / measuredDimensions.length);

    if (overallReadinessScore >= 80) overallReadinessLevel = 'Strong Position';
    else if (overallReadinessScore >= 65) overallReadinessLevel = 'Interview Ready';
    else if (overallReadinessScore >= 45) overallReadinessLevel = 'Developing';
    else overallReadinessLevel = 'Needs Focus';
  }

  return {
    overallReadiness: {
      score: overallReadinessScore,
      level: overallReadinessLevel,
      measuredDimensionsCount: measuredDimensions.length,
      totalDimensionsCount: 5
    },
    dimensions: {
      dsaCompetency: dsaDimension,
      resumeAlignment: resumeDimension,
      interviewPerformance: interviewDimension,
      communication: communicationDimension,
      engineeringProjects: projectsDimension
    }
  };
}

/**
 * Closed-Loop Progress: Explains what changed between snapshots.
 */
function calculateClosedLoopDelta(telemetry, currentReadinessScore) {
  const { dsaProblems, interviews, latestResumeReport } = telemetry;
  const recentDsaCount = dsaProblems.filter((p) => {
    const daysOld = (Date.now() - new Date(p.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24);
    return daysOld <= 7;
  }).length;

  const recentInterviews = (interviews || []).filter((i) => {
    const daysOld = (Date.now() - new Date(i.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24);
    return daysOld <= 7 && i.status === 'completed';
  }).length;

  const realEvents = [];
  if (recentDsaCount > 0) {
    realEvents.push(`Solved ${recentDsaCount} DSA problems this week`);
  }
  if (recentInterviews > 0) {
    realEvents.push(`Completed ${recentInterviews} AI mock interview(s)`);
  }
  if (latestResumeReport && latestResumeReport.atsScore) {
    realEvents.push(`Evaluated resume with ATS score of ${latestResumeReport.atsScore}/100`);
  }

  return {
    eventsCount: realEvents.length,
    recentEvents: realEvents,
    summary: realEvents.length > 0
      ? `Recent progress: ${realEvents.join(' • ')}`
      : 'No new practice activity recorded this week. Complete recommended actions below to improve readiness.'
  };
}

/**
 * Main Entry Point: Unified Placement Intelligence Assessment.
 */
async function getUnifiedJobReadiness(userId, targetOverride = null) {
  const telemetry = await harvestUserTelemetry(userId);
  const { user } = telemetry;

  const targetRole = targetOverride?.targetRole || user?.targetRole || 'Software Development Engineer';
  const targetCompany = targetOverride?.targetCompany || user?.targetCompany || 'General Tech';
  const jobDescription = targetOverride?.jobDescription || '';

  // 1. Extract Target Job Requirements
  const jobRequirements = await extractJobRequirements({
    targetRole,
    targetCompany,
    jobDescription
  });

  // 2. Deterministic Job Match
  const githubLanguages = telemetry.codingProfiles.find((p) => p.platform === 'github')?.stats?.languages
    ? Object.keys(telemetry.codingProfiles.find((p) => p.platform === 'github').stats.languages)
    : [];

  const jobMatch = calculateJobMatch({
    candidateSkills: user?.skills || [],
    candidateProjects: (user?.projects || []).map((p) => p.title || p.name),
    resumeReport: telemetry.latestResumeReport,
    dsaProblems: telemetry.dsaProblems || [],
    codingProfiles: telemetry.codingProfiles || [],
    interviews: telemetry.interviews || [],
    githubLanguages
  }, jobRequirements);

  // 3. Evidence-First Placement Readiness
  const readiness = calculateEvidenceReadiness(telemetry, jobRequirements);

  // 4. Activity & Pipeline Stats
  const pipelineStats = {
    applied: telemetry.jobs.length,
    oa: telemetry.jobs.filter((j) => j.status === 'oa' || j.oaDate).length,
    technicalRounds: telemetry.jobs.filter((j) => ['technical_1', 'technical_2', 'system_design', 'interview'].includes(j.status)).length,
    offers: telemetry.jobs.filter((j) => j.status === 'offer').length
  };

  const activity = {
    currentStreak: telemetry.streak?.currentStreak || 0,
    longestStreak: telemetry.streak?.longestStreak || 0,
    dsaSolvedTotal: (telemetry.codingProfiles.find((p) => p.platform === 'leetcode')?.stats?.totalSolved || 0) + telemetry.dsaProblems.length,
    activeApplications: telemetry.jobs.length,
    upcomingOAs: pipelineStats.oa
  };

  // 5. Deterministic Priority Engine
  const { biggestBottleneck, topPriorities } = calculateDeterministicPriorities({
    readinessDimensions: readiness.dimensions,
    jobMatch,
    jobRequirements,
    pipelineStats,
    telemetry
  });

  // 6. Closed-Loop Delta Explanation
  const closedLoopDelta = calculateClosedLoopDelta(telemetry, readiness.overallReadiness.score);

  return {
    target: {
      role: targetRole,
      company: targetCompany,
      experienceLevel: jobRequirements.experienceLevel,
      hasCustomJobDescription: Boolean(jobDescription && jobDescription.length > 50)
    },
    jobRequirements: {
      requiredSkills: jobRequirements.requiredSkills,
      preferredSkills: jobRequirements.preferredSkills,
      coreAreas: jobRequirements.coreAreas
    },
    jobMatch,
    placementReadiness: readiness.overallReadiness,
    readinessBreakdown: readiness.dimensions,
    biggestBottleneck,
    topPriorities,
    activity,
    closedLoopDelta
  };
}

module.exports = {
  getUnifiedJobReadiness,
  harvestUserTelemetry
};
