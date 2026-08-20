import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
  GitBranch,
  Star,
  GitFork,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FolderGit2,
  Users,
  Pin,
  Code2,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import { extractCleanHandle } from '../utils/sanitizeHandle';
import { CodingProfilesNav } from '../components/CodingProfilesNav';
import { Card, CardHeader } from '../components/ui/Card';
import { MetricCard } from '../components/ui/MetricCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';
import { EmptyState } from '../components/ui/EmptyState';

function formatSyncTime(dateString) {
  if (!dateString) return null;
  const elapsed = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (isNaN(elapsed) || elapsed < 0) return 'just now';
  if (elapsed < 10) return 'just now';
  if (elapsed < 60) return `${elapsed}s ago`;
  const mins = Math.floor(elapsed / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatRelativeTime(dateString) {
  if (!dateString) return 'Recently';
  const diffSec = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (isNaN(diffSec) || diffSec < 0) return 'Just now';
  if (diffSec < 60) return 'Just now';
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

function formatTooltipDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return dateStr;
  const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const LEVEL_COLORS = {
  0: 'bg-slate-100 dark:bg-[#161b22] border border-slate-200/60 dark:border-white/5',
  1: 'bg-[#9be9a8] dark:bg-[#0e4429] border border-[#7bc96f]/40 dark:border-[#006d32]/40',
  2: 'bg-[#40c463] dark:bg-[#006d32] border border-[#30a14e]/40 dark:border-[#26a641]/40',
  3: 'bg-[#30a14e] dark:bg-[#26a641] border border-[#216e39]/40 dark:border-[#39d353]/40',
  4: 'bg-[#216e39] dark:bg-[#39d353] border border-[#1b552d]/40 dark:border-[#56e36d]/40'
};

export function GitHubIntelligencePage() {
  const queryClient = useQueryClient();
  const currentUser = useSelector((state) => state.auth.user);
  const currentUserId = currentUser?.id || currentUser?._id || 'anon';

  const [handleInput, setHandleInput] = useState('');
  const [isEditingHandle, setIsEditingHandle] = useState(false);
  const [notice, setNotice] = useState(null);

  // 1. Fetch Coding Profiles with auto-refetch
  const profilesQuery = useQuery({
    queryKey: ['coding-profiles', currentUserId],
    queryFn: async () => {
      const res = await api.get('/coding-profiles');
      return res.data?.data || [];
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true
  });

  const profiles = profilesQuery.data || [];
  const githubProfile = useMemo(() => {
    return profiles.find((p) => p.platform === 'github');
  }, [profiles]);

  const rawUsername = handleInput || githubProfile?.username || '';
  const username = extractCleanHandle(rawUsername);

  // 2. Fetch GitHub Public Profile (Backend only)
  const ghUserQuery = useQuery({
    queryKey: ['github-user', currentUserId, username],
    queryFn: async () => {
      if (!username) return null;
      const res = await api.get(`/github/profile/${encodeURIComponent(username)}`);
      return res.data?.data;
    },
    enabled: Boolean(username),
    retry: (failureCount, error) => {
      if (error?.response?.status === 429 || error?.response?.status === 404) return false;
      return failureCount < 2;
    },
    refetchInterval: (query) => {
      if (query.state.error?.response?.status === 429 || query.state.error?.response?.status === 404) return false;
      return 30000;
    },
    refetchOnWindowFocus: (query) => query.state.error?.response?.status !== 429
  });

  // 3. Fetch GitHub Repositories (Backend only)
  const ghReposQuery = useQuery({
    queryKey: ['github-repos', currentUserId, username],
    queryFn: async () => {
      if (!username) return [];
      const res = await api.get(`/github/repos/${encodeURIComponent(username)}?perPage=30`);
      return res.data?.data || [];
    },
    enabled: Boolean(username),
    retry: (failureCount, error) => {
      if (error?.response?.status === 429 || error?.response?.status === 404) return false;
      return failureCount < 2;
    },
    refetchInterval: (query) => {
      if (query.state.error?.response?.status === 429 || query.state.error?.response?.status === 404) return false;
      return 30000;
    },
    refetchOnWindowFocus: (query) => query.state.error?.response?.status !== 429
  });

  // 4. Fetch GitHub Recent Events / Activity (Backend only)
  const ghEventsQuery = useQuery({
    queryKey: ['github-events', currentUserId, username],
    queryFn: async () => {
      if (!username) return [];
      const res = await api.get(`/github/events/${encodeURIComponent(username)}?perPage=15`);
      return res.data?.data || [];
    },
    enabled: Boolean(username),
    retry: (failureCount, error) => {
      if (error?.response?.status === 429 || error?.response?.status === 404) return false;
      return failureCount < 2;
    },
    refetchInterval: (query) => {
      if (query.state.error?.response?.status === 429 || query.state.error?.response?.status === 404) return false;
      return 30000;
    },
    refetchOnWindowFocus: (query) => query.state.error?.response?.status !== 429
  });

  // 5. Fetch Genuine 12-Month Contribution Calendar (Backend only)
  const ghContributionsQuery = useQuery({
    queryKey: ['github-contributions', currentUserId, username],
    queryFn: async () => {
      if (!username) return null;
      const res = await api.get(`/github/contributions/${encodeURIComponent(username)}`);
      return res.data?.data;
    },
    enabled: Boolean(username),
    retry: (failureCount, error) => {
      if (error?.response?.status === 429 || error?.response?.status === 404) return false;
      return failureCount < 2;
    },
    refetchInterval: (query) => {
      if (query.state.error?.response?.status === 429 || query.state.error?.response?.status === 404) return false;
      return 30000;
    },
    refetchOnWindowFocus: (query) => query.state.error?.response?.status !== 429
  });

  // Sync Mutation
  const syncMutation = useMutation({
    mutationFn: async (targetHandle) => {
      const cleanTarget = extractCleanHandle(targetHandle);
      const res = await api.post('/github/sync', { username: cleanTarget });
      return res.data?.data;
    },
    onSuccess: async () => {
      setNotice({ type: 'success', text: 'GitHub profile synchronized successfully.' });
      setIsEditingHandle(false);
      await queryClient.invalidateQueries({ queryKey: ['coding-profiles', currentUserId] });
      await queryClient.invalidateQueries({ queryKey: ['github-user', currentUserId] });
      await queryClient.invalidateQueries({ queryKey: ['github-repos', currentUserId] });
      await queryClient.invalidateQueries({ queryKey: ['github-events', currentUserId] });
      await queryClient.invalidateQueries({ queryKey: ['github-contributions', currentUserId] });
    },
    onError: (err) => {
      setNotice({
        type: 'error',
        text: err.response?.data?.message || 'Could not synchronize this GitHub profile. Check username and try again.'
      });
    }
  });

  // Pin / Feature Repo Mutation
  const pinRepoMutation = useMutation({
    mutationFn: async (repoName) => {
      const res = await api.post('/github/pin-repo', { repoName });
      return res.data?.data;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['coding-profiles', currentUserId] });
      setNotice({
        type: 'success',
        text: data?.isPinned
          ? 'Repository pinned to Careerly portfolio.'
          : 'Repository removed from featured portfolio.'
      });
    },
    onError: (err) => {
      setNotice({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update pinned repository.'
      });
    }
  });

  const ghUser = ghUserQuery.data;
  const repos = ghReposQuery.data || [];
  const events = ghEventsQuery.data || [];
  const contributions = ghContributionsQuery.data;
  const featuredRepoNames = githubProfile?.featuredRepos || [];

  // Group verified days into weekly columns for 12-month calendar heatmap
  const contributionWeeks = useMemo(() => {
    const days = contributions?.days || [];
    if (days.length === 0) return [];
    const weeks = [];
    let currentWeek = [];
    days.forEach((day, idx) => {
      currentWeek.push(day);
      if (currentWeek.length === 7 || idx === days.length - 1) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    return weeks;
  }, [contributions?.days]);

  // Compute month labels aligned with week columns (Jan, Feb, Mar...)
  const monthLabels = useMemo(() => {
    if (contributionWeeks.length === 0) return [];
    const labels = [];
    let lastMonth = -1;

    contributionWeeks.forEach((week, colIdx) => {
      const firstDayStr = week[0]?.date || week.find((d) => d?.date)?.date;
      if (!firstDayStr) return;
      const [y, m, d] = firstDayStr.split('-');
      if (!y || !m || !d) return;
      const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
      const month = date.getMonth();

      if (month !== lastMonth) {
        const prevCol = labels[labels.length - 1]?.colIdx ?? -99;
        if (colIdx - prevCol >= 2) {
          labels.push({
            colIdx,
            label: date.toLocaleString('en-US', { month: 'short' })
          });
          lastMonth = month;
        }
      }
    });
    return labels;
  }, [contributionWeeks]);

  // Calculate real stars and language distribution from verified repos
  const totalStars = useMemo(() => {
    return repos.reduce((sum, r) => sum + (r.stars || 0), 0);
  }, [repos]);

  const languageDistribution = useMemo(() => {
    const counts = {};
    repos.forEach((r) => {
      if (r.language && r.language !== 'Code') {
        counts[r.language] = (counts[r.language] || 0) + 1;
      }
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return Object.entries(counts)
      .map(([lang, count]) => ({
        language: lang,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [repos]);

  const featuredRepos = useMemo(() => {
    return repos.filter((r) => featuredRepoNames.includes(r.name));
  }, [repos, featuredRepoNames]);

  // Active Projects (Top 4 most recently updated repos)
  const activeProjects = useMemo(() => {
    return [...repos]
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, 4);
  }, [repos]);

  function handleSyncSubmit(e) {
    e.preventDefault();
    const handle = handleInput.trim() || username;
    if (!handle) {
      setNotice({ type: 'error', text: 'Please enter a GitHub username.' });
      return;
    }
    setNotice(null);
    syncMutation.mutate(handle);
  }

  const isLoading = profilesQuery.isLoading || (Boolean(username) && ghUserQuery.isLoading);
  const isError = ghUserQuery.isError && !ghUser;

  return (
    <main className="flex-1 p-6 lg:p-10 space-y-8 max-w-7xl mx-auto w-full animate-fadeIn">
      {/* Sub Nav */}
      <CodingProfilesNav profiles={profiles} />

      {/* Header */}
      <SectionHeader
        eyebrow="ENGINEERING PROOF OF WORK"
        title={
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="flex items-center gap-2.5">
              <GitBranch className="h-6 w-6 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>GitHub Activity & Portfolio</span>
            </span>

            {/* Live Sync State Badge */}
            {syncMutation.isPending ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.68rem] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Syncing GitHub...</span>
              </span>
            ) : syncMutation.isError ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.68rem] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                <AlertCircle className="w-3 h-3" />
                <span>Sync failed</span>
                {githubProfile?.lastSyncedAt && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-slate-500 dark:text-slate-400 font-normal">
                      Last successful: {formatSyncTime(githubProfile.lastSyncedAt)}
                    </span>
                  </>
                )}
              </span>
            ) : githubProfile ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.68rem] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                <CheckCircle2 className="w-3 h-3" />
                <span>GitHub Connected</span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-slate-500 dark:text-slate-400 font-normal">
                  Last synced {formatSyncTime(githubProfile.lastSyncedAt) || 'just now'}
                </span>
              </span>
            ) : null}
          </div>
        }
        description="Public repository portfolio, live commit activity, stack distributions, and pinned showcase projects for recruiters."
        action={
          <form onSubmit={handleSyncSubmit} className="flex items-center gap-2">
            {isEditingHandle || !username ? (
              <input
                type="text"
                value={handleInput}
                onChange={(e) => setHandleInput(e.target.value)}
                placeholder="GitHub username..."
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
              />
            ) : (
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                @{username}
              </span>
            )}

            <Button
              size="sm"
              icon={RefreshCw}
              isLoading={syncMutation.isPending}
              type="submit"
            >
              {syncMutation.isPending ? 'Syncing...' : 'Sync GitHub'}
            </Button>

            {username && !isEditingHandle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setHandleInput(username);
                  setIsEditingHandle(true);
                }}
              >
                Edit
              </Button>
            )}
          </form>
        }
      />

      {/* Notice Banner */}
      {notice && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
          {notice.type === 'error' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => syncMutation.mutate(username)}
              className="text-[0.7rem] py-1 px-2.5 h-auto"
            >
              Retry
            </Button>
          )}
        </div>
      )}

      {/* Error Fallback Banner */}
      {isError && (
        <Card className="p-6 border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 text-center space-y-3">
          <AlertCircle className="h-6 w-6 text-rose-600 dark:text-rose-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {ghUserQuery.error?.response?.data?.message || `Unable to load GitHub activity for @${username}`}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {ghUserQuery.error?.response?.status === 404
              ? `GitHub user '${username}' does not exist on GitHub. Please check the spelling.`
              : ghUserQuery.error?.response?.status === 429
              ? 'GitHub API rate limit reached. Please wait a moment or configure a GITHUB_TOKEN in your environment.'
              : 'Please check your connection or retry synchronization.'}
          </p>
          <Button
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['github-user'] });
              queryClient.invalidateQueries({ queryKey: ['github-repos'] });
              queryClient.invalidateQueries({ queryKey: ['github-events'] });
              queryClient.invalidateQueries({ queryKey: ['github-contributions'] });
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
          >
            Retry Loading
          </Button>
        </Card>
      )}

      {/* Loading Skeletons */}
      {isLoading && !ghUser && (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            ))}
          </div>
          <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      )}

      {/* Empty State - No GitHub connected */}
      {!username && !isLoading && (
        <EmptyState
          icon={FolderGit2}
          title="No GitHub account connected"
          description="Enter your GitHub username above or connect your account to display verified engineering activity, contributions, and featured projects."
        />
      )}

      {/* Main Content Area */}
      {username && ghUser && (
        <>
          {/* 1. Overview Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Public Repositories"
              value={`${ghUser?.publicRepos ?? repos.length}`}
              subtitle="Open-source projects"
              icon={FolderGit2}
              accent="purple"
            />

            <MetricCard
              title="Stars Received"
              value={`${totalStars}`}
              subtitle="Across public repositories"
              icon={Star}
              accent="orange"
            />

            <MetricCard
              title="Followers & Reach"
              value={`${ghUser?.followers ?? 0}`}
              subtitle={`${ghUser?.following ?? 0} following`}
              icon={Users}
              accent="blue"
            />

            <MetricCard
              title="Primary Language"
              value={languageDistribution[0]?.language || 'None'}
              subtitle={
                languageDistribution[0]
                  ? `${languageDistribution[0].percentage}% of repositories`
                  : 'No public code logged'
              }
              icon={Code2}
              accent="green"
            />
          </div>

          {/* 2. Contribution Activity Heatmap */}
          <Card className="p-6 space-y-4 border-slate-200/80 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Contribution Activity
                </h3>
              </div>
              {contributions?.days && contributions.days.length > 0 && (
                <Badge variant="green" size="sm" className="self-start sm:self-auto font-mono">
                  {contributions.totalLastYear} contributions in the last year
                </Badge>
              )}
            </div>

            {/* If no real contribution days available, show honest empty state */}
            {!contributions || !contributions.days || contributions.days.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  No contribution history available yet.
                </p>
                <p className="text-slate-400">
                  Sync your GitHub account to load verified contribution activity.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto pb-2 scrollbar-thin">
                <div className="min-w-[750px] space-y-1.5">
                  {/* Month Labels Row */}
                  <div className="relative h-4 text-[10px] text-slate-500 dark:text-slate-400 font-medium select-none">
                    {monthLabels.map(({ colIdx, label }, i) => (
                      <span
                        key={i}
                        className="absolute"
                        style={{ left: `${colIdx * 14}px` }}
                      >
                        {label}
                      </span>
                    ))}
                  </div>

                  {/* Grid of Weeks */}
                  <div className="flex gap-[3px]">
                    {contributionWeeks.map((week, wIdx) => (
                      <div key={wIdx} className="flex flex-col gap-[3px]">
                        {week.map((day) => {
                          const formattedDate = formatTooltipDate(day.date);
                          const tooltip = `${day.count === 0 ? 'No' : day.count} contribution${
                            day.count === 1 ? '' : 's'
                          } on ${formattedDate}`;

                          return (
                            <div
                              key={day.date}
                              title={tooltip}
                              className={`w-[11px] h-[11px] rounded-[2px] transition-transform hover:scale-125 cursor-pointer ${
                                LEVEL_COLORS[day.level] || LEVEL_COLORS[0]
                              }`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Heatmap Legend */}
                  <div className="flex items-center justify-between pt-2 text-[0.68rem] text-slate-500">
                    <span>Last 12 months verified activity</span>
                    <div className="flex items-center gap-1.5">
                      <span>Less</span>
                      {[0, 1, 2, 3, 4].map((lvl) => (
                        <div
                          key={lvl}
                          className={`w-[10px] h-[10px] rounded-[2px] ${LEVEL_COLORS[lvl]}`}
                        />
                      ))}
                      <span>More</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* 3. Recent Engineering Activity & Active Projects Grid */}
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            {/* Recent Engineering Activity Stream */}
            <Card className="space-y-4">
              <CardHeader
                title="Recent Engineering Activity"
                subtitle="Live event log from verified GitHub activity."
              />

              {events.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    No recent GitHub activity found.
                  </p>
                  <p className="text-slate-400">
                    Sync your GitHub account to start tracking engineering activity.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {events.slice(0, 10).map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/90 flex items-start gap-3 text-xs hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 shrink-0 mt-0.5">
                        <GitBranch className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {ev.actionText}{' '}
                            <a
                              href={ev.repoUrl || `https://github.com/${ev.repoName}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                            >
                              {ev.repoName}
                            </a>
                          </p>
                          <span className="text-[0.68rem] text-slate-400 shrink-0 whitespace-nowrap font-medium">
                            {formatRelativeTime(ev.createdAt)}
                          </span>
                        </div>

                        {ev.detail && (
                          <p className="text-[0.72rem] text-slate-500 dark:text-slate-400 line-clamp-2 font-mono bg-slate-50/70 dark:bg-slate-900/60 p-1.5 rounded-md border border-slate-100 dark:border-slate-800">
                            "{ev.detail}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Active Projects Indicator */}
            <Card className="space-y-4">
              <CardHeader
                title="Active Projects"
                subtitle="Repositories with recent engineering updates."
              />

              {activeProjects.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No public repositories found.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeProjects.map((repo) => (
                    <div
                      key={repo.id}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <a
                          href={repo.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-slate-900 dark:text-slate-100 hover:text-emerald-600 truncate flex items-center gap-1.5"
                        >
                          <span className="truncate">{repo.name}</span>
                          <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
                        </a>
                        <p className="text-[0.68rem] text-slate-400 mt-0.5">
                          Updated {formatRelativeTime(repo.updatedAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="neutral" size="sm">
                          {repo.language}
                        </Badge>
                        <span className="flex items-center gap-1 text-[0.7rem] text-slate-500">
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          <span>{repo.stars}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* 4. Featured Showcase Projects */}
          <section className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Pin className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Featured Showcase Projects
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Pin key repositories to showcase architecture to interviewers
              </span>
            </div>

            {featuredRepos.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featuredRepos.map((repo) => (
                  <Card key={repo.id} className="flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {repo.language}
                        </span>
                        <button
                          type="button"
                          onClick={() => pinRepoMutation.mutate(repo.name)}
                          className="p-1 rounded text-amber-500 hover:text-slate-400 transition"
                          title="Unpin repository"
                        >
                          <Pin className="h-4 w-4 fill-amber-500" />
                        </button>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{repo.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {repo.description || 'Production repository with clean architecture.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 text-slate-500">
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5" />
                          <span>{repo.stars}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <GitFork className="h-3.5 w-3.5" />
                          <span>{repo.forks}</span>
                        </span>
                      </div>

                      <a
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={FolderGit2}
                title="No featured projects pinned"
                description="Click the pin icon on any repository below to feature it in your recruiter portfolio."
              />
            )}
          </section>

          {/* 5. All Repositories Table */}
          <Card className="space-y-4">
            <CardHeader
              title="All Repositories"
              subtitle={`${repos.length} public repositories found`}
            />

            {repos.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No public repositories found for @{username}.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {repos.map((repo) => {
                  const isPinned = featuredRepoNames.includes(repo.name);
                  return (
                    <div
                      key={repo.id}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 text-xs hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <a
                            href={repo.htmlUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold text-slate-900 dark:text-slate-100 hover:text-emerald-600 truncate"
                          >
                            {repo.name}
                          </a>
                          <Badge variant="neutral" size="sm">
                            {repo.language}
                          </Badge>
                        </div>
                        <p className="text-[0.68rem] text-slate-400 line-clamp-1 mt-0.5">
                          {repo.description || 'Public GitHub project repository.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => pinRepoMutation.mutate(repo.name)}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            isPinned
                              ? 'border-amber-300 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:border-amber-800'
                              : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-amber-500'
                          }`}
                          title={isPinned ? 'Unpin' : 'Pin to showcase'}
                        >
                          <Pin className={`h-3.5 w-3.5 ${isPinned ? 'fill-amber-500' : ''}`} />
                        </button>

                        <a
                          href={repo.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 transition"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </main>
  );
}
