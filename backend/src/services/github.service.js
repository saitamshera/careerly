const axios = require('axios');
const { CodingProfile } = require('../models/codingProfile.model');
const { findUserById } = require('../repositories/user.repository');
const { ApiError } = require('../utils/apiError');
const { logger } = require('../config/logger');

const { env } = require('../config/env');

const GITHUB_API_BASE = 'https://api.github.com';

const axiosInstance = axios.create({
  baseURL: GITHUB_API_BASE,
  timeout: 8000,
  headers: {
    'User-Agent': 'Careerly-App',
    Accept: 'application/vnd.github.v3+json',
    ...(env.GITHUB_TOKEN ? { Authorization: `Bearer ${env.GITHUB_TOKEN}` } : {})
  }
});

function handleGitHubError(error, username, operation = 'fetch profile') {
  const status = error?.response?.status;
  const data = error?.response?.data;
  logger.warn(`GitHub API ${operation} failed for @${username} (status ${status}):`, data || error.message);

  if (status === 404) {
    throw new ApiError(404, `GitHub user "${username}" was not found.`);
  }
  if (status === 403) {
    const isRateLimit = String(data?.message || '').toLowerCase().includes('rate limit');
    if (isRateLimit) {
      throw new ApiError(429, 'GitHub API rate limit reached. Please try again in a few moments or configure a GITHUB_TOKEN.');
    }
    throw new ApiError(403, `GitHub access forbidden for "${username}".`);
  }
  if (status >= 500) {
    throw new ApiError(502, 'GitHub service is temporarily unavailable. Please try again later.');
  }
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    throw new ApiError(504, 'Connection to GitHub timed out. Please try again.');
  }
  throw new ApiError(status || 500, error.message || `Unable to ${operation} for GitHub user "${username}".`);
}

async function fetchGitHubProfile(username) {
  const cleanUsername = username ? username.trim().replace(/^@/, '') : '';
  if (!cleanUsername) throw new ApiError(400, 'GitHub username is required');

  try {
    const res = await axiosInstance.get(`/users/${encodeURIComponent(cleanUsername)}`);
    const data = res.data;

    return {
      username: data.login,
      name: data.name || data.login,
      bio: data.bio || '',
      avatarUrl: data.avatar_url,
      profileUrl: data.html_url,
      publicRepos: data.public_repos || 0,
      publicGists: data.public_gists || 0,
      followers: data.followers || 0,
      following: data.following || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    handleGitHubError(error, cleanUsername, 'fetch profile');
  }
}

async function fetchGitHubRepos(username, perPage = 30) {
  const cleanUsername = username ? username.trim().replace(/^@/, '') : '';
  if (!cleanUsername) return [];

  try {
    const res = await axiosInstance.get(`/users/${encodeURIComponent(cleanUsername)}/repos`, {
      params: {
        sort: 'updated',
        per_page: perPage,
        type: 'owner'
      }
    });

    return (res.data || []).map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || '',
      htmlUrl: repo.html_url,
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      watchers: repo.watchers_count || 0,
      language: repo.language || 'Code',
      isFork: Boolean(repo.fork),
      topics: repo.topics || [],
      updatedAt: repo.updated_at,
      createdAt: repo.created_at,
      openIssues: repo.open_issues_count || 0
    }));
  } catch (error) {
    logger.warn(`GitHub repos fetch failed for ${cleanUsername}:`, error?.message);
    return [];
  }
}

async function fetchGitHubEvents(username, perPage = 20) {
  const cleanUsername = username ? username.trim().replace(/^@/, '') : '';
  if (!cleanUsername) return [];

  try {
    const res = await axiosInstance.get(`/users/${encodeURIComponent(cleanUsername)}/events/public`, {
      params: { per_page: perPage }
    });

    // 1. Strict Data Integrity: Only accept events where the acting user matches cleanUsername
    const userEvents = (res.data || []).filter((event) => {
      const actorLogin = event.actor?.login || '';
      return actorLogin.toLowerCase() === cleanUsername.toLowerCase();
    });

    return userEvents.map((event) => {
      let actionText = 'Contributed to';
      let detail = '';

      if (event.type === 'PushEvent') {
        const count = event.payload?.commits?.length || (event.payload?.size ?? 1);
        actionText = `Pushed ${count} commit${count > 1 ? 's' : ''} to`;
        detail = event.payload?.commits?.[0]?.message || '';
      } else if (event.type === 'PullRequestEvent') {
        const prAction = event.payload?.action || 'updated';
        actionText = `${prAction.charAt(0).toUpperCase() + prAction.slice(1)} pull request on`;
        detail = event.payload?.pull_request?.title || '';
      } else if (event.type === 'CreateEvent') {
        const refType = event.payload?.ref_type || 'repository';
        actionText = `Created ${refType} on`;
        detail = event.payload?.ref || event.repo?.name || '';
      } else if (event.type === 'DeleteEvent') {
        const refType = event.payload?.ref_type || 'branch';
        actionText = `Deleted ${refType} on`;
        detail = event.payload?.ref || '';
      } else if (event.type === 'IssuesEvent') {
        const issueAction = event.payload?.action || 'updated';
        actionText = `${issueAction.charAt(0).toUpperCase() + issueAction.slice(1)} issue on`;
        detail = event.payload?.issue?.title || '';
      } else if (event.type === 'WatchEvent') {
        actionText = 'Starred';
      } else if (event.type === 'ReleaseEvent') {
        actionText = 'Published release on';
        detail = event.payload?.release?.name || event.payload?.release?.tag_name || '';
      } else if (event.type === 'MemberEvent') {
        actionText = `${event.payload?.action || 'Updated'} collaboration on`;
      }

      return {
        id: event.id,
        type: event.type,
        actor: event.actor?.login || cleanUsername,
        actionText,
        detail,
        repoName: event.repo?.name || '',
        repoUrl: `https://github.com/${event.repo?.name || ''}`,
        createdAt: event.created_at
      };
    });
  } catch (error) {
    logger.warn(`GitHub events fetch failed for ${cleanUsername}:`, error?.message);
    return [];
  }
}

