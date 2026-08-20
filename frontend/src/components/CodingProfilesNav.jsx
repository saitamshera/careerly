import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Flame, GitBranch } from 'lucide-react';
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
    <div className="flex items-center gap-2 overflow-x-auto border-b border-[#E3DED3] pb-2 scrollbar-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${isActive
                ? 'bg-[#E8F0EA] text-[#315B45] border border-[#D1E0D7] font-bold'
                : 'text-[#5F625C] hover:text-[#20211E] hover:bg-[#F7F4ED] border border-transparent'
              }`
            }
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
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
