import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  User as UserIcon,
  X,
  Plus
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';
import { ActivityOverview } from '../components/activity/ActivityOverview';

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
    <main className="flex-1 p-6 lg:p-10 space-y-6 max-w-5xl mx-auto w-full animate-fadeIn bg-[#F8F6F0]">
      {/* 1. Header */}
      <SectionHeader
        eyebrow="STUDENT CANDIDATE PROFILE"
        title={
          <span className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-[#315B45] shrink-0" />
            <span>Profile & Placement Settings</span>
          </span>
        }
        description="Configure your technical skills, target companies, problem-solving daily goals, and connected developer accounts."
      />

      {/* 2. Candidate Header Card */}
      <Card className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#E8F0EA] text-[#315B45] font-extrabold text-xl flex items-center justify-center border border-[#D1E0D7] shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'S'}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#20211E]">
              {user?.name || 'Student Candidate'}
            </h2>
            <p className="text-xs text-[#5F625C] flex items-center gap-2 mt-0.5">
              <span>{user?.email || 'student@university.edu'}</span>
              <span>•</span>
              <span className="text-[#315B45] font-semibold">Placement Season 2026</span>
            </p>
          </div>
        </div>

        <Badge variant="green" size="md">
          Active Student Account
        </Badge>
      </Card>

      {/* 3. Placement Preferences & Goals */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2 lg:col-span-2 space-y-6">
          <ActivityOverview />
          <Card className="space-y-3.5 p-4">
            <CardHeader
              title="Daily Practice Target"
              subtitle="Configure daily problem solving milestones."
            />
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#20211E] mb-1">
                  Daily DSA Target (Problems / Day)
                </label>
              <input
                type="number"
                min="1"
                max="20"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(e.target.value)}
                className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] px-3 py-1.5 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#20211E] mb-1">
                Target Companies (Comma-separated)
              </label>
              <input
                type="text"
                value={targetCompanies}
                onChange={(e) => setTargetCompanies(e.target.value)}
                placeholder="e.g. Google, Microsoft, Amazon, Stripe"
                className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] px-3 py-1.5 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
              />
            </div>

            <div className="pt-1 flex justify-end">
              <Button size="sm" onClick={handleSavePreferences} isLoading={updateProfile.isPending}>
                Save Preferences
              </Button>
            </div>
          </div>
        </Card>
        </div>

        {/* Linked Accounts */}
        <Card className="space-y-3.5 p-4">
          <CardHeader
            title="Linked Developer Handles"
            subtitle="Connect your competitive profiles."
          />

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-[#20211E] mb-1">
                LeetCode Handle
              </label>
              <input
                type="text"
                value={leetcodeUsername}
                onChange={(e) => setLeetcodeUsername(e.target.value)}
                placeholder="e.g. leetcode_user"
                className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] px-3 py-1.5 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#20211E] mb-1">
                GitHub Profile URL
              </label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] px-3 py-1.5 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#20211E] mb-1">
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] px-3 py-1.5 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
              />
            </div>

            <div className="pt-1 flex justify-end">
              <Button size="sm" onClick={handleSaveLinks} isLoading={updateProfile.isPending}>
                Update Links
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* 4. Technical Skills Management */}
      <Card className="space-y-3.5 p-4">
        <CardHeader
          title="Technical Competencies & Skills"
          subtitle="Skills listed here are matched against active job descriptions and roadmap modules."
        />

        <div className="flex flex-wrap gap-1.5">
          {(profile?.skills || []).map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#F7F4ED] border border-[#E3DED3] text-xs font-semibold text-[#20211E]"
            >
              <span>{skill}</span>
              <button
                type="button"
                onClick={() => handleRemoveSkill(skill)}
                className="text-[#74766F] hover:text-[#B83A35] transition cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2 max-w-sm pt-1">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Add new skill..."
            className="flex-1 rounded-lg border border-[#E3DED3] bg-[#FFFDF8] px-3 py-1.5 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
          />
          <Button size="sm" icon={Plus} onClick={() => handleAddSkill()}>
            Add
          </Button>
        </div>

        {/* Suggested Quick Add */}
        <div className="pt-1 space-y-1.5">
          <span className="text-[0.68rem] font-bold uppercase text-[#74766F] block">
            Suggested Quick-Add Skills:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_SKILLS.filter((s) => !(profile?.skills || []).includes(s)).map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => handleAddSkill(skill)}
                className="px-2 py-0.5 rounded-md text-xs font-medium border border-[#E3DED3] bg-[#FFFDF8] hover:bg-[#E8F0EA] hover:text-[#315B45] text-[#5F625C] transition cursor-pointer"
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
