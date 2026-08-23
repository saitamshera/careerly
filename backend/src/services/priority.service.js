/**
 * Deterministic Priority & Bottleneck Engine.
 * 
 * Formula:
 * priorityScore = gap * relevance * impact * confidence
 * 
 * Where:
 * - gap: max(0, targetBenchmark - currentScore)
 * - relevance: 1.5 if target JD explicitly lists this skill/domain, else 1.0
 * - impact: weight based on candidate's current stage in the placement pipeline
 * - confidence: 1.0 if measured, 0.7 if low sample size, 0.0 if unmeasured
 */

function calculateDeterministicPriorities({ readinessDimensions, jobMatch, jobRequirements, pipelineStats, telemetry }) {
  const candidates = [];

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const wasCompletedToday = (dateField) => {
    if (!dateField) return false;
    const date = new Date(dateField);
    return date >= todayStart;
  };

  // 1. Evaluate DSA Dimension
  const dsa = readinessDimensions.dsaCompetency;
  if (dsa.status === 'measured') {
    const gap = Math.max(0, 100 - (dsa.score || 0));
    const relevance = jobRequirements?.requiredSkills?.some((s) => s.includes('dsa') || s.includes('algorithm') || s.includes('structures')) ? 1.4 : 1.2;
    const impact = (pipelineStats?.oa || 0) > 0 ? 1.4 : 1.1; // Higher if upcoming OA scheduled
    const confidence = 1.0;
    const priorityScore = Math.round(gap * relevance * impact * confidence);

    if (gap > 10) {
      const weakTopic = dsa.weakTopics?.[0] || 'Dynamic Programming';
      const topicSlug = weakTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      candidates.push({
        id: 'dsa_mastery',
        category: 'DSA & Algorithms',
        title: dsa.score < 50 ? 'Build Core Problem Solving Depth' : 'Target Medium & Hard DSA Patterns',
        gapPoints: Math.round(gap * 0.7), // Gap towards minimum interview bar (70%)
        currentScore: dsa.score,
        targetScore: 75,
        priorityScore,
        whyReason: `Your DSA score is ${dsa.score}%. Target SDE roles heavily weight algorithmic filtering in early rounds.`,
        actionLabel: `Practice ${weakTopic}`,
        actionRoute: `/practice/${topicSlug}`,
        actionIntent: { type: 'SOLVE_DSA', topic: weakTopic },
        suggestedFocus: weakTopic,
        estimatedDuration: '35 min',
        completed: (telemetry?.dsaProblems || []).some(p => wasCompletedToday(p.createdAt))
      });
    }
  } else {
    // Insufficient data -> Action to start tracking or connect LeetCode
    candidates.push({
      id: 'dsa_connect',
      category: 'DSA & Algorithms',
      title: 'Log Problems or Connect LeetCode',
      gapPoints: 50,
      currentScore: null,
      targetScore: 75,
      priorityScore: 90,
      whyReason: 'No verified DSA practice data found. Log solved problems or connect your handle to measure algorithmic readiness.',
      actionLabel: 'Log DSA Problem',
      actionRoute: '/dsa-tracker',
      actionIntent: { type: 'SOLVE_DSA', topic: 'Arrays' },
      suggestedFocus: 'Arrays & Two Pointers',
      estimatedDuration: '10 min',
      completed: (telemetry?.dsaProblems || []).some(p => wasCompletedToday(p.createdAt))
    });
  }

  // 2. Evaluate Resume ATS Dimension
  const resume = readinessDimensions.resumeAlignment;
  if (resume.status === 'measured') {
    const gap = Math.max(0, 75 - (resume.score || 0));
    const hasMissingSkills = (jobMatch?.missingSkills || []).length > 0;
    const relevance = hasMissingSkills ? 1.5 : 1.1;
    const impact = (pipelineStats?.applied || 0) < 10 ? 1.3 : 1.0; // Critical for initial screening
    const confidence = 1.0;
    const priorityScore = Math.round(gap * relevance * impact * confidence);

    if (gap > 5 || hasMissingSkills) {
      const missingList = (jobMatch?.missingSkills || []).slice(0, 3).map((s) => s.name || s).join(', ');
      candidates.push({
        id: 'resume_optimization',
        category: 'Resume & Screening',
        title: hasMissingSkills ? `Add Missing JD Keywords (${missingList})` : 'Enhance Metric-Driven Project Bullets',
        gapPoints: gap,
        currentScore: resume.score,
        targetScore: 75,
        priorityScore,
        whyReason: hasMissingSkills
          ? `Your resume is missing key required skills (${missingList}) extracted from the target JD.`
          : `Resume ATS score is ${resume.score}/100. Target screening threshold is 75/100.`,
        actionLabel: 'Optimize Resume in Lab',
        actionRoute: '/resume',
        actionIntent: { type: 'IMPROVE_RESUME', section: 'Skills' },
        suggestedFocus: missingList || 'Quantified business impacts',
        estimatedDuration: '15 min',
        completed: wasCompletedToday(telemetry?.latestResumeReport?.createdAt)
      });
    }
  } else {
    candidates.push({
      id: 'resume_upload',
      category: 'Resume & Screening',
      title: 'Upload Resume for ATS Screening',
      gapPoints: 40,
      currentScore: null,
      targetScore: 75,
      priorityScore: 95,
      whyReason: 'No parsed resume on file. Upload your PDF to benchmark ATS match rate against this job description.',
      actionLabel: 'Upload Resume',
      actionRoute: '/resume',
      actionIntent: { type: 'IMPROVE_RESUME', section: 'Upload' },
      suggestedFocus: 'Core technical keywords',
      estimatedDuration: '5 min',
      completed: wasCompletedToday(telemetry?.latestResumeReport?.createdAt)
    });
  }

  // 3. Evaluate Mock Technical Interview Dimension
  const interview = readinessDimensions.interviewPerformance;
  if (interview.status === 'measured') {
    const gap = Math.max(0, 70 - (interview.score || 0));
    const relevance = 1.3;
    const impact = (pipelineStats?.technicalRounds || 0) > 0 ? 1.5 : 1.2;
    const confidence = 1.0;
    const priorityScore = Math.round(gap * relevance * impact * confidence);

    if (gap > 10 || interview.completedCount < 3) {
      const topicFocus = jobRequirements?.targetRole || 'System Architecture';
      candidates.push({
        id: 'mock_technical',
        category: 'Technical Interview',
        title: interview.completedCount < 3 ? 'Complete Practice Mock Technical Interview' : 'Target Technical Architecture Weakness',
        gapPoints: gap,
        currentScore: interview.score,
        targetScore: 70,
        priorityScore,
        whyReason: `Completed ${interview.completedCount} mock session(s) with average score ${interview.score}%. Regular drills prevent freeze-ups in real rounds.`,
        actionLabel: 'Start AI Mock Interview',
        actionRoute: `/interview-prep?topic=${encodeURIComponent(topicFocus)}&type=technical`,
        actionIntent: { type: 'PRACTICE_INTERVIEW', topic: topicFocus },
        suggestedFocus: 'System architecture & trade-offs',
        estimatedDuration: '45 min',
        completed: (telemetry?.interviews || []).some(i => wasCompletedToday(i.createdAt) && i.status === 'completed')
      });
    }
  } else {
    const topicFocus = jobRequirements?.targetRole || 'Software Engineering';
    candidates.push({
      id: 'mock_first',
      category: 'Technical Interview',
      title: 'Complete First AI Mock Interview',
      gapPoints: 45,
      currentScore: null,
      targetScore: 70,
      priorityScore: 85,
      whyReason: 'No mock interview evaluations recorded. Taking simulated rounds builds verbal technical articulation.',
      actionLabel: 'Start AI Mock Interview',
      actionRoute: `/interview-prep?topic=${encodeURIComponent(topicFocus)}&type=technical`,
      actionIntent: { type: 'PRACTICE_INTERVIEW', topic: topicFocus },
      suggestedFocus: 'Background & core projects',
      estimatedDuration: '45 min',
      completed: (telemetry?.interviews || []).some(i => wasCompletedToday(i.createdAt) && i.status === 'completed')
    });
  }

  // 4. Evaluate Communication & Behavioral Dimension
  const comm = readinessDimensions.communication;
  if (comm.status === 'measured') {
    const gap = Math.max(0, 75 - (comm.score || 0));
    if (gap > 12) {
      candidates.push({
        id: 'comm_star',
        category: 'Behavioral & Communication',
        title: 'Refine STAR Structure in Answers',
        gapPoints: gap,
        currentScore: comm.score,
        targetScore: 75,
        priorityScore: Math.round(gap * 1.2 * 1.0 * 1.0),
        whyReason: `Communication score is ${comm.score}%. Bar-raisers look for structured (Situation, Task, Action, Result) responses with concrete personal ownership.`,
        actionLabel: 'Practice Behavioral Mock',
        actionRoute: '/interview-prep?type=behavioral',
        actionIntent: { type: 'PRACTICE_INTERVIEW', topic: 'Behavioral STAR' },
        suggestedFocus: 'STAR framework & conciseness',
        estimatedDuration: '20 min',
        completed: (telemetry?.interviews || []).some(i => wasCompletedToday(i.createdAt) && i.status === 'completed')
      });
    }
  }

  // 5. Evaluate Engineering Projects & GitHub
  const projects = readinessDimensions.engineeringProjects;
  if (projects.status === 'measured') {
    const gap = Math.max(0, 70 - (projects.score || 0));
    if (gap > 15) {
      candidates.push({
        id: 'github_projects',
        category: 'Engineering Proof',
        title: 'Push Production README & Code Artifacts',
        gapPoints: gap,
        currentScore: projects.score,
        targetScore: 70,
        priorityScore: Math.round(gap * 1.1 * 1.0 * 1.0),
        whyReason: 'Your public GitHub repository signals have limited documentation and recent commit proof.',
        actionLabel: 'Inspect GitHub Repos',
        actionRoute: '/coding-profiles/github',
        actionIntent: { type: 'BUILD_PROJECT', topic: 'GitHub Proof' },
        suggestedFocus: 'Live demo link & architectural diagrams',
        estimatedDuration: '15 min',
        completed: (telemetry?.codingProfiles || []).some(p => p.platform === 'github' && wasCompletedToday(p.updatedAt))
      });
    }
  }

  // Sort candidates strictly by priorityScore descending
  candidates.sort((a, b) => b.priorityScore - a.priorityScore);

  // Top 3 Priorities
  const topPriorities = candidates.slice(0, 3).map((item, index) => ({
    rank: index + 1,
    ...item
  }));

  // Identify Biggest Bottleneck (Candidate with largest verified gap or highest priority score)
  const measuredBottlenecks = candidates.filter((c) => c.gapPoints > 12);
  const primary = measuredBottlenecks[0] || candidates[0] || null;

  const biggestBottleneck = primary
    ? {
      category: primary.category,
      title: primary.title,
      currentScore: primary.currentScore,
      targetScore: primary.targetScore,
      gapPoints: primary.gapPoints,
      reason: primary.whyReason,
      actionLabel: primary.actionLabel,
      actionRoute: primary.actionRoute
    }
    : null;

  return {
    biggestBottleneck,
    topPriorities
  };
}

module.exports = {
  calculateDeterministicPriorities
};
