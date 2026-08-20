import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Target,
  ArrowRight,
  AlertTriangle,
  Code2,
  CheckCircle2,
  TrendingUp,
  Sparkles,
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
  const { data: readinessData } = useQuery({
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
    <main className="flex-1 p-6 lg:p-10 space-y-6 max-w-5xl mx-auto w-full animate-fadeIn bg-[#F8F6F0]">
      {/* 1. Target Job Header with Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-[#FFFDF8] border border-[#E5E0D6] shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[#315B45]">
              Target Goal
            </span>
            {target.hasCustomJobDescription && (
              <Badge variant="blue" size="sm">
                Custom JD Parsed
              </Badge>
            )}
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-[#20211E] tracking-tight flex items-center gap-2">
            <span>{target.company}</span>
            <span className="text-[#92928A] font-light">•</span>
            <span className="text-[#315B45] font-bold">{target.role}</span>
          </h1>
          <p className="text-xs text-[#6F7068]">
            Readiness evaluated against verified problem solving, resume, mock interview, and project data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={openTargetModal}>
            Change Target / Paste JD
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Placement Readiness"
          value={placementReadiness?.score !== null ? `${placementReadiness?.score}%` : 'Evaluating'}
          subtitle={placementReadiness?.level || 'Developing'}
          icon={Target}
          accent="green"
        />

        <MetricCard
          title="Job Match Score"
          value={jobMatch?.score !== null ? `${jobMatch?.score}%` : 'N/A'}
          subtitle={jobMatch?.details || 'Matching skills with JD'}
          icon={CheckCircle2}
          accent="blue"
        />

        <MetricCard
          title="DSA Solved Depth"
          value={`${readinessData?.activity?.dsaSolvedTotal || 0}`}
          subtitle="LeetCode & DSA Tracker"
          icon={Code2}
          accent="purple"
        />

        <MetricCard
          title="Closed-Loop Progress"
          value={`${closedLoop?.eventsCount || 0} Events`}
          subtitle="Recent verified actions"
          icon={TrendingUp}
          accent="orange"
        />
      </div>

      {/* 3. Primary Bottleneck Alert */}
      {bottleneck && (
        <Card className="border-[#F0D0BF] bg-[#F7E7DD]/50 p-4 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F7E7DD] border border-[#F0D0BF] text-[#C9683A]">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[#C9683A]">
                    Primary Bottleneck
                  </span>
                  <Badge variant="orange" size="sm">
                    {bottleneck.gapPoints} pt gap
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-[#20211E]">
                  {bottleneck.title} ({bottleneck.currentScore !== null ? `${bottleneck.currentScore}%` : 'Unmeasured'} vs {bottleneck.targetScore}%)
                </h3>
                <p className="text-xs text-[#6F7068] leading-relaxed max-w-xl">
                  {bottleneck.reason}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <Link to={bottleneck.actionRoute}>
                <Button size="sm" variant="danger">
                  <span>{bottleneck.actionLabel}</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* 4. Top 3 Deterministic Priorities */}
      <section className="space-y-3">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#E5E0D6]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#315B45]" />
            <h2 className="text-sm font-bold text-[#20211E] tracking-tight">
              Top Ranked Actions for Today
            </h2>
          </div>
          <span className="text-[0.68rem] text-[#92928A]">
            Gap × Relevance × Impact
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {priorities.map((item) => (
            <Card
              key={item.rank}
              className="flex flex-col justify-between space-y-3 hover:border-[#315B45] transition p-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[0.68rem] font-mono font-bold text-[#315B45]">
                    0{item.rank}
                  </span>
                  <Badge variant={item.rank === 1 ? 'orange' : 'neutral'} size="sm">
                    {item.category}
                  </Badge>
                </div>
                <h3 className="text-xs font-bold text-[#20211E] leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-[#6F7068] leading-relaxed">
                  {item.whyReason}
                </p>
              </div>

              <div className="pt-2 border-t border-[#F0ECE4] flex items-center justify-between">
                <span className="text-[0.68rem] text-[#92928A] font-medium">
                  {item.suggestedFocus || 'Core Focus'}
                </span>
                <Link
                  to={item.actionRoute}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#315B45] hover:underline transition"
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
      <Card className="space-y-4 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#F0ECE4]">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#315B45]" />
              <h2 className="text-sm font-bold text-[#20211E] tracking-tight">
                Skill Verification Matrix
              </h2>
            </div>
            <p className="text-xs text-[#6F7068] mt-0.5">
              Requirements for <span className="font-semibold text-[#20211E]">{target.role}</span> cross-referenced with your data.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#F5F2EA] p-1 rounded-lg text-xs font-medium border border-[#E5E0D6]">
            <button
              onClick={() => setSelectedGapTab('all')}
              className={`px-2.5 py-0.5 rounded-md transition cursor-pointer ${selectedGapTab === 'all'
                ? 'bg-[#FFFDF8] text-[#20211E] font-bold shadow-2xs'
                : 'text-[#6F7068] hover:text-[#20211E]'
                }`}
            >
              All ({(jobMatch?.verifiedSkills?.length || 0) + (jobMatch?.unverifiedSkills?.length || 0) + (jobMatch?.missingSkills?.length || 0)})
            </button>
            <button
              onClick={() => setSelectedGapTab('verified')}
              className={`px-2.5 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 ${selectedGapTab === 'verified'
                ? 'bg-[#E8F0EA] text-[#315B45] font-bold'
                : 'text-[#315B45] hover:bg-[#E8F0EA]/60'
                }`}
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>Verified ({jobMatch?.verifiedSkills?.length || 0})</span>
            </button>
            <button
              onClick={() => setSelectedGapTab('unverified')}
              className={`px-2.5 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 ${selectedGapTab === 'unverified'
                ? 'bg-[#F7E7DD] text-[#C9683A] font-bold'
                : 'text-[#C9683A] hover:bg-[#F7E7DD]/60'
                }`}
            >
              <AlertTriangle className="h-3 w-3" />
              <span>Unverified ({jobMatch?.unverifiedSkills?.length || 0})</span>
            </button>
            <button
              onClick={() => setSelectedGapTab('missing')}
              className={`px-2.5 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 ${selectedGapTab === 'missing'
                ? 'bg-[#FDECEB] text-[#B83A35] font-bold'
                : 'text-[#B83A35] hover:bg-[#FDECEB]/60'
                }`}
            >
              <XCircle className="h-3 w-3" />
              <span>Missing ({jobMatch?.missingSkills?.length || 0})</span>
            </button>
          </div>
        </div>

        {/* Skill Matrix Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* 1. Verified Skills */}
          {(selectedGapTab === 'all' || selectedGapTab === 'verified') &&
            jobMatch?.verifiedSkills?.map((skill, idx) => (
              <div
                key={`ver-${idx}`}
                className="p-3 rounded-lg border border-[#D1E0D7] bg-[#E8F0EA]/40 flex flex-col justify-between space-y-2.5"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#315B45] capitalize flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      {skill.name}
                    </span>
                    <Badge variant="green" size="sm">Verified</Badge>
                  </div>
                  <ul className="space-y-0.5 text-[0.7rem] text-[#315B45]">
                    {skill.evidence?.map((ev, eIdx) => (
                      <li key={eIdx} className="flex items-start gap-1">
                        <span>•</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-2 border-t border-[#D1E0D7]/60 flex justify-end">
                  <Link
                    to={skill.actionRoute || '/coding-profiles'}
                    className="text-[0.68rem] font-bold text-[#315B45] hover:underline inline-flex items-center gap-1"
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
                className="p-3 rounded-lg border border-[#F0D0BF] bg-[#F7E7DD]/40 flex flex-col justify-between space-y-2.5"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#C9683A] capitalize flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      {skill.name}
                    </span>
                    <Badge variant="orange" size="sm">Unverified</Badge>
                  </div>
                  <p className="text-[0.7rem] text-[#6F7068] leading-snug">
                    {skill.reason || 'Claimed on resume but not yet verified in practice.'}
                  </p>
                </div>
                <div className="pt-2 border-t border-[#F0D0BF]/60 flex justify-end">
                  <Link
                    to={skill.actionRoute || '/interview-prep'}
                    className="text-[0.68rem] font-bold text-[#C9683A] hover:underline inline-flex items-center gap-1"
                  >
                    <span>{skill.actionLabel || 'Verify in Interview'}</span>
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
                className="p-3 rounded-lg border border-[#F7CBC9] bg-[#FDECEB]/40 flex flex-col justify-between space-y-2.5"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#B83A35] capitalize flex items-center gap-1.5">
                      <XCircle className="h-3.5 w-3.5 shrink-0" />
                      {skill.name}
                    </span>
                    <Badge variant="red" size="sm">Missing</Badge>
                  </div>
                  <p className="text-[0.7rem] text-[#6F7068] leading-snug">
                    {skill.reason || 'Requirement not detected in resume or profile.'}
                  </p>
                </div>
                <div className="pt-2 border-t border-[#F7CBC9]/60 flex justify-end">
                  <Link
                    to={skill.actionRoute || '/roadmap'}
                    className="text-[0.68rem] font-bold text-[#B83A35] hover:underline inline-flex items-center gap-1"
                  >
                    <span>{skill.actionLabel || 'Add to Roadmap'}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* 6. Evidence-First Readiness Breakdown */}
      <Card className="space-y-4 p-5">
        <CardHeader
          title="Evidence-First Readiness Breakdown"
          subtitle="Transparent breakdown of measured skills. 100% verified data."
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* DSA */}
          <div className="p-3.5 rounded-lg border border-[#E5E0D6] bg-[#F8F6F0] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#20211E]">DSA Depth</span>
              {breakdown.dsaCompetency?.status === 'measured' ? (
                <Badge variant="green" size="sm">{breakdown.dsaCompetency.score}%</Badge>
              ) : (
                <Badge variant="neutral" size="sm">Not Measured</Badge>
              )}
            </div>
            <ul className="space-y-0.5 text-xs text-[#6F7068]">
              {breakdown.dsaCompetency?.evidence?.map((ev, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-[#315B45]">•</span>
                  <span>{ev}</span>
                </li>
              )) || <li>Log problems to establish measurement.</li>}
            </ul>
          </div>

          {/* Resume ATS */}
          <div className="p-3.5 rounded-lg border border-[#E5E0D6] bg-[#F8F6F0] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#20211E]">Resume ATS</span>
              {breakdown.resumeAlignment?.status === 'measured' ? (
                <Badge variant="green" size="sm">{breakdown.resumeAlignment.score}/100</Badge>
              ) : (
                <Badge variant="neutral" size="sm">Not Measured</Badge>
              )}
            </div>
            <ul className="space-y-0.5 text-xs text-[#6F7068]">
              {breakdown.resumeAlignment?.evidence?.map((ev, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-[#315B45]">•</span>
                  <span>{ev}</span>
                </li>
              )) || <li>Upload resume PDF to measure ATS score.</li>}
            </ul>
          </div>

          {/* Interview */}
          <div className="p-3.5 rounded-lg border border-[#E5E0D6] bg-[#F8F6F0] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#20211E]">Mock Interview</span>
              {breakdown.interviewPerformance?.status === 'measured' ? (
                <Badge variant="green" size="sm">{breakdown.interviewPerformance.score}%</Badge>
              ) : (
                <Badge variant="neutral" size="sm">Not Measured</Badge>
              )}
            </div>
            <ul className="space-y-0.5 text-xs text-[#6F7068]">
              {breakdown.interviewPerformance?.evidence?.map((ev, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-[#315B45]">•</span>
                  <span>{ev}</span>
                </li>
              )) || <li>Take a mock interview to establish score.</li>}
            </ul>
          </div>

          {/* Communication */}
          <div className="p-3.5 rounded-lg border border-[#E5E0D6] bg-[#F8F6F0] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#20211E]">STAR Delivery</span>
              {breakdown.communication?.status === 'measured' ? (
                <Badge variant="green" size="sm">{breakdown.communication.score}%</Badge>
              ) : (
                <Badge variant="neutral" size="sm">Not Measured</Badge>
              )}
            </div>
            <ul className="space-y-0.5 text-xs text-[#6F7068]">
              {breakdown.communication?.evidence?.map((ev, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-[#315B45]">•</span>
                  <span>{ev}</span>
                </li>
              )) || <li>Complete mock verbal answers to measure delivery.</li>}
            </ul>
          </div>

          {/* Projects & GitHub */}
          <div className="p-3.5 rounded-lg border border-[#E5E0D6] bg-[#F8F6F0] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#20211E]">Engineering Proof</span>
              {breakdown.engineeringProjects?.status === 'measured' ? (
                <Badge variant="green" size="sm">{breakdown.engineeringProjects.score}%</Badge>
              ) : (
                <Badge variant="neutral" size="sm">Connect GitHub</Badge>
              )}
            </div>
            <ul className="space-y-0.5 text-xs text-[#6F7068]">
              {breakdown.engineeringProjects?.evidence?.map((ev, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-[#315B45]">•</span>
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
        subtitle="Careerly will analyze your profile data against this target."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveTarget} className="space-y-3.5 text-xs">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-bold text-[#20211E] mb-1">
                Target Company
              </label>
              <input
                required
                placeholder="e.g. Amazon, Google, Stripe"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                className="w-full rounded-lg border border-[#E5E0D6] bg-[#FFFDF8] px-3 py-2 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#20211E] mb-1">
                Target Role Title
              </label>
              <input
                required
                placeholder="e.g. SDE-1, Backend Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full rounded-lg border border-[#E5E0D6] bg-[#FFFDF8] px-3 py-2 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#20211E] mb-1">
              Job Description (Optional)
            </label>
            <textarea
              rows={4}
              placeholder="Paste the target job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full rounded-lg border border-[#E5E0D6] bg-[#FFFDF8] p-2.5 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
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