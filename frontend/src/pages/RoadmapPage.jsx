import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Compass,
  Sliders,
  Sparkles,
  Calendar,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { api } from '../services/api';
import { PlacementJourneyStages } from '../components/roadmap/PlacementJourneyStages';
import { RoadmapWeekAccordion } from '../components/roadmap/RoadmapWeekAccordion';
import { CustomizeRoadmapModal } from '../components/roadmap/CustomizeRoadmapModal';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';

export function RoadmapPage() {
  const queryClient = useQueryClient();
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState({ 1: true });
  const [selectedStageTab, setSelectedStageTab] = useState('foundation');
  const [customForm, setCustomForm] = useState({
    targetRole: 'Software Engineer',
    targetCompany: '',
    monthsRemaining: 3,
    hoursDaily: 4,
    currentSkills: '',
    weakTopics: '',
    strongTopics: '',
    projects: ''
  });

  // 1. Fetch user's profile context for auto-populating
  const { data: contextData } = useQuery({
    queryKey: ['roadmapContext'],
    queryFn: async () => {
      const response = await api.get('/ai/roadmap/context');
      return response?.data?.data || null;
    }
  });

  // 2. Fetch user's saved roadmap
  const {
    data: savedRoadmap
  } = useQuery({
    queryKey: ['savedRoadmap'],
    queryFn: async () => {
      const response = await api.get('/ai/roadmap');
      return response?.data?.data || null;
    }
  });

  // Pre-fill custom form when context arrives
  useEffect(() => {
    if (contextData) {
      setCustomForm((prev) => ({
        targetRole: savedRoadmap?.targetRole || contextData.targetRole || 'Software Engineer',
        targetCompany: savedRoadmap?.targetCompany || contextData.targetCompany || '',
        monthsRemaining: savedRoadmap?.monthsRemaining || 3,
        hoursDaily: savedRoadmap?.hoursDaily || 4,
        currentSkills: (contextData.currentSkills || []).join(', '),
        weakTopics: (contextData.dsaWeakTopics || []).join(', '),
        strongTopics: (contextData.dsaStrongTopics || []).join(', '),
        projects: (contextData.projects || []).join(', ')
      }));
    }
    if (savedRoadmap?.currentStage) {
      setSelectedStageTab(savedRoadmap.currentStage);
    }
  }, [contextData, savedRoadmap]);

  // 3. Roadmap Generation Mutation
  const roadmapMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/ai/roadmap', payload);
      if (!response?.data?.data || typeof response.data.data !== 'object') {
        throw new Error('Invalid roadmap response from the server');
      }
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['savedRoadmap'], data);
      setIsCustomizeOpen(false);
      setExpandedWeeks({ 1: true });
      if (data?.currentStage) setSelectedStageTab(data.currentStage);
    }
  });

  // 4. Task Toggle Mutation
  const toggleTaskMutation = useMutation({
    mutationFn: async (taskId) => {
      const response = await api.post('/ai/roadmap/toggle-task', { taskId });
      return response?.data?.data;
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['savedRoadmap'] });
      const previous = queryClient.getQueryData(['savedRoadmap']);

      if (previous && previous.weeks) {
        const updatedWeeks = previous.weeks.map((week) => ({
          ...week,
          tasks: (week.tasks || []).map((t) =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          )
        }));

        const isNowCompleted = !previous.completedTaskIds?.includes(taskId);
        const updatedCompletedIds = isNowCompleted
          ? [...(previous.completedTaskIds || []), taskId]
          : (previous.completedTaskIds || []).filter((id) => id !== taskId);

        queryClient.setQueryData(['savedRoadmap'], {
          ...previous,
          weeks: updatedWeeks,
          completedTaskIds: updatedCompletedIds
        });
      }

      return { previous };
    },
    onError: (err, taskId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['savedRoadmap'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['savedRoadmap'] });
    }
  });

  const activeRoadmap = savedRoadmap;

  const toggleWeekExpand = (weekNum) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [weekNum]: !prev[weekNum]
    }));
  };

  const handleGenerateSubmit = (e) => {
    e.preventDefault();
    const payload = {
      targetRole: customForm.targetRole,
      targetCompany: customForm.targetCompany,
      monthsRemaining: Number(customForm.monthsRemaining),
      hoursDaily: Number(customForm.hoursDaily),
      currentSkills: customForm.currentSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      weakTopics: customForm.weakTopics
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      strongTopics: customForm.strongTopics
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      projects: customForm.projects
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    };
    roadmapMutation.mutate(payload);
  };

  const stages = activeRoadmap?.stages || {
    foundation: {
      name: 'Foundation',
      tagline: 'Build missing fundamentals & baseline proof',
      goal: 'Eliminate core DSA gaps, polish resume ATS score, and deploy an interview-ready project.',
      progress: 72,
      status: 'in_progress',
      exitCriteria: [
        { name: 'Core DSA Problems Solved', target: '50 problems', current: '35 solved', met: false },
        { name: 'Resume ATS Quality Baseline', target: '75 / 100', current: '78 / 100', met: true },
        { name: 'Portfolio Project Interview-Ready', target: '1 live project', current: '1 live', met: true },
        { name: 'Introductory Communication & STAR', target: '1 practice mock', current: '1 recorded', met: true }
      ]
    },
    interview_prep: {
      name: 'Interview Preparation',
      tagline: 'Convert fundamentals into live interview performance',
      goal: 'Master medium-difficulty patterns under timed conditions, deep-dive into CS fundamentals, and practice STAR mocks.',
      progress: 28,
      status: 'locked',
      exitCriteria: [
        { name: 'Medium DSA Timed Mastery', target: '120 problems', current: '35 solved', met: false },
        { name: 'CS Fundamentals & System Design', target: 'Core concepts reviewed', current: 'In progress', met: false },
        { name: 'Mock Technical & Behavioral Interviews', target: '5 completed mocks', current: '1 completed', met: false },
        { name: 'Deep Project Architecture Explanation', target: 'End-to-end verified', current: 'Verified', met: false }
      ]
    },
    placement_execution: {
      name: 'Placement Execution',
      tagline: 'Apply → Interview → Analyze Failures → Adapt',
      goal: 'Ramp application pipeline (5/week), analyze technical screening drop-offs, and target high-conviction referral opportunities.',
      progress: 0,
      status: 'locked',
      exitCriteria: [
        { name: 'Targeted Applications Submitted', target: '40 applications', current: '8 submitted', met: false },
        { name: 'Interview Failure Analysis & Loop Drills', target: 'Continuous adaptation', current: 'Active pipeline', met: false },
        { name: 'Referrals & Off-Campus Conversion', target: '2+ referral calls', current: '0 calls', met: false },
        { name: 'Offer Negotiation & Decision', target: '1+ offer received', current: 'Pending offers', met: false }
      ]
    }
  };

  const gapsBenchmark = activeRoadmap?.gapsBenchmark || [
    { metric: 'DSA Problems', current: 75, target: 150, gap: 75, label: 'Problem Solving Depth', unit: 'problems' },
    { metric: 'Resume ATS Score', current: 68, target: 85, gap: 17, label: 'Recruiter Screening Match', unit: 'pts' },
    { metric: 'Mock Interviews', current: 1, target: 8, gap: 7, label: 'Communication & Delivery', unit: 'sessions' },
    { metric: 'Applications Submitted', current: 8, target: 40, gap: 32, label: 'Hiring Funnel Volume', unit: 'apps' }
  ];

  const currentStageKey = activeRoadmap?.currentStage || 'foundation';

  return (
    <main className="flex-1 p-6 lg:p-10 space-y-6 max-w-5xl mx-auto w-full animate-fadeIn bg-[#F8F6F0]">
      {/* 1. Header with Actions */}
      <SectionHeader
        eyebrow="LONG-TERM PREPARATION STRATEGY"
        title={
          <span className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-[#315B45] shrink-0" />
            <span>Placement Roadmap</span>
          </span>
        }
        description="Structured milestone roadmap calibrated against your current telemetry. Focuses on systematic progression from core foundations to live interview execution."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={Sliders}
              onClick={() => setIsCustomizeOpen(true)}
            >
              Customize
            </Button>

            <Button
              size="sm"
              icon={Sparkles}
              isLoading={roadmapMutation.isPending}
              onClick={handleGenerateSubmit}
            >
              {activeRoadmap ? 'Update Roadmap' : 'Generate Roadmap'}
            </Button>
          </div>
        }
      />

      {/* 2. Placement Milestones (V1, V2, V3) */}
      <PlacementJourneyStages
        stages={stages}
        currentStageKey={currentStageKey}
        selectedStageTab={selectedStageTab}
        setSelectedStageTab={setSelectedStageTab}
      />

      {/* 3. Gap Analysis Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-[#E3DED3]">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#20211E]">
              Current Telemetry vs. Placement Benchmarks
            </h2>
          </div>
          <span className="text-xs text-[#74766F] hidden sm:inline-block">
            Roadmap re-prioritizes around your largest telemetry gaps.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {gapsBenchmark.map((gap, gIdx) => (
            <Card key={gIdx} className="space-y-2 p-3.5">
              <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[#74766F] block">
                {gap.label}
              </span>
              <div>
                <p className="text-xs font-semibold text-[#5F625C]">{gap.metric}</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl font-bold text-[#20211E] font-mono">{gap.current}</span>
                  <span className="text-xs text-[#74766F] font-medium">/ {gap.target} {gap.unit}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-[#E3DED3] flex items-center justify-between text-xs">
                <span className="text-[#74766F]">Remaining Gap:</span>
                <span className={gap.gap === 0 ? 'text-[#315B45] font-bold' : 'text-[#C9683A] font-bold font-mono'}>
                  {gap.gap === 0 ? 'Goal Met ✓' : `${gap.gap} ${gap.unit}`}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. Readiness Breakdown & Weekly Plan */}
      {activeRoadmap && (
        <section className="space-y-5">
          {/* Active Stage Exit Criteria */}
          {stages[selectedStageTab] && (
            <Card className="space-y-3.5 p-4">
              <CardHeader
                title={`Stage Exit Criteria: ${stages[selectedStageTab].name}`}
                subtitle={stages[selectedStageTab].goal}
                action={
                  <Badge variant={stages[selectedStageTab].status === 'completed' ? 'green' : 'orange'}>
                    {stages[selectedStageTab].status === 'completed' ? 'Completed' : 'In Progress'}
                  </Badge>
                }
              />

              <div className="grid gap-2.5 sm:grid-cols-2">
                {(stages[selectedStageTab].exitCriteria || []).map((crit, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border flex items-start gap-2.5 ${crit.met
                      ? 'border-[#D1E0D7] bg-[#E8F0EA]/40 text-[#20211E]'
                      : 'border-[#E3DED3] bg-[#FFFDF8]'
                      }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {crit.met ? (
                        <CheckCircle2 className="h-4 w-4 text-[#315B45]" />
                      ) : (
                        <Circle className="h-4 w-4 text-[#74766F]" />
                      )}
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#20211E]">
                        {crit.name}
                      </p>
                      <div className="flex items-center justify-between text-[0.7rem] text-[#74766F]">
                        <span>Current: <strong className="text-[#20211E]">{crit.current}</strong></span>
                        <span>Target: <strong className="text-[#20211E]">{crit.target}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Weekly Task Plan */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#E3DED3]">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#315B45]" />
                <h3 className="text-sm font-bold text-[#20211E]">
                  Weekly Execution Curriculum
                </h3>
              </div>
              <span className="text-xs text-[#74766F] font-medium">
                {activeRoadmap.weeks?.length || 0} Total Weeks Planned
              </span>
            </div>

            <div className="space-y-2.5">
              {(activeRoadmap.weeks || []).map((week) => (
                <RoadmapWeekAccordion
                  key={week.weekNumber}
                  week={week}
                  isExpanded={Boolean(expandedWeeks[week.weekNumber])}
                  onToggleExpand={() => toggleWeekExpand(week.weekNumber)}
                  activeRoadmap={activeRoadmap}
                  onToggleTask={(taskId) => toggleTaskMutation.mutate(taskId)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Customize Modal */}
      <CustomizeRoadmapModal
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        customForm={customForm}
        setCustomForm={setCustomForm}
        onSubmit={handleGenerateSubmit}
        isPending={roadmapMutation.isPending}
      />
    </main>
  );
}