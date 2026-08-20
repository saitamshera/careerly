import React, { useState } from 'react';
import { Globe, Play, ArrowRight, Trash2 } from 'lucide-react';
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
    <section className="space-y-5 max-w-2xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#20211E]">
          AI Interview Arena
        </h1>
        <p className="text-xs text-[#6F7068] max-w-md mx-auto leading-relaxed">
          Interactive voice mock interviews with live transcription, adaptive follow-ups, and recruiter evaluations.
        </p>
      </div>

      {/* Config Form Card */}
      <Card className="p-5 space-y-4">
        <CardHeader
          title="Configure Interview Session"
          subtitle="Select your interview track, seniority, and target company."
        />

        <form onSubmit={onSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-[#20211E] mb-1">
              Interview Track / Style
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-lg border border-[#E5E0D6] bg-[#FFFDF8] p-2 text-xs text-[#20211E] outline-none focus:border-[#315B45] cursor-pointer"
            >
              {COMPANY_STYLES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-[#20211E] mb-1">
                Seniority / Level
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full rounded-lg border border-[#E5E0D6] bg-[#FFFDF8] p-2 text-xs text-[#20211E] outline-none focus:border-[#315B45] cursor-pointer"
              >
                <option value="easy">Entry / SDE-1 (0-1 yrs)</option>
                <option value="medium">Intermediate / SDE-2 (2-4 yrs)</option>
                <option value="hard">Senior / Staff (5+ yrs)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#20211E] mb-1">
                Target Role
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. SDE-1, Backend"
                className="w-full rounded-lg border border-[#E5E0D6] bg-[#FFFDF8] p-2 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#20211E] mb-1">
                Target Company <span className="text-[0.65rem] text-[#92928A] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="e.g. Google, Amazon"
                className="w-full rounded-lg border border-[#E5E0D6] bg-[#FFFDF8] p-2 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
              />
            </div>
          </div>

          {/* Language Notice */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#F5F2EA] border border-[#E5E0D6] text-xs text-[#6F7068]">
            <Globe className="w-3.5 h-3.5 text-[#315B45] shrink-0" />
            <span>Voice & TTS configured for <strong className="text-[#20211E]">English (en-IN / en-US)</strong> with live transcription.</span>
          </div>

          {/* Collapsible JD context */}
          <div>
            <button
              type="button"
              onClick={() => setShowJobDescField(!showJobDescField)}
              className="text-xs font-semibold text-[#315B45] hover:underline cursor-pointer"
            >
              {showJobDescField ? '− Hide Job Description' : '+ Add specific Job Description (Optional)'}
            </button>

            {showJobDescField && (
              <textarea
                rows={3}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste job description requirements to tailor questions..."
                className="mt-2 w-full rounded-lg border border-[#E5E0D6] bg-[#FFFDF8] p-2 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
              />
            )}
          </div>

          <div className="pt-1">
            <Button
              type="submit"
              size="md"
              className="w-full"
              icon={Play}
              isLoading={isPending}
            >
              {isPending ? 'Preparing Interview Session...' : 'Start Interview →'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Past Sessions List */}
      {pastSessions.length > 0 && (
        <Card className="space-y-3 p-4">
          <CardHeader
            title="Past Interview Evaluations"
            subtitle="Review transcripts, metrics, and evaluator scorecards."
          />

          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
            {pastSessions.map((session) => (
              <div
                key={session._id}
                onClick={() => onSelectSession(session._id)}
                className="group p-2.5 rounded-lg border border-[#E5E0D6] bg-[#FFFDF8] flex items-center justify-between hover:bg-[#F5F2EA] cursor-pointer transition"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#20211E]">
                      {session.targetRole || session.role || session.topic || 'Software Engineer'} ({session.type || session.interviewType || 'technical'})
                    </span>
                    <Badge variant={session.status === 'completed' ? 'green' : 'orange'} size="sm">
                      {session.status}
                    </Badge>
                  </div>
                  <p className="text-[0.68rem] text-[#92928A]">
                    {session.createdAt ? new Date(session.createdAt).toLocaleDateString() : 'Recent Session'} • {session.questions?.length || 0} Questions
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs font-semibold text-[#315B45]">
                    <span>Scorecard</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>

                  <button
                    type="button"
                    title="Delete evaluation"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingSession(session);
                    }}
                    className="p-1 rounded-md text-[#92928A] hover:text-[#B83A35] hover:bg-[#FDECEB] transition cursor-pointer"
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
          <p className="text-[#6F7068] leading-relaxed">
            Are you sure you want to delete the evaluation for{' '}
            <strong className="text-[#20211E]">
              "{deletingSession?.targetRole || deletingSession?.role || deletingSession?.topic || 'Interview'}"
            </strong>
            ? This action cannot be undone.
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
