import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './ui/Logo';

const prepareLinks = [
  { label: 'Overview', to: '/dashboard' },
  { label: 'Career Mentor', to: '/chat-mentor' },
  { label: 'AI Interview', to: '/interview-prep' },
  { label: 'Resume Lab', to: '/resume' },
  { label: 'DSA Tracker', to: '/dsa-tracker' },
  { label: 'Roadmap', to: '/roadmap' },
  { label: 'Coding Profiles', to: '/coding-profiles' }
];

const jobTrackerLinks = [
  { label: 'Applications', to: '/job-tracker' },
  { label: 'Analytics', to: '/analytics' }
];

const resourceLinks = [
  { label: 'Profile & Settings', to: '/profile' },
  { label: 'LeetCode Intelligence', to: '/coding-profiles/leetcode' },
  { label: 'GitHub Activity', to: '/coding-profiles/github' }
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[#E5E0D6] bg-[#F5F2EA] text-[#20211E]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          {/* Brand Section */}
          <div className="col-span-2 space-y-1">
            <Link to="/dashboard" className="inline-flex items-center">
              <Logo />
            </Link>
            <p className="text-[0.7rem] text-[#6F7068] max-w-xs leading-relaxed">
              Your focused workspace for software engineering placement preparation.
            </p>
          </div>

          {/* Prepare Column */}
          <div className="space-y-1">
            <p className="text-[0.62rem] font-bold tracking-wider uppercase text-[#92928A]">
              Prepare
            </p>
            <ul className="space-y-0.5">
              {prepareLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-[0.72rem] text-[#6F7068] hover:text-[#315B45] font-medium transition block leading-snug"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Job Tracker Column */}
          <div className="space-y-1">
            <p className="text-[0.62rem] font-bold tracking-wider uppercase text-[#92928A]">
              Job Tracker
            </p>
            <ul className="space-y-0.5">
              {jobTrackerLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-[0.72rem] text-[#6F7068] hover:text-[#315B45] font-medium transition block leading-snug"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Column */}
          <div className="space-y-1">
            <p className="text-[0.62rem] font-bold tracking-wider uppercase text-[#92928A]">
              Resources
            </p>
            <ul className="space-y-0.5">
              {resourceLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-[0.72rem] text-[#6F7068] hover:text-[#315B45] font-medium transition block leading-snug"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-3 pt-2.5 border-t border-[#E5E0D6] flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[0.68rem] text-[#92928A]">
          <p>© {new Date().getFullYear()} Careerly. Placement Preparation OS.</p>
          <div className="flex items-center gap-3.5 text-[#6F7068]">
            <Link to="/dashboard" className="hover:text-[#315B45] transition">Workspace</Link>
            <Link to="/chat-mentor" className="hover:text-[#315B45] transition">Mentor</Link>
            <Link to="/interview-prep" className="hover:text-[#315B45] transition">Mock Interview</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