async function fetchGitHubContributions(username) {
  const cleanUsername = username ? username.trim().replace(/^@/, '') : '';
  if (!cleanUsername) return { totalLastYear: 0, days: [] };

  // 1. Try official GitHub GraphQL API if GITHUB_TOKEN is available
  if (env.GITHUB_TOKEN) {
    try {
      const query = `
        query($username: String!) {
          user(login: $username) {
            contributionsCollection {
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    date
                    contributionCount
                    contributionLevel
                  }
                }
              }
            }
          }
        }
      `;

      const res = await axios.post(
        'https://api.github.com/graphql',
        { query, variables: { username: cleanUsername } },
        {
          headers: {
            Authorization: `Bearer ${env.GITHUB_TOKEN}`,
            'User-Agent': 'Careerly-App'
          },
          timeout: 8000
        }
      );

      const calendar = res.data?.data?.user?.contributionsCollection?.contributionCalendar;
      if (calendar) {
        const levelMap = {
          NONE: 0,
          FIRST_QUARTILE: 1,
          SECOND_QUARTILE: 2,
          THIRD_QUARTILE: 3,
          FOURTH_QUARTILE: 4
        };

        const days = [];
        (calendar.weeks || []).forEach((w) => {
          (w.contributionDays || []).forEach((d) => {
            days.push({
              date: d.date,
              count: d.contributionCount || 0,
              level: levelMap[d.contributionLevel] ?? (d.contributionCount > 0 ? 1 : 0)
            });
          });
        });

        return {
          totalLastYear: calendar.totalContributions || 0,
          days
        };
      }
    } catch (graphqlErr) {
      logger.warn(`GitHub GraphQL contributions failed for ${cleanUsername}:`, graphqlErr?.message);
    }
  }

  // 2. Fallback to public contributions service
  try {
    const res = await axios.get(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(cleanUsername)}?y=last`, {
      timeout: 8000
    });
    const totalLastYear = res.data?.total?.lastYear ?? 0;
    const days = (res.data?.contributions || []).map((d) => ({
      date: d.date,
      count: d.count || 0,
      level: d.level || 0
    }));

    return { totalLastYear, days };
  } catch (error) {
    logger.warn(`GitHub contributions fetch failed for ${cleanUsername}:`, error?.message);
    return { totalLastYear: 0, days: [] };
  }
}

async function syncGitHubToUser(userId, username) {
  const [profile, repos, contributions] = await Promise.all([
    fetchGitHubProfile(username),
    fetchGitHubRepos(username),
    fetchGitHubContributions(username)
  ]);
  const starsReceived = repos.reduce((sum, r) => sum + (r.stars || 0), 0);

  // Update User model
  const user = await findUserById(userId);
  if (user) {
    user.githubUrl = profile.profileUrl;
    await user.save();
  }

  // Update or Upsert CodingProfile model for GitHub
  const codingProfile = await CodingProfile.findOneAndUpdate(
    { userId, platform: 'github' },
    {
      userId,
      platform: 'github',
      username: profile.username,
      profileUrl: profile.profileUrl,
      isSelfReported: false,
      stats: {
        totalSolved: profile.publicRepos,
        publicRepos: profile.publicRepos,
        followers: profile.followers,
        following: profile.following,
        starsReceived,
        globalRank: `${profile.followers} followers`,
        lastActiveDate: profile.updatedAt ? String(profile.updatedAt).slice(0, 10) : '',
        contributionCalendar: contributions
      },
      lastSyncedAt: new Date()
    },
    { upsert: true, new: true }
  );

  return {
    profile,
    stats: codingProfile.stats,
    featuredRepos: codingProfile.featuredRepos || []
  };
}

async function toggleFeaturedRepo(userId, repoName) {
  if (!repoName) {
    throw new ApiError(400, 'Repository name is required');
  }

  let profile = await CodingProfile.findOne({ userId, platform: 'github' });
  if (!profile) {
    throw new ApiError(404, 'GitHub profile is not connected yet. Connect your GitHub account first.');
  }

  const currentPins = profile.featuredRepos || [];
  const exists = currentPins.includes(repoName);

  let updatedPins;
  if (exists) {
    updatedPins = currentPins.filter((name) => name !== repoName);
  } else {
    updatedPins = [...currentPins, repoName];
  }

  profile.featuredRepos = updatedPins;
  await profile.save();

  return {
    featuredRepos: updatedPins,
    isPinned: !exists
  };
}

module.exports = {
  fetchGitHubProfile,
  fetchGitHubRepos,
  fetchGitHubEvents,
  fetchGitHubContributions,
  syncGitHubToUser,
  toggleFeaturedRepo
};
