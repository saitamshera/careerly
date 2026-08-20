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
  0: 'bg-[#F7F4ED] border border-[#E3DED3]',
  1: 'bg-[#C8E0D0] border border-[#B3D3BE]',
  2: 'bg-[#8FBF9F] border border-[#78AC8A]',
  3: 'bg-[#538E6A] border border-[#427958]',
  4: 'bg-[#315B45] border border-[#234533]'
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

  // Compute month labels aligned with week columns
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
    <main className="flex-1 p-6 lg:p-10 space-y-6 max-w-5xl mx-auto w-full animate-fadeIn bg-[#F8F6F0]">
      {/* Sub Nav */}
      <CodingProfilesNav profiles={profiles} />

      {/* Header */}
      <SectionHeader
        eyebrow="ENGINEERING PROOF OF WORK"
        title={
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <span className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-[#315B45] shrink-0" />
              <span>GitHub Activity & Portfolio</span>
            </span>

            {/* Live Sync State Badge */}
            {syncMutation.isPending ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.68rem] font-semibold bg-[#E8F0EA] text-[#315B45] border border-[#D1E0D7] animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Syncing GitHub...</span>
              </span>
            ) : syncMutation.isError ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.68rem] font-semibold bg-[#FDECEB] text-[#B83A35] border border-[#F7CBC9]">
                <AlertCircle className="w-3 h-3" />
                <span>Sync failed</span>
              </span>
            ) : githubProfile ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.68rem] font-semibold bg-[#E8F0EA] text-[#315B45] border border-[#D1E0D7]">
                <CheckCircle2 className="w-3 h-3" />
                <span>Connected</span>
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
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#E3DED3] bg-[#FFFDF8] text-[#20211E] outline-none focus:border-[#315B45]"
              />
            ) : (
              <span className="text-xs font-bold text-[#20211E]">
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
          className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between gap-2 ${
            notice.type === 'success'
              ? 'bg-[#E8F0EA] text-[#315B45] border border-[#D1E0D7]'
              : 'bg-[#FDECEB] text-[#B83A35] border border-[#F7CBC9]'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-[#315B45] shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-[#B83A35] shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
          {notice.type === 'error' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => syncMutation.mutate(username)}
              className="text-[0.7rem] py-1 px-2 h-auto"
            >
              Retry
            </Button>
          )}
        </div>
      )}

      {/* Error Fallback Banner */}
      {isError && (
        <Card className="p-5 border-[#F7CBC9] bg-[#FDECEB]/40 text-center space-y-2.5">
          <AlertCircle className="h-5 w-5 text-[#B83A35] mx-auto" />
          <h3 className="text-xs sm:text-sm font-bold text-[#20211E]">
            {ghUserQuery.error?.response?.data?.message || `Unable to load GitHub activity for @${username}`}
          </h3>
          <p className="text-xs text-[#5F625C] max-w-md mx-auto">
            {ghUserQuery.error?.response?.status === 404
              ? `GitHub user '${username}' does not exist. Please check the spelling.`
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
          >
            Retry Loading
          </Button>
        </Card>
      )}

      {/* Empty State */}
      {!username && !isLoading && (
        <EmptyState
          icon={FolderGit2}
          title="No GitHub account connected"
          description="Enter your GitHub username above to display verified activity, contributions, and featured projects."
        />
      )}

      {/* Main Content Area */}
      {username && ghUser && (
        <>
          {/* 1. Overview Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              title="Public Repos"
              value={`${ghUser?.publicRepos ?? repos.length}`}
              subtitle="Open-source projects"
              icon={FolderGit2}
              accent="purple"
            />

            <MetricCard
              title="Stars Received"
              value={`${totalStars}`}
              subtitle="Across repositories"
              icon={Star}
              accent="orange"
            />

            <MetricCard
              title="Followers"
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
          <Card className="p-5 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E3DED3]">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#315B45]" />
                <h3 className="text-xs sm:text-sm font-bold text-[#20211E]">
                  Contribution Activity
                </h3>
              </div>
              {contributions?.days && contributions.days.length > 0 && (
                <Badge variant="green" size="sm" className="font-mono">
                  {contributions.totalLastYear} contributions in the last year
                </Badge>
              )}
            </div>

            {!contributions || !contributions.days || contributions.days.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#74766F] space-y-1">
                <p className="font-semibold text-[#20211E]">
                  No contribution history available yet.
                </p>
                <p className="text-[#5F625C]">
                  Sync your GitHub account to load verified contribution activity.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto pb-2">
                <div className="min-w-[700px] space-y-1">
                  {/* Month Labels Row */}
                  <div className="relative h-4 text-[10px] text-[#74766F] font-medium select-none">
                    {monthLabels.map(({ colIdx, label }, i) => (
                      <span
                        key={i}
                        className="absolute"
                        style={{ left: `${colIdx * 13}px` }}
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
                              className={`w-[10px] h-[10px] rounded-[2px] transition-transform hover:scale-125 cursor-pointer ${
                                LEVEL_COLORS[day.level] || LEVEL_COLORS[0]
                              }`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Heatmap Legend */}
                  <div className="flex items-center justify-between pt-2 text-[0.68rem] text-[#74766F]">
                    <span>Last 12 months verified activity</span>
                    <div className="flex items-center gap-1.5">
                      <span>Less</span>
                      {[0, 1, 2, 3, 4].map((lvl) => (
                        <div
                          key={lvl}
                          className={`w-[9px] h-[9px] rounded-[2px] ${LEVEL_COLORS[lvl]}`}
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
          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            {/* Recent Engineering Activity Stream */}
            <Card className="space-y-3 p-4">
              <CardHeader
                title="Recent Engineering Activity"
                subtitle="Live event log from verified GitHub activity."
              />

              {events.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#74766F]">
                  No recent GitHub activity found.
                </div>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {events.slice(0, 10).map((ev) => (
                    <div
                      key={ev.id}
                      className="p-2.5 rounded-lg border border-[#E3DED3] bg-[#FFFDF8] flex items-start gap-2.5 text-xs hover:bg-[#F7F4ED] transition"
                    >
                      <div className="p-1 rounded bg-[#E8F0EA] text-[#315B45] shrink-0 mt-0.5">
                        <GitBranch className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-[#20211E] truncate">
                            {ev.actionText}{' '}
                            <a
                              href={ev.repoUrl || `https://github.com/${ev.repoName}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-[#20211E] hover:text-[#315B45] transition"
                            >
                              {ev.repoName}
                            </a>
                          </p>
                          <span className="text-[0.68rem] text-[#74766F] shrink-0 font-medium">
                            {formatRelativeTime(ev.createdAt)}
                          </span>
                        </div>

                        {ev.detail && (
                          <p className="text-[0.7rem] text-[#5F625C] line-clamp-1 font-mono bg-[#F7F4ED] p-1 rounded border border-[#E3DED3]">
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
            <Card className="space-y-3 p-4">
              <CardHeader
                title="Active Projects"
                subtitle="Repositories with recent engineering updates."
              />

              {activeProjects.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#74766F]">
                  No public repositories found.
                </div>
              ) : (
                <div className="space-y-2">
                  {activeProjects.map((repo) => (
                    <div
                      key={repo.id}
                      className="p-2.5 rounded-lg border border-[#E3DED3] bg-[#FFFDF8] flex items-center justify-between gap-2 text-xs hover:bg-[#F7F4ED] transition"
                    >
                      <div className="min-w-0 flex-1">
                        <a
                          href={repo.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-[#20211E] hover:text-[#315B45] truncate flex items-center gap-1"
                        >
                          <span className="truncate">{repo.name}</span>
                          <ExternalLink className="h-3 w-3 shrink-0 text-[#74766F]" />
                        </a>
                        <p className="text-[0.68rem] text-[#74766F] mt-0.5">
                          Updated {formatRelativeTime(repo.updatedAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="neutral" size="sm">
                          {repo.language}
                        </Badge>
                        <span className="flex items-center gap-0.5 text-[0.7rem] text-[#74766F]">
                          <Star className="h-3 w-3 text-[#B9822E] fill-[#B9822E]" />
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
          <section className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#E3DED3]">
              <div className="flex items-center gap-2">
                <Pin className="h-4 w-4 text-[#315B45]" />
                <h3 className="text-xs sm:text-sm font-bold text-[#20211E]">
                  Featured Showcase Projects
                </h3>
              </div>
              <span className="text-xs text-[#74766F]">
                Pin key repositories to showcase architecture
              </span>
            </div>

            {featuredRepos.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {featuredRepos.map((repo) => (
                  <Card key={repo.id} className="flex flex-col justify-between space-y-3 p-3.5">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-[#315B45]">
                          {repo.language}
                        </span>
                        <button
                          type="button"
                          onClick={() => pinRepoMutation.mutate(repo.name)}
                          className="p-1 rounded text-[#B9822E] hover:text-[#74766F] transition"
                          title="Unpin repository"
                        >
                          <Pin className="h-3.5 w-3.5 fill-[#B9822E]" />
                        </button>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#20211E]">{repo.name}</h4>
                      <p className="text-xs text-[#5F625C] line-clamp-2 leading-relaxed">
                        {repo.description || 'Production repository with clean architecture.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#E3DED3] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 text-[#74766F]">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          <span>{repo.stars}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <GitFork className="h-3 w-3" />
                          <span>{repo.forks}</span>
                        </span>
                      </div>

                      <a
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#315B45] font-bold hover:underline"
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
          <Card className="space-y-3 p-4">
            <CardHeader
              title="All Repositories"
              subtitle={`${repos.length} public repositories found`}
            />

            {repos.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#74766F]">
                No public repositories found for @{username}.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {repos.map((repo) => {
                  const isPinned = featuredRepoNames.includes(repo.name);
                  return (
                    <div
                      key={repo.id}
                      className="p-2.5 rounded-lg border border-[#E3DED3] bg-[#FFFDF8] flex items-start justify-between gap-2.5 text-xs hover:bg-[#F7F4ED] transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <a
                            href={repo.htmlUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold text-[#20211E] hover:text-[#315B45] truncate"
                          >
                            {repo.name}
                          </a>
                          <Badge variant="neutral" size="sm">
                            {repo.language}
                          </Badge>
                        </div>
                        <p className="text-[0.68rem] text-[#74766F] line-clamp-1 mt-0.5">
                          {repo.description || 'Public GitHub project repository.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => pinRepoMutation.mutate(repo.name)}
                          className={`p-1 rounded-md border transition cursor-pointer ${
                            isPinned
                              ? 'border-[#D1E0D7] bg-[#E8F0EA] text-[#315B45]'
                              : 'border-[#E3DED3] text-[#74766F] hover:text-[#B9822E]'
                          }`}
                          title={isPinned ? 'Unpin' : 'Pin to showcase'}
                        >
                          <Pin className={`h-3 w-3 ${isPinned ? 'fill-[#315B45]' : ''}`} />
                        </button>

                        <a
                          href={repo.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-md text-[#74766F] hover:text-[#315B45] transition"
                        >
                          <ExternalLink className="h-3 w-3" />
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
