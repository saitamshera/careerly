import React, { useState } from 'react';
import { Video, Sparkles, Globe, Play, History, ArrowRight, Trash2 } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export const COMPANY_STYLES = [
  { label: 'Amazon STAR Behavioral & Leadership', value: 'behavioral' },
  { label: 'Google Algorithmic Problem Solving & CS', value: 'technical' },
  { label: 'Meta System Design & Architecture', value: 'system-design' },
  { label: 'Resume & Project Deep Dive', value: 'resume-based' },
  { label: 'HR, Culture Fit & Communication', value: 'hr' }
];

export function InterviewConfigCard({
  selectedType,
  setSelectedType,
  selectedDifficulty,
  setSelectedDifficulty,
  targetRole,
  setTargetRole,
  targetCompany,
  setTargetCompany,
  jobDescription,
  setJobDescription,
  showJobDescField,
  setShowJobDescField,
  onSubmit,
  isPending,
  pastSessions = [],
  onSelectSession,
  onDeleteSession,
  isDeleting = false
}) {
  const [deletingSession, setDeletingSession] = useState(null);
  return (
    <section className="space-y-8 max-w-3xl mx-auto animate-fadeIn">
      {/* Hero Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-Life Technical & Behavioral Mock Arena</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2.5">
          <Video className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          <span>AI Interview Arena</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Practice interactive voice mock interviews with live transcription, natural pauses, adaptive follow-up probing, and senior recruiter scorecards.
        </p>
      </div>

      {/* Config Form Card */}
      <Card className="p-6 sm:p-8 space-y-6">
        <CardHeader
          title="Configure Interview Session"
          subtitle="Select your interview track, seniority level, and target role."
        />

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Interview Track / Style
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 transition cursor-pointer"
            >
              {COMPANY_STYLES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Seniority / Difficulty
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 transition cursor-pointer"
              >
                <option value="easy">Entry Level / SDE-1 (0-1 yrs)</option>
                <option value="medium">Intermediate / SDE-2 (2-4 yrs)</option>
                <option value="hard">Senior / Staff (5+ yrs)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Role
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. SDE-1, Backend"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Company <span className="text-[0.68rem] text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="e.g. Google, Amazon, Uber"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Language Notice */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 text-xs text-slate-500">
            <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Voice & TTS configured for <strong className="text-slate-800 dark:text-slate-200">English (en-IN / en-US)</strong> with live transcription.</span>
          </div>

          {/* Collapsible JD context */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowJobDescField(!showJobDescField)}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              {showJobDescField ? '− Hide Job Description context' : '+ Add specific Job Description (Optional)'}
            </button>

            {showJobDescField && (
              <textarea
                rows={3}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste job description requirements to tailor questions..."
                className="mt-2.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
              />
            )}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              icon={Play}
              isLoading={isPending}
            >
              {isPending ? 'Preparing Interview Studio...' : 'Start Real Mock Interview'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Past Sessions List */}
      {pastSessions.length > 0 && (
        <Card className="space-y-4">
          <CardHeader
            title="Past Interview Evaluations"
            subtitle="Review detailed bar-raiser evaluations, transcripts, and scoring history."
          />

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {pastSessions.map((session) => (
              <div
                key={session._id}
                onClick={() => onSelectSession(session._id)}
                className="group p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {session.targetRole || session.role || session.topic || 'Software Engineer'} ({session.type || session.interviewType || 'technical'})
                    </span>
                    <Badge variant={session.status === 'completed' ? 'green' : 'orange'} size="sm">
                      {session.status}
                    </Badge>
                  </div>
                  <p className="text-[0.68rem] text-slate-400">
                    {session.createdAt ? new Date(session.createdAt).toLocaleDateString() : 'Recent Session'} • {session.questions?.length || 0} Questions
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <span>Scorecard</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>

                  <button
                    type="button"
                    title="Delete interview evaluation"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingSession(session);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingSession)}
        onClose={() => setDeletingSession(null)}
        title="Delete Interview Evaluation?"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Are you sure you want to delete the evaluation for{' '}
            <strong className="text-slate-900 dark:text-white">
              "{deletingSession?.targetRole || deletingSession?.role || deletingSession?.topic || 'Interview'}"
            </strong>
            ? This action is permanent and cannot be undone.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeletingSession(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={async () => {
                if (deletingSession && onDeleteSession) {
                  await onDeleteSession(deletingSession._id);
                  setDeletingSession(null);
                }
              }}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
