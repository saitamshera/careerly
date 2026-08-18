const { asyncHandler } = require('../utils/asyncHandler');
const { ApiResponse } = require('../utils/apiResponse');
const { ApiError } = require('../utils/apiError');
const leetcodeService = require('../services/leetcode.service');
const { findUserById } = require('../repositories/user.repository');

const getProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const profile = await leetcodeService.fetchLeetCodeProfile(username);
  return res.status(200).json(new ApiResponse(200, profile, 'Profile fetched successfully'));
});

const getSubmissions = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const submissions = await leetcodeService.fetchRecentSubmissions(username);
  return res.status(200).json(new ApiResponse(200, submissions, 'Submissions fetched successfully'));
});

const syncProfile = asyncHandler(async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  if (!user.leetcodeUsername) {
    throw new ApiError(400, 'LeetCode username not set for user');
  }

  const stats = await leetcodeService.syncLeetCodeToUser(req.user.id, user.leetcodeUsername);
  return res.status(200).json(new ApiResponse(200, stats, 'LeetCode profile synced successfully'));
});

module.exports = {
  getProfile,
  getSubmissions,
  syncProfile
};
