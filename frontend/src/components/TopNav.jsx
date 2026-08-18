import React from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Bell, Sparkles } from 'lucide-react';
import { useSelector } from 'react-redux';

const pageTitles = {
  '/dashboard': 'Dashboard Overview',
  '/roadmap': 'Preparation Roadmap',
  '/dsa-tracker': 'DSA Practice Tracker',
  '/coding-profiles': 'Coding Profiles Hub',
  '/coding-profiles/leetcode': 'LeetCode Intelligence',
  '/coding-profiles/github': 'GitHub Activity & Portfolio',
  '/interview-prep': 'AI Interview Arena',
  '/resume': 'Resume Lab & ATS Scanner',
  '/chat-mentor': 'Career Mentor',
  '/job-tracker': 'Job Application Tracker',
  '/analytics': 'Conversion & Momentum Analytics',
  '/profile': 'Student Profile & Settings'
};

export function TopNav() {
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const currentTitle = pageTitles[location.pathname] || 'Workspace';

  return (
    <header className="sticky top-0 z-20 hidden lg:flex items-center justify-between h-14 px-6 sm:px-8 bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/70 dark:border-slate-800/70 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
          {currentTitle}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Readiness Tag */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Placement Season 2026</span>
        </div>

        {/* User Mini Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {user?.name || 'Candidate'}
          </span>
        </div>
      </div>
    </header>
  );
}
