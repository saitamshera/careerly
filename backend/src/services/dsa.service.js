const mongoose = require('mongoose');
const { ApiError } = require('../utils/apiError');
const {
  createDsaProblem,
  findDsaProblemsByUserId,
  findDsaProblemByIdAndUserId,
  updateDsaProblemByIdAndUserId,
  deleteDsaProblemByIdAndUserId,
  findTodayProblemsByUserId,
  getDsaAggregatesByUserId
} = require('../repositories/dsa.repository');

function normalizeDsaPayload(payload = {}) {
  return {
    ...payload,
    title: payload.title?.trim(),
    topic: payload.topic?.trim(),
    difficulty: payload.difficulty ? String(payload.difficulty).trim().toLowerCase() : 'medium',
    platform: payload.platform?.trim() || 'LeetCode',
    notes: payload.notes?.trim() || '',
    approach: payload.approach?.trim() || '',
    language: payload.language?.trim() || 'C++',
    link: payload.link?.trim() || '',
    leetcodeId: payload.leetcodeId ? Number(payload.leetcodeId) : undefined,
    companies: Array.isArray(payload.companies) ? payload.companies : [],
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    status: payload.status === 'unsolved' ? 'unsolved' : 'solved'
  };
}

function validateObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid problem id');
  }
}

async function listUserProblems(userId) {
  return findDsaProblemsByUserId(userId);
}

async function createUserProblem(userId, payload) {
  const normalized = normalizeDsaPayload(payload);

  if (!normalized.title || !normalized.topic || !normalized.difficulty) {
    throw new ApiError(400, 'Title, topic, and difficulty are required');
  }

  return createDsaProblem({
    ...normalized,
    userId,
    revisionCount: Number(payload.revisionCount || 0),
    timeTaken: Number(payload.timeTaken || 0),
    solvedAt: normalized.status === 'solved' ? payload.solvedAt || new Date() : undefined
  });
}

async function updateUserProblem(userId, problemId, payload) {
  validateObjectId(problemId);

  const normalized = normalizeDsaPayload(payload);
  if (normalized.status === 'solved' && !payload.solvedAt) {
    normalized.solvedAt = new Date();
  }

  const problem = await updateDsaProblemByIdAndUserId(problemId, userId, {
    ...normalized,
    revisionCount: payload.revisionCount !== undefined ? Number(payload.revisionCount) : undefined,
    timeTaken: payload.timeTaken !== undefined ? Number(payload.timeTaken) : undefined
  });

  if (!problem) {
    throw new ApiError(404, 'Problem not found');
  }

  return problem;
}

async function removeUserProblem(userId, problemId) {
  validateObjectId(problemId);
  const problem = await deleteDsaProblemByIdAndUserId(problemId, userId);
  if (!problem) {
    throw new ApiError(404, 'Problem not found');
  }
  return problem;
}

async function getUserProblemById(userId, problemId) {
  validateObjectId(problemId);
  const problem = await findDsaProblemByIdAndUserId(problemId, userId);
  if (!problem) {
    throw new ApiError(404, 'Problem not found');
  }
  return problem;
}

async function getTodayProblems(userId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  return findTodayProblemsByUserId(userId, startOfDay, endOfDay);
}

async function getStreak(userId) {
  const problems = await findDsaProblemsByUserId(userId);
  const solvedProblems = problems.filter((p) => p.status === 'solved' && p.solvedAt);
  if (!solvedProblems.length) return { currentStreak: 0, longestStreak: 0 };

  const dates = Array.from(
    new Set(solvedProblems.map((p) => new Date(p.solvedAt).toISOString().split('T')[0]))
  ).sort().reverse();

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  let checkDate = new Date();
  for (let i = 0; i < 365; i++) {
    const dStr = checkDate.toISOString().split('T')[0];
    if (dates.includes(dStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i === 0) {
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate longest streak
  for (let i = 0; i < dates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
      longestStreak = 1;
      continue;
    }
    const d1 = new Date(dates[i-1]);
    const d2 = new Date(dates[i]);
    const diffTime = Math.abs(d1 - d2);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  return { currentStreak, longestStreak };
}

async function getUserDsaStats(userId) {
  const problems = await findDsaProblemsByUserId(userId);
  const aggregates = await getDsaAggregatesByUserId(userId);

  const solvedCount = problems.filter((problem) => problem.status === 'solved').length;
  const topicMap = aggregates.reduce((accumulator, item) => {
    const topic = item._id.topic;
    if (!accumulator[topic]) {
      accumulator[topic] = { solved: 0, unsolved: 0, totalTime: 0 };
    }

    accumulator[topic][item._id.status] += item.count;
    accumulator[topic].totalTime += item.totalTime;
    return accumulator;
  }, {});

  const todayData = await getTodayProblems(userId);
  const streak = await getStreak(userId);

  return {
    total: problems.length,
    solved: solvedCount,
    unsolved: problems.length - solvedCount,
    todaySolved: todayData.length,
    streak: streak.currentStreak,
    topics: topicMap,
    weakTopics: Object.entries(topicMap)
      .filter(([, value]) => value.solved < value.unsolved)
      .map(([topic]) => topic)
  };
}

module.exports = {
  listUserProblems,
  createUserProblem,
  updateUserProblem,
  removeUserProblem,
  getUserProblemById,
  getUserDsaStats,
  getTodayProblems,
  getStreak
};