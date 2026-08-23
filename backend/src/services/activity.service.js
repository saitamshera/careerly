const { harvestUserTelemetry } = require('./readiness.service');
const { fetchLeetCodeCalendar } = require('./leetcode.service');
const { logger } = require('../config/logger');

/**
 * Aggregates verified activity across all supported platforms without
 * duplicating the underlying source data in the database.
 * The source of truth remains the platform-specific models.
 */
async function getNormalizedActivity(userId) {
  const telemetry = await harvestUserTelemetry(userId);
  const events = [];

  const pushEvent = (platform, type, dateStr, metadata) => {
    if (!dateStr) return;
    
    // Fix Timezone shift: if date is just 'YYYY-MM-DD', treat it as noon UTC to keep it on the same local day globally
    let finalDateStr = dateStr;
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      finalDateStr = `${dateStr}T12:00:00.000Z`;
    }

    const dateObj = new Date(finalDateStr);
    if (isNaN(dateObj.getTime())) return;
    
    events.push({
      id: `${platform}_${type}_${dateObj.getTime()}_${Math.random().toString(36).substring(2, 9)}`,
      platform,
      activityType: type,
      timestamp: dateObj.toISOString(),
      metadata,
      verified: true
    });
  };

  // 1. Careerly AI Interviews
  (telemetry.interviews || []).forEach(interview => {
    if (interview.status === 'completed') {
      pushEvent('careerly', 'ai_interview_completed', interview.createdAt, {
        title: interview.type === 'technical' ? 'Technical Mock Interview' : 'Behavioral Mock Interview',
        score: interview.overallScore,
        duration: interview.duration, // assumed in minutes
        topics: interview.topics || []
      });
    }
  });

  // 2. Careerly Resume Analysis
  if (telemetry.latestResumeReport) {
    pushEvent('careerly', 'resume_analysis', telemetry.latestResumeReport.createdAt, {
      title: 'Resume Parsed & Evaluated',
      score: telemetry.latestResumeReport.overallScore || telemetry.latestResumeReport.atsScore
    });
  }

  // 3. Careerly DSA Tracker and internal LeetCode tracking
  (telemetry.dsaProblems || []).forEach(problem => {
    if (problem.status === 'solved') {
      const problemPlatform = problem.platform && problem.platform.toLowerCase() === 'leetcode' 
        ? 'leetcode' 
        : 'careerly';

      pushEvent(problemPlatform, 'dsa_solved', problem.solvedAt || problem.createdAt, {
        title: `Solved: ${problem.title}`,
        difficulty: problem.difficulty,
        topics: problem.topic ? [problem.topic] : []
      });
    }
  });

  // 4. Job Applications
  (telemetry.jobs || []).forEach(job => {
    pushEvent('applications', 'application_submitted', job.createdAt, {
      title: `Applied to ${job.company}`,
      role: job.position,
      status: job.status
    });
  });

  logger.info(`[Activity Debug] DSA Problems: ${JSON.stringify(telemetry.dsaProblems.map(p => ({ platform: p.platform, title: p.title })))}`);
  logger.info(`[Activity Debug] Coding Profiles: ${JSON.stringify(telemetry.codingProfiles.map(p => p.platform))}`);


  // 5. GitHub Aggregated Activity (from CodingProfile)
  (telemetry.codingProfiles || []).forEach(profile => {
    const platform = profile.platform;
    const days = profile.stats?.contributionCalendar?.days || [];
    
    if (platform === 'github') {
      days.forEach(day => {
        if (day.count > 0) {
          pushEvent(platform, 'commit', day.date, {
            count: day.count,
            title: `${day.count} commits pushed`
          });
        }
      });
    }
  });

  // 6. LeetCode Aggregated Activity (Live Fetch)
  const leetcodeProfile = (telemetry.codingProfiles || []).find(p => p.platform === 'leetcode');
  const leetcodeUsername = telemetry.user?.leetcodeUsername || leetcodeProfile?.username;

  if (leetcodeUsername) {
    try {
      const leetcodeCal = await fetchLeetCodeCalendar(leetcodeUsername);
      (leetcodeCal?.days || []).forEach(day => {
        if (day.count > 0) {
          // Check if we already have this many or more LeetCode events on this day from DsaProblem
          // To prevent double-counting, we'll only add the diff if the live fetch has more.
          const dayDate = day.date; // YYYY-MM-DD
          const existingCount = events.filter(e => 
            e.platform === 'leetcode' && 
            e.timestamp.startsWith(dayDate)
          ).length;

          if (day.count > existingCount) {
            pushEvent('leetcode', 'problem_solved', day.date, {
              count: day.count - existingCount,
              title: `Solved ${day.count - existingCount} problems`
            });
          }
        }
      });
    } catch (err) {
      logger.warn(`Failed to fetch LeetCode calendar for activity feed: ${err.message}`);
    }
  }

  logger.info(`[Unified Activity] userId: ${userId} -> Events generated: ${events.length}`);

  // Sort newest first
  events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return events;
}

module.exports = {
  getNormalizedActivity
};
