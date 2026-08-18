import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  User as UserIcon,
  Globe,
  Link2,
  Mail,
  Target,
  Code2,
  X,
  Plus,
  RefreshCw,
  CheckCircle2,
  Briefcase
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';

const SUGGESTED_SKILLS = [
  'React', 'Node.js', 'Express', 'MongoDB', 'Python', 'Java', 'C++',
  'JavaScript', 'TypeScript', 'SQL', 'Docker', 'AWS',
  'Data Structures', 'System Design'
];

export function ProfilePage() {
  const user = useSelector((state) => state.auth.user);
  const queryClient = useQueryClient();

  const [newSkill, setNewSkill] = useState('');
  const [leetcodeUsername, setLeetcodeUsername] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [dailyGoal, setDailyGoal] = useState('');
  const [targetCompanies, setTargetCompanies] = useState('');

  // Fetch Profile
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get('/profile');
      return res.data?.data || {};
    }
  });

  useEffect(() => {
    if (profile) {
      setLeetcodeUsername(profile.leetcodeUsername || '');
      setGithubUrl(profile.githubUrl || '');
      setLinkedinUrl(profile.linkedinUrl || '');
      setDailyGoal(profile.dailyGoal || 2);
      setTargetCompanies(profile.targetCompanies?.join(', ') || '');
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async (payload) => {
      const res = await api.put('/profile', payload);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
    }
  });

  const syncLeetcode = useMutation({
    mutationFn: async () => {
      const res = await api.post('/profile/sync-leetcode');
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
    }
  });

  const handleSavePreferences = () => {
    const companiesArray = targetCompanies.split(',').map((c) => c.trim()).filter(Boolean);
    updateProfile.mutate({
      dailyGoal: Number(dailyGoal),
      targetCompanies: companiesArray
    });
  };

  const handleSaveLinks = () => {
    updateProfile.mutate({
      leetcodeUsername,
      githubUrl,
      linkedinUrl
    });
  };

  const handleAddSkill = (skillToAdd) => {
    const s = (skillToAdd || newSkill).trim();
    if (!s) return;
    const currentSkills = profile?.skills || [];
    if (currentSkills.includes(s)) return;
    updateProfile.mutate({ skills: [...currentSkills, s] });
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    const currentSkills = profile?.skills || [];
    updateProfile.mutate({ skills: currentSkills.filter((s) => s !== skillToRemove) });
  };

  return (
    <main className="flex-1 p-6 lg:p-10 space-y-8 max-w-5xl mx-auto w-full animate-fadeIn">
      {/* 1. Header */}
      <SectionHeader
        eyebrow="STUDENT CANDIDATE PROFILE"
        title={
          <span className="flex items-center gap-2.5">
            <UserIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Profile & Placement Settings</span>
          </span>
        }
        description="Configure your technical skills, target companies, problem-solving daily goals, and connected developer accounts."
      />

      {/* 2. Candidate Header Card */}
      <Card className="p-6 flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-extrabold text-2xl flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'S'}
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
              {user?.name || 'Student Candidate'}
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>{user?.email || 'student@university.edu'}</span>
              <span>•</span>
              <span className="text-emerald-600 font-semibold">Placement Season 2026</span>
            </p>
          </div>
        </div>

        <Badge variant="green" size="md">
          Active Student Account
        </Badge>
      </Card>

      {/* 3. Placement Preferences & Goals */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="space-y-4">
          <CardHeader
            title="Daily Practice Target"
            subtitle="Configure daily problem solving milestones."
          />

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Daily DSA Target (Problems / Day)
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Companies (Comma-separated)
              </label>
              <input
                type="text"
                value={targetCompanies}
                onChange={(e) => setTargetCompanies(e.target.value)}
                placeholder="e.g. Google, Microsoft, Amazon, Stripe"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button size="sm" onClick={handleSavePreferences} isLoading={updateProfile.isPending}>
                Save Preferences
              </Button>
            </div>
          </div>
        </Card>

        {/* Linked Accounts */}
        <Card className="space-y-4">
          <CardHeader
            title="Linked Developer Handles"
            subtitle="Connect your competitive profiles."
          />

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                LeetCode Handle
              </label>
              <input
                type="text"
                value={leetcodeUsername}
                onChange={(e) => setLeetcodeUsername(e.target.value)}
                placeholder="e.g. leetcode_user"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                GitHub Profile URL
              </label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button size="sm" onClick={handleSaveLinks} isLoading={updateProfile.isPending}>
                Update Links
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* 4. Technical Skills Management */}
      <Card className="space-y-4">
        <CardHeader
          title="Technical Competencies & Skills"
          subtitle="Skills listed here are matched against active job descriptions and roadmap modules."
        />

        <div className="flex flex-wrap gap-2">
          {(profile?.skills || []).map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              <span>{skill}</span>
              <button
                type="button"
                onClick={() => handleRemoveSkill(skill)}
                className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2 max-w-sm pt-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Add new skill..."
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
          />
          <Button size="sm" icon={Plus} onClick={() => handleAddSkill()}>
            Add
          </Button>
        </div>

        {/* Suggested Quick Add */}
        <div className="pt-2 space-y-1.5">
          <span className="text-[0.68rem] font-bold uppercase text-slate-400 block">
            Suggested Quick-Add Skills:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_SKILLS.filter((s) => !(profile?.skills || []).includes(s)).map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => handleAddSkill(skill)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 hover:border-emerald-300 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                + {skill}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </main>
  );
}
