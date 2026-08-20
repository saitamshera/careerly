import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard,
  Compass,
  Code2,
  Globe,
  Video,
  FileText,
  Bot,
  Briefcase,
  BarChart3,
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { clearSession } from '../app/store';
import { queryClient } from '../app/queryClient';

const navSections = [
  {
    title: 'PREPARATION',
    items: [
      { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
      { label: 'Career Mentor', to: '/chat-mentor', icon: Bot },
      { label: 'AI Interview', to: '/interview-prep', icon: Video },
      { label: 'Resume Lab', to: '/resume', icon: FileText },
      { label: 'DSA Tracker', to: '/dsa-tracker', icon: Code2 },
      { label: 'Roadmap', to: '/roadmap', icon: Compass },
      { label: 'Coding Profiles', to: '/coding-profiles', icon: Globe }
    ]
  },
  {
    title: 'TRACKING',
    items: [
      { label: 'Applications', to: '/job-tracker', icon: Briefcase },
      { label: 'Analytics', to: '/analytics', icon: BarChart3 }
    ]
  },
  {
    title: 'ACCOUNT',
    items: [
      { label: 'Profile & Settings', to: '/profile', icon: User }
    ]
  }
];

export function Sidebar() {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function signOut() {
    queryClient.clear();
    dispatch(clearSession());
    navigate('/login');
  }

  return (
    <>
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#E3DED3] bg-[#F4F1E9] px-4 py-3 shadow-xs lg:hidden">
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#315B45] text-white font-bold text-xs">
            C
          </div>
          <span className="text-base font-bold text-[#20211E] tracking-tight">
            Careerly
          </span>
        </NavLink>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-md border border-[#E3DED3] bg-[#FFFDF8] p-1.5 text-[#5F625C] hover:text-[#20211E] transition cursor-pointer"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </header>

      {/* Mobile Nav Drawer */}
      {mobileOpen && (
        <div className="fixed inset-x-0 top-[49px] bottom-0 z-30 flex flex-col bg-[#F4F1E9] p-4 shadow-lg overflow-y-auto lg:hidden">
          <nav className="space-y-5">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <p className="text-[0.65rem] font-bold tracking-wider uppercase text-[#74766F] px-2.5">
                  {section.title}
                </p>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.label}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${isActive
                          ? 'bg-[#E8F0EA] text-[#315B45] font-semibold'
                          : 'text-[#5F625C] hover:bg-[#EAE5DA] hover:text-[#20211E]'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>
      )}

      {/* Desktop Clean Warm Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-[#E3DED3] bg-[#F4F1E9] p-4 shadow-xs lg:flex">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-1">
          <NavLink to="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#315B45] text-white font-bold text-xs">
              C
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-[#20211E] tracking-tight">
                Careerly
              </span>
            </div>
          </NavLink>
        </div>

        {/* Workspace Selector */}
        <div className="mt-4 pb-3 border-b border-[#E3DED3]">
          <div className="flex items-center justify-between rounded-lg border border-[#E3DED3] bg-[#FFFDF8] px-2.5 py-1.5 text-xs text-[#20211E] shadow-2xs">
            <span className="flex items-center gap-2 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#315B45]" />
              <span>Placement Prep</span>
            </span>
            <span className="text-[0.65rem] font-bold text-[#74766F] uppercase">2026</span>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="mt-3 flex-1 space-y-4 overflow-y-auto pr-0.5">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-0.5">
              <p className="text-[0.62rem] font-bold tracking-wider uppercase text-[#74766F] px-2.5 mb-1">
                {section.title}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    className={({ isActive }) =>
                      `group flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition ${isActive
                        ? 'bg-[#E8F0EA] text-[#315B45] font-semibold'
                        : 'text-[#5F625C] hover:bg-[#EAE5DA] hover:text-[#20211E] font-medium'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-2.5">
                          <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#315B45]' : 'text-[#5F625C] group-hover:text-[#20211E]'}`} />
                          <span>{item.label}</span>
                        </div>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#315B45] shrink-0" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div className="mt-auto pt-3 border-t border-[#E3DED3] flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-md bg-[#315B45] text-white font-bold text-xs flex items-center justify-center shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'S'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#20211E] truncate">
                {user?.name || 'Student'}
              </p>
              <p className="text-[0.65rem] text-[#74766F] truncate">
                {user?.email || 'Placement 2026'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={signOut}
              title="Sign Out"
              className="p-1 rounded-md text-[#74766F] hover:text-[#C9683A] hover:bg-[#F7E7DD] transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
