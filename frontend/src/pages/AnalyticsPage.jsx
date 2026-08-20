import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Video,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { Card, CardHeader } from '../components/ui/Card';
import { MetricCard } from '../components/ui/MetricCard';
import { SectionHeader } from '../components/ui/SectionHeader';

export function AnalyticsPage() {
  const { data } = useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: async () => {
      const res = await api.get('/dashboard');
      return res.data?.data;
    }
  });

  const jobsQuery = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await api.get('/jobs');
      return res.data?.data || [];
    }
  });

  const jobs = jobsQuery.data || [];
  const total = jobs.length;

  const responses = jobs.filter((j) => !['saved', 'applied'].includes(j.status)).length;
  const interviews = jobs.filter((j) =>
    ['technical', 'technical_1', 'technical_2', 'system_design', 'interview', 'hr', 'final', 'manager'].includes(
      j.status
    )
  ).length;
  const offers = jobs.filter((j) => ['offer', 'accepted'].includes(j.status)).length;
  const rejections = jobs.filter((j) => j.status === 'rejected').length;

  const responseRate = total > 0 ? Math.round((responses / total) * 100) : 0;
  const interviewRate = total > 0 ? Math.round((interviews / total) * 100) : 0;
  const offerRate = total > 0 ? Math.round((offers / total) * 100) : 0;

  const chartData = [
    { label: 'Applied', count: total },
    { label: 'Responses', count: responses },
    { label: 'Interviews', count: interviews },
    { label: 'Offers', count: offers },
    { label: 'Archived', count: rejections }
  ];

  // Calculate real average response time
  let totalResponseTimeMs = 0;
  let responseCount = 0;
  jobs.forEach((job) => {
    if (Array.isArray(job.companyFeedback) && job.companyFeedback.length > 1) {
      const appliedTime = new Date(job.createdAt).getTime();
      const firstResponse = job.companyFeedback.find(
        (fb) => fb.statusStage && !['applied', 'saved', 'wishlist'].includes(fb.statusStage)
      );
      if (firstResponse && firstResponse.timestamp) {
        const responseTime = new Date(firstResponse.timestamp).getTime();
        if (responseTime > appliedTime) {
          totalResponseTimeMs += responseTime - appliedTime;
          responseCount++;
        }
      }
    }
  });

  const avgResponseTimeDays =
    responseCount > 0 ? (totalResponseTimeMs / (responseCount * 1000 * 60 * 60 * 24)).toFixed(1) : null;

  return (
    <main className="flex-1 p-6 lg:p-10 space-y-6 max-w-5xl mx-auto w-full animate-fadeIn bg-[#F8F6F0]">
      {/* 1. Header */}
      <SectionHeader
        eyebrow="CONVERSION & MOMENTUM ANALYTICS"
        title={
          <span className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#315B45] shrink-0" />
            <span>Placement Analytics</span>
          </span>
        }
        description="Track funnel conversion rates from submitted applications to interview invitations, turnaround time, and offers."
      />

      {/* 2. Key Metric Cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Response Rate"
          value={`${responseRate}%`}
          subtitle={`${responses} of ${total} responded`}
          icon={TrendingUp}
          accent="green"
        />

        <MetricCard
          title="Interview Conversion"
          value={`${interviewRate}%`}
          subtitle={`${interviews} interviews secured`}
          icon={Video}
          accent="blue"
        />

        <MetricCard
          title="Offer Rate"
          value={`${offerRate}%`}
          subtitle={`${offers} offers extended`}
          icon={CheckCircle2}
          accent="purple"
        />

        <MetricCard
          title="Avg Turnaround"
          value={avgResponseTimeDays ? `${avgResponseTimeDays} Days` : 'N/A'}
          subtitle="From apply to response"
          icon={Clock}
          accent="orange"
        />
      </div>

      {/* 3. Funnel Chart & Telemetry Summary */}
      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="space-y-3 p-4">
          <CardHeader
            title="Application Conversion Funnel"
            subtitle="Drop-off analysis across application lifecycle stages."
          />

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3DED3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#74766F' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#74766F' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFDF8',
                    borderColor: '#E3DED3',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                    color: '#20211E'
                  }}
                />
                <Bar dataKey="count" fill="#315B45" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Preparation Score Benchmarks */}
        <Card className="space-y-3 p-4">
          <CardHeader
            title="Readiness Breakdown"
            subtitle="Aggregated multi-dimensional index."
          />

          <div className="space-y-3 text-xs pt-1">
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-[#5F625C]">DSA Coverage</span>
                <span className="font-bold text-[#20211E]">{data?.totalDsaSolved ?? 0} Solved</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#F7F4ED] border border-[#E3DED3] overflow-hidden">
                <div className="h-full bg-[#315B45] rounded-full" style={{ width: `${Math.min(((data?.totalDsaSolved ?? 0) / 150) * 100, 100)}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-[#5F625C]">Resume ATS Alignment</span>
                <span className="font-bold text-[#20211E]">{data?.resumeScore || 70}/100</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#F7F4ED] border border-[#E3DED3] overflow-hidden">
                <div className="h-full bg-[#315B45] rounded-full" style={{ width: `${data?.resumeScore || 70}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-[#5F625C]">Readiness Tier</span>
                <span className="font-bold text-[#315B45]">{data?.readinessLevel || 'Developing'}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#F7F4ED] border border-[#E3DED3] overflow-hidden">
                <div className="h-full bg-[#315B45] rounded-full" style={{ width: `${data?.readinessScore || 73}%` }} />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}