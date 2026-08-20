import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const pageTitles = {
  '/dashboard': 'Overview',
  '/roadmap': 'Preparation Roadmap',
  '/dsa-tracker': 'DSA Practice Tracker',
  '/coding-profiles': 'Coding Profiles Hub',
  '/coding-profiles/leetcode': 'LeetCode Intelligence',
  '/coding-profiles/github': 'GitHub Activity & Portfolio',
  '/interview-prep': 'AI Interview Arena',
  '/resume': 'Resume Lab & ATS Scanner',
  '/chat-mentor': 'Career Mentor',
  '/job-tracker': 'Job Applications',
  '/analytics': 'Conversion Analytics',
  '/profile': 'Profile & Settings'
};

export function TopNav() {
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const currentTitle = pageTitles[location.pathname] || 'Workspace';

  return (
    <header className="sticky top-0 z-20 hidden lg:flex items-center justify-between h-12 px-6 sm:px-8 bg-[#F8F6F0]/90 border-b border-[#E3DED3] backdrop-blur-xs">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-[#20211E]">
          {currentTitle}
        </span>
      </div>

      <div className="flex items-center gap-3.5">
        {/* Readiness Tag */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F0EA] border border-[#D1E0D7] text-[#315B45] text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#315B45]" />
          <span>Placement Season 2026</span>
        </div>

        {/* User Mini Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#E3DED3]">
          <div className="w-6 h-6 rounded-md bg-[#315B45] text-white font-bold text-[0.65rem] flex items-center justify-center">
            {user?.name?.[0]?.toUpperCase() || 'S'}
          </div>
          <span className="text-xs font-medium text-[#20211E]">
            {user?.name || 'Candidate'}
          </span>
        </div>
      </div>
    </header>
  );
}
