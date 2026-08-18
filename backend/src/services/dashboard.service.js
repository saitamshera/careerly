const { getUnifiedJobReadiness } = require('./readiness.service');

/**
 * Get unified dashboard summary driven directly by the Placement Intelligence Engine.
 * Answers: "What is my readiness for my target job, and what should I do today?"
 */
async function getDashboardSummary(userId) {
  const readinessData = await getUnifiedJobReadiness(userId);

  return {
    target: readinessData.target,
    jobMatch: readinessData.jobMatch,
    placementReadiness: readinessData.placementReadiness,
    readinessBreakdown: readinessData.readinessBreakdown,
    biggestBottleneck: readinessData.biggestBottleneck,
    topPriorities: readinessData.topPriorities,
    activity: readinessData.activity,
    closedLoopDelta: readinessData.closedLoopDelta,
    
    // Legacy helper fields for backwards compatibility with any remaining widgets
    targetRole: readinessData.target.role,
    targetCompany: readinessData.target.company,
    readinessScore: readinessData.placementReadiness.score,
    readinessLevel: readinessData.placementReadiness.level,
    totalDsaSolved: readinessData.activity.dsaSolvedTotal,
    dsaStreak: readinessData.activity.currentStreak,
    applications: readinessData.activity.activeApplications,
    upcomingOAs: readinessData.activity.upcomingOAs
  };
}

module.exports = { getDashboardSummary };