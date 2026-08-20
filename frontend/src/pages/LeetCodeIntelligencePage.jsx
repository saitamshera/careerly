import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
  Flame,
  Award,
  Code2,
  TrendingUp,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { extractCleanHandle } from '../utils/sanitizeHandle';
import { CodingProfilesNav } from '../components/CodingProfilesNav';
import { Card, CardHeader } from '../components/ui/Card';
import { MetricCard } from '../components/ui/MetricCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';

const COMPANY_LIST = ['Amazon', 'Google', 'Microsoft', 'Meta', 'Atlassian', 'Apple', 'Uber', 'Netflix'];

function formatTooltipDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return dateStr;
  const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const LEVEL_COLORS = {
  0: 'bg-[#F7F4ED] border border-[#E3DED3]',
  1: 'bg-[#C8E0D0] border border-[#B3D3BE]',
  2: 'bg-[#8FBF9F] border border-[#78AC8A]',
  3: 'bg-[#538E6A] border border-[#427958]',
  4: 'bg-[#315B45] border border-[#234533]'
};

async function fetchPublicLeetCodeProfile(username) {
  const clean = encodeURIComponent(username.trim().replace(/^@/, ''));
  const response = await fetch(`https://alfa-leetcode-api.onrender.com/userProfile/${clean}`);
  if (!response.ok) throw new Error('LeetCode could not find this public profile.');
  const data = await response.json();
  return {
    totalSolved: data.totalSolved || 0,
    easySolved: data.easySolved || 0,
    mediumSolved: data.mediumSolved || 0,
    hardSolved: data.hardSolved || 0,
    ranking: data.ranking || 0,
    recentSubmissions: data.recentSubmissions || []
  };
}

