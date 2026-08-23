import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Target,
  ArrowRight,
  Code2,
  CheckCircle2,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { MetricCard } from '../components/ui/MetricCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { DashboardActivityPreview } from '../components/activity/DashboardActivityPreview';

function PriorityCard({ item }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className={`flex flex-col justify-between p-5 space-y-4 transition ${item.completed ? 'border-[#E8F0EA] bg-[#F5F2EA] opacity-60' : 'border-[#E5E0D6] bg-[#FFFDF8] hover:border-[#315B45]'}`}>
      <div 
        className="space-y-3 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#315B45] focus-visible:ring-offset-2 rounded-md" 
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        tabIndex={0}
        role="button"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center justify-between pointer-events-none">
          <span className="text-xl font-black text-[#E5E0D6]">0{item.rank}</span>
          <div className="flex items-center gap-2">
            <Badge variant="neutral" size="sm">{item.category}</Badge>
            <div className="text-[#92928A] flex items-center justify-center p-1 rounded-md hover:bg-[#F0ECE4] transition">
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
        </div>
        <div className="pointer-events-none">
          <h3 className="text-sm font-bold text-[#20211E]">{item.title}</h3>
          
          {!isExpanded && (
            <p className="text-xs text-[#6F7068] mt-1.5 leading-relaxed line-clamp-2">{item.whyReason}</p>
          )}

          {isExpanded && (
            <div className="mt-3 p-3 bg-[#F8F6F0] rounded-lg border border-[#E5E0D6] space-y-2">
              <div className="grid grid-cols-2 gap-2 text-[0.7rem]">
                {item.currentScore !== null && (
                  <div><span className="font-semibold text-[#6F7068]">Current:</span> <span className="text-[#20211E] font-bold">{item.currentScore}%</span></div>
                )}
                {item.targetScore !== null && (
                  <div><span className="font-semibold text-[#6F7068]">Target:</span> <span className="text-[#20211E] font-bold">{item.targetScore}%</span></div>
                )}
                {item.gapPoints != null && (
                  <div><span className="font-semibold text-[#6F7068]">Gap:</span> <span className="text-[#C9683A] font-bold">{item.gapPoints}</span></div>
                )}
                <div><span className="font-semibold text-[#6F7068]">Impact:</span> <span className="text-[#315B45] font-bold">{item.priorityScore > 80 ? 'High' : 'Medium'}</span></div>
              </div>
              
              <div className="pt-2 border-t border-[#E5E0D6]">
                <span className="block text-[0.65rem] font-bold uppercase tracking-wider text-[#92928A] mb-1">Why this is your priority</span>
                <p className="text-xs text-[#20211E] leading-relaxed">{item.whyReason}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="pt-4 border-t border-[#F0ECE4] flex items-center justify-between">
        <span className="text-xs font-semibold text-[#6F7068]">
          {item.estimatedDuration || '25 min'}
        </span>
        {item.completed ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#315B45]">
            <CheckCircle2 className="h-4 w-4" /> Completed
          </span>
        ) : (
          <Link
            to={item.actionRoute}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FFFDF8] bg-[#315B45] hover:bg-[#20211E] px-3 py-1.5 rounded-md transition shadow-2xs outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#20211E]"
          >
            <span>Start</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const user = useSelector((state) => state.auth.user);
  const queryClient = useQueryClient();

  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [targetCompany, setTargetCompany] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');

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
    <main className="flex-1 p-6 lg:p-10 space-y-10 max-w-5xl mx-auto w-full animate-fadeIn bg-[#F8F6F0]">
      {/* 1. Greeting & Target Role */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#20211E] tracking-tight">
            Good morning, {user?.name?.split(' ')[0] || 'Candidate'} 👋
          </h1>
          <p className="text-sm text-[#6F7068] mt-1">Let's make today count.</p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-1.5">
          <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[#92928A]">Target Role</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#20211E]">{target.role}</span>
            <span className="text-[#92928A] font-light">•</span>
            <span className="text-sm font-medium text-[#315B45]">{target.company}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={openTargetModal} className="mt-1 h-7 text-xs px-2.5">
            Change Target
          </Button>
        </div>
      </div>

      {/* 2. Today's Priorities */}
      <section className="space-y-4">
        <h2 className="text-[0.7rem] font-bold tracking-widest uppercase text-[#92928A]">Today's Priorities</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {priorities.map((item) => (
            <PriorityCard key={item.rank} item={item} />
          ))}
          {priorities.length === 0 && (
            <div className="col-span-3 p-6 text-center text-sm text-[#6F7068] border border-dashed border-[#E5E0D6] rounded-xl">
              You're all caught up! Take a break or explore the roadmap.
            </div>
          )}
        </div>
      </section>

      {/* 3. Biggest Gap */}
      {bottleneck && (
        <section className="space-y-4">
          <h2 className="text-[0.7rem] font-bold tracking-widest uppercase text-[#92928A]">Your Biggest Gap</h2>
          <Card className="p-6 border-[#E5E0D6] bg-[#FFFDF8]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#20211E]">{bottleneck.category}</h3>
                  <span className="text-sm font-semibold text-[#6F7068]">
                    {bottleneck.currentScore || 0}% current <span className="mx-2 text-[#E5E0D6]">|</span> {bottleneck.targetScore}% target
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="relative w-full h-2.5 bg-[#E8F0EA] rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-[#315B45] rounded-full"
                    style={{ width: `${Math.min(100, bottleneck.currentScore || 0)}%` }}
                  />
                  <div
                    className="absolute top-0 h-full bg-[#C9683A] opacity-80"
                    style={{
                      left: `${bottleneck.currentScore || 0}%`,
                      width: `${bottleneck.targetScore - (bottleneck.currentScore || 0)}%`
                    }}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div>
                    <div className="text-sm font-bold text-[#C9683A]">Gap: {bottleneck.gapPoints} points</div>
                    <p className="text-xs text-[#6F7068] mt-0.5">{bottleneck.reason}</p>
                  </div>
                  <Link to={bottleneck.actionRoute} className="shrink-0 text-xs font-bold text-[#315B45] hover:underline inline-flex items-center gap-1">
                    <span>Focus Area</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* 4. Preparation Summary */}
      <section className="space-y-4">
        <h2 className="text-[0.7rem] font-bold tracking-widest uppercase text-[#92928A]">Preparation Summary</h2>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
          <MetricCard
            title="DSA Progress"
            value={`${breakdown.dsaCompetency?.score || 0}%`}
            subtitle={`${readinessData?.activity?.dsaSolvedTotal || 0} Solved`}
            icon={Code2}
            accent="green"
            to="/dsa-tracker"
          />
          <MetricCard
            title="Interview Readiness"
            value={`${breakdown.interviewPerformance?.score || 0}%`}
            subtitle={`${breakdown.interviewPerformance?.completedCount || 0} Mocks done`}
            icon={Target}
            accent="blue"
            to="/interview-prep"
          />
          <MetricCard
            title="Resume Score"
            value={`${breakdown.resumeAlignment?.score || 0}/100`}
            subtitle="ATS parsed"
            icon={CheckCircle2}
            accent="orange"
            to="/resume"
          />
          <MetricCard
            title="GitHub Connected"
            value={breakdown.engineeringProjects?.score ? 'Yes' : 'No'}
            subtitle={breakdown.engineeringProjects?.score ? `${breakdown.engineeringProjects.score}% proof` : 'Connect now'}
            icon={Code2}
            accent="purple"
            to="/coding-profiles/github"
          />
          <MetricCard
            title="Applications Tracked"
            value={`${readinessData?.activity?.activeApplications || 0}`}
            subtitle={`${readinessData?.activity?.upcomingOAs || 0} upcoming OAs`}
            icon={TrendingUp}
            accent="green"
            to="/job-tracker"
          />
        </div>
      </section>

      {/* 5. Recent Progress */}
      {closedLoop && closedLoop.recentEvents?.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-[0.7rem] font-bold tracking-widest uppercase text-[#92928A]">Recent Progress</h2>
          <Card className="divide-y divide-[#F0ECE4] border-[#E5E0D6] bg-[#FFFDF8]">
            {closedLoop.recentEvents.slice(0, 3).map((evt, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#20211E]">{evt.description}</p>
                  <p className="text-xs text-[#6F7068] mt-0.5">{evt.timeLabel}</p>
                </div>
                <Badge variant="neutral" size="sm">+{evt.impactScore} pts</Badge>
              </div>
            ))}
            {closedLoop.recentEvents.length === 0 && (
              <div className="p-6 text-center text-sm text-[#6F7068]">
                Start a priority to see your progress here.
              </div>
            )}
          </Card>
        </div>
      )}

      <div className="space-y-4 lg:col-span-2">
        <DashboardActivityPreview />
      </div>

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