const { CodingProfile } = require('../models/codingProfile.model');
const { fetchLeetCodeProfile } = require('./leetcode.service');
const { fetchGitHubProfile } = require('./github.service');
const axios = require('axios');
const { logger } = require('../config/logger');

async function fetchLivePlatformStats(platform, username) {
  const cleanHandle = String(username || '').trim().replace(/^@/, '');
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
          currentRating: stats.ranking || 0,
          globalRank: stats.ranking ? `#${stats.ranking}` : 'N/A',
          badges: [],
          isSelfReported: false
        };
      }
    } else if (platform === 'github') {
      const stats = await fetchGitHubProfile(cleanHandle);
      if (stats) {
        return {
          totalSolved: stats.publicRepos || 0,
          globalRank: `${stats.followers || 0} followers`,
          lastActiveDate: stats.updatedAt ? String(stats.updatedAt).slice(0, 10) : '',
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
    languages: stats?.languages || {}
  };

  let selfReportedFlag = Boolean(isSelfReported);

  // Try live API sync first if self-reported isn't explicitly true
  if (!selfReportedFlag) {
    const apiStats = await fetchLivePlatformStats(platform, username);
    if (apiStats) {
      computedStats = { ...computedStats, ...apiStats };
      selfReportedFlag = false;
    } else {
      selfReportedFlag = true;
    }
  }

  return CodingProfile.findOneAndUpdate(
    { userId, platform },
    {
      userId,
      platform,
      username,
      profileUrl: profileUrl || `https://${platform}.com/${username}`,
      isSelfReported: selfReportedFlag,
      stats: computedStats,
      lastSyncedAt: new Date()
    },
    { upsert: true, new: true }
  );
}

async function removeUserCodingProfile(userId, profileId) {
  return CodingProfile.deleteOne({ _id: profileId, userId });
}

module.exports = {
  fetchLivePlatformStats,
  getUserCodingProfiles,
  upsertUserCodingProfile,
  removeUserCodingProfile
};
