import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Target,
  ArrowRight,
  AlertTriangle,
  Code2,
  FileText,
  Video,
  CheckCircle2,
  TrendingUp,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Clock,
  ShieldCheck,
  XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { api } from '../services/api';
import { Card, CardHeader } from '../components/ui/Card';
import { MetricCard } from '../components/ui/MetricCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

export function DashboardPage() {
  const user = useSelector((state) => state.auth.user);
  const queryClient = useQueryClient();

  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [targetCompany, setTargetCompany] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedGapTab, setSelectedGapTab] = useState('all');

  // 1. Fetch Unified Readiness Intelligence
  const { data: readinessData, isLoading } = useQuery({
    queryKey: ['job-readiness'],
    queryFn: async () => {
      const res = await api.get('/readiness');
      return res.data?.data;
    }
  });

  // 2. Update Target Role / Company Mutation
  const updateTargetMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/readiness/target', payload);
      return res.data?.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['job-readiness'], data);
      queryClient.invalidateQueries(['dashboard']);
      setIsTargetModalOpen(false);
    }
  });

  const target = readinessData?.target || {
    company: user?.targetCompany || 'General Tech',
    role: user?.targetRole || 'Software Development Engineer'
  };

  const jobMatch = readinessData?.jobMatch;
  const placementReadiness = readinessData?.placementReadiness;
  const breakdown = readinessData?.readinessBreakdown || {};
  const bottleneck = readinessData?.biggestBottleneck;
  const priorities = readinessData?.topPriorities || [];
  const closedLoop = readinessData?.closedLoopDelta;

  const handleSaveTarget = (e) => {
    e.preventDefault();
    updateTargetMutation.mutate({
      targetCompany: targetCompany.trim() || 'General Tech',
      targetRole: targetRole.trim() || 'Software Development Engineer',
      jobDescription: jobDescription.trim()
    });
  };

  const openTargetModal = () => {
    setTargetCompany(target.company || '');
    setTargetRole(target.role || '');
    setIsTargetModalOpen(true);
  };

  return (
    <main className="flex-1 p-6 lg:p-10 space-y-8 max-w-7xl mx-auto w-full animate-fadeIn">
      {/* 1. Target Job Header with Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[0.68rem] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              TARGET PLACEMENT GOAL
            </span>
            {target.hasCustomJobDescription && (
              <Badge variant="blue" size="sm">
                Custom JD Parsed
              </Badge>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>{target.company}</span>
            <span className="text-slate-300 dark:text-slate-700 font-light">•</span>
            <span className="text-slate-700 dark:text-slate-300 font-bold">{target.role}</span>
          </h1>
          <p className="text-xs text-slate-500">
            Readiness evaluated against your actual verified coding, resume, mock interview, and GitHub data.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={openTargetModal}>
            Change Target / Paste JD
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Placement Readiness"
          value={placementReadiness?.score !== null ? `${placementReadiness?.score}%` : 'Evaluating'}
          subtitle={placementReadiness?.level || 'Developing'}
          icon={Target}
          accent="green"
          trend="Real multi-source weighted readiness"
        />

        <MetricCard
          title="Job Match Score"
          value={jobMatch?.score !== null ? `${jobMatch?.score}%` : 'N/A'}
          subtitle={jobMatch?.details || 'Matching skills with JD'}
          icon={CheckCircle2}
          accent="blue"
          trend={`${jobMatch?.matchedSkills?.length || 0} required skills verified`}
        />

        <MetricCard
          title="DSA Solved Depth"
          value={`${readinessData?.activity?.dsaSolvedTotal || 0}`}
          subtitle="LeetCode & DSA Tracker"
          icon={Code2}
          accent="purple"
          trend={`${readinessData?.activity?.currentStreak || 0}-day active streak`}
        />

        <MetricCard
          title="Closed-Loop Progress"
          value={`${closedLoop?.eventsCount || 0} Events`}
          subtitle="Recent verified actions"
          icon={TrendingUp}
          accent="orange"
          trend={closedLoop?.summary || 'Complete actions to move score'}
        />
      </div>

      {/* 3. Primary Bottleneck Alert */}
      {bottleneck && (
        <Card className="border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900/50 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[0.68rem] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                    PRIMARY PREPARATION BOTTLENECK
                  </span>
                  <Badge variant="orange" size="sm">
                    {bottleneck.gapPoints} pt gap
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {bottleneck.title} ({bottleneck.currentScore !== null ? `${bottleneck.currentScore}%` : 'Unmeasured'} vs {bottleneck.targetScore}%)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                  {bottleneck.reason}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <Link to={bottleneck.actionRoute}>
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white border-none">
                  <span>{bottleneck.actionLabel}</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* 4. Top 3 Deterministic Priorities */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Top Ranked Actions for Today
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Deterministic ranking: Gap × Relevance × Impact
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {priorities.map((item) => (
            <Card
              key={item.rank}
              className="flex flex-col justify-between space-y-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                    PRIORITY #{item.rank}
                  </span>
                  <Badge variant={item.rank === 1 ? 'orange' : 'neutral'} size="sm">
                    {item.category}
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.whyReason}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[0.68rem] text-slate-400 font-medium">
                  Focus: {item.suggestedFocus || 'Core'}
                </span>
                <Link
                  to={item.actionRoute}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 transition"
                >
                  <span>{item.actionLabel}</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 5. Target Job vs Candidate Gap Engine Matrix */}
      <Card className="space-y-5 border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Target Job Skill Verification Matrix
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Requirements for <span className="font-semibold text-slate-700 dark:text-slate-300">{target.role}</span> cross-referenced with your Resume, GitHub, DSA & Mock Interview telemetry.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setSelectedGapTab('all')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                selectedGapTab === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              All ({(jobMatch?.verifiedSkills?.length || 0) + (jobMatch?.unverifiedSkills?.length || 0) + (jobMatch?.missingSkills?.length || 0)})
            </button>
            <button
              onClick={() => setSelectedGapTab('verified')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                selectedGapTab === 'verified'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>Verified ({jobMatch?.verifiedSkills?.length || 0})</span>
            </button>
            <button
              onClick={() => setSelectedGapTab('unverified')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                selectedGapTab === 'unverified'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              <AlertTriangle className="h-3 w-3" />
              <span>Unverified Claims ({jobMatch?.unverifiedSkills?.length || 0})</span>
            </button>
            <button
              onClick={() => setSelectedGapTab('missing')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                selectedGapTab === 'missing'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              <XCircle className="h-3 w-3" />
              <span>Missing ({jobMatch?.missingSkills?.length || 0})</span>
            </button>
          </div>
        </div>

        {/* Skill Matrix Grid */}
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {/* 1. Verified Skills */}
          {(selectedGapTab === 'all' || selectedGapTab === 'verified') &&
            jobMatch?.verifiedSkills?.map((skill, idx) => (
              <div
                key={`ver-${idx}`}
                className="p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900/50 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 capitalize flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      {skill.name}
                    </span>
                    <Badge variant="green" size="sm">Verified</Badge>
                  </div>
                  <ul className="space-y-1 text-[0.7rem] text-emerald-800 dark:text-emerald-300">
                    {skill.evidence?.map((ev, eIdx) => (
                      <li key={eIdx} className="flex items-start gap-1">
                        <span className="font-bold">•</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40 flex justify-end">
                  <Link
                    to={skill.actionRoute || '/coding-profiles'}
                    className="text-[0.7rem] font-bold text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-200 inline-flex items-center gap-1"
                  >
                    <span>{skill.actionLabel || 'View Proof'}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}

          {/* 2. Unverified Claims */}
          {(selectedGapTab === 'all' || selectedGapTab === 'unverified') &&
            jobMatch?.unverifiedSkills?.map((skill, idx) => (
              <div
                key={`unver-${idx}`}
                className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900/50 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950 dark:text-amber-200 capitalize flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      {skill.name}
                    </span>
                    <Badge variant="orange" size="sm">Unverified Claim</Badge>
                  </div>
                  <p className="text-[0.7rem] text-amber-900 dark:text-amber-300 leading-snug">
                    {skill.reason || 'Claimed on resume but no GitHub project, DSA problem, or interview verification found.'}
                  </p>
                  <ul className="space-y-1 text-[0.68rem] text-amber-800/80 dark:text-amber-400">
                    {skill.evidence?.map((ev, eIdx) => (
                      <li key={eIdx} className="flex items-start gap-1">
                        <span>•</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 flex justify-end">
                  <Link
                    to={skill.actionRoute || '/interview-prep'}
                    className="text-[0.7rem] font-bold text-amber-800 hover:text-amber-950 dark:text-amber-300 dark:hover:text-amber-100 inline-flex items-center gap-1"
                  >
                    <span>{skill.actionLabel || 'Verify in Mock Interview'}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}

          {/* 3. Missing Requirements */}
          {(selectedGapTab === 'all' || selectedGapTab === 'missing') &&
            jobMatch?.missingSkills?.map((skill, idx) => (
              <div
                key={`mis-${idx}`}
                className="p-3.5 rounded-xl border border-rose-200/80 bg-rose-50/40 dark:bg-rose-950/20 dark:border-rose-900/50 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-950 dark:text-rose-200 capitalize flex items-center gap-1.5">
                      <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      {skill.name}
                    </span>
                    <Badge variant="red" size="sm">Missing Skill</Badge>
                  </div>
                  <p className="text-[0.7rem] text-rose-900 dark:text-rose-300 leading-snug">
                    {skill.reason || 'Key job requirement not currently detected in resume or telemetry.'}
                  </p>
                  <ul className="space-y-1 text-[0.68rem] text-rose-800/80 dark:text-rose-400">
                    {skill.evidence?.map((ev, eIdx) => (
                      <li key={eIdx} className="flex items-start gap-1">
                        <span>•</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/40 flex justify-end">
                  <Link
                    to={skill.actionRoute || '/roadmap'}
                    className="text-[0.7rem] font-bold text-rose-800 hover:text-rose-950 dark:text-rose-300 dark:hover:text-rose-100 inline-flex items-center gap-1"
                  >
                    <span>{skill.actionLabel || 'Add to Roadmap'}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
        </div>

        {/* Empty state if all lists are empty */}
        {(!jobMatch?.verifiedSkills?.length && !jobMatch?.unverifiedSkills?.length && !jobMatch?.missingSkills?.length) && (
          <div className="py-8 text-center text-xs text-slate-500">
            Paste a custom Job Description in the Target Goal switcher above to generate a 3-way skill verification breakdown.
          </div>
        )}
      </Card>

      {/* 6. Evidence-First Readiness Breakdown */}
      <Card className="space-y-4">
        <CardHeader
          title="Evidence-First Readiness Breakdown"
          subtitle="Transparent breakdown of measured skills and verified platform data. No random numbers."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* DSA */}
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">DSA & Algorithms</span>
              {breakdown.dsaCompetency?.status === 'measured' ? (
                <Badge variant="green" size="sm">{breakdown.dsaCompetency.score}%</Badge>
              ) : (
                <Badge variant="neutral" size="sm">Not Enough Data</Badge>
              )}
            </div>
            <ul className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
              {breakdown.dsaCompetency?.evidence?.map((ev, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{ev}</span>
                </li>
              )) || <li>Log problems to establish measurement.</li>}
            </ul>
          </div>

          {/* Resume ATS */}
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Resume ATS Alignment</span>
              {breakdown.resumeAlignment?.status === 'measured' ? (
                <Badge variant="green" size="sm">{breakdown.resumeAlignment.score}/100</Badge>
              ) : (
                <Badge variant="neutral" size="sm">Not Enough Data</Badge>
              )}
            </div>
            <ul className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
              {breakdown.resumeAlignment?.evidence?.map((ev, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{ev}</span>
                </li>
              )) || <li>Upload resume PDF to measure ATS score.</li>}
            </ul>
          </div>

          {/* Interview */}
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Technical Mock Rating</span>
              {breakdown.interviewPerformance?.status === 'measured' ? (
                <Badge variant="green" size="sm">{breakdown.interviewPerformance.score}%</Badge>
              ) : (
                <Badge variant="neutral" size="sm">Not Enough Data</Badge>
              )}
            </div>
            <ul className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
              {breakdown.interviewPerformance?.evidence?.map((ev, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{ev}</span>
                </li>
              )) || <li>Take a mock interview to establish score.</li>}
            </ul>
          </div>

          {/* Communication */}
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Communication & STAR Delivery</span>
              {breakdown.communication?.status === 'measured' ? (
                <Badge variant="green" size="sm">{breakdown.communication.score}%</Badge>
              ) : (
                <Badge variant="neutral" size="sm">Not Enough Data</Badge>
              )}
            </div>
            <ul className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
              {breakdown.communication?.evidence?.map((ev, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{ev}</span>
                </li>
              )) || <li>Complete mock verbal answers to measure delivery.</li>}
            </ul>
          </div>

          {/* Projects & GitHub */}
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Engineering Proof & GitHub</span>
              {breakdown.engineeringProjects?.status === 'measured' ? (
                <Badge variant="green" size="sm">{breakdown.engineeringProjects.score}%</Badge>
              ) : (
                <Badge variant="neutral" size="sm">Connect GitHub</Badge>
              )}
            </div>
            <ul className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
              {breakdown.engineeringProjects?.evidence?.map((ev, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{ev}</span>
                </li>
              )) || <li>Connect GitHub profile in Coding Profiles.</li>}
            </ul>
          </div>
        </div>
      </Card>

      {/* Target Modal */}
      <Modal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        title="Set Target Company & Role"
        subtitle="Careerly will analyze your actual profile data against this target to compute match and readiness."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveTarget} className="space-y-4 text-xs">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Company
              </label>
              <input
                required
                placeholder="e.g. Amazon, Google, Stripe"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Role Title
              </label>
              <input
                required
                placeholder="e.g. SDE-1, Backend Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Job Description Requirements (Optional)
            </label>
            <textarea
              rows={4}
              placeholder="Paste the target job description here to extract exact required skills and benchmarks..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsTargetModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={updateTargetMutation.isPending}>
              Analyze Target
            </Button>
          </div>
        </form>
      </Modal>
    </main>
  );
}