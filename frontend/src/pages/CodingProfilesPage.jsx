import React, { useMemo, useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  Globe,
  Plus,
  ExternalLink,
  Trash2,
  BrainCircuit,
  RefreshCw,
  ArrowRight,
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
    let highestRating = 0;

    profiles.forEach((p) => {
      const s = p.stats || {};
      if (p.platform !== 'github') {
        problemSolvedCount += Number(s.totalSolved || 0);
      } else {
        githubReposCount += Number(s.publicRepos || s.totalSolved || 0);
        githubFollowersCount += Number(s.followers || 0);
      }

      const r = Number(s.currentRating || 0);
      const mr = Number(s.maxRating || 0);
      if (r > highestRating && r <= 4000) highestRating = r;
      if (mr > highestRating && mr <= 4000) highestRating = mr;
    });

    return {
      problemSolvedCount,
      githubReposCount,
      githubFollowersCount,
      highestRating
    };
  }, [profiles]);

  const connectedPlatformIds = useMemo(() => {
    return new Set(profiles.map((p) => p.platform));
  }, [profiles]);

  const hasConnectedProfiles = profiles.length > 0;

  return (
    <main className="flex-1 p-6 lg:p-10 space-y-6 max-w-5xl mx-auto w-full animate-fadeIn bg-[#F8F6F0]">
      {/* Central Sub-Navigation Tabs */}
      <CodingProfilesNav profiles={profiles} />

      {/* 1. Header with Actions */}
      <SectionHeader
        eyebrow="CENTRAL DEVELOPER HUB"
        title={
          <span className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-[#315B45] shrink-0" />
            <span>Coding Profiles</span>
          </span>
        }
        description="Connect your LeetCode, GitHub, and competitive coding profiles to unify your telemetry."
        action={
          <div className="flex items-center gap-2">
            {hasConnectedProfiles && (
              <Button
                variant="secondary"
                size="sm"
                icon={RefreshCw}
                isLoading={syncAllMutation.isPending}
                onClick={() => syncAllMutation.mutate()}
              >
                {syncAllMutation.isPending ? 'Syncing...' : 'Sync All'}
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
      <Card className="p-4 bg-[#E8F0EA]/30 border-[#D1E0D7]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D1E0D7]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center bg-[#E8F0EA] text-[#315B45] font-bold">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold text-[#20211E]">
                  DSA Practice Tracker
                </h3>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[0.65rem] font-semibold bg-[#E8F0EA] text-[#315B45]">
                  Personal Log
                </span>
              </div>
              <p className="text-[0.68rem] text-[#6F7068]">
                Manual problem notes, pattern tags, and daily consistency.
              </p>
            </div>
          </div>

          <Link
            to="/dsa-tracker"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#315B45] hover:underline transition shrink-0"
          >
            <span>View Full Tracker</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-3">
          <div>
            <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[#92928A]">
              Problems Logged
            </span>
            <p className="text-lg font-bold font-mono text-[#20211E] mt-0.5">
              {dsaStats?.total ?? 0}
            </p>
            <p className="text-[0.68rem] text-[#6F7068]">
              {dsaStats?.solved ?? 0} marked solved
            </p>
          </div>

          <div>
            <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[#92928A]">
              Topics Covered
            </span>
            <p className="text-lg font-bold font-mono text-[#20211E] mt-0.5">
              {dsaTopicsCoveredCount}
            </p>
            <p className="text-[0.68rem] text-[#6F7068]">
              across data structures
            </p>
          </div>

          <div>
            <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[#92928A]">
              Active Streak
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <Flame className="w-3.5 h-3.5 text-[#C9683A]" />
              <span className="text-lg font-bold font-mono text-[#20211E]">
                {dsaStreak} <span className="text-xs font-medium text-[#6F7068]">{dsaStreak === 1 ? 'day' : 'days'}</span>
              </span>
            </div>
            <p className="text-[0.68rem] text-[#6F7068]">
              continuous practice
            </p>
          </div>
        </div>
      </Card>

      {/* 3. Overview Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

      {/* 4. Connected Profiles Cards */}
      {hasConnectedProfiles ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#E5E0D6]">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#315B45]" />
              <h3 className="text-sm font-bold text-[#20211E]">
                Connected Platforms ({profiles.length})
              </h3>
            </div>
            <span className="text-xs text-[#92928A]">
              Click LeetCode or GitHub to inspect deep telemetry
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                  className={`flex flex-col justify-between space-y-3 p-4 transition ${
                    hasDeepDive
                      ? 'cursor-pointer hover:border-[#315B45]'
                      : ''
                  }`}
                >
                  <div className="space-y-2.5">
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
                          className="p-1 rounded-md text-[#92928A] hover:text-[#315B45] hover:bg-[#E8F0EA] transition cursor-pointer"
                          title="Sync Now"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${syncSingleMutation.isPending && syncSingleMutation.variables === prof._id ? 'animate-spin text-[#315B45]' : ''}`} />
                        </button>
                        {prof.profileUrl && (
                          <a
                            href={prof.profileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded-md text-[#92928A] hover:text-[#315B45] transition"
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
                          className="p-1 rounded-md text-[#92928A] hover:text-[#B83A35] hover:bg-[#FDECEB] transition cursor-pointer"
                          title="Disconnect"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-bold text-[#20211E]">
                        @{prof.username}
                      </p>
                      <p className="text-[0.68rem] text-[#92928A]">
                        Last synced: {formatSyncTime(prof.lastSyncedAt)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t border-[#F0ECE4] pt-2.5 text-xs">
                      <div>
                        <span className="text-[#92928A] text-[0.65rem] font-bold uppercase block">
                          {prof.platform === 'github' ? 'Public Repos' : 'Solved'}
                        </span>
                        <span className="text-sm font-bold text-[#20211E] font-mono mt-0.5 block">
                          {prof.platform === 'github'
                            ? stats.publicRepos || stats.totalSolved || 0
                            : stats.totalSolved || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#92928A] text-[0.65rem] font-bold uppercase block">
                          {prof.platform === 'github' ? 'Followers' : 'Rating / Rank'}
                        </span>
                        <span className="text-sm font-bold text-[#315B45] font-mono mt-0.5 block">
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
                    <div className="pt-2 border-t border-[#F0ECE4] flex items-center justify-between text-xs font-bold text-[#315B45]">
                      <span>Open {cfg.name} Intelligence</span>
                      <ArrowRight className="h-3 w-3" />
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
          description="Connect your LeetCode, GitHub, or competitive handles to unlock aggregated analytics."
          actionText="Connect Handle"
          onAction={() => handleOpenModal('leetcode')}
        />
      )}

      {/* 5. AI Recruiter Synthesis */}
      <section ref={analysisRef} className="space-y-3">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#E5E0D6]">
          <h3 className="text-sm font-bold text-[#20211E]">
            Developer Profile Intelligence
          </h3>

          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            isLoading={recruiterAnalysisMutation.isPending}
            onClick={handleRunAnalysis}
          >
            {recruiterAnalysis ? 'Re-run Analysis' : 'Run Profile Analysis'}
          </Button>
        </div>

        {recruiterAnalysis ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              <Card className="p-3 space-y-0.5">
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[#92928A] block">DSA Readiness</span>
                <p className="text-lg font-bold text-[#315B45] font-mono">
                  {recruiterAnalysis.dsaReadiness ? `${recruiterAnalysis.dsaReadiness}/100` : 'Strong'}
                </p>
              </Card>

              <Card className="p-3 space-y-0.5">
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[#92928A] block">Code Portfolio</span>
                <p className="text-lg font-bold text-[#5E3F8A] font-mono">
                  {recruiterAnalysis.githubPortfolioScore ? `${recruiterAnalysis.githubPortfolioScore}/100` : 'Active'}
                </p>
              </Card>

              <Card className="p-3 space-y-0.5">
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[#92928A] block">Consistency</span>
                <p className="text-lg font-bold text-[#C9683A] font-mono">
                  {recruiterAnalysis.contestPerformance ? `${recruiterAnalysis.contestPerformance}/100` : 'Steady'}
                </p>
              </Card>

              <Card className="p-3 space-y-0.5">
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[#92928A] block">Open Source</span>
                <p className="text-lg font-bold text-[#2C5E8A] font-mono">
                  {recruiterAnalysis.openSourceScore ? `${recruiterAnalysis.openSourceScore}/100` : 'Building'}
                </p>
              </Card>

              <Card className="p-3 space-y-0.5 col-span-2 sm:col-span-1">
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[#92928A] block">Recruiter Match</span>
                <p className="text-lg font-bold text-[#315B45] font-mono">
                  {recruiterAnalysis.placementReadiness ? `${recruiterAnalysis.placementReadiness}/100` : '8.2 / 10'}
                </p>
              </Card>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="space-y-2.5 p-4">
                <CardHeader
                  title="Profile Strengths"
                  action={<Badge variant="green">Verified</Badge>}
                />
                <ul className="space-y-1 text-xs text-[#6F7068]">
                  {(recruiterAnalysis.topStrengths || [
                    'Multi-platform telemetry confirms active technical engagement.',
                    'Problem solving volume demonstrates foundational algorithmic readiness.'
                  ]).map((st, idx) => (
                    <li key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-[#E8F0EA]/40 border border-[#D1E0D7]">
                      <Check className="h-3.5 w-3.5 text-[#315B45] mt-0.5 shrink-0" />
                      <span>{st}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="space-y-2.5 p-4">
                <CardHeader
                  title="Key Action Items"
                  action={<Badge variant="orange">Attention</Badge>}
                />
                <ul className="space-y-1 text-xs text-[#6F7068]">
                  {(recruiterAnalysis.topWeaknesses || [
                    'Connect both LeetCode and GitHub to unlock 360-degree recruiter analysis.',
                    'Expand advanced problem complexity and open source project contributions.'
                  ]).map((wk, idx) => (
                    <li key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-[#F7E7DD]/40 border border-[#F0D0BF]">
                      <ChevronRight className="h-3.5 w-3.5 text-[#C9683A] mt-0.5 shrink-0" />
                      <span>{wk}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        ) : null}
      </section>

      {/* 6. Supported Platforms Grid */}
      <section className="space-y-3 pt-1">
        <div className="pb-1.5 border-b border-[#E5E0D6]">
          <h3 className="text-sm font-bold text-[#20211E]">
            Supported Platforms
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PLATFORMS_CONFIG.map((platform) => {
            const isConnected = connectedPlatformIds.has(platform.id);
            const connectedProfile = profiles.find((p) => p.platform === platform.id);

            return (
              <Card
                key={platform.id}
                className="flex flex-col justify-between space-y-3 p-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-1.5 rounded-lg bg-[#F5F2EA] text-[#20211E] border border-[#E5E0D6]">
                      {platform.icon({ className: 'h-4 w-4' })}
                    </div>

                    <Badge variant={isConnected ? 'green' : 'neutral'}>
                      {isConnected ? 'Connected ✓' : 'Available'}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-[#20211E]">
                      {platform.name}
                    </h4>
                    <p className="text-[0.68rem] text-[#6F7068] mt-0.5 leading-relaxed">
                      {platform.tagline}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#F0ECE4] flex items-center justify-between">
                  {isConnected ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-semibold text-[#20211E] truncate max-w-[130px]">
                        @{connectedProfile?.username}
                      </span>
                      {platform.detailRoute ? (
                        <Link
                          to={platform.detailRoute}
                          className="text-xs font-bold text-[#315B45] hover:underline"
                        >
                          Analytics →
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenModal(platform.id)}
                          className="text-xs font-bold text-[#315B45] hover:underline cursor-pointer"
                        >
                          Edit
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
