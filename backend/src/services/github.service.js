const axios = require('axios');
const { CodingProfile } = require('../models/codingProfile.model');
const { findUserById } = require('../repositories/user.repository');
const { ApiError } = require('../utils/apiError');
const { logger } = require('../config/logger');

const GITHUB_API_BASE = 'https://api.github.com';

const axiosInstance = axios.create({
  baseURL: GITHUB_API_BASE,
  timeout: 8000,
  headers: {
    'User-Agent': 'Careerly-App'
  }
});

async function fetchGitHubProfile(username) {
  const cleanUsername = username ? username.trim().replace(/^@/, '') : '';
  if (!cleanUsername) throw new Error('GitHub username is required');

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
    logger.warn(`GitHub profile fetch failed for ${cleanUsername}:`, error?.response?.data || error.message);
    throw new Error(`Unable to find GitHub user "${cleanUsername}". Check the username and try again.`);
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

    return (res.data || []).map((event) => {
      let actionText = 'Contributed to';
      let detail = '';

      if (event.type === 'PushEvent') {
        const count = event.payload?.commits?.length || 1;
        actionText = `Pushed ${count} commit${count > 1 ? 's' : ''} to`;
        detail = event.payload?.commits?.[0]?.message || '';
      } else if (event.type === 'PullRequestEvent') {
        actionText = `${event.payload?.action === 'opened' ? 'Opened' : 'Updated'} pull request on`;
        detail = event.payload?.pull_request?.title || '';
      } else if (event.type === 'CreateEvent') {
        actionText = `Created ${event.payload?.ref_type || 'repository'}`;
        detail = event.payload?.ref || '';
      } else if (event.type === 'IssuesEvent') {
        actionText = `${event.payload?.action || 'Updated'} issue on`;
        detail = event.payload?.issue?.title || '';
      } else if (event.type === 'WatchEvent') {
        actionText = 'Starred';
      }

      return {
        id: event.id,
        type: event.type,
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

async function syncGitHubToUser(userId, username) {
  const profile = await fetchGitHubProfile(username);
  const repos = await fetchGitHubRepos(username);
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
      platform,
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
        lastActiveDate: profile.updatedAt ? String(profile.updatedAt).slice(0, 10) : ''
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
  syncGitHubToUser,
  toggleFeaturedRepo
};
