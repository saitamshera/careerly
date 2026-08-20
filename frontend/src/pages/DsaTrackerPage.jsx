import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  Code2,
  Flame,
  Search,
  Plus,
  Filter,
  Edit3,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Circle,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { MetricCard } from '../components/ui/MetricCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { SectionHeader } from '../components/ui/SectionHeader';
import { EmptyState } from '../components/ui/EmptyState';

const TOPICS = [
  'Arrays', 'Strings', 'Linked List', 'Trees', 'Graphs', 'DP',
  'Backtracking', 'Binary Search', 'Stack', 'Queue', 'Heap',
  'Hash Map', 'Greedy', 'Sliding Window', 'Two Pointers',
  'Recursion', 'Math', 'Bit Manipulation', 'Sorting'
];
const PLATFORMS = ['LeetCode', 'GFG', 'CodeForces', 'HackerRank', 'Other'];

const initialForm = {
  title: '',
  leetcodeId: '',
  link: '',
  difficulty: 'medium',
  topic: 'Arrays',
  platform: 'LeetCode',
  timeTaken: 20,
  language: 'C++',
  status: 'solved',
  companies: '',
  approach: '',
  notes: ''
};

export function DsaTrackerPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const rawUrlTopic = searchParams.get('topic') || '';
  const initialTopic = rawUrlTopic
    ? TOPICS.find((t) => t.toLowerCase() === rawUrlTopic.toLowerCase() || rawUrlTopic.toLowerCase().includes(t.toLowerCase())) || rawUrlTopic
    : 'All';

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState({
    ...initialForm,
    topic: initialTopic !== 'All' ? initialTopic : 'Arrays'
  });
  const [editingId, setEditingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [diffFilter, setDiffFilter] = useState('All');
  const [topicFilter, setTopicFilter] = useState(initialTopic);
  const [statusFilter, setStatusFilter] = useState('All');

  // Queries
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => (await api.get('/profile')).data?.data
  });
  const { data: problems = [] } = useQuery({
    queryKey: ['dsa-problems'],
    queryFn: async () => (await api.get('/dsa')).data?.data || []
  });
  const { data: stats } = useQuery({
    queryKey: ['dsa-stats'],
    queryFn: async () => (await api.get('/dsa/stats')).data?.data
  });

  const saveProblem = useMutation({
    mutationFn: async (payload) =>
      editingId ? api.put(`/dsa/${editingId}`, payload) : api.post('/dsa', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dsa-problems'] });
      queryClient.invalidateQueries({ queryKey: ['dsa-stats'] });
      setIsFormOpen(false);
      setEditingId(null);
      setFormState(initialForm);
    }
  });

  const deleteProblem = useMutation({
    mutationFn: async (id) => api.delete(`/dsa/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dsa-problems'] });
      queryClient.invalidateQueries({ queryKey: ['dsa-stats'] });
    }
  });

  // Derived Data
  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      const matchSearch =
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(p.companies) ? p.companies.join(', ') : p.companies || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchDiff =
        diffFilter === 'All' || p.difficulty?.toLowerCase() === diffFilter.toLowerCase();
      const matchTopic = topicFilter === 'All' || p.topic === topicFilter;
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchSearch && matchDiff && matchTopic && matchStatus;
    });
  }, [problems, searchTerm, diffFilter, topicFilter, statusFilter]);

  const handleEdit = (p) => {
    setFormState({
      ...p,
      companies: Array.isArray(p.companies) ? p.companies.join(', ') : p.companies || ''
    });
    setEditingId(p._id);
    setIsFormOpen(true);
  };

  const getDiffBadge = (diff) => {
    const d = String(diff || '').toLowerCase();
    if (d === 'easy') return <Badge variant="green">Easy</Badge>;
    if (d === 'hard') return <Badge variant="red">Hard</Badge>;
    return <Badge variant="orange">Medium</Badge>;
  };

  return (
    <main className="flex-1 p-6 lg:p-10 space-y-6 max-w-5xl mx-auto w-full animate-fadeIn bg-[#F8F6F0]">
      {/* 1. Page Header */}
      <SectionHeader
        eyebrow="PROBLEM SOLVING LOG & MASTERY"
        title={
          <span className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-[#315B45] shrink-0" />
            <span>DSA Practice Tracker</span>
          </span>
        }
        description="Log your daily data structures and algorithms practice, capture problem notes and time complexities, and review revision lists."
        action={
          <Button
            icon={Plus}
            size="sm"
            onClick={() => {
              setEditingId(null);
              setFormState(initialForm);
              setIsFormOpen(true);
            }}
          >
            Log New Problem
          </Button>
        }
      />

      {/* 2. LeetCode Live Sync Bar & Stats Row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Logged"
          value={`${problems.length}`}
          subtitle={`${problems.filter((p) => p.status === 'solved').length} solved`}
          icon={Code2}
          accent="green"
        />

        <MetricCard
          title="Topics Covered"
          value={`${Object.keys(stats?.topics || {}).length}`}
          subtitle="DSA categories explored"
          icon={Filter}
          accent="blue"
        />

        <MetricCard
          title="Needs Revision"
          value={`${problems.filter((p) => p.status === 'unsolved').length}`}
          subtitle="Flagged for re-solving"
          icon={RefreshCw}
          accent="orange"
        />

        <MetricCard
          title="Active Streak"
          value={`${profile?.leetcodeStats?.streak || 0} Days`}
          subtitle={profile?.leetcodeUsername ? `@${profile.leetcodeUsername}` : 'Connect LeetCode'}
          icon={Flame}
          accent="purple"
        />
      </div>

      {/* 3. Filters & Search Bar */}
      <Card padding="sm" className="space-y-3 p-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#74766F]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search problems by title, company..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E3DED3] bg-[#FFFDF8] text-[#20211E] placeholder:text-[#85877F] outline-none focus:border-[#315B45]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={diffFilter}
              onChange={(e) => setDiffFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-[#E3DED3] bg-[#FFFDF8] text-[#20211E] outline-none focus:border-[#315B45] cursor-pointer"
            >
              <option value="All">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-[#E3DED3] bg-[#FFFDF8] text-[#20211E] outline-none focus:border-[#315B45] cursor-pointer"
            >
              <option value="All">All Topics</option>
              {TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-[#E3DED3] bg-[#FFFDF8] text-[#20211E] outline-none focus:border-[#315B45] cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="solved">Solved</option>
              <option value="unsolved">Needs Revision</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 4. Problems Data Table */}
      <Card padding="none" className="overflow-hidden">
        {filteredProblems.length === 0 ? (
          <EmptyState
            icon={Code2}
            title="No problems found"
            description="Start logging your solved problems or adjust your search filters."
            actionText="Log First Problem"
            onAction={() => {
              setEditingId(null);
              setFormState(initialForm);
              setIsFormOpen(true);
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F4ED] border-b border-[#E3DED3] text-[#74766F] font-bold uppercase tracking-wider text-[0.65rem]">
                <tr>
                  <th className="py-3 px-4">Problem</th>
                  <th className="py-3 px-4">Topic</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3DED3]">
                {filteredProblems.map((p) => (
                  <tr
                    key={p._id}
                    className="hover:bg-[#F7F4ED]/60 transition group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {p.status === 'solved' ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#315B45] shrink-0" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-[#B9822E] shrink-0" />
                        )}
                        <span className="font-bold text-[#20211E]">
                          {p.title}
                        </span>
                        {p.link && (
                          <a
                            href={p.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#74766F] hover:text-[#315B45] transition"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      {p.approach && (
                        <p className="text-[0.68rem] text-[#5F625C] line-clamp-1 mt-0.5 pl-5.5">
                          {p.approach}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#5F625C]">
                      {p.topic}
                    </td>
                    <td className="py-3 px-4">
                      {getDiffBadge(p.difficulty)}
                    </td>
                    <td className="py-3 px-4 text-[#74766F] font-mono text-[0.7rem]">
                      {p.platform || 'LeetCode'}
                    </td>
                    <td className="py-3 px-4 text-[#74766F] font-mono text-[0.7rem]">
                      {p.timeTaken ? `${p.timeTaken}m` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={p.status === 'solved' ? 'green' : 'orange'} size="sm">
                        {p.status === 'solved' ? 'Solved' : 'Revision'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition">
                        <button
                          type="button"
                          onClick={() => handleEdit(p)}
                          className="p-1 rounded-md text-[#74766F] hover:text-[#20211E] hover:bg-[#F7F4ED] transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Remove this problem log?')) {
                              deleteProblem.mutate(p._id);
                            }
                          }}
                          className="p-1 rounded-md text-[#74766F] hover:text-[#B83A35] hover:bg-[#FDECEB] transition cursor-pointer"
                          title="Delete"
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
        )}
      </Card>

      {/* 5. Add / Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? 'Edit Problem Log' : 'Log DSA Problem'}
        subtitle="Keep track of the solution pattern, notes, and time taken."
        maxWidth="max-w-xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveProblem.mutate({
              ...formState,
              companies: formState.companies
                ? formState.companies.split(',').map((c) => c.trim()).filter(Boolean)
                : []
            });
          }}
          className="space-y-3 text-xs"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#20211E] mb-1">
                Problem Title
              </label>
              <input
                required
                placeholder="e.g. Trapping Rain Water"
                value={formState.title}
                onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] px-3 py-1.5 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#20211E] mb-1">
                LeetCode #
              </label>
              <input
                placeholder="e.g. 42"
                value={formState.leetcodeId}
                onChange={(e) => setFormState({ ...formState, leetcodeId: e.target.value })}
                className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] px-3 py-1.5 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-[#20211E] mb-1">
                Difficulty
              </label>
              <select
                value={formState.difficulty}
                onChange={(e) => setFormState({ ...formState, difficulty: e.target.value })}
                className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] px-3 py-1.5 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#20211E] mb-1">
                Topic
              </label>
              <select
                value={formState.topic}
                onChange={(e) => setFormState({ ...formState, topic: e.target.value })}
                className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] px-3 py-1.5 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
              >
                {TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#20211E] mb-1">
                Platform
              </label>
              <select
                value={formState.platform}
                onChange={(e) => setFormState({ ...formState, platform: e.target.value })}
                className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] px-3 py-1.5 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-[#20211E] mb-1">
                Time Taken (minutes)
              </label>
              <input
                type="number"
                value={formState.timeTaken}
                onChange={(e) => setFormState({ ...formState, timeTaken: Number(e.target.value) })}
                className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] px-3 py-1.5 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#20211E] mb-1">
                Status
              </label>
              <select
                value={formState.status}
                onChange={(e) => setFormState({ ...formState, status: e.target.value })}
                className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] px-3 py-1.5 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
              >
                <option value="solved">Solved</option>
                <option value="unsolved">Needs Revision</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#20211E] mb-1">
              Approach / Pattern Summary
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Two pointers moving inward from both ends..."
              value={formState.approach}
              onChange={(e) => setFormState({ ...formState, approach: e.target.value })}
              className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] p-2 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
            />
          </div>

          <div className="pt-2 border-t border-[#E3DED3] flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={saveProblem.isPending}>
              {editingId ? 'Save Changes' : 'Log Problem'}
            </Button>
          </div>
        </form>
      </Modal>
    </main>
  );
}