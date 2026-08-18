const { asyncHandler } = require('../utils/asyncHandler');
const { ApiResponse } = require('../utils/apiResponse');
const { ApiError } = require('../utils/apiError');
const { findUserById } = require('../repositories/user.repository');
const leetcodeService = require('../services/leetcode.service');

const getProfile = asyncHandler(async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) throw new ApiError(404, 'User not found');

  return res.status(200).json(new ApiResponse(200, user, 'Profile fetched successfully'));
});

const updateProfile = asyncHandler(async (req, res) => {
  const { leetcodeUsername, skills, githubUrl, linkedinUrl, targetCompanies, dailyGoal } = req.body;

  const user = await findUserById(req.user.id);
  if (!user) throw new ApiError(404, 'User not found');

  if (leetcodeUsername !== undefined) user.leetcodeUsername = leetcodeUsername;
  if (skills !== undefined) user.skills = skills;
  if (githubUrl !== undefined) user.githubUrl = githubUrl;
  if (linkedinUrl !== undefined) user.linkedinUrl = linkedinUrl;
  if (targetCompanies !== undefined) user.targetCompanies = targetCompanies;
  if (dailyGoal !== undefined) user.dailyGoal = dailyGoal;

  await user.save();

  return res.status(200).json(new ApiResponse(200, user, 'Profile updated successfully'));
});

const syncLeetCode = asyncHandler(async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) throw new ApiError(404, 'User not found');

  const targetHandle = req.body?.username || req.body?.leetcodeUsername || user.leetcodeUsername;
  if (!targetHandle) throw new ApiError(400, 'LeetCode username not set. Please enter a handle.');

  user.leetcodeUsername = targetHandle;
  const browserStats = req.body?.stats;
  if (browserStats && Number.isFinite(Number(browserStats.totalSolved))) {
    user.leetcodeStats = {
      totalSolved: Number(browserStats.totalSolved) || 0,
      easySolved: Number(browserStats.easySolved) || 0,
      mediumSolved: Number(browserStats.mediumSolved) || 0,
      hardSolved: Number(browserStats.hardSolved) || 0,
      ranking: Number(browserStats.ranking) || 0,
      streak: Math.max(1, (user.leetcodeStats?.streak || 0) + 1),
      lastSynced: new Date()
    };
    await user.save();
    return res.status(200).json(new ApiResponse(200, user.leetcodeStats, 'LeetCode stats synchronized successfully'));
  }

  await user.save();

  const stats = await leetcodeService.syncLeetCodeToUser(req.user.id, targetHandle);
  return res.status(200).json(new ApiResponse(200, stats, 'LeetCode stats synced successfully'));
});

module.exports = {
  getProfile,
  updateProfile,
  syncLeetCode
};
