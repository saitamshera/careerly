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
  ChevronDown,
  Menu,
  X,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';
import { clearSession } from '../app/store';
import { useTheme } from './ThemeProvider';

const navSections = [
  {
    title: 'PREPARATION',
    items: [
      { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
      { label: 'Roadmap', to: '/roadmap', icon: Compass },
      { label: 'DSA Tracker', to: '/dsa-tracker', icon: Code2 },
      { label: 'Coding Profiles', to: '/coding-profiles', icon: Globe },
      { label: 'AI Interview', to: '/interview-prep', icon: Video },
      { label: 'Resume Lab', to: '/resume', icon: FileText },
      { label: 'Career Mentor', to: '/chat-mentor', icon: Bot }
    ]
  },
  {
    title: 'JOB TRACKER',
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
  const { theme, toggleTheme } = useTheme();

  function signOut() {
    dispatch(clearSession());
    navigate('/login');
  }

  return (
    <>
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 py-3 shadow-xs backdrop-blur-md lg:hidden">
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-black text-xs shadow-xs">
            C
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Careerly
          </span>
        </NavLink>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg border border-slate-200 dark:border-slate-800 p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition cursor-pointer"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile Nav Drawer */}
      {mobileOpen && (
        <div className="fixed inset-x-0 top-[53px] bottom-0 z-30 flex flex-col bg-white dark:bg-slate-900 p-4 shadow-xl overflow-y-auto lg:hidden">
          <nav className="space-y-6">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1.5">
                <p className="text-[0.65rem] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 px-3">
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
                        `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                        }`
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>
      )}

      {/* Desktop Clean Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-2xs lg:flex">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <NavLink to="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-black text-xs shadow-xs">
              C
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Careerly
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mb-0.5" />
            </div>
          </NavLink>
        </div>

        {/* Workspace Selector */}
        <div className="mt-5 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 px-1">
            WORKSPACE
          </p>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Placement Prep</span>
            </span>
            <span className="text-[0.65rem] font-bold text-slate-400 uppercase">2026</span>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="mt-4 flex-1 space-y-5 overflow-y-auto pr-1">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="text-[0.65rem] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 px-3">
                {section.title}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 shadow-2xs font-bold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {user?.name || 'Student'}
              </p>
              <p className="text-[0.65rem] text-slate-400 truncate">
                {user?.email || 'Placement 2026'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={signOut}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
