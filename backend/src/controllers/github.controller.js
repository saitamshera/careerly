const crypto = require('crypto');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiResponse } = require('../utils/apiResponse');
const { ApiError } = require('../utils/apiError');
const { env } = require('../config/env');
const { logger } = require('../config/logger');
const { CodingProfile } = require('../models/codingProfile.model');
const githubService = require('../services/github.service');

// In-memory debounce lock to prevent duplicate concurrent sync stampedes for the same user
const activeSyncLocks = new Map();
const SYNC_DEBOUNCE_MS = 5000;

function verifyGitHubSignature(req) {
  const secret = env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    if (env.NODE_ENV === 'production') {
      logger.warn('GITHUB_WEBHOOK_SECRET is not set in production. Webhook rejected.');
      return false;
    }
    return true;
  }

  const signatureHeader = req.headers['x-hub-signature-256'];
  if (!signatureHeader) {
    return false;
  }

  const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(rawBody).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(digest));
  } catch {
    return false;
  }
}

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

const getContributions = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const contributions = await githubService.fetchGitHubContributions(username);
  return res.status(200).json(new ApiResponse(200, contributions, 'GitHub contribution calendar fetched successfully'));
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

const handleWebhook = asyncHandler(async (req, res) => {
  const signatureValid = verifyGitHubSignature(req);
  if (!signatureValid) {
    logger.warn('GitHub webhook signature verification failed.');
    throw new ApiError(401, 'Invalid GitHub webhook signature.');
  }

  const eventType = req.headers['x-github-event'] || 'unknown';
  const deliveryId = req.headers['x-github-delivery'] || 'none';

  // Acknowledge GitHub test ping
  if (eventType === 'ping') {
    return res.status(200).json(new ApiResponse(200, { eventType, deliveryId }, 'GitHub webhook ping acknowledged.'));
  }

  // Filter for portfolio-relevant GitHub events
  const relevantEvents = ['push', 'repository', 'create', 'delete', 'watch', 'star', 'public', 'release'];
  if (!relevantEvents.includes(eventType)) {
    return res.status(200).json(new ApiResponse(200, { eventType, ignored: true }, `Event ${eventType} acknowledged (no sync required).`));
  }

  const senderLogin = req.body?.sender?.login;
  const repoOwnerLogin = req.body?.repository?.owner?.login;
  const username = senderLogin || repoOwnerLogin;

  if (!username) {
    return res.status(200).json(new ApiResponse(200, { skipped: true }, 'No GitHub username found in webhook payload.'));
  }

  // Look up matching user's CodingProfile
  const profile = await CodingProfile.findOne({
    platform: 'github',
    username: { $regex: new RegExp(`^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
  });

  if (!profile) {
    return res.status(200).json(
      new ApiResponse(200, { username, matched: false }, `No connected profile found for GitHub user @${username}.`)
    );
  }

  // Prevent duplicate concurrent sync stampedes for the same user
  const lockKey = String(profile.userId);
  const lastSyncTime = activeSyncLocks.get(lockKey) || 0;
  const now = Date.now();

  if (now - lastSyncTime < SYNC_DEBOUNCE_MS) {
    return res.status(200).json(
      new ApiResponse(200, { debounced: true, deliveryId }, 'Webhook received; sync already processed recently.')
    );
  }

  activeSyncLocks.set(lockKey, now);

  // Trigger background idempotent sync
  githubService.syncGitHubToUser(profile.userId, profile.username).catch((err) => {
    logger.error(`Automated webhook sync failed for @${profile.username}:`, {
      message: err?.message || String(err)
    });
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        deliveryId,
        eventType,
        username: profile.username,
        updated: true
      },
      `GitHub ${eventType} webhook processed successfully for @${profile.username}.`
    )
  );
});

module.exports = {
  getProfile,
  getRepos,
  getEvents,
  getContributions,
  syncProfile,
  togglePinRepo,
  handleWebhook
};
