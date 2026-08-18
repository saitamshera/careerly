import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Flame, GitBranch, Check } from 'lucide-react';
import { Badge } from './ui/Badge';

export function CodingProfilesNav({ profiles = [] }) {
  const isLeetCodeConnected = profiles.some((p) => p.platform === 'leetcode');
  const isGitHubConnected = profiles.some((p) => p.platform === 'github');

  const tabs = [
    {
      label: 'Overview & Hub',
      to: '/coding-profiles',
      end: true,
      icon: LayoutDashboard,
      badge: `${profiles.length} Linked`,
      isConnected: profiles.length > 0
    },
    {
      label: 'LeetCode Intelligence',
      to: '/coding-profiles/leetcode',
      end: false,
      icon: Flame,
      badge: isLeetCodeConnected ? 'Connected' : 'Setup',
      isConnected: isLeetCodeConnected
    },
    {
      label: 'GitHub Activity',
      to: '/coding-profiles/github',
      end: false,
      icon: GitBranch,
      badge: isGitHubConnected ? 'Connected' : 'Setup',
      isConnected: isGitHubConnected
    }
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200/80 dark:border-slate-800 pb-2 scrollbar-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{tab.label}</span>
            <Badge variant={tab.isConnected ? 'green' : 'neutral'} size="sm">
              {tab.badge}
            </Badge>
          </NavLink>
        );
      })}
    </div>
  );
}
