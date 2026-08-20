import React, { useMemo, useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  Globe,
  Plus,
  ExternalLink,
  CheckCircle2,
  Trash2,
  BrainCircuit,
  Sparkles,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Target,
  Check,
  Layers,
  ChevronRight,
  Code2,
  FolderGit2,
  Flame,
  Users
} from 'lucide-react';
import { api } from '../services/api';
import { extractCleanHandle } from '../utils/sanitizeHandle';
import { CodingProfilesNav } from '../components/CodingProfilesNav';
import { PLATFORMS_CONFIG } from '../config/platforms.config';
import { ConnectPlatformModal } from '../components/codingProfiles/ConnectPlatformModal';
import { Card, CardHeader } from '../components/ui/Card';
import { MetricCard } from '../components/ui/MetricCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';
import { EmptyState } from '../components/ui/EmptyState';

function formatSyncTime(dateString) {
  if (!dateString) return 'Never';
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

export function CodingProfilesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const analysisRef = useRef(null);

  const currentUser = useSelector((state) => state.auth.user);
  const currentUserId = currentUser?.id || currentUser?._id || 'anon';

  // Modal & Form state
  const [showModal, setShowModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('leetcode');
  const [username, setUsername] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const [isSelfReported, setIsSelfReported] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState(null);

  // Stats input state (for manual self-report)
  const [totalSolved, setTotalSolved] = useState('');
  const [easySolved, setEasySolved] = useState('');
  const [mediumSolved, setMediumSolved] = useState('');
  const [hardSolved, setHardSolved] = useState('');
  const [currentRating, setCurrentRating] = useState('');
  const [maxRating, setMaxRating] = useState('');
  const [globalRank, setGlobalRank] = useState('');

  // Fetch Coding Profiles
  const profilesQuery = useQuery({
    queryKey: ['coding-profiles', currentUserId],
    queryFn: async () => {
      const res = await api.get('/coding-profiles');
      return res.data?.data || [];
    },
    refetchOnWindowFocus: true
  });

  // Fetch DSA Tracker summary stats
  const { data: dsaStats } = useQuery({
    queryKey: ['dsa-stats', currentUserId],
    queryFn: async () => (await api.get('/dsa/stats')).data?.data
  });

  const dsaTopicsCoveredCount = useMemo(() => {
    return Object.keys(dsaStats?.topics || {}).length;
  }, [dsaStats]);

  const dsaStreak = dsaStats?.streak || 0;

  // Sync All Mutation
  const syncAllMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/coding-profiles/sync-all');
      return res.data?.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['coding-profiles', currentUserId] });
      await queryClient.invalidateQueries({ queryKey: ['dsa-stats', currentUserId] });
      setFeedbackNotice({
        type: 'success',
        message: 'All connected profiles synchronized successfully.'
      });
      setTimeout(() => setFeedbackNotice(null), 3000);
    },
    onError: (err) => {
      setFeedbackNotice({
        type: 'error',
        message: err.response?.data?.message || 'Sync failed. Please try again.'
      });
    }
  });

  // Single Profile Sync Mutation
  const syncSingleMutation = useMutation({
    mutationFn: async (profileId) => {
      const res = await api.post(`/coding-profiles/${profileId}/sync`);
      return res.data?.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['coding-profiles', currentUserId] });
      setFeedbackNotice({
        type: 'success',
        message: 'Profile synchronized with live platform data.'
      });
      setTimeout(() => setFeedbackNotice(null), 3000);
    },
    onError: (err) => {
      setFeedbackNotice({
        type: 'error',
        message: err.response?.data?.message || 'Sync failed for this profile.'
      });
    }
  });

  // Upsert Mutation
  const upsertMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/coding-profiles', payload);
      return res.data?.data;
    },
    onSuccess: async () => {
      setFeedbackNotice({
        type: 'success',
        message: 'Profile connected successfully.'
      });
      await queryClient.invalidateQueries({ queryKey: ['coding-profiles', currentUserId] });
      setTimeout(() => {
        setShowModal(false);
        resetForm();
        setFeedbackNotice(null);
      }, 1000);
    },
    onError: (err) => {
      const msg =
        err.response?.data?.message ||
        'Could not find this profile. Check the username and try again.';
      setFeedbackNotice({
        type: 'error',
        message: msg
      });
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (profileId) => {
      await api.delete(`/coding-profiles/${profileId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['coding-profiles', currentUserId] });
    }
  });

  // AI Recruiter Analysis Mutation
  const recruiterAnalysisMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/ai/recruiter-analysis', payload);
      return res.data?.data;
    }
  });

  function resetForm() {
    setUsername('');
    setProfileUrl('');
    setIsSelfReported(false);
    setTotalSolved('');
    setEasySolved('');
    setMediumSolved('');
    setHardSolved('');
    setCurrentRating('');
    setMaxRating('');
    setGlobalRank('');
    setFeedbackNotice(null);
  }

  function handleOpenModal(platformId = 'leetcode') {
    resetForm();
    setSelectedPlatform(platformId);
    setShowModal(true);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setFeedbackNotice(null);

    const statsPayload = {
      totalSolved: Number(totalSolved || 0),
      easySolved: Number(easySolved || 0),
      mediumSolved: Number(mediumSolved || 0),
      hardSolved: Number(hardSolved || 0),
      currentRating: Number(currentRating || 0),
      maxRating: Number(maxRating || 0),
      globalRank: globalRank || 'N/A'
    };

    const cleanUsername = extractCleanHandle(username);

    upsertMutation.mutate({
      platform: selectedPlatform,
      username: cleanUsername,
      profileUrl: profileUrl.trim(),
      isSelfReported,
      stats: statsPayload
    });
  }

  const profiles = profilesQuery.data || [];
  const recruiterAnalysis = useMemo(
    () => recruiterAnalysisMutation.data,
    [recruiterAnalysisMutation.data]
  );

  const handleRunAnalysis = () => {
    recruiterAnalysisMutation.mutate(
      {
        profiles,
        resumeScore: 78,
        targetRole: 'Software Engineer'
      },
      {
        onSuccess: () => {
          setTimeout(() => {
            analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
      }
    );
  };

  // Compute aggregated KPIs strictly from real returned data
  const aggregateMetrics = useMemo(() => {
    let problemSolvedCount = 0;
    let githubReposCount = 0;
    let githubFollowersCount = 0;
    let githubStarsCount = 0;
    let highestRating = 0;

    profiles.forEach((p) => {
      const s = p.stats || {};
      if (p.platform !== 'github') {
        problemSolvedCount += Number(s.totalSolved || 0);
      } else {
        githubReposCount += Number(s.publicRepos || s.totalSolved || 0);
        githubFollowersCount += Number(s.followers || 0);
        githubStarsCount += Number(s.starsReceived || 0);
      }

      const r = Number(s.currentRating || 0);
      const mr = Number(s.maxRating || 0);
      // Valid contest ratings are <= 4000; ignores user global rank numbers (e.g. 1.9M)
      if (r > highestRating && r <= 4000) highestRating = r;
      if (mr > highestRating && mr <= 4000) highestRating = mr;
    });

    return {
      problemSolvedCount,
      githubReposCount,
      githubFollowersCount,
      githubStarsCount,
      highestRating
    };
  }, [profiles]);

  const connectedPlatformIds = useMemo(() => {
    return new Set(profiles.map((p) => p.platform));
  }, [profiles]);

  const hasConnectedProfiles = profiles.length > 0;

  return (
    <main className="flex-1 p-6 lg:p-10 space-y-8 max-w-7xl mx-auto w-full animate-fadeIn">
      {/* Central Sub-Navigation Tabs */}
      <CodingProfilesNav profiles={profiles} />

      {/* 1. Header with Actions */}
      <SectionHeader
        eyebrow="CENTRAL DEVELOPER HUB"
        title={
          <span className="flex items-center gap-2.5">
            <Globe className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Coding Profiles</span>
          </span>
        }
        description="Connect your LeetCode, GitHub, and competitive coding profiles to unify your telemetry and generate recruiter-grade proof of work."
        action={
          <div className="flex items-center gap-2.5">
            {hasConnectedProfiles && (
              <Button
                variant="secondary"
                size="sm"
                icon={RefreshCw}
                isLoading={syncAllMutation.isPending}
                onClick={() => syncAllMutation.mutate()}
              >
                {syncAllMutation.isPending ? 'Syncing All...' : 'Sync All'}
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              icon={BrainCircuit}
              isLoading={recruiterAnalysisMutation.isPending}
              onClick={handleRunAnalysis}
            >
              AI Recruiter Analysis
            </Button>

            <Button
              size="sm"
              icon={Plus}
              onClick={() => handleOpenModal('leetcode')}
            >
              Connect Platform
            </Button>
          </div>
        }
      />

      {/* 2. DSA Practice Summary Snapshot */}
      <Card className="p-4 sm:p-5 bg-gradient-to-r from-emerald-500/5 via-slate-50 to-emerald-500/5 dark:from-emerald-950/20 dark:via-slate-900/50 dark:to-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  DSA Practice Tracker
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                  Personal Log
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manual problem notes, pattern tags, and daily consistency.
              </p>
            </div>
          </div>

          <Link
            to="/dsa-tracker"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition shrink-0 group self-start sm:self-auto"
          >
            <span>View Full Tracker</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-3.5">
          <div>
            <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Problems Logged
            </span>
            <p className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
              {dsaStats?.total ?? 0}
            </p>
            <p className="text-[0.7rem] text-slate-400 dark:text-slate-500 mt-0.5">
              {dsaStats?.solved ?? 0} marked solved
            </p>
          </div>

          <div>
            <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Topics Covered
            </span>
            <p className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
              {dsaTopicsCoveredCount}
            </p>
            <p className="text-[0.7rem] text-slate-400 dark:text-slate-500 mt-0.5">
              across data structures
            </p>
          </div>

          <div>
            <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Streak
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Flame className={`w-4 h-4 ${dsaStreak > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`} />
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                {dsaStreak} <span className="text-xs font-medium text-slate-500">{dsaStreak === 1 ? 'day' : 'days'}</span>
              </span>
            </div>
            <p className="text-[0.7rem] text-slate-400 dark:text-slate-500 mt-0.5">
              continuous practice
            </p>
          </div>
        </div>
      </Card>

      {/* 3. Overview Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Problems Solved"
          value={`${aggregateMetrics.problemSolvedCount}`}
          subtitle="LeetCode & Competitive"
          icon={Code2}
          accent="green"
        />

        <MetricCard
          title="Public Repositories"
          value={`${aggregateMetrics.githubReposCount}`}
          subtitle="GitHub Engineering"
          icon={FolderGit2}
          accent="purple"
        />

        <MetricCard
          title="Peak Contest Rating"
          value={aggregateMetrics.highestRating > 0 ? `${aggregateMetrics.highestRating}` : 'N/A'}
          subtitle="Competitive Standing"
          icon={Flame}
          accent="orange"
        />

        <MetricCard
          title="Developer Reach"
          value={`${aggregateMetrics.githubFollowersCount}`}
          subtitle="GitHub Followers"
          icon={Users}
          accent="blue"
        />
      </div>

      {/* 3. Connected Profiles Cards */}
      {hasConnectedProfiles ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Connected Platforms ({profiles.length})
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Click LeetCode or GitHub to inspect deep telemetry
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((prof) => {
              const cfg =
                PLATFORMS_CONFIG.find((p) => p.id === prof.platform) || PLATFORMS_CONFIG[0];
              const stats = prof.stats || {};
              const hasDeepDive = Boolean(cfg.detailRoute);

              return (
                <Card
                  key={prof._id}
                  onClick={() => {
                    if (hasDeepDive) navigate(cfg.detailRoute);
                  }}
                  className={`flex flex-col justify-between space-y-4 transition ${
                    hasDeepDive
                      ? 'cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700'
                      : ''
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="green" size="md">
                        {cfg.icon({ className: 'h-3.5 w-3.5 mr-1 inline' })}
                        <span>{prof.platform}</span>
                      </Badge>

                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => syncSingleMutation.mutate(prof._id)}
                          disabled={syncSingleMutation.isPending && syncSingleMutation.variables === prof._id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition cursor-pointer"
                          title="Sync Now"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${syncSingleMutation.isPending && syncSingleMutation.variables === prof._id ? 'animate-spin text-emerald-600' : ''}`} />
                        </button>
                        {prof.profileUrl && (
                          <a
                            href={prof.profileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                            title="Open URL"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Disconnect ${prof.platform}?`)) {
                              deleteMutation.mutate(prof._id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                          title="Disconnect"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                        @{prof.username}
                      </p>
                      <p className="text-[0.68rem] text-slate-400">
                        Last synced: {formatSyncTime(prof.lastSyncedAt)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
                      <div>
                        <span className="text-slate-400 text-[0.65rem] font-bold uppercase block">
                          {prof.platform === 'github' ? 'Public Repos' : 'Solved'}
                        </span>
                        <span className="text-base font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5 block">
                          {prof.platform === 'github'
                            ? stats.publicRepos || stats.totalSolved || 0
                            : stats.totalSolved || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[0.65rem] font-bold uppercase block">
                          {prof.platform === 'github' ? 'Followers' : 'Rating / Rank'}
                        </span>
                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
                          {prof.platform === 'github'
                            ? stats.followers || 0
                            : stats.currentRating > 0 && stats.currentRating <= 4000
                            ? stats.currentRating
                            : stats.globalRank || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {hasDeepDive && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <span>Open {cfg.name} Intelligence</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      ) : (
        <EmptyState
          icon={Globe}
          title="No coding profiles connected yet"
          description="Connect your LeetCode, GitHub, or competitive handles to unlock aggregated analytics and recruiter benchmarks."
          actionText="Connect Your First Handle"
          onAction={() => handleOpenModal('leetcode')}
        />
      )}

      {/* 4. AI Recruiter Synthesis */}
      <section ref={analysisRef} className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[0.68rem] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              CROSS-PLATFORM SYNTHESIS
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Developer Profile Intelligence
            </h3>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            isLoading={recruiterAnalysisMutation.isPending}
            onClick={handleRunAnalysis}
          >
            {recruiterAnalysis ? 'Re-generate Analysis' : 'Run Profile Analysis'}
          </Button>
        </div>

        {recruiterAnalysis ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <Card className="p-4 space-y-1">
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 block">DSA Readiness</span>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {recruiterAnalysis.dsaReadiness ? `${recruiterAnalysis.dsaReadiness}/100` : 'Strong'}
                </p>
              </Card>

              <Card className="p-4 space-y-1">
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 block">Code Portfolio</span>
                <p className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono">
                  {recruiterAnalysis.githubPortfolioScore ? `${recruiterAnalysis.githubPortfolioScore}/100` : 'Active'}
                </p>
              </Card>

              <Card className="p-4 space-y-1">
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 block">Consistency</span>
                <p className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                  {recruiterAnalysis.contestPerformance ? `${recruiterAnalysis.contestPerformance}/100` : 'Steady'}
                </p>
              </Card>

              <Card className="p-4 space-y-1">
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 block">Open Source</span>
                <p className="text-xl font-black text-sky-600 dark:text-sky-400 font-mono">
                  {recruiterAnalysis.openSourceScore ? `${recruiterAnalysis.openSourceScore}/100` : 'Building'}
                </p>
              </Card>

              <Card className="p-4 space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 block">Recruiter Match</span>
                <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                  {recruiterAnalysis.placementReadiness ? `${recruiterAnalysis.placementReadiness}/100` : '8.2 / 10'}
                </p>
              </Card>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="space-y-3">
                <CardHeader
                  title="Profile Strengths"
                  action={<Badge variant="green">Verified</Badge>}
                />
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  {(recruiterAnalysis.topStrengths || [
                    'Multi-platform telemetry confirms active technical engagement.',
                    'Problem solving volume demonstrates foundational algorithmic readiness.'
                  ]).map((st, idx) => (
                    <li key={idx} className="flex items-start gap-2 p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40">
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                      <span>{st}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="space-y-3">
                <CardHeader
                  title="Key Action Items"
                  action={<Badge variant="orange">Attention</Badge>}
                />
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  {(recruiterAnalysis.topWeaknesses || [
                    'Connect both LeetCode and GitHub to unlock 360-degree recruiter analysis.',
                    'Expand advanced problem complexity and open source project contributions.'
                  ]).map((wk, idx) => (
                    <li key={idx} className="flex items-start gap-2 p-2 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/40">
                      <ChevronRight className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                      <span>{wk}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        ) : null}
      </section>

      {/* 5. Supported Platforms Grid */}
      <section className="space-y-4 pt-2">
        <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400 block">
            ECOSYSTEM INTEGRATIONS
          </span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Supported Coding Platforms
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORMS_CONFIG.map((platform) => {
            const isConnected = connectedPlatformIds.has(platform.id);
            const connectedProfile = profiles.find((p) => p.platform === platform.id);

            return (
              <Card
                key={platform.id}
                className="flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {platform.icon({ className: 'h-5 w-5' })}
                    </div>

                    <Badge variant={isConnected ? 'green' : 'neutral'}>
                      {isConnected ? 'Connected ✓' : 'Available'}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {platform.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {platform.tagline}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  {isConnected ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                        @{connectedProfile?.username}
                      </span>
                      {platform.detailRoute ? (
                        <Link
                          to={platform.detailRoute}
                          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          View Analytics →
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenModal(platform.id)}
                          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          Edit Handle
                        </button>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      icon={Plus}
                      onClick={() => handleOpenModal(platform.id)}
                    >
                      Connect {platform.name}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Connect Platform Modal */}
      <ConnectPlatformModal
        show={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        selectedPlatform={selectedPlatform}
        setSelectedPlatform={setSelectedPlatform}
        username={username}
        setUsername={setUsername}
        profileUrl={profileUrl}
        setProfileUrl={setProfileUrl}
        isSelfReported={isSelfReported}
        setIsSelfReported={setIsSelfReported}
        totalSolved={totalSolved}
        setTotalSolved={setTotalSolved}
        easySolved={easySolved}
        setEasySolved={setEasySolved}
        mediumSolved={mediumSolved}
        setMediumSolved={setMediumSolved}
        hardSolved={hardSolved}
        setHardSolved={setHardSolved}
        currentRating={currentRating}
        setCurrentRating={setCurrentRating}
        maxRating={maxRating}
        setMaxRating={setMaxRating}
        globalRank={globalRank}
        setGlobalRank={setGlobalRank}
        feedbackNotice={feedbackNotice}
        isPending={upsertMutation.isPending}
        onSubmit={handleSubmit}
      />
    </main>
  );
}
