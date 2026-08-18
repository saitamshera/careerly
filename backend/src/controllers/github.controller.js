const { asyncHandler } = require('../utils/asyncHandler');
const { ApiResponse } = require('../utils/apiResponse');
const { ApiError } = require('../utils/apiError');
const githubService = require('../services/github.service');

const getProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const profile = await githubService.fetchGitHubProfile(username);
  return res.status(200).json(new ApiResponse(200, profile, 'GitHub profile fetched successfully'));
});

const getRepos = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const perPage = req.query.perPage ? parseInt(req.query.perPage, 10) : 30;
  const repos = await githubService.fetchGitHubRepos(username, perPage);
  return res.status(200).json(new ApiResponse(200, repos, 'GitHub repositories fetched successfully'));
});

const getEvents = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const perPage = req.query.perPage ? parseInt(req.query.perPage, 10) : 20;
  const events = await githubService.fetchGitHubEvents(username, perPage);
  return res.status(200).json(new ApiResponse(200, events, 'GitHub activity events fetched successfully'));
});

const syncProfile = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const username = req.body?.username;
  if (!username) {
    throw new ApiError(400, 'GitHub username is required for synchronization');
  }

  const result = await githubService.syncGitHubToUser(userId, username);
  return res.status(200).json(new ApiResponse(200, result, 'GitHub profile synchronized successfully'));
});

const togglePinRepo = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const { repoName } = req.body;
  const result = await githubService.toggleFeaturedRepo(userId, repoName);

  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      result.isPinned ? 'Repository pinned to Careerly portfolio' : 'Repository removed from featured portfolio'
    )
  );
});

module.exports = {
  getProfile,
  getRepos,
  getEvents,
  syncProfile,
  togglePinRepo
};
