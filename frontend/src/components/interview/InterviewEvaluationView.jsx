import React, { useState } from 'react';
import {
  Award,
  Download,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  BookOpen,
  MessageSquare
} from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export function InterviewEvaluationView({
  activeSession,
  onResetInterview,
  onDownloadReport
}) {
  const [showTranscriptDrawer, setShowTranscriptDrawer] = useState(false);

  return (
    <section className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="green">EVALUATION COMPLETE</Badge>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mt-1">
            <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Senior Bar-Raiser Scorecard</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeSession.targetRole || activeSession.topic} • {String(activeSession.type || '').toUpperCase()} • {String(activeSession.difficulty || '').toUpperCase()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={() => onDownloadReport(activeSession)}
          >
            Download Report (.MD)
          </Button>

          <Button
            size="sm"
            icon={RotateCcw}
            onClick={onResetInterview}
          >
            New Interview
          </Button>
        </div>
      </div>

      {/* Overall Score Dial & Verdict Hero */}
      <Card className="p-6 sm:p-8 space-y-6 bg-gradient-to-r from-white via-slate-50/50 to-emerald-50/20 dark:from-slate-900 dark:via-slate-900/90 dark:to-emerald-950/20">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 shrink-0">
            <div className="flex items-center justify-center w-24 h-24 rounded-full border-4 border-emerald-500/30 bg-white dark:bg-slate-900 shadow-inner">
              <div className="text-center">
                <span className="text-3xl font-black font-mono text-slate-900 dark:text-slate-100 tracking-tight">
                  {activeSession.evaluationReport?.overallScore || activeSession.score || 0}
                </span>
                <span className="block text-[0.65rem] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  /100
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <Badge variant="green" size="md">
                {activeSession.evaluationReport?.verdict || 'Evaluation Complete'}
              </Badge>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-sm leading-relaxed">
                {activeSession.evaluationReport?.executiveSummary || activeSession.feedback || 'Detailed hiring evaluation.'}
              </p>
            </div>
          </div>

          {/* Dimension Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs w-full sm:w-auto">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[0.65rem] text-slate-400 uppercase font-bold block">Communication</span>
              <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {activeSession.evaluationReport?.communication || activeSession.communication || 0}%
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[0.65rem] text-slate-400 uppercase font-bold block">Tech Depth</span>
              <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {activeSession.evaluationReport?.technicalKnowledge || activeSession.technicalKnowledge || 0}%
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[0.65rem] text-slate-400 uppercase font-bold block">Problem Solving</span>
              <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {activeSession.evaluationReport?.problemSolving || activeSession.problemSolving || 0}%
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Strengths & Weaknesses */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Card className="space-y-3">
          <CardHeader
            title="Demonstrated Strengths"
            action={<Badge variant="green">Highlights</Badge>}
          />
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            {(activeSession.evaluationReport?.strengths || ['Clear problem statement breakdown.', 'Maintained structured thought process.']).map((s, idx) => (
              <li key={idx} className="flex items-start gap-2 p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-3">
          <CardHeader
            title="Critical Growth Areas"
            action={<Badge variant="orange">Actionable</Badge>}
          />
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            {(activeSession.evaluationReport?.areasToImprove || activeSession.evaluationReport?.areasForImprovement || ['Quantify STAR impacts with concrete business metrics.', 'Address edge cases before jumping into solution.']).map((w, idx) => (
              <li key={idx} className="flex items-start gap-2 p-2 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/40">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Architectural Claims & Defense Analysis */}
      {(activeSession.evaluationReport?.strongestDefendedClaim?.claim || activeSession.evaluationReport?.weakestDefendedClaim?.claim) && (
        <Card className="space-y-4">
          <CardHeader
            title="Architectural Claims & Defense Analysis"
            subtitle="How well did your technical claims and performance metrics hold up under rigorous follow-up probing?"
            action={<Badge variant="blue">Bar-Raiser Defense</Badge>}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Strongest Defended Claim */}
            <div className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Strongest Defended Claim
                </span>
                {activeSession.evaluationReport?.strongestDefendedClaim?.technology && (
                  <Badge variant="green" size="sm">
                    {activeSession.evaluationReport.strongestDefendedClaim.technology}
                  </Badge>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                "{activeSession.evaluationReport?.strongestDefendedClaim?.claim || 'Solid technical justification.'}"
              </p>
              <p className="text-[0.72rem] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                {activeSession.evaluationReport?.strongestDefendedClaim?.defenseSummary || 'Demonstrated clear understanding of system boundaries and failure modes.'}
              </p>
            </div>

            {/* Weakest Defended Claim */}
            <div className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  Weakest Defended Claim / Metric
                </span>
                {activeSession.evaluationReport?.weakestDefendedClaim?.technology && (
                  <Badge variant="orange" size="sm">
                    {activeSession.evaluationReport.weakestDefendedClaim.technology}
                  </Badge>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                "{activeSession.evaluationReport?.weakestDefendedClaim?.claim || 'Unverified metric or scaling claim.'}"
              </p>
              <p className="text-[0.72rem] text-amber-800 dark:text-amber-300 leading-relaxed">
                {activeSession.evaluationReport?.weakestDefendedClaim?.issue || 'Could not substantiate baseline measurements or handle failure edge cases when probed.'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Technical Decisions & Trade-offs */}
      {(activeSession.evaluationReport?.strongestTechnicalDecision?.decision || activeSession.evaluationReport?.weakestTradeoffAnalysis?.decision) && (
        <Card className="space-y-4">
          <CardHeader
            title="Technical Decision Making & Trade-offs"
            subtitle="Senior engineers are evaluated on how thoughtfully they weigh trade-offs against alternatives."
          />

          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
              <span className="text-[0.68rem] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                Top Architectural Decision
              </span>
              <p className="font-bold text-slate-900 dark:text-slate-100">
                {activeSession.evaluationReport?.strongestTechnicalDecision?.decision}
              </p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[0.72rem]">
                {activeSession.evaluationReport?.strongestTechnicalDecision?.justification}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
              <span className="text-[0.68rem] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                Missing Trade-off Consideration
              </span>
              <p className="font-bold text-slate-900 dark:text-slate-100">
                {activeSession.evaluationReport?.weakestTradeoffAnalysis?.decision}
              </p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[0.72rem]">
                {activeSession.evaluationReport?.weakestTradeoffAnalysis?.missingTradeoff}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Recommended Practice Areas (Closed-Loop Anchor) */}
      {(activeSession.evaluationReport?.recommendedPracticeAreas?.length > 0 || activeSession.evaluationReport?.depthGaps?.length > 0) && (
        <Card className="space-y-4 border-emerald-200 dark:border-emerald-900/50">
          <CardHeader
            title="Closed-Loop Action: Recommended Practice Topics"
            subtitle="Targeted drills generated directly from your interview gaps to improve your Placement Readiness score."
            action={<Badge variant="green">Next Steps</Badge>}
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(activeSession.evaluationReport?.recommendedPracticeAreas || activeSession.evaluationReport?.depthGaps || []).slice(0, 6).map((topic, tIdx) => (
              <div
                key={tIdx}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 flex flex-col justify-between space-y-2"
              >
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {topic}
                </span>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex justify-end">
                  <a
                    href={`/dsa-tracker?topic=${encodeURIComponent(topic)}`}
                    className="text-[0.7rem] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1"
                  >
                    <span>Practice Topic</span>
                    <Sparkles className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Question by Question Transcript Drawer Toggle */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              Full Dialogue & Question-by-Question Transcript
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTranscriptDrawer(!showTranscriptDrawer)}
          >
            {showTranscriptDrawer ? 'Collapse Transcript' : `Expand ${activeSession.questions?.length || 0} Exchanges`}
          </Button>
        </div>

        {showTranscriptDrawer && (
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {(activeSession.questions || []).map((questionText, qIdx) => (
              <div key={qIdx} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 space-y-2 text-xs">
                <div className="font-bold text-slate-900 dark:text-slate-100">
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">Q{qIdx + 1}: </span>
                  {typeof questionText === 'string' ? questionText : questionText?.question || 'Question'}
                </div>
                <div className="pl-4 border-l-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-400 block text-[0.68rem] uppercase">Your Answer:</span>
                  <p className="mt-0.5 leading-relaxed">
                    {activeSession.answers?.[qIdx] || (typeof questionText === 'object' ? questionText?.userAnswer : null) || 'No response recorded.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}