export function LeetCodeIntelligencePage() {
  const queryClient = useQueryClient();
  const currentUser = useSelector((state) => state.auth.user);
  const currentUserId = currentUser?.id || currentUser?._id || 'anon';

  const [selectedCompany, setSelectedCompany] = useState('All');
  const [handleInput, setHandleInput] = useState('');
  const [isEditingHandle, setIsEditingHandle] = useState(false);
  const [notice, setNotice] = useState(null);

  // Fetch Coding Profiles
  const profilesQuery = useQuery({
    queryKey: ['coding-profiles', currentUserId],
    queryFn: async () => {
      const res = await api.get('/coding-profiles');
      return res.data?.data || [];
    }
  });

  // Fetch user profile
  const userProfileQuery = useQuery({
    queryKey: ['user-profile', currentUserId],
    queryFn: async () => {
      const res = await api.get('/profile');
      return res.data?.data || {};
    }
  });

  const profiles = profilesQuery.data || [];
  const userProfile = userProfileQuery.data || {};

  const leetcodeProfile = useMemo(() => {
    return profiles.find((p) => p.platform === 'leetcode');
  }, [profiles]);

  const rawUsername = handleInput || leetcodeProfile?.username || userProfile?.leetcodeUsername || '';
  const username = extractCleanHandle(rawUsername).toLowerCase();

  // Fetch Live Submissions
  const submissionsQuery = useQuery({
    queryKey: ['leetcode-submissions', currentUserId, username],
    queryFn: async () => {
      if (!username) return [];
      try {
        const res = await api.get(`/leetcode/submissions/${username}`);
        return res.data?.data || [];
      } catch {
        const publicData = await fetchPublicLeetCodeProfile(username);
        return (publicData.recentSubmissions || []).filter((item) => item.statusDisplay === 'Accepted');
      }
    },
    enabled: Boolean(username)
  });

  // Fetch LeetCode 12-Month Calendar
  const calendarQuery = useQuery({
    queryKey: ['leetcode-calendar', currentUserId, username],
    queryFn: async () => {
      if (!username) return null;
      const res = await api.get(`/leetcode/calendar/${encodeURIComponent(username)}`);
      return res.data?.data;
    },
    enabled: Boolean(username)
  });

  // Fetch Logged DSA Problems
  const dsaQuery = useQuery({
    queryKey: ['dsa-problems', currentUserId],
    queryFn: async () => {
      const res = await api.get('/dsa');
      return res.data?.data || [];
    }
  });

  // Sync Mutation
  const syncMutation = useMutation({
    mutationFn: async (targetHandle) => {
      const cleanTarget = extractCleanHandle(targetHandle).toLowerCase();
      try {
        const res = await api.post('/coding-profiles', {
          platform: 'leetcode',
          username: cleanTarget
        });
        await api.post('/profile/sync-leetcode', { username: cleanTarget }).catch(() => {});
        return res.data?.data;
      } catch {
        const publicStats = await fetchPublicLeetCodeProfile(cleanTarget);
        const res = await api.post('/coding-profiles', {
          platform: 'leetcode',
          username: cleanTarget,
          stats: {
            totalSolved: publicStats.totalSolved,
            easySolved: publicStats.easySolved,
            mediumSolved: publicStats.mediumSolved,
            hardSolved: publicStats.hardSolved,
            currentRating: 0,
            globalRank: `#${publicStats.ranking}`
          }
        });
        await api.post('/profile/sync-leetcode', { username: cleanTarget, stats: publicStats }).catch(() => {});
        return res.data?.data;
      }
    },
    onSuccess: async () => {
      setNotice({ type: 'success', text: 'LeetCode profile synchronized successfully.' });
      setIsEditingHandle(false);
      await queryClient.invalidateQueries({ queryKey: ['coding-profiles', currentUserId] });
      await queryClient.invalidateQueries({ queryKey: ['user-profile', currentUserId] });
      await queryClient.invalidateQueries({ queryKey: ['leetcode-submissions', currentUserId] });
      await queryClient.invalidateQueries({ queryKey: ['leetcode-calendar', currentUserId] });
    },
    onError: (error) => {
      setNotice({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Could not synchronize this LeetCode profile.'
      });
    }
  });

  const leetcodeStats = leetcodeProfile?.stats || userProfile?.leetcodeStats || {};
  const dsaProblems = dsaQuery.data || [];
  const submissions = submissionsQuery.data || [];
  const calendarData = calendarQuery.data;

  // Group verified days into weekly columns for 12-month calendar heatmap
  const contributionWeeks = useMemo(() => {
    const days = calendarData?.days || [];
    if (days.length === 0) return [];
    const weeks = [];
    let currentWeek = [];
    days.forEach((day, idx) => {
      currentWeek.push(day);
      if (currentWeek.length === 7 || idx === days.length - 1) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    return weeks;
  }, [calendarData?.days]);

  // Compute month labels aligned with week columns
  const monthLabels = useMemo(() => {
    if (contributionWeeks.length === 0) return [];
    const labels = [];
    let lastMonth = -1;

    contributionWeeks.forEach((week, colIdx) => {
      const firstDayStr = week[0]?.date || week.find((d) => d?.date)?.date;
      if (!firstDayStr) return;
      const [y, m, d] = firstDayStr.split('-');
      if (!y || !m || !d) return;
      const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
      const month = date.getMonth();

      if (month !== lastMonth) {
        const prevCol = labels[labels.length - 1]?.colIdx ?? -99;
        if (colIdx - prevCol >= 2) {
          labels.push({
            colIdx,
            label: date.toLocaleString('en-US', { month: 'short' })
          });
          lastMonth = month;
        }
      }
    });
    return labels;
  }, [contributionWeeks]);

  // Company tagged problem counts
  const companyCounts = useMemo(() => {
    const map = { Amazon: 0, Google: 0, Microsoft: 0, Meta: 0, Atlassian: 0, Apple: 0, Uber: 0, Netflix: 0 };
    dsaProblems.forEach((p) => {
      const companyStr = Array.isArray(p.companies) ? p.companies.join(' ') : p.companies || '';
      COMPANY_LIST.forEach((comp) => {
        if (companyStr.toLowerCase().includes(comp.toLowerCase())) {
          map[comp] = (map[comp] || 0) + 1;
        }
      });
    });
    return map;
  }, [dsaProblems]);

  // Filtered DSA Problems
  const filteredDsaProblems = useMemo(() => {
    if (selectedCompany === 'All') return dsaProblems;
    return dsaProblems.filter((p) => {
      const compStr = Array.isArray(p.companies) ? p.companies.join(' ') : p.companies || '';
      return compStr.toLowerCase().includes(selectedCompany.toLowerCase());
    });
  }, [dsaProblems, selectedCompany]);

  function handleSyncSubmit(e) {
    e.preventDefault();
    const handle = handleInput.trim() || username;
    if (!handle) {
      setNotice({ type: 'error', text: 'Please enter a public LeetCode handle.' });
      return;
    }
    setNotice(null);
    syncMutation.mutate(handle);
  }

  const totalSolved = Number(leetcodeStats.totalSolved || dsaProblems.length || 0);
  const easySolved = Number(leetcodeStats.easySolved || 0);
  const mediumSolved = Number(leetcodeStats.mediumSolved || 0);
  const hardSolved = Number(leetcodeStats.hardSolved || 0);

  const easyPct = totalSolved > 0 ? Math.round((easySolved / totalSolved) * 100) : 0;
  const medPct = totalSolved > 0 ? Math.round((mediumSolved / totalSolved) * 100) : 0;
  const hardPct = totalSolved > 0 ? Math.round((hardSolved / totalSolved) * 100) : 0;

  const rawRank = leetcodeStats.globalRank || leetcodeStats.currentRating || userProfile?.leetcodeStats?.ranking || '';
  const displayRank = rawRank ? (String(rawRank).startsWith('#') ? rawRank : `#${rawRank}`) : 'Unranked';

  return (
    <main className="flex-1 p-6 lg:p-10 space-y-6 max-w-5xl mx-auto w-full animate-fadeIn bg-[#F8F6F0]">
      {/* Sub Nav */}
      <CodingProfilesNav profiles={profiles} />

      {/* Header */}
      <SectionHeader
        eyebrow="PLATFORM INTELLIGENCE"
        title={
          <span className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-[#C9683A] shrink-0" />
            <span>LeetCode Intelligence</span>
          </span>
        }
        description="Real-time problem-solving telemetry, difficulty ratios, company benchmarks, and live submission verification."
        action={
          <form onSubmit={handleSyncSubmit} className="flex items-center gap-2">
            {isEditingHandle || !username ? (
              <input
                type="text"
                value={handleInput}
                onChange={(e) => setHandleInput(e.target.value)}
                placeholder="LeetCode username..."
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#E3DED3] bg-[#FFFDF8] text-[#20211E] outline-none focus:border-[#315B45]"
              />
            ) : (
              <span className="text-xs font-bold text-[#20211E]">
                @{username}
              </span>
            )}

            <Button
              size="sm"
              icon={RefreshCw}
              isLoading={syncMutation.isPending}
              type="submit"
            >
              {syncMutation.isPending ? 'Syncing...' : 'Sync LeetCode'}
            </Button>

            {username && !isEditingHandle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setHandleInput(username);
                  setIsEditingHandle(true);
                }}
              >
                Edit
              </Button>
            )}
          </form>
        }
      />

      {notice && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
            notice.type === 'success'
              ? 'bg-[#E8F0EA] text-[#315B45] border border-[#D1E0D7]'
              : 'bg-[#FDECEB] text-[#B83A35] border border-[#F7CBC9]'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-[#315B45]" />
          ) : (
            <AlertCircle className="h-4 w-4 text-[#B83A35]" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Overview Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="Total Solved"
          value={`${totalSolved}`}
          subtitle={`${easySolved} Easy • ${mediumSolved} Med • ${hardSolved} Hard`}
          icon={Code2}
          accent="green"
        />

        <MetricCard
          title="Medium Dominance"
          value={`${medPct}%`}
          subtitle={`${mediumSolved} Medium problems`}
          icon={TrendingUp}
          accent="orange"
          trend="Target: 50%+ for technical screens"
        />

        <MetricCard
          title="Global Standing"
          value={displayRank}
          subtitle="Contest ranking"
          icon={Award}
          accent="blue"
        />

        <MetricCard
          title="Live Submissions"
          value={`${submissions.length}`}
          subtitle="Recent accepted solutions"
          icon={Sparkles}
          accent="purple"
        />
      </div>

      {/* LeetCode Submission Activity Heatmap */}
      <Card className="p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E3DED3]">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#C9683A]" />
            <h3 className="text-xs sm:text-sm font-bold text-[#20211E]">
              Submission Activity
            </h3>
          </div>
          {calendarData?.days && calendarData.days.length > 0 && (
            <div className="flex items-center gap-2">
              {calendarData.streak > 0 && (
                <Badge variant="orange" size="sm" className="font-mono">
                  🔥 {calendarData.streak} day streak
                </Badge>
              )}
              <Badge variant="blue" size="sm" className="font-mono">
                {calendarData.totalActiveDays} active days
              </Badge>
            </div>
          )}
        </div>

        {!calendarData || !calendarData.days || calendarData.days.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#74766F] space-y-1">
            <p className="font-semibold text-[#20211E]">
              No submission activity available yet.
            </p>
            <p className="text-[#5F625C]">
              Sync your LeetCode account to load verified activity.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[700px] space-y-1">
              {/* Month Labels Row */}
              <div className="relative h-4 text-[10px] text-[#74766F] font-medium select-none">
                {monthLabels.map(({ colIdx, label }, i) => (
                  <span
                    key={i}
                    className="absolute"
                    style={{ left: `${colIdx * 13}px` }}
                  >
                    {label}
                  </span>
                ))}
              </div>

              {/* Grid of Weeks */}
              <div className="flex gap-[3px]">
                {contributionWeeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-[3px]">
                    {week.map((day) => {
                      const formattedDate = formatTooltipDate(day.date);
                      const tooltip = `${day.count === 0 ? 'No' : day.count} submission${
                        day.count === 1 ? '' : 's'
                      } on ${formattedDate}`;

                      return (
                        <div
                          key={day.date}
                          title={tooltip}
                          className={`w-[10px] h-[10px] rounded-[2px] transition-transform hover:scale-125 cursor-pointer ${
                            LEVEL_COLORS[day.level] || LEVEL_COLORS[0]
                          }`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Heatmap Legend */}
              <div className="flex items-center justify-between pt-2 text-[0.68rem] text-[#74766F]">
                <span>Last 12 months verified activity</span>
                <div className="flex items-center gap-1.5">
                  <span>Less</span>
                  {[0, 1, 2, 3, 4].map((lvl) => (
                    <div
                      key={lvl}
                      className={`w-[9px] h-[9px] rounded-[2px] ${LEVEL_COLORS[lvl]}`}
                    />
                  ))}
                  <span>More</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Difficulty Breakdown Bar */}
      <Card className="space-y-3 p-4">
        <CardHeader
          title="Difficulty Distribution"
          subtitle="Balance between foundational, interview standard, and algorithmic depth."
        />

        <div className="space-y-2">
          <div className="h-2.5 w-full rounded-full bg-[#F7F4ED] border border-[#E3DED3] overflow-hidden flex">
            <div style={{ width: `${easyPct}%` }} className="bg-[#315B45] transition-all duration-300" title={`Easy: ${easySolved}`} />
            <div style={{ width: `${medPct}%` }} className="bg-[#B9822E] transition-all duration-300" title={`Medium: ${mediumSolved}`} />
            <div style={{ width: `${hardPct}%` }} className="bg-[#C9683A] transition-all duration-300" title={`Hard: ${hardSolved}`} />
          </div>

          <div className="flex items-center justify-between text-xs font-semibold pt-1">
            <span className="text-[#315B45] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#315B45]" />
              Easy: {easySolved} ({easyPct}%)
            </span>
            <span className="text-[#B9822E] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#B9822E]" />
              Medium: {mediumSolved} ({medPct}%)
            </span>
            <span className="text-[#C9683A] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#C9683A]" />
              Hard: {hardSolved} ({hardPct}%)
            </span>
          </div>
        </div>
      </Card>

      {/* Company Tagging & Recent Submissions Section */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        {/* Company Filter & Breakdown */}
        <Card className="space-y-3 p-4">
          <CardHeader
            title="Company Tag Coverage"
            subtitle="Problems solved associated with major tech hiring bars."
          />

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCompany('All')}
              className={`px-2 py-0.5 rounded-md text-xs font-semibold border transition cursor-pointer ${
                selectedCompany === 'All'
                  ? 'bg-[#E8F0EA] text-[#315B45] border-[#D1E0D7] font-bold'
                  : 'bg-[#F7F4ED] text-[#5F625C] border-[#E3DED3]'
              }`}
            >
              All ({dsaProblems.length})
            </button>
            {COMPANY_LIST.map((comp) => (
              <button
                key={comp}
                type="button"
                onClick={() => setSelectedCompany(comp)}
                className={`px-2 py-0.5 rounded-md text-xs font-semibold border transition cursor-pointer ${
                  selectedCompany === comp
                    ? 'bg-[#E8F0EA] text-[#315B45] border-[#D1E0D7] font-bold'
                    : 'bg-[#F7F4ED] text-[#5F625C] border-[#E3DED3]'
                }`}
              >
                {comp} ({companyCounts[comp] || 0})
              </button>
            ))}
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {filteredDsaProblems.slice(0, 8).map((p) => (
              <div
                key={p._id}
                className="p-2 rounded-lg border border-[#E3DED3] bg-[#FFFDF8] flex items-center justify-between text-xs hover:bg-[#F7F4ED] transition"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-[#20211E] truncate">{p.title}</p>
                  <p className="text-[0.68rem] text-[#74766F]">{p.topic}</p>
                </div>
                <Badge variant={p.difficulty === 'easy' ? 'green' : p.difficulty === 'hard' ? 'red' : 'orange'} size="sm">
                  {p.difficulty}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Live Submissions Feed */}
        <Card className="space-y-3 p-4">
          <CardHeader
            title="Recent Live Submissions"
            subtitle="Verified via LeetCode endpoint."
          />

          {submissions.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#74766F]">
              No recent live submissions retrieved yet. Click "Sync LeetCode" to pull live telemetry.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {submissions.slice(0, 10).map((sub, sIdx) => (
                <div
                  key={sIdx}
                  className="p-2 rounded-lg border border-[#E3DED3] bg-[#FFFDF8] flex items-center justify-between text-xs hover:bg-[#F7F4ED] transition"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-[#20211E] truncate">
                      {sub.title || sub.titleSlug}
                    </p>
                    <p className="text-[0.68rem] text-[#74766F]">
                      {sub.timestamp ? new Date(Number(sub.timestamp) * 1000).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>
                  <Badge variant="green" size="sm">
                    Accepted ✓
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
