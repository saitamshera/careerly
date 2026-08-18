import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Briefcase,
  MapPin,
  DollarSign,
  Plus,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  ExternalLink,
  Columns,
  List,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { Card, CardHeader } from '../components/ui/Card';
import { MetricCard } from '../components/ui/MetricCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { SectionHeader } from '../components/ui/SectionHeader';
import { EmptyState } from '../components/ui/EmptyState';

const STAGES = [
  { id: 'wishlist', label: 'Wishlist', variant: 'neutral' },
  { id: 'applied', label: 'Applied', variant: 'blue' },
  { id: 'oa', label: 'Online Assessment', variant: 'orange' },
  { id: 'interview', label: 'Interview', variant: 'purple' },
  { id: 'hr', label: 'HR Round', variant: 'blue' },
  { id: 'offer', label: 'Offer', variant: 'green' },
  { id: 'rejected', label: 'Archived', variant: 'red' }
];

const initialForm = {
  company: '',
  role: '',
  location: '',
  salary: '',
  status: 'applied',
  skills: '',
  oaDate: '',
  oaPlatform: '',
  jobLink: '',
  referral: '',
  notes: '',
  interviewDate: ''
};

export function JobTrackerPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState('kanban');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => (await api.get('/jobs')).data?.data || []
  });
  const { data: oas = [] } = useQuery({
    queryKey: ['upcoming-oas'],
    queryFn: async () => (await api.get('/jobs/upcoming-oas')).data?.data || []
  });
  const { data: matchedSkills = [] } = useQuery({
    queryKey: ['match-skills'],
    queryFn: async () => (await api.get('/jobs/match-skills')).data?.data || []
  });

  const saveJob = useMutation({
    mutationFn: async (payload) =>
      editingId ? api.put(`/jobs/${editingId}`, payload) : api.post('/jobs', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-oas'] });
      queryClient.invalidateQueries({ queryKey: ['match-skills'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      closeModal();
    }
  });

  const deleteJob = useMutation({
    mutationFn: async (id) => api.delete(`/jobs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-oas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });

  const openModal = (job = null) => {
    if (job) {
      setEditingId(job._id);
      setFormState({
        ...job,
        skills: Array.isArray(job.skills) ? job.skills.join(', ') : job.skills || '',
        oaDate: job.oaDate ? new Date(job.oaDate).toISOString().slice(0, 16) : '',
        interviewDate: job.interviewDate ? new Date(job.interviewDate).toISOString().slice(0, 16) : ''
      });
    } else {
      setEditingId(null);
      setFormState(initialForm);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormState(initialForm);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formState,
      skills: formState.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    };
    saveJob.mutate(payload);
  };

  const appliedCount = jobs.filter((j) => j.status === 'applied').length;
  const oaCount = jobs.filter((j) => j.status === 'oa').length;
  const interviewCount = jobs.filter((j) => j.status === 'interview' || j.status === 'hr').length;
  const offerCount = jobs.filter((j) => j.status === 'offer').length;

  return (
    <main className="flex-1 p-6 lg:p-10 space-y-8 max-w-7xl mx-auto w-full animate-fadeIn">
      {/* 1. Header with Controls */}
      <SectionHeader
        eyebrow="HIRING FUNNEL & APPLICATIONS"
        title={
          <span className="flex items-center gap-2.5">
            <Briefcase className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Job Application Tracker</span>
          </span>
        }
        description="Monitor company applications, upcoming online assessments, technical interviews, and offer deadlines."
        action={
          <div className="flex items-center gap-3">
            <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-white dark:bg-slate-900 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'kanban'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
                title="Kanban Board"
              >
                <Columns className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <Button size="sm" icon={Plus} onClick={() => openModal()}>
              Add Application
            </Button>
          </div>
        }
      />

      {/* 2. Funnel KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Applied"
          value={`${jobs.length}`}
          subtitle={`${appliedCount} waiting for screening`}
          icon={Briefcase}
          accent="blue"
        />

        <MetricCard
          title="Upcoming OAs"
          value={`${oaCount}`}
          subtitle="Online assessments active"
          icon={Clock}
          accent="orange"
        />

        <MetricCard
          title="Active Interviews"
          value={`${interviewCount}`}
          subtitle="Technical & HR rounds"
          icon={CheckCircle2}
          accent="purple"
        />

        <MetricCard
          title="Offers Received"
          value={`${offerCount}`}
          subtitle="Conversion goal"
          icon={DollarSign}
          accent="green"
        />
      </div>

      {/* 3. Upcoming OA Alert / Banner */}
      {oas.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
              <Clock className="h-4 w-4 text-amber-600" />
              <span>Upcoming Online Assessments ({oas.length})</span>
            </div>
            <span className="text-xs text-amber-700 dark:text-amber-400">
              Scheduled tests within 7 days
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 mt-3">
            {oas.map((oa) => (
              <div
                key={oa._id}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/60 text-xs flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{oa.company}</p>
                  <p className="text-[0.68rem] text-slate-500">
                    {oa.oaDate ? new Date(oa.oaDate).toLocaleDateString() : 'Scheduled'}
                  </p>
                </div>
                <Badge variant="orange" size="sm">
                  {oa.oaPlatform || 'OA'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 4. Applications Workspace (Kanban or List) */}
      {jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No job applications tracked yet"
          description="Keep all your job applications, referral contacts, and interview stages organized in one central pipeline."
          actionText="Add First Application"
          onAction={() => openModal()}
        />
      ) : viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {STAGES.slice(1, 6).map((stage) => {
            const stageJobs = jobs.filter((j) => j.status === stage.id);
            return (
              <div key={stage.id} className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {stage.label}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {stageJobs.length}
                  </span>
                </div>

                <div className="space-y-2.5 min-h-[120px]">
                  {stageJobs.map((job) => (
                    <Card
                      key={job._id}
                      padding="sm"
                      hover
                      onClick={() => openModal(job)}
                      className="space-y-2 cursor-pointer transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {job.company}
                          </h4>
                          <p className="text-[0.7rem] text-slate-500 font-medium line-clamp-1">
                            {job.role}
                          </p>
                        </div>
                        <Badge variant={stage.variant} size="sm">
                          {stage.id}
                        </Badge>
                      </div>

                      {job.location && (
                        <p className="text-[0.68rem] text-slate-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{job.location}</span>
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-bold uppercase text-[0.65rem]">
                <tr>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Timeline</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {jobs.map((job) => (
                  <tr key={job._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {job.company}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{job.role}</td>
                    <td className="py-3 px-4">
                      <Badge variant={job.status === 'offer' ? 'green' : job.status === 'oa' ? 'orange' : 'neutral'} size="sm">
                        {job.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{job.location || '-'}</td>
                    <td className="py-3 px-4 text-slate-500 text-[0.68rem]">
                      {job.updatedAt ? new Date(job.updatedAt).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openModal(job)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Delete application entry?')) {
                              deleteJob.mutate(job._id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 5. Add / Edit Application Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Application Details' : 'Add New Application'}
        subtitle="Track company name, role, salary, and current interview status."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Company Name
              </label>
              <input
                required
                placeholder="e.g. Stripe, Amazon"
                value={formState.company}
                onChange={(e) => setFormState({ ...formState, company: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Role Title
              </label>
              <input
                required
                placeholder="e.g. SDE-1, Full Stack"
                value={formState.role}
                onChange={(e) => setFormState({ ...formState, role: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pipeline Stage
              </label>
              <select
                value={formState.status}
                onChange={(e) => setFormState({ ...formState, status: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 cursor-pointer"
              >
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Location
              </label>
              <input
                placeholder="e.g. Remote / Seattle"
                value={formState.location}
                onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Compensation (CTC)
              </label>
              <input
                placeholder="e.g. $140k / 22 LPA"
                value={formState.salary}
                onChange={(e) => setFormState({ ...formState, salary: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                OA Scheduled Date
              </label>
              <input
                type="datetime-local"
                value={formState.oaDate}
                onChange={(e) => setFormState({ ...formState, oaDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Interview Date
              </label>
              <input
                type="datetime-local"
                value={formState.interviewDate}
                onChange={(e) => setFormState({ ...formState, interviewDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Notes & Next Actions
            </label>
            <textarea
              rows={2}
              placeholder="Referral contact, recruiter follow-up date, or interview prep focus..."
              value={formState.notes}
              onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <Button variant="secondary" size="sm" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={saveJob.isPending}>
              {editingId ? 'Save Changes' : 'Add Application'}
            </Button>
          </div>
        </form>
      </Modal>
    </main>
  );
}