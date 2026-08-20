import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  Columns,
  List,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
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
  const navigate = useNavigate();
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

  const saveJob = useMutation({
    mutationFn: async (payload) =>
      editingId ? api.put(`/jobs/${editingId}`, payload) : api.post('/jobs', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-oas'] });
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
    <main className="flex-1 p-6 lg:p-10 space-y-6 max-w-5xl mx-auto w-full animate-fadeIn bg-[#F8F6F0]">
      {/* 1. Header with Controls */}
      <SectionHeader
        eyebrow="HIRING FUNNEL & APPLICATIONS"
        title={
          <span className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-[#315B45] shrink-0" />
            <span>Job Application Tracker</span>
          </span>
        }
        description="Monitor company applications, upcoming online assessments, technical interviews, and offer deadlines."
        action={
          <div className="flex items-center gap-2.5">
            <div className="flex rounded-lg border border-[#E3DED3] p-0.5 bg-[#FFFDF8]">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`p-1 rounded-md transition cursor-pointer ${viewMode === 'kanban'
                    ? 'bg-[#E8F0EA] text-[#315B45] font-bold'
                    : 'text-[#74766F] hover:text-[#20211E]'
                  }`}
                title="Kanban Board"
              >
                <Columns className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1 rounded-md transition cursor-pointer ${viewMode === 'list'
                    ? 'bg-[#E8F0EA] text-[#315B45] font-bold'
                    : 'text-[#74766F] hover:text-[#20211E]'
                  }`}
                title="List View"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>

            <Button size="sm" icon={Plus} onClick={() => openModal()}>
              Add Application
            </Button>
          </div>
        }
      />

      {/* 2. Funnel KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="Total Applied"
          value={`${jobs.length}`}
          subtitle={`${appliedCount} in pipeline`}
          icon={Briefcase}
          accent="blue"
        />

        <MetricCard
          title="Upcoming OAs"
          value={`${oaCount}`}
          subtitle="Assessments scheduled"
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
          subtitle="Placement conversions"
          icon={DollarSign}
          accent="green"
        />
      </div>

      {/* 3. Upcoming OA Alert / Banner */}
      {oas.length > 0 && (
        <Card className="border-[#F3E3C4] bg-[#FBF4E6]/50 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#B9822E]">
              <Clock className="h-3.5 w-3.5" />
              <span>Upcoming Online Assessments ({oas.length})</span>
            </div>
            <span className="text-[0.68rem] text-[#B9822E]">
              Scheduled within 7 days
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 pt-1">
            {oas.map((oa) => (
              <div
                key={oa._id}
                className="p-2 rounded-lg bg-[#FFFDF8] border border-[#E3DED3] text-xs flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-[#20211E]">{oa.company}</p>
                  <p className="text-[0.68rem] text-[#74766F]">
                    {oa.oaDate ? new Date(oa.oaDate).toLocaleDateString() : 'Scheduled'}
                  </p>
                </div>
                <Badge variant="amber" size="sm">
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
          description="Keep all your job applications, referral contacts, and interview stages organized in one pipeline."
          actionText="Add First Application"
          onAction={() => openModal()}
        />
      ) : viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
          {STAGES.slice(1, 6).map((stage) => {
            const stageJobs = jobs.filter((j) => j.status === stage.id);
            return (
              <div key={stage.id} className="space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#E3DED3]">
                  <span className="text-xs font-bold text-[#20211E]">
                    {stage.label}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#74766F]">
                    {stageJobs.length}
                  </span>
                </div>

                <div className="space-y-2 min-h-[100px]">
                  {stageJobs.map((job) => (
                    <Card
                      key={job._id}
                      padding="sm"
                      hover
                      onClick={() => openModal(job)}
                      className="space-y-1.5 cursor-pointer transition p-3"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div>
                          <h4 className="text-xs font-bold text-[#20211E]">
                            {job.company}
                          </h4>
                          <p className="text-[0.7rem] text-[#5F625C] font-medium line-clamp-1">
                            {job.role}
                          </p>
                        </div>
                        <Badge variant={stage.variant} size="sm">
                          {stage.id}
                        </Badge>
                      </div>

                      {job.location && (
                        <p className="text-[0.68rem] text-[#74766F] flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{job.location}</span>
                        </p>
                      )}

                      <div className="pt-1.5 border-t border-[#E3DED3] flex items-center justify-between">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/interview-prep?company=${encodeURIComponent(job.company)}&role=${encodeURIComponent(job.role)}`);
                          }}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.65rem] font-bold text-[#315B45] bg-[#E8F0EA] border border-[#D1E0D7] hover:bg-[#D1E0D7] transition cursor-pointer"
                          title="Practice AI Mock Interview for this job"
                        >
                          <Sparkles className="h-2.5 w-2.5 text-[#315B45]" />
                          <span>Practice</span>
                        </button>
                      </div>
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
              <thead className="bg-[#F7F4ED] border-b border-[#E3DED3] text-[#74766F] font-bold uppercase text-[0.65rem]">
                <tr>
                  <th className="py-2.5 px-3.5">Company</th>
                  <th className="py-2.5 px-3.5">Role</th>
                  <th className="py-2.5 px-3.5">Stage</th>
                  <th className="py-2.5 px-3.5">Location</th>
                  <th className="py-2.5 px-3.5">Timeline</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3DED3] font-medium">
                {jobs.map((job) => (
                  <tr key={job._id} className="hover:bg-[#F7F4ED]/60 transition">
                    <td className="py-2.5 px-3.5 font-bold text-[#20211E]">
                      {job.company}
                    </td>
                    <td className="py-2.5 px-3.5 text-[#5F625C]">{job.role}</td>
                    <td className="py-2.5 px-3.5">
                      <Badge variant={job.status === 'offer' ? 'green' : job.status === 'oa' ? 'orange' : 'neutral'} size="sm">
                        {job.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3.5 text-[#74766F]">{job.location || '-'}</td>
                    <td className="py-2.5 px-3.5 text-[#74766F] text-[0.68rem]">
                      {job.updatedAt ? new Date(job.updatedAt).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/interview-prep?company=${encodeURIComponent(job.company)}&role=${encodeURIComponent(job.role)}`)}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.65rem] font-bold text-[#315B45] bg-[#E8F0EA] border border-[#D1E0D7] hover:bg-[#D1E0D7] transition cursor-pointer"
                          title="Practice AI Mock Interview"
                        >
                          <Sparkles className="h-2.5 w-2.5" />
                          <span>Practice</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openModal(job)}
                          className="p-1 rounded text-[#74766F] hover:text-[#20211E] hover:bg-[#F7F4ED] transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Delete application entry?')) {
                              deleteJob.mutate(job._id);
                            }
                          }}
                          className="p-1 rounded text-[#74766F] hover:text-[#B83A35] hover:bg-[#FDECEB] transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
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
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-[#20211E] mb-1">
                Company Name
              </label>
              <input
                required
                placeholder="e.g. Stripe, Amazon"
                value={formState.company}
                onChange={(e) => setFormState({ ...formState, company: e.target.value })}
                className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] px-3 py-1.5 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#20211E] mb-1">
                Role Title
              </label>
              <input
                required
                placeholder="e.g. SDE-1, Full Stack"
                value={formState.role}
                onChange={(e) => setFormState({ ...formState, role: e.target.value })}
                className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] px-3 py-1.5 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-[#20211E] mb-1">
                Pipeline Stage
              </label>
              <select
                value={formState.status}
                onChange={(e) => setFormState({ ...formState, status: e.target.value })}
                className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] px-3 py-1.5 text-xs text-[#20211E] outline-none focus:border-[#315B45] cursor-pointer"
              >
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#20211E] mb-1">
                Location
              </label>
              <input
                placeholder="e.g. Remote / Seattle"
                value={formState.location}
                onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] px-3 py-1.5 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#20211E] mb-1">
                Compensation (CTC)
              </label>
              <input
                placeholder="e.g. $140k / 22 LPA"
                value={formState.salary}
                onChange={(e) => setFormState({ ...formState, salary: e.target.value })}
                className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] px-3 py-1.5 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-[#20211E] mb-1">
                OA Scheduled Date
              </label>
              <input
                type="datetime-local"
                value={formState.oaDate}
                onChange={(e) => setFormState({ ...formState, oaDate: e.target.value })}
                className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] px-3 py-1.5 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#20211E] mb-1">
                Interview Date
              </label>
              <input
                type="datetime-local"
                value={formState.interviewDate}
                onChange={(e) => setFormState({ ...formState, interviewDate: e.target.value })}
                className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] px-3 py-1.5 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#20211E] mb-1">
              Notes & Next Actions
            </label>
            <textarea
              rows={2}
              placeholder="Referral contact, recruiter follow-up date..."
              value={formState.notes}
              onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
              className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] p-2 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
            />
          </div>

          <div className="pt-2 border-t border-[#E3DED3] flex items-center justify-between gap-2">
            {editingId && formState.company ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={Sparkles}
                onClick={() => {
                  navigate(`/interview-prep?company=${encodeURIComponent(formState.company)}&role=${encodeURIComponent(formState.role)}`);
                }}
              >
                Practice Interview
              </Button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={saveJob.isPending}>
                {editingId ? 'Save Changes' : 'Add Application'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </main>
  );
}