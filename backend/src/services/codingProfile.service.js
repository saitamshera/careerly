const { CodingProfile } = require('../models/codingProfile.model');
const { fetchLeetCodeProfile } = require('./leetcode.service');
const { syncGitHubToUser, fetchGitHubProfile } = require('./github.service');
const { findUserById } = require('../repositories/user.repository');
const { ApiError } = require('../utils/apiError');
const { extractCleanHandle } = require('../utils/sanitizeHandle');
const axios = require('axios');
const { logger } = require('../config/logger');

async function fetchLivePlatformStats(platform, username) {
  const cleanHandle = extractCleanHandle(username);
  if (!cleanHandle) return null;

  try {
    if (platform === 'leetcode') {
      const stats = await fetchLeetCodeProfile(cleanHandle);
      if (stats) {
        return {
          totalSolved: stats.totalSolved || 0,
          easySolved: stats.easySolved || 0,
          mediumSolved: stats.mediumSolved || 0,
          hardSolved: stats.hardSolved || 0,
          currentRating: stats.contestRating || 0,
          maxRating: stats.maxRating || 0,
          globalRank: stats.ranking ? `#${stats.ranking}` : 'N/A',
          badges: [],
          lastActiveDate: new Date().toISOString().slice(0, 10),
          isSelfReported: false
        };
      }
    } else if (platform === 'codeforces') {
      const res = await axios.get(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(cleanHandle)}`, { timeout: 5000 });
      if (res.data && res.data.status === 'OK' && res.data.result?.[0]) {
        const u = res.data.result[0];
        return {
          currentRating: u.rating || 0,
          maxRating: u.maxRating || 0,
          globalRank: u.rank || 'N/A',
          isSelfReported: false
        };
      }
    }
  } catch (error) {
    logger.warn(`Live platform sync failed for ${platform}:${cleanHandle}:`, error?.message);
  }
  return null;
}

async function getUserCodingProfiles(userId) {
  return CodingProfile.find({ userId });
}

async function upsertUserCodingProfile(userId, { platform, username, profileUrl, isSelfReported, stats }) {
  const cleanHandle = extractCleanHandle(username);
  let selfReportedFlag = Boolean(isSelfReported);

  // For GitHub, reuse the full GitHub service to guarantee 100% data fidelity (repos, stars, contributions)
  if (platform === 'github' && !selfReportedFlag) {
    try {
      const result = await syncGitHubToUser(userId, cleanHandle);
      const profile = await CodingProfile.findOne({ userId, platform: 'github' });
      return profile;
    } catch (err) {
      logger.warn(`Full GitHub sync failed, falling back: ${err.message}`);
    }
  }

  let computedStats = {
    totalSolved: Number(stats?.totalSolved || 0),
    easySolved: Number(stats?.easySolved || 0),
    mediumSolved: Number(stats?.mediumSolved || 0),
    hardSolved: Number(stats?.hardSolved || 0),
    currentRating: Number(stats?.currentRating || 0),
    maxRating: Number(stats?.maxRating || 0),
    globalRank: String(stats?.globalRank || 'N/A'),
    badges: Array.isArray(stats?.badges) ? stats.badges : [],
    lastActiveDate: String(stats?.lastActiveDate || new Date().toISOString().slice(0, 10)),
    publicRepos: Number(stats?.publicRepos || 0),
    followers: Number(stats?.followers || 0),
    following: Number(stats?.following || 0),
    starsReceived: Number(stats?.starsReceived || 0),
    languages: stats?.languages || {}
  };

  // Try live API sync if not self-reported
  if (!selfReportedFlag) {
    const apiStats = await fetchLivePlatformStats(platform, cleanHandle);
    if (apiStats) {
      computedStats = { ...computedStats, ...apiStats };
      selfReportedFlag = false;

      // Also sync LeetCode to User document if platform is leetcode
      if (platform === 'leetcode') {
        const user = await findUserById(userId);
        if (user) {
          user.leetcodeUsername = cleanHandle;
          user.leetcodeStats = {
            totalSolved: computedStats.totalSolved,
            easySolved: computedStats.easySolved,
            mediumSolved: computedStats.mediumSolved,
            hardSolved: computedStats.hardSolved,
            ranking: Number(String(computedStats.globalRank || '').replace(/[^0-9]/g, '')) || 0,
            streak: Math.max(1, (user.leetcodeStats?.streak || 0) + 1),
            lastSynced: new Date()
          };
          await user.save();
        }
      }
    } else {
      selfReportedFlag = true;
    }
  }

  return CodingProfile.findOneAndUpdate(
    { userId, platform },
    {
      userId,
      platform,
      username: cleanHandle,
      profileUrl: profileUrl || `https://${platform}.com/${cleanHandle}`,
      isSelfReported: selfReportedFlag,
      stats: computedStats,
      lastSyncedAt: new Date()
    },
    { upsert: true, new: true }
  );
}

async function syncSingleProfile(userId, profileId) {
  const profile = await CodingProfile.findOne({ _id: profileId, userId });
  if (!profile) throw new ApiError(404, 'Coding profile not found.');
  return upsertUserCodingProfile(userId, {
    platform: profile.platform,
    username: profile.username,
    profileUrl: profile.profileUrl,
    isSelfReported: false,
    stats: profile.stats
  });
}

async function syncAllUserProfiles(userId) {
  const profiles = await CodingProfile.find({ userId });
  const updatedProfiles = [];

  for (const profile of profiles) {
    try {
      const updated = await upsertUserCodingProfile(userId, {
        platform: profile.platform,
        username: profile.username,
        profileUrl: profile.profileUrl,
        isSelfReported: false,
        stats: profile.stats
      });
      updatedProfiles.push(updated);
    } catch (err) {
      logger.warn(`Failed to auto-sync ${profile.platform}:${profile.username}:`, err.message);
      updatedProfiles.push(profile);
    }
  }

  return updatedProfiles;
}

async function removeUserCodingProfile(userId, profileId) {
  return CodingProfile.deleteOne({ _id: profileId, userId });
}

module.exports = {
  fetchLivePlatformStats,
  getUserCodingProfiles,
  upsertUserCodingProfile,
  syncSingleProfile,
  syncAllUserProfiles,
  removeUserCodingProfile
};
