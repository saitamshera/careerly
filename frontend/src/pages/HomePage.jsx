import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Briefcase,
  FileText,
  Video,
  Code2,
  ChevronRight,
  Target,
  Flame,
  Globe,
  Compass
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export function HomePage() {
  return (
    <main className="relative min-h-screen bg-[#fafaf9] dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-4 pb-20 pt-6 sm:px-8 lg:px-12 animate-fadeIn">
      {/* Header Bar */}
      <header className="relative mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-6 py-3.5 shadow-2xs backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-black text-sm shadow-xs">
            C
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Careerly
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mb-0.5" />
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 transition hover:text-slate-900 dark:hover:text-white"
          >
            Sign In
          </Link>
          <Link to="/register">
            <Button size="sm" icon={ArrowRight}>
              Open Workspace
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl py-16 sm:py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          <span>Placement Preparation Operating System</span>
        </div>

        <h1 className="mt-6 mx-auto max-w-4xl text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Everything you need to secure your top software engineering offer.
        </h1>

        <p className="mt-5 mx-auto max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-400">
          Unify your LeetCode telemetry, GitHub engineering proof, voice AI mock interviewer, and full-funnel job application pipeline in a single, focused workspace.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/register">
            <Button size="lg" icon={ArrowRight}>
              Start Placement Prep
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="secondary" size="lg" icon={ChevronRight}>
              Explore Workspace
            </Button>
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-16 grid gap-5 md:grid-cols-3 text-left">
          <Card className="p-6 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-100 dark:border-emerald-800/60">
              <Code2 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Coding Profiles Hub & Sync
            </h3>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Live synchronized LeetCode and GitHub metrics, company-tagged problem coverage, and candidate readiness scoring.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 font-bold border border-purple-100 dark:border-purple-800/60">
              <Video className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Voice AI Mock Interviews
            </h3>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Real-time voice mock interviews with live speech transcription, natural thinking pauses, and bar-raiser evaluation reports.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold border border-amber-100 dark:border-amber-800/60">
              <Briefcase className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Application Pipeline CRM
            </h3>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Track company applications, upcoming online assessments, technical rounds, and conversion velocity analytics.
            </p>
          </Card>
        </div>
      </section>
    </main>
  );
}
