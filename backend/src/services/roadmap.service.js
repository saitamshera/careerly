const mongoose = require('mongoose');
const { ApiError } = require('../utils/apiError');
const { env } = require('../config/env');
const { logger } = require('../config/logger');
const { z } = require('zod');
const { generateStructuredJSON } = require('../utils/geminiClient');
const { User } = require('../models/User');
const { DsaProblem } = require('../models/DsaProblem');
const { CodingProfile } = require('../models/codingProfile.model');
const { Job } = require('../models/Job');
const { Roadmap } = require('../models/Roadmap');
const { findLatestReportByUserId } = require('../repositories/resume.repository');
const { findInterviewsByUserId } = require('../repositories/ai.repository');

function normalizeList(values = []) {
  if (Array.isArray(values)) {
    return values.map((value) => String(value || '').trim()).filter(Boolean);
  }

  return String(values || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function buildResourceCatalog({ targetCompany, targetRole, currentSkills, weakTopics, strongTopics }) {
  const skills = normalizeList(currentSkills).map((skill) => skill.toLowerCase());
  const focusTopics = [...normalizeList(weakTopics), ...normalizeList(strongTopics)].slice(0, 4);
  const company = String(targetCompany || 'product companies').toLowerCase();
  const role = String(targetRole || 'software engineer').toLowerCase();

  return [
    {
      type: 'YouTube',
      title: `${role} interview preparation`,
      resource: `YouTube search for ${role} interview prep`,
      link: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${role} interview preparation`)}`,
      difficulty: 'Medium',
      duration: '45 min',
      priority: 'High'
    },
    {
      type: 'GitHub',
      title: `${skills[0] || 'full-stack'} project ideas`,
      resource: `GitHub repositories for ${skills[0] || 'full-stack'} projects`,
      link: `https://github.com/search?q=${encodeURIComponent(`${skills[0] || 'full-stack'} project portfolio`)}`,
      difficulty: 'Medium',
      duration: '90 min',
      priority: 'High'
    },
    {
      type: 'Docs',
      title: `${skills[1] || 'system design'} fundamentals`,
      resource: `Official docs for ${skills[1] || 'system design'} fundamentals`,
      link: `https://www.google.com/search?q=${encodeURIComponent(`official docs ${skills[1] || 'system design'} ${role}`)}`,
      difficulty: 'Medium',
      duration: '60 min',
      priority: 'Medium'
    },
    {
      type: 'Practice',
      title: `LeetCode patterns for ${focusTopics[0] || 'arrays'}`,
      resource: `Practice set for ${focusTopics[0] || 'arrays'}`,
      link: 'https://leetcode.com/problemset/',
      difficulty: 'Medium',
      duration: '60 min',
      priority: 'High'
    },
    {
      type: 'Company',
      title: `${company} engineering blog`,
      resource: `${company} engineering blog and interview advice`,
      link: `https://www.google.com/search?q=${encodeURIComponent(`${company} engineering blog`)}`,
      difficulty: 'Medium',
      duration: '30 min',
      priority: 'Medium'
    }
  ];
}

async function getUserProfileContext(userId) {
  const [user, latestResumeReport, dsaProblems, codingProfiles, jobs, interviews] = await Promise.all([
    User.findById(userId).lean().catch(() => null),
    findLatestReportByUserId(userId).catch(() => null),
    DsaProblem.find({ userId }).lean().catch(() => []),
    CodingProfile.find({ userId }).lean().catch(() => []),
    Job.find({ userId }).lean().catch(() => []),
    findInterviewsByUserId(userId).catch(() => [])
  ]);

  const leetcodeProfile = (codingProfiles || []).find((p) => p.platform === 'leetcode');
  const githubProfile = (codingProfiles || []).find((p) => p.platform === 'github');

  const leetcodeSolved = Number(leetcodeProfile?.stats?.totalSolved || user?.leetcodeStats?.totalSolved || 0);
  const leetcodeEasy = Number(leetcodeProfile?.stats?.easySolved || user?.leetcodeStats?.easySolved || 0);
  const leetcodeMed = Number(leetcodeProfile?.stats?.mediumSolved || user?.leetcodeStats?.mediumSolved || 0);
  const leetcodeHard = Number(leetcodeProfile?.stats?.hardSolved || user?.leetcodeStats?.hardSolved || 0);

  const dsaCount = (dsaProblems || []).length;
  const dsaTopicCounts = {};
  (dsaProblems || []).forEach((p) => {
    const t = p.topic || 'General';
    dsaTopicCounts[t] = (dsaTopicCounts[t] || 0) + 1;
  });

  const resumeScore = Number(latestResumeReport?.atsScore || 70);
  const resumeStrengths = latestResumeReport?.strengths?.length ? latestResumeReport.strengths : ['Foundational programming skills'];
  const resumeWeaknesses = latestResumeReport?.weaknesses?.length ? latestResumeReport.weaknesses : ['Quantified project metric depth'];

  const completedInterviews = (interviews || []).filter((i) => i.status === 'completed');
  const avgInterviewScore = completedInterviews.length > 0
    ? Math.round(completedInterviews.reduce((acc, i) => acc + (i.evaluationReport?.overallScore || i.score || 0), 0) / completedInterviews.length)
    : 0;

  return {
    targetRole: user?.targetRole || 'Software Engineer',
    targetCompany: user?.targetCompany || '',
    currentSkills: user?.skills?.length ? user.skills : ['JavaScript', 'React', 'Node.js', 'Data Structures'],
    projects: (user?.projects || []).map((p) => p.title || p.name || 'Core Engineering Project'),
    resumeScore,
    resumeStrengths,
    resumeWeaknesses,
    dsaProblemsSolved: dsaCount,
    dsaWeakTopics: Object.keys(dsaTopicCounts).length ? Object.keys(dsaTopicCounts).slice(0, 3) : ['Dynamic Programming', 'Graph Traversal'],
    dsaStrongTopics: ['Arrays', 'Two Pointers', 'Hashing'],
    leetcodeSolved,
    leetcodeBreakdown: { easy: leetcodeEasy, medium: leetcodeMed, hard: leetcodeHard },
    githubConnected: Boolean(githubProfile),
    githubRepos: githubProfile?.stats?.publicRepos || 0,
    applicationsSubmitted: (jobs || []).length,
    interviewHistory: completedInterviews.length,
    avgInterviewScore
  };
}

function calculateDeterministicReadiness(context = {}) {
  // 1. Resume Quality (0-100, weight: 20%)
  const resumeComp = Math.min(100, Math.max(20, Number(context.resumeScore) || 70));

  // 2. DSA Competency (0-100, weight: 25%)
  const totalDsa = (Number(context.dsaProblemsSolved) || 0) + (Number(context.leetcodeSolved) || 0);
  const dsaComp = Math.min(100, Math.max(15, Math.round((totalDsa / 150) * 100)));

  // 3. Projects & Practical Depth (0-100, weight: 20%)
  const projectCount = Array.isArray(context.projects) ? context.projects.length : 1;
  const githubScore = context.githubConnected ? 40 : 15;
  const projectsComp = Math.min(100, Math.max(20, Math.round(projectCount * 25 + githubScore)));

  // 4. Interview Readiness (0-100, weight: 20%)
  const interviewComp = (Number(context.interviewHistory) || 0) > 0
    ? Math.min(100, Math.max(20, Number(context.avgInterviewScore) || 65))
    : 30;

  // 5. Coding Platform Engagement (0-100, weight: 15%)
  const codingComp = Math.min(100, Math.max(15, Math.round(
    (Number(context.leetcodeSolved) > 0 ? 40 : 0) +
    (context.githubConnected ? 30 : 0) +
    (Number(context.dsaProblemsSolved) > 10 ? 30 : 10)
  )));

  const rawScore = Math.round(
    (resumeComp * 0.20) +
    (dsaComp * 0.25) +
    (projectsComp * 0.20) +
    (interviewComp * 0.20) +
    (codingComp * 0.15)
  );

  const score = Math.min(100, Math.max(10, rawScore));

  let level = 'Needs Work';
  if (score >= 80) level = 'Strong Position';
  else if (score >= 65) level = 'Interview Ready';
  else if (score >= 45) level = 'Developing';

  return {
    score,
    level,
    breakdown: {
      resume: resumeComp,
      dsa: dsaComp,
      projects: projectsComp,
      interview: interviewComp,
      coding: codingComp
    }
  };
}

function calculateStagesAndBenchmarks(context = {}) {
  const totalDsa = (Number(context.dsaProblemsSolved) || 0) + (Number(context.leetcodeSolved) || 0);
  const resumeScore = Number(context.resumeScore || 70);
  const mockInterviews = Number(context.interviewHistory || 0);
  const applications = Number(context.applicationsSubmitted || 0);

  // 1. Stage 1: Foundation Exit Criteria
  const f1 = { name: 'Core DSA Problems Solved', target: '50 problems', current: `${totalDsa} solved`, met: totalDsa >= 50 };
  const f2 = { name: 'Resume ATS Quality Baseline', target: '75 / 100', current: `${resumeScore} / 100`, met: resumeScore >= 75 };
  const f3 = { name: 'Portfolio Project Interview-Ready', target: '1 live project', current: context.githubConnected ? '1+ live' : 'In development', met: Boolean(context.githubConnected) };
  const f4 = { name: 'Introductory Communication & STAR', target: '1 practice mock', current: `${mockInterviews} recorded`, met: mockInterviews >= 1 };

  const foundationMetCount = [f1, f2, f3, f4].filter((c) => c.met).length;
  const foundationProgress = Math.round((foundationMetCount / 4) * 100);

  // 2. Stage 2: Interview Prep Exit Criteria
  const i1 = { name: 'Medium DSA Timed Mastery', target: '120 problems', current: `${totalDsa} solved`, met: totalDsa >= 120 };
  const i2 = { name: 'CS Fundamentals & System Design', target: 'Core concepts reviewed', current: 'In progress', met: totalDsa >= 80 && resumeScore >= 75 };
  const i3 = { name: 'Mock Technical & Behavioral Interviews', target: '5 completed mocks', current: `${mockInterviews} completed`, met: mockInterviews >= 5 };
  const i4 = { name: 'Deep Project Architecture Explanation', target: 'End-to-end verified', current: 'Verified', met: Boolean(context.githubConnected && totalDsa >= 60) };

  const interviewMetCount = [i1, i2, i3, i4].filter((c) => c.met).length;
  const interviewProgress = Math.round((interviewMetCount / 4) * 100);

  // 3. Stage 3: Placement Execution Exit Criteria
  const p1 = { name: 'Targeted Applications Submitted', target: '40 applications', current: `${applications} submitted`, met: applications >= 40 };
  const p2 = { name: 'Interview Failure Analysis & Loop Drills', target: 'Continuous adaptation', current: 'Active pipeline', met: applications >= 15 };
  const p3 = { name: 'Referrals & Off-Campus Conversion', target: '2+ referral calls', current: `${applications >= 10 ? '2' : '0'} calls`, met: applications >= 20 };
  const p4 = { name: 'Offer Negotiation & Decision', target: '1+ offer received', current: 'Pending offers', met: false };

  const placementMetCount = [p1, p2, p3, p4].filter((c) => c.met).length;
  const placementProgress = Math.round((placementMetCount / 4) * 100);

  let currentStage = 'foundation';
  let foundationStatus = 'in_progress';
  let interviewStatus = 'locked';
  let placementStatus = 'locked';

  if (foundationProgress >= 75) {
    foundationStatus = 'completed';
    if (interviewProgress >= 75) {
      interviewStatus = 'completed';
      placementStatus = 'in_progress';
      currentStage = 'placement_execution';
    } else {
      interviewStatus = 'in_progress';
      currentStage = 'interview_prep';
    }
  }

  const stages = {
    foundation: {
      name: 'Foundation',
      tagline: 'Build missing fundamentals & baseline proof',
      goal: 'Eliminate core DSA gaps, polish resume ATS score, and deploy an interview-ready project.',
      progress: foundationProgress,
      status: foundationStatus,
      exitCriteria: [f1, f2, f3, f4]
    },
    interview_prep: {
      name: 'Interview Preparation',
      tagline: 'Convert fundamentals into live interview performance',
      goal: 'Master medium-difficulty patterns under timed conditions, deep-dive into CS fundamentals, and practice STAR mocks.',
      progress: interviewProgress,
      status: interviewStatus,
      exitCriteria: [i1, i2, i3, i4]
    },
    placement_execution: {
      name: 'Placement Execution',
      tagline: 'Apply → Interview → Analyze Failures → Adapt',
      goal: 'Ramp application pipeline (5/week), analyze technical screening drop-offs, and target high-conviction referral opportunities.',
      progress: placementProgress,
      status: placementStatus,
      exitCriteria: [p1, p2, p3, p4]
    }
  };

  const gapsBenchmark = [
    { metric: 'DSA Problems', current: totalDsa, target: 150, gap: Math.max(0, 150 - totalDsa), label: 'Problem Solving Depth', unit: 'problems' },
    { metric: 'Resume ATS Score', current: resumeScore, target: 85, gap: Math.max(0, 85 - resumeScore), label: 'Recruiter Screening Match', unit: 'pts' },
    { metric: 'Mock Interviews', current: mockInterviews, target: 8, gap: Math.max(0, 8 - mockInterviews), label: 'Communication & Delivery', unit: 'sessions' },
    { metric: 'Applications Submitted', current: applications, target: 40, gap: Math.max(0, 40 - applications), label: 'Hiring Funnel Volume', unit: 'apps' }
  ];

  return { stages, currentStage, gapsBenchmark };
}

function calculateWorkloadCapacity(monthsRemaining = 3, hoursDaily = 4) {
  const months = Math.max(1, Math.min(12, Number(monthsRemaining) || 3));
  const daily = Math.max(1, Math.min(12, Number(hoursDaily) || 4));
  const totalWeeks = Math.max(4, Math.min(12, months * 4));
  const weeklyHours = Math.round(daily * 6); // 6 days / week
  const availableHours = weeklyHours * totalWeeks;

  return {
    totalWeeks,
    weeklyHours,
    availableHours
  };
}

function generateDeterministicFallbackRoadmap(context, workload, readiness, targetRole, targetCompany) {
  const role = targetRole || context.targetRole || 'Software Engineer';
  const company = targetCompany || context.targetCompany || 'Top Tech Companies';
  const weak1 = context.dsaWeakTopics?.[0] || 'Dynamic Programming';
  const weak2 = context.dsaWeakTopics?.[1] || 'System Design';
  const { stages, currentStage, gapsBenchmark } = calculateStagesAndBenchmarks(context);

  const weeks = Array.from({ length: workload.totalWeeks }, (_, idx) => {
    const weekNum = idx + 1;
    const isFoundation = idx < 2;
    const isMid = idx >= 2 && idx < workload.totalWeeks - 2;
    const isFinal = idx >= workload.totalWeeks - 2;

    const phase = isFoundation ? 'Foundation' : isMid ? 'Depth & Systems' : 'Interview Readiness';
    const title = isFoundation
      ? `Strengthen core DSA & ${weak1}`
      : isMid
      ? `System architecture & ${weak2} drills`
      : 'Mock interviews, portfolio polishing & application sprints';

    const priority = isFoundation ? 'CRITICAL' : isMid ? 'HIGH' : 'HIGH';

    const baseHours = Math.round(workload.weeklyHours / 4);

    return {
      weekNumber: weekNum,
      title,
      phase,
      objective: `Complete targeted problem sets on ${isFoundation ? weak1 : weak2} and refine project deliverables.`,
      estimatedHours: workload.weeklyHours,
      priority,
      tasks: [
        {
          id: `w${weekNum}_t1`,
          category: 'DSA',
          task: `Solve 4-6 problems on ${isFoundation ? weak1 : 'mixed topic revision'} (Medium difficulty)`,
          estimatedHours: baseHours,
          completed: false
        },
        {
          id: `w${weekNum}_t2`,
          category: 'Project',
          task: `Refactor ${context.projects?.[0] || 'core project'} architecture and add quantified impact metrics to README`,
          estimatedHours: baseHours,
          completed: false
        },
        {
          id: `w${weekNum}_t3`,
          category: 'Interview',
          task: `Rehearse STAR behavioral stories and one system design concept for ${role}`,
          estimatedHours: baseHours,
          completed: false
        },
        {
          id: `w${weekNum}_t4`,
          category: 'Resume',
          task: 'Update resume bullet points with measurable engineering outcomes',
          estimatedHours: Math.max(2, workload.weeklyHours - baseHours * 3),
          completed: false
        }
      ],
      resources: [
        { title: 'LeetCode Problem Patterns', link: 'https://leetcode.com/problemset/', type: 'Practice' },
        { title: `${weak1} Curated Guide`, link: 'https://neetcode.io/', type: 'Guide' }
      ],
      expectedOutcome: `Mastery of ${isFoundation ? weak1 : weak2} patterns and verified code implementation.`
    };
  });

  const plannedHours = weeks.reduce((sum, w) => sum + (w.tasks || []).reduce((tSum, t) => tSum + (t.estimatedHours || 0), 0), 0);

  return {
    targetRole: role,
    targetCompany: company,
    currentStage,
    stages,
    gapsBenchmark,
    summary: `Structured ${workload.totalWeeks}-week preparation plan tailored for ${role} ${company ? `at ${company}` : ''}.`,
    aiExplanation: `Your readiness score is ${readiness.score}/100 (${readiness.level}). The plan prioritizes ${weak1} and hands-on project proof to elevate your competitive standing.`,
    biggestGaps: [
      { area: weak1, reason: 'High recurrence in technical screening rounds with significant drop-off rate', priority: 'CRITICAL' },
      { area: weak2, reason: 'Crucial for senior/mid SDE interviews and end-to-end architecture evaluation', priority: 'HIGH' },
      { area: 'Quantified Storytelling', reason: 'Resume bullet points need concrete metrics to clear ATS thresholds', priority: 'MEDIUM' }
    ],
    weeks,
    recommendations: [
      `Maintain a strict cadence of at least ${workload.weeklyHours} hours per week across the ${workload.totalWeeks}-week duration.`,
      'Pair every solved DSA problem with an explanation dry-run to build interview communication skills.'
    ],
    risks: [
      { risk: 'Workload burnout from trying to cover all topics at once', mitigation: 'Focus on one high-yield pattern each week.' }
    ],
    workload: {
      plannedHours,
      availableHours: workload.availableHours,
      weeklyHours: workload.weeklyHours,
      totalWeeks: workload.totalWeeks
    },
    readiness
  };
}

function generateRecruiterAnalysis(input = {}) {
  const profiles = Array.isArray(input.profiles) ? input.profiles : [];
  const resumeScore = Number(input.resumeScore || 70);
  const targetRole = String(input.targetRole || 'Software Engineer').trim();

  const leetcode = profiles.find((p) => p.platform === 'leetcode');
  const github = profiles.find((p) => p.platform === 'github');

  const leetcodeSolved = Number(leetcode?.stats?.totalSolved || 0);
  const githubRepos = Number(github?.stats?.publicRepos || 0);

  const overallCodingScore = Math.min(100, Math.max(15, Math.round(
    (leetcodeSolved > 0 ? Math.min(50, leetcodeSolved * 0.5) : 10) +
    (githubRepos > 0 ? Math.min(30, githubRepos * 4) : 10) +
    (resumeScore * 0.2)
  )));

  const dsaReadiness = Math.min(100, Math.max(10, Math.round((leetcodeSolved / 150) * 100)));
  const contestPerformance = leetcode?.stats?.ranking ? Math.min(100, Math.max(20, 100 - Math.round(leetcode.stats.ranking / 10000))) : 45;
  const githubPortfolioScore = Math.min(100, Math.max(15, githubRepos * 10 + (github ? 30 : 0)));
  const openSourceScore = Math.min(100, Math.max(10, (github?.stats?.followers || 0) * 5 + githubPortfolioScore * 0.6));
  const resumeImpactScore = Math.min(100, Math.max(20, resumeScore));
  const interviewReadiness = Math.min(100, Math.max(20, Math.round((dsaReadiness * 0.5) + (overallCodingScore * 0.5))));
  const placementReadiness = Math.min(100, Math.max(20, Math.round(
    (overallCodingScore * 0.35) +
    (dsaReadiness * 0.25) +
    (githubPortfolioScore * 0.20) +
    (resumeImpactScore * 0.20)
  )));

  const strengths = [];
  const weaknesses = [];

  if (leetcodeSolved >= 50) strengths.push(`Solved ${leetcodeSolved} LeetCode problems demonstrating consistent practice`);
  else weaknesses.push('LeetCode solved count is low for competitive screening rounds');

  if (githubRepos >= 3) strengths.push(`Maintains ${githubRepos} public GitHub repositories showcasing code`);
  else weaknesses.push('Few public GitHub repositories to verify code craftsmanship');

  if (resumeScore >= 75) strengths.push(`ATS Resume Score of ${resumeScore}/100 meets recruiter benchmarks`);
  else weaknesses.push(`Resume score (${resumeScore}/100) indicates missing keywords or impact metrics`);

  const inferredSkills = [];
  if (leetcodeSolved > 30) inferredSkills.push('Data Structures & Algorithms');
  if (profiles.some((profile) => profile.platform === 'github')) inferredSkills.push('Software craftsmanship');
  if (targetRole.toLowerCase().includes('frontend')) inferredSkills.push('UI engineering');
  if (targetRole.toLowerCase().includes('backend')) inferredSkills.push('System design');
  if (!inferredSkills.length) inferredSkills.push('Full-stack delivery');

  const improvementPlan = [
    {
      title: 'Increase interview proof',
      description: 'Publish one polished project and rehearse 3 STAR stories this week.',
      expectedImpact: 'Higher recruiter confidence',
      days: 7
    },
    {
      title: 'Close the weakest topic gap',
      description: 'Focus on your weakest topic with daily problem-solving and revision.',
      expectedImpact: 'Stronger DSA readiness',
      days: 14
    },
    {
      title: 'Strengthen resume impact',
      description: 'Add quantified achievements and role-specific keywords to the summary.',
      expectedImpact: 'Better ATS and recruiter response',
      days: 10
    }
  ];

  return {
    overallCodingScore,
    dsaReadiness,
    contestPerformance,
    githubPortfolioScore,
    openSourceScore,
    resumeImpactScore,
    interviewReadiness,
    placementReadiness,
    topStrengths: strengths.slice(0, 5),
    topWeaknesses: weaknesses.slice(0, 5),
    skillsRecruitersInfer: inferredSkills.slice(0, 5),
    personalized30DayPlan: improvementPlan,
    summary: `Your current profile suggests ${placementReadiness}% placement readiness for ${targetRole}.`
  };
}

async function getSavedRoadmap(userId) {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return null;
  return Roadmap.findOne({ userId }).lean();
}

async function toggleRoadmapTask(userId, taskId) {
  if (!userId || !taskId) {
    throw new ApiError(400, 'User ID and Task ID are required');
  }

  const roadmap = await Roadmap.findOne({ userId });
  if (!roadmap) {
    throw new ApiError(404, 'Roadmap not found');
  }

  let found = false;
  let nowCompleted = false;

  for (const week of roadmap.weeks) {
    for (const task of week.tasks) {
      if (task.id === taskId) {
        task.completed = !task.completed;
        nowCompleted = task.completed;
        found = true;
        break;
      }
    }
    if (found) break;
  }

  if (!found) {
    throw new ApiError(404, 'Task not found in roadmap');
  }

  if (nowCompleted) {
    if (!roadmap.completedTaskIds.includes(taskId)) {
      roadmap.completedTaskIds.push(taskId);
    }
  } else {
    roadmap.completedTaskIds = roadmap.completedTaskIds.filter((id) => id !== taskId);
  }

  await roadmap.save();
  return roadmap.toObject();
}

/**
 * Generate a personalized career roadmap using real candidate telemetry and Gemini AI.
 */
async function generateRoadmapWithAI(userId, input = {}) {
  const profileContext = await getUserProfileContext(userId);

  const targetRole = String(input.targetRole || profileContext.targetRole || 'Software Engineer').trim();
  const targetCompany = String(input.targetCompany || input.dreamCompany || profileContext.targetCompany || '').trim();
  const monthsRemaining = Math.max(1, Math.min(12, Number(input.monthsLeft || input.monthsRemaining || 3)));
  const hoursDaily = Math.max(1, Math.min(12, Number(input.hoursDaily || 4)));

  if (input.currentSkills && Array.isArray(input.currentSkills) && input.currentSkills.length > 0) {
    profileContext.currentSkills = input.currentSkills;
  }
  if (input.weakTopics && Array.isArray(input.weakTopics) && input.weakTopics.length > 0) {
    profileContext.dsaWeakTopics = input.weakTopics;
  }
  if (input.strongTopics && Array.isArray(input.strongTopics) && input.strongTopics.length > 0) {
    profileContext.dsaStrongTopics = input.strongTopics;
  }
  if (input.projects && Array.isArray(input.projects) && input.projects.length > 0) {
    profileContext.projects = input.projects;
  }
  if (input.resumeScore) {
    profileContext.resumeScore = Number(input.resumeScore);
  }
  if (input.dsaProgress) {
    profileContext.dsaProblemsSolved = Number(input.dsaProgress);
  }

  const readiness = calculateDeterministicReadiness(profileContext);
  const workload = calculateWorkloadCapacity(monthsRemaining, hoursDaily);

  const fallbackData = generateDeterministicFallbackRoadmap(profileContext, workload, readiness, targetRole, targetCompany);

  let generatedPlan = fallbackData;

  if (env.GEMINI_API_KEY) {
    try {
      const prompt = `You are a Principal Technical Career Strategist at Careerly.
Generate an actionable, week-by-week personalized career roadmap for a developer candidate based on their real profile telemetry.

CANDIDATE TELEMETRY & PROFILE:
- Target Role: ${targetRole}
- Target Company: ${targetCompany || 'Top Tech Product Companies'}
- Timeline: ${workload.totalWeeks} Weeks (${monthsRemaining} months)
- Available Capacity: ${hoursDaily} hours/day (~${workload.weeklyHours} hours/week available, ${workload.availableHours} total available hours)
- Current Skills: ${profileContext.currentSkills.join(', ')}
- Resume ATS Score: ${profileContext.resumeScore}/100
- Resume Strengths: ${profileContext.resumeStrengths.join(', ')}
- Resume Weaknesses: ${profileContext.resumeWeaknesses.join(', ')}
- DSA Tracker Problems: ${profileContext.dsaProblemsSolved} (${profileContext.dsaWeakTopics.join(', ')} need work)
- LeetCode Solved: ${profileContext.leetcodeSolved} (Easy: ${profileContext.leetcodeBreakdown.easy}, Medium: ${profileContext.leetcodeBreakdown.medium}, Hard: ${profileContext.leetcodeBreakdown.hard})
- GitHub Repositories: ${profileContext.githubConnected ? `${profileContext.githubRepos} public repos` : 'Not Connected'}
- Job Applications Submitted: ${profileContext.applicationsSubmitted}
- Completed Mock Interviews: ${profileContext.interviewHistory} (Average Score: ${profileContext.avgInterviewScore || 'N/A'})

CRITICAL RULES:
1. DO NOT invent or alter any candidate statistics.
2. Produce exactly ${workload.totalWeeks} weekly modules (Week 1 to Week ${workload.totalWeeks}).
3. For each week, provide 3-5 concrete, actionable tasks across categories: "DSA", "Project", "Resume", "Interview", "Application", "Core", "System Design".
4. The sum of estimatedHours for all tasks in a single week MUST NOT exceed ${workload.weeklyHours} hours (weekly availability).
5. Priority for each week and gap must strictly be one of: "CRITICAL", "HIGH", "MEDIUM", "LOW".
6. "aiExplanation" must clearly explain "Why this plan fits you" using the real telemetry (strengths, gap areas, and timeline pace) without generic motivational text.
7. Include 3-4 distinct "biggestGaps" with specific technical reasons and priority.

Respond in JSON format only matching this schema:
{
  "summary": "string",
  "aiExplanation": "string",
  "biggestGaps": [
    { "area": "string", "reason": "string", "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" }
  ],
  "weeks": [
    {
      "weekNumber": 1,
      "title": "string",
      "phase": "string",
      "objective": "string",
      "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      "tasks": [
        { "id": "w1_t1", "category": "DSA" | "Project" | "Resume" | "Interview" | "Application" | "Core" | "System Design", "task": "string", "estimatedHours": 4 }
      ],
      "resources": [
        { "title": "string", "link": "string", "type": "string" }
      ],
      "expectedOutcome": "string"
    }
  ],
  "recommendations": ["string"],
  "risks": [
    { "risk": "string", "mitigation": "string" }
  ]
}`;

      const taskSchema = z.object({
        id: z.string().optional(),
        category: z.enum(['DSA', 'Project', 'Resume', 'Interview', 'Application', 'Core', 'System Design']).default('Core'),
        task: z.string(),
        estimatedHours: z.number().min(1).max(30).default(3)
      });

      const resourceSchema = z.object({
        title: z.string(),
        link: z.string().default(''),
        type: z.string().default('Guide')
      });

      const weekSchema = z.object({
        weekNumber: z.number().int().min(1),
        title: z.string(),
        phase: z.string().default('Preparation'),
        objective: z.string().default(''),
        priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('HIGH'),
        tasks: z.array(taskSchema).min(1),
        resources: z.array(resourceSchema).default([]),
        expectedOutcome: z.string().default('')
      });

      const roadmapSchema = z.object({
        summary: z.string(),
        aiExplanation: z.string(),
        biggestGaps: z.array(
          z.object({
            area: z.string(),
            reason: z.string(),
            priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('HIGH')
          })
        ),
        weeks: z.array(weekSchema).min(1),
        recommendations: z.array(z.string()).default([]),
        risks: z.array(
          z.object({
            risk: z.string(),
            mitigation: z.string()
          })
        ).default([])
      });

      const validated = await generateStructuredJSON({
        prompt,
        schema: roadmapSchema
      });

      if (!validated) {
        throw new Error('Gemini structured JSON validation failed for roadmap');
      }

      let totalPlannedHours = 0;
      const formattedWeeks = validated.weeks.map((w, wIdx) => {
        const weekNum = w.weekNumber || wIdx + 1;
        const tasks = (w.tasks || []).map((t, tIdx) => {
          const tHours = Number(t.estimatedHours) || 3;
          totalPlannedHours += tHours;
          return {
            id: `w${weekNum}_t${tIdx + 1}`,
            category: t.category || 'Core',
            task: t.task,
            estimatedHours: tHours,
            completed: false
          };
        });

        return {
          weekNumber: weekNum,
          title: w.title,
          phase: w.phase || 'Execution',
          objective: w.objective || '',
          estimatedHours: tasks.reduce((sum, task) => sum + task.estimatedHours, 0) || workload.weeklyHours,
          priority: w.priority || 'HIGH',
          tasks,
          resources: w.resources || [],
          expectedOutcome: w.expectedOutcome || ''
        };
      });

      const { stages, currentStage, gapsBenchmark } = calculateStagesAndBenchmarks(profileContext);

      generatedPlan = {
        targetRole,
        targetCompany,
        currentStage,
        stages,
        gapsBenchmark,
        summary: validated.summary,
        aiExplanation: validated.aiExplanation,
        biggestGaps: validated.biggestGaps,
        weeks: formattedWeeks,
        recommendations: validated.recommendations,
        risks: validated.risks,
        workload: {
          plannedHours: totalPlannedHours || workload.availableHours,
          availableHours: workload.availableHours,
          weeklyHours: workload.weeklyHours,
          totalWeeks: workload.totalWeeks
        },
        readiness
      };
    } catch (error) {
      logger.error('Gemini roadmap generation failed, using deterministic fallback', {
        message: error.message,
        status: error.status || error.code
      });
      generatedPlan = fallbackData;
    }
  }

  // Persist to MongoDB Roadmap model if userId is valid
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    const { stages, currentStage, gapsBenchmark } = calculateStagesAndBenchmarks(profileContext);

    const savedDoc = await Roadmap.findOneAndUpdate(
      { userId },
      {
        userId,
        targetRole,
        targetCompany,
        monthsRemaining,
        hoursDaily,
        currentStage: generatedPlan.currentStage || currentStage,
        stages: generatedPlan.stages || stages,
        gapsBenchmark: generatedPlan.gapsBenchmark || gapsBenchmark,
        profileSnapshot: {
          currentSkills: profileContext.currentSkills,
          projects: profileContext.projects,
          resumeScore: profileContext.resumeScore,
          dsaProgress: profileContext.dsaProblemsSolved,
          dsaProblemsSolved: profileContext.dsaProblemsSolved,
          leetcodeSolved: profileContext.leetcodeSolved,
          githubConnected: profileContext.githubConnected,
          githubRepos: profileContext.githubRepos,
          applicationsSubmitted: profileContext.applicationsSubmitted,
          interviewHistory: profileContext.interviewHistory,
          weakTopics: profileContext.dsaWeakTopics,
          strongTopics: profileContext.dsaStrongTopics
        },
        readiness,
        workload: generatedPlan.workload,
        summary: generatedPlan.summary,
        aiExplanation: generatedPlan.aiExplanation,
        biggestGaps: generatedPlan.biggestGaps,
        weeks: generatedPlan.weeks,
        recommendations: generatedPlan.recommendations,
        risks: generatedPlan.risks,
        lastGeneratedAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return savedDoc;
  }

  return generatedPlan;
}

module.exports = {
  getUserProfileContext,
  calculateDeterministicReadiness,
  calculateStagesAndBenchmarks,
  calculateWorkloadCapacity,
  generateDeterministicFallbackRoadmap,
  buildRoadmapPlan: generateDeterministicFallbackRoadmap,
  generateRoadmapWithAI,
  getSavedRoadmap,
  toggleRoadmapTask,
  generateRecruiterAnalysis,
  buildResourceCatalog
};
