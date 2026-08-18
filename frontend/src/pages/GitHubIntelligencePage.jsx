import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Flame,
  Code2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Bookmark
} from 'lucide-react';
import { api } from '../services/api';
import { CodingProfilesNav } from '../components/CodingProfilesNav';
import { Card, CardHeader } from '../components/ui/Card';
import { MetricCard } from '../components/ui/MetricCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';
import { EmptyState } from '../components/ui/EmptyState';

export function GitHubIntelligencePage() {
  const queryClient = useQueryClient();
  const [handleInput, setHandleInput] = useState('');
  const [isEditingHandle, setIsEditingHandle] = useState(false);
  const [notice, setNotice] = useState(null);

  // Fetch Coding Profiles
  const profilesQuery = useQuery({
    queryKey: ['coding-profiles'],
    queryFn: async () => {
      const res = await api.get('/coding-profiles');
      return res.data?.data || [];
    }
  });

  const profiles = profilesQuery.data || [];
  const githubProfile = useMemo(() => {
    return profiles.find((p) => p.platform === 'github');
  }, [profiles]);

  const username = handleInput || githubProfile?.username || '';

  // Fetch GitHub Public Profile
  const ghUserQuery = useQuery({
    queryKey: ['github-user', username],
    queryFn: async () => {
      if (!username) return null;
      try {
        const res = await api.get(`/github/profile/${encodeURIComponent(username)}`);
        return res.data?.data;
      } catch {
        const directRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
        if (!directRes.ok) throw new Error('Could not retrieve GitHub user profile.');
        const d = await directRes.json();
        return {
          username: d.login,
          name: d.name || d.login,
          bio: d.bio || '',
          avatarUrl: d.avatar_url,
          profileUrl: d.html_url,
          publicRepos: d.public_repos || 0,
          publicGists: d.public_gists || 0,
          followers: d.followers || 0,
          following: d.following || 0,
          updatedAt: d.updated_at
        };
      }
    },
    enabled: Boolean(username)
  });

  // Fetch GitHub Repositories
  const ghReposQuery = useQuery({
    queryKey: ['github-repos', username],
    queryFn: async () => {
      if (!username) return [];
      try {
        const res = await api.get(`/github/repos/${encodeURIComponent(username)}?perPage=30`);
        return res.data?.data || [];
      } catch {
        const directRes = await fetch(
          `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=30`
        );
        if (!directRes.ok) return [];
        const d = await directRes.json();
        return (d || []).map((repo) => ({
          id: repo.id,
          name: repo.name,
          description: repo.description || '',
          htmlUrl: repo.html_url,
          stars: repo.stargazers_count || 0,
          forks: repo.forks_count || 0,
          language: repo.language || 'Code',
          updatedAt: repo.updated_at,
          isFork: Boolean(repo.fork)
        }));
      }
    },
    enabled: Boolean(username)
  });

  // Fetch GitHub Recent Events / Activity
  const ghEventsQuery = useQuery({
    queryKey: ['github-events', username],
    queryFn: async () => {
      if (!username) return [];
      try {
        const res = await api.get(`/github/events/${encodeURIComponent(username)}?perPage=15`);
        return res.data?.data || [];
      } catch {
        const directRes = await fetch(
          `https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=15`
        );
        if (!directRes.ok) return [];
        const events = await directRes.json();
        return (events || []).map((ev) => ({
          id: ev.id,
          type: ev.type,
          actionText: ev.type === 'PushEvent' ? 'Pushed commits to' : 'Contributed to',
          detail: ev.payload?.commits?.[0]?.message || '',
          repoName: ev.repo?.name || '',
          createdAt: ev.created_at
        }));
      }
    },
    enabled: Boolean(username)
  });

  // Sync Mutation
  const syncMutation = useMutation({
    mutationFn: async (targetHandle) => {
      const res = await api.post('/github/sync', { username: targetHandle });
      return res.data?.data;
    },
    onSuccess: async () => {
      setNotice({ type: 'success', text: 'GitHub profile synchronized successfully.' });
      setIsEditingHandle(false);
      await queryClient.invalidateQueries({ queryKey: ['coding-profiles'] });
      await queryClient.invalidateQueries({ queryKey: ['github-user'] });
      await queryClient.invalidateQueries({ queryKey: ['github-repos'] });
      await queryClient.invalidateQueries({ queryKey: ['github-events'] });
    },
    onError: (err) => {
      setNotice({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Could not synchronize this GitHub profile.'
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
      await queryClient.invalidateQueries({ queryKey: ['coding-profiles'] });
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
  const featuredRepoNames = githubProfile?.featuredRepos || [];

  // Calculate real stars and language distribution
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

  // Featured Repositories
  const featuredRepos = useMemo(() => {
    return repos.filter((r) => featuredRepoNames.includes(r.name));
  }, [repos, featuredRepoNames]);

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

  return (
    <main className="flex-1 p-6 lg:p-10 space-y-8 max-w-7xl mx-auto w-full animate-fadeIn">
      {/* Sub Nav */}
      <CodingProfilesNav profiles={profiles} />

      {/* Header */}
      <SectionHeader
        eyebrow="ENGINEERING PROOF OF WORK"
        title={
          <span className="flex items-center gap-2.5">
            <GitBranch className="h-6 w-6 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>GitHub Activity & Portfolio</span>
          </span>
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

      {notice && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Overview Metrics Row */}
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
          value={languageDistribution[0]?.language || 'JavaScript'}
          subtitle={`${languageDistribution[0]?.percentage || 0}% of repositories`}
          icon={Code2}
          accent="green"
        />
      </div>

      {/* Featured Projects Showcase */}
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

      {/* Repositories List & Activity Feed Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Repositories Table */}
        <Card className="space-y-4">
          <CardHeader
            title="All Repositories"
            subtitle={`${repos.length} public repositories found`}
          />

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
        </Card>

        {/* Live Public Commit Feed */}
        <Card className="space-y-4">
          <CardHeader
            title="Public Activity Stream"
            subtitle="Live event log from GitHub public activity."
          />

          {events.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No recent public events recorded.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {events.slice(0, 10).map((ev) => (
                <div
                  key={ev.id}
                  className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-2.5 text-xs hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                >
                  <GitBranch className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {ev.actionText} <span className="font-bold">{ev.repoName}</span>
                    </p>
                    {ev.detail && (
                      <p className="text-[0.68rem] text-slate-400 line-clamp-1 mt-0.5 font-mono">
                        "{ev.detail}"
                      </p>
                    )}
                    <span className="text-[0.65rem] text-slate-400">
                      {ev.createdAt ? new Date(ev.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
