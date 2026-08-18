import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  Flame,
  Calendar,
  Mail,
  Plus,
  RefreshCw,
  ArrowRight,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { syncGmailInbox, fetchGmailAuthUrl } from '../services/gmail.api';

export function TodayFocus({ summary, onRefresh }) {
  const [syncingGmail, setSyncingGmail] = useState(false);
  const [gmailMessages, setGmailMessages] = useState([]);

  const todaySolved = summary?.todayDsaSolved || 2;
  const dailyGoal = summary?.todayGoal || 3;
  const dsaStreak = summary?.dsaStreak || 14;
  const nextOA = summary?.nextOA || null;
  const gmailConnected = summary?.gmailConnected || false;

  async function handleGmailSync() {
    if (!gmailConnected) {
      const url = await fetchGmailAuthUrl();
      if (url) window.location.href = url;
      return;
    }

    setSyncingGmail(true);
    try {
      const updates = await syncGmailInbox();
      setGmailMessages(updates);
      if (onRefresh) onRefresh();
    } finally {
      setSyncingGmail(false);
    }
  }

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="rounded-2xl bg-[#28234d] p-6 text-white shadow-lg space-y-5">
      {/* Top Banner Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-400/30">
            ⭐
          </div>
          <div>
            <h2 className="serif-font text-2xl font-bold tracking-tight text-white">TODAY'S FOCUS</h2>
            <p className="text-[0.7rem] text-indigo-200 font-medium">Prioritize your daily problem solving & upcoming company assessments.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[0.7rem] font-semibold tracking-wide text-indigo-200 uppercase">
            {currentDateStr}
          </span>
        </div>
      </div>

      {/* 3 Main Priority Cards Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Panel 1: DSA Daily */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" /> DSA Today
            </span>
            <span className="rounded-full bg-amber-500/20 border border-amber-400/30 px-2 py-0.5 text-[0.65rem] font-bold text-amber-300 flex items-center gap-1">
              <Flame className="h-3 w-3 fill-amber-400 text-amber-400" /> {dsaStreak} day streak
            </span>
          </div>

          <div>
            <p className="serif-font text-3xl font-bold text-white">
              {todaySolved} <span className="text-sm font-sans font-normal text-indigo-200">/ {dailyGoal} solved</span>
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/20">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((todaySolved / dailyGoal) * 100))}%` }}
              />
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between border-t border-white/10 text-xs">
            <span className="text-[0.7rem] text-indigo-200 font-medium">Daily Target</span>
            <Link to="/dsa-tracker" className="font-bold text-amber-400 hover:underline flex items-center gap-1">
              + Add Problem <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Panel 2: Next OA Countdown */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Upcoming OA
            </span>
            <span className="text-[0.65rem] font-semibold text-indigo-200">Countdown</span>
          </div>

          {nextOA ? (
            <div>
              <p className="text-base font-bold text-white truncate">{nextOA.company} - {nextOA.role}</p>
              <p className="text-xs text-indigo-200 mt-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3 text-emerald-400" />
                <span>{nextOA.oaPlatform || 'HackerRank'} · {nextOA.oaDate ? String(nextOA.oaDate).slice(0, 10) : 'Upcoming'}</span>
              </p>
            </div>
          ) : (
            <div>
              <p className="text-base font-bold text-white">Amazon · SDE II</p>
              <p className="text-xs text-indigo-200 mt-0.5">OA scheduled in 3 days on HackerRank</p>
            </div>
          )}

          <div className="pt-1 flex items-center justify-between border-t border-white/10 text-xs">
            <span className="text-[0.7rem] text-indigo-200 font-medium">Online Assessment</span>
            <Link to="/job-tracker" className="font-bold text-emerald-400 hover:underline flex items-center gap-1">
              View Pipeline <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Panel 3: Gmail Auto-Updates */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Gmail Updates
            </span>
            {gmailConnected ? (
              <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Connected
              </span>
            ) : (
              <span className="rounded-full bg-white/10 border border-white/20 px-2 py-0.5 text-[0.65rem] font-bold text-white/70">
                Not Linked
              </span>
            )}
          </div>

          <div>
            <p className="text-sm font-bold text-white">
              {gmailMessages.length ? `${gmailMessages.length} company emails synced` : gmailConnected ? 'Inbox synced for company OAs' : 'Auto-detect company updates'}
            </p>
            <p className="text-xs text-indigo-200 mt-0.5 truncate">
              {gmailMessages[0]?.subject || 'Sync email inbox to parse interview invites.'}
            </p>
          </div>

          <div className="pt-1 flex items-center justify-between border-t border-white/10 text-xs">
            <span className="text-[0.7rem] text-indigo-200 font-medium">Recruiter Mail</span>
            <button
              onClick={handleGmailSync}
              disabled={syncingGmail}
              className="font-bold text-rose-300 hover:underline flex items-center gap-1 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${syncingGmail ? 'animate-spin' : ''}`} />
              <span>{gmailConnected ? 'Sync Mail' : 'Connect Gmail'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-4 text-xs font-semibold">
        <span className="text-[0.68rem] uppercase font-bold text-indigo-200">Quick Actions:</span>
        <Link
          to="/dsa-tracker"
          className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-white hover:bg-white/20 transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Problem</span>
        </Link>
        <Link
          to="/job-tracker"
          className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-white hover:bg-white/20 transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Company</span>
        </Link>
        <Link
          to="/profile"
          className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-white hover:bg-white/20 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Sync LeetCode Profile</span>
        </Link>
      </div>
    </div>
  );
}
