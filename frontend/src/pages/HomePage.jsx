import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Briefcase,
  Video,
  Code2,
  ChevronRight
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';

export function HomePage() {
  return (
    <main className="relative min-h-screen bg-[#F8F6F0] text-[#20211E] px-4 pb-20 pt-6 sm:px-8 lg:px-12 animate-fadeIn">
      {/* Header Bar */}
      <header className="relative mx-auto flex max-w-5xl items-center justify-between rounded-xl border border-[#E3DED3] bg-[#FFFDF8] px-5 py-3 shadow-2xs">
        <Link to="/" className="flex items-center">
          <Logo />
        </Link>

        <div className="flex items-center gap-2.5">
          <Link
            to="/login"
            className="px-3 py-1.5 text-xs font-semibold text-[#5F625C] transition hover:text-[#20211E]"
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
      <section className="relative mx-auto max-w-4xl py-14 sm:py-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#D1E0D7] bg-[#E8F0EA] px-3 py-1 text-xs font-bold text-[#315B45]">
          <Sparkles className="h-3.5 w-3.5 text-[#315B45]" />
          <span>Placement Preparation Operating System</span>
        </div>

        <h1 className="mt-5 mx-auto max-w-3xl text-3xl sm:text-5xl font-bold tracking-tight text-[#20211E] leading-tight">
          Everything you need to secure your top software engineering offer.
        </h1>

        <p className="mt-4 mx-auto max-w-2xl text-xs sm:text-sm leading-relaxed text-[#5F625C]">
          Unify your LeetCode telemetry, GitHub engineering proof, voice AI mock interviewer, and full-funnel job application pipeline in a single, focused workspace.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
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
        <div className="mt-12 grid gap-4 md:grid-cols-3 text-left">
          <Card className="p-5 space-y-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F0EA] text-[#315B45] font-bold border border-[#D1E0D7]">
              <Code2 className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-sm font-bold text-[#20211E]">
              Coding Profiles Hub & Sync
            </h3>
            <p className="text-xs leading-relaxed text-[#5F625C]">
              Live synchronized LeetCode and GitHub metrics, company-tagged problem coverage, and candidate readiness scoring.
            </p>
          </Card>

          <Card className="p-5 space-y-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F0EA] text-[#315B45] font-bold border border-[#D1E0D7]">
              <Video className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-sm font-bold text-[#20211E]">
              Voice AI Mock Interviews
            </h3>
            <p className="text-xs leading-relaxed text-[#5F625C]">
              Real-time voice mock interviews with live speech transcription, natural thinking pauses, and bar-raiser evaluation reports.
            </p>
          </Card>

          <Card className="p-5 space-y-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FBF4E6] text-[#B9822E] font-bold border border-[#F3E3C4]">
              <Briefcase className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-sm font-bold text-[#20211E]">
              Application Pipeline CRM
            </h3>
            <p className="text-xs leading-relaxed text-[#5F625C]">
              Track company applications, upcoming online assessments, technical rounds, and conversion velocity analytics.
            </p>
          </Card>
        </div>
      </section>
    </main>
  );
}
