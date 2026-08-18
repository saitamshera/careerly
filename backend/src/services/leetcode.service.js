const { findUserById } = require('../repositories/user.repository');
const { logger } = require('../config/logger');

async function fetchLeetCodeProfile(username) {
  const cleanUsername = username ? username.trim().toLowerCase().replace(/^@/, '') : '';
  if (!cleanUsername) throw new Error('Username is required');

  // Try Provider 1: Alfa LeetCode API
  try {
    const res = await fetch(`https://alfa-leetcode-api.onrender.com/userProfile/${cleanUsername}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.totalSolved !== undefined) {
        const rawAcceptance = data.acceptanceRate ? parseFloat(String(data.acceptanceRate).replace('%', '')) : null;
        return {
          username: cleanUsername,
          totalSolved: data.totalSolved || 0,
          easySolved: data.easySolved || 0,
          mediumSolved: data.mediumSolved || 0,
          hardSolved: data.hardSolved || 0,
          ranking: data.ranking || 0,
          reputation: data.reputation || 0,
          acceptanceRate: Number.isFinite(rawAcceptance) ? rawAcceptance : null
        };
      }
    }
  } catch (err) {
    logger.warn(`Provider 1 (alfa-leetcode-api) failed, trying GraphQL directly: ${err.message}`);
  }

  // Try Provider 2: LeetCode Official GraphQL API
  try {
    const query = `
      query userPublicProfile($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            ranking
            reputation
          }
          submitStats {
            acSubmissionNum {
              difficulty
              count
            }
            totalSubmissionNum {
              difficulty
              count
            }
          }
        }
      }
    `;

    logger.info(`[LeetCode Service] Attempting GraphQL for cleanUsername: "${cleanUsername}"`);
    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://leetcode.com'
      },
      body: JSON.stringify({ query, variables: { username: cleanUsername } })
    });

    if (res.ok) {
      const json = await res.json();
      const user = json.data?.matchedUser;
      if (user) {
        const acStats = user.submitStats?.acSubmissionNum || [];
        const totalStats = user.submitStats?.totalSubmissionNum || [];

        let totalSolved = 0, easySolved = 0, mediumSolved = 0, hardSolved = 0;
        acStats.forEach((s) => {
          if (s.difficulty === 'All') totalSolved = s.count;
          if (s.difficulty === 'Easy') easySolved = s.count;
          if (s.difficulty === 'Medium') mediumSolved = s.count;
          if (s.difficulty === 'Hard') hardSolved = s.count;
        });

        const totalSubmitted = totalStats.find((s) => s.difficulty === 'All')?.count || 0;
        const acceptanceRate = totalSubmitted > 0
          ? Math.round((totalSolved / totalSubmitted) * 1000) / 10
          : null;

        return {
          username: user.username,
          totalSolved,
          easySolved,
          mediumSolved,
          hardSolved,
          ranking: user.profile?.ranking || 0,
          reputation: user.profile?.reputation || 0,
          acceptanceRate
        };
      }
    }
  } catch (err) {
    logger.warn(`Provider 2 (GraphQL) failed with error: ${err.message}`);
  }

  // Never present made-up statistics as a synchronized profile.
  throw new Error(`Unable to retrieve the public LeetCode profile for "${cleanUsername}". Check the username and try again.`);
}

async function fetchRecentSubmissions(username, limit = 10) {
  const cleanUsername = username ? username.trim().toLowerCase().replace(/^@/, '') : '';
  if (!cleanUsername) return [];

  // Try Provider 1: Alfa LeetCode API
  try {
    const res = await fetch(`https://alfa-leetcode-api.onrender.com/userProfile/${cleanUsername}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.recentSubmissions) {
        const acSubmissions = data.recentSubmissions.filter((s) => s.statusDisplay === 'Accepted');
        return acSubmissions.slice(0, limit).map((s) => ({
          title: s.title,
          titleSlug: s.titleSlug,
          timestamp: s.timestamp
        }));
      }
    }
  } catch (err) {
    logger.warn(`Alfa API for recent submissions failed: ${err.message}`);
  }

  // Fallback to Provider 2: LeetCode Official GraphQL API
  try {
    const query = `
      query recentAcSubmissions($username: String!, $limit: Int!) {
        recentAcSubmissionList(username: $username, limit: $limit) {
          title
          titleSlug
          timestamp
        }
      }
    `;

    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://leetcode.com'
      },
      body: JSON.stringify({ query, variables: { username: cleanUsername, limit } })
    });

    if (res.ok) {
      const json = await res.json();
      return json.data?.recentAcSubmissionList || [];
    }
  } catch (err) {
    logger.warn(`Failed to fetch recent submissions via GraphQL: ${err.message}`);
  }

  return [];
}

async function syncLeetCodeToUser(userId, username) {
  const profile = await fetchLeetCodeProfile(username);
  const user = await findUserById(userId);
  if (!user) throw new Error('User not found');

  user.leetcodeUsername = profile.username;
  user.leetcodeStats = {
    totalSolved: profile.totalSolved,
    easySolved: profile.easySolved,
    mediumSolved: profile.mediumSolved,
    hardSolved: profile.hardSolved,
    ranking: profile.ranking,
    streak: Math.max(1, (user.leetcodeStats?.streak || 0) + 1),
    lastSynced: new Date()
  };

  await user.save();
  return user.leetcodeStats;
}

module.exports = {
  fetchLeetCodeProfile,
  fetchRecentSubmissions,
  syncLeetCodeToUser,
  getUserLeetCodeProfile: fetchLeetCodeProfile,
  getUserRecentSubmissions: fetchRecentSubmissions,
  syncUserLeetCodeStats: syncLeetCodeToUser
};
