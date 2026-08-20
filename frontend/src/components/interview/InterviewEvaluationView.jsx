import React, { useState } from 'react';
import {
  Award,
  Download,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
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
    <section className="space-y-5 max-w-3xl mx-auto animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E5E0D6]">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="green">Evaluation Complete</Badge>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#20211E] flex items-center gap-2 mt-1">
            <Award className="w-5 h-5 text-[#315B45]" />
            <span>Senior Bar-Raiser Scorecard</span>
          </h2>
          <p className="text-xs text-[#6F7068] mt-0.5">
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
            Download Report
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
      <Card className="p-5 space-y-4 bg-[#FFFDF8]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center justify-center w-18 h-18 rounded-full border-2 border-[#315B45]/30 bg-[#E8F0EA]">
              <div className="text-center">
                <span className="text-2xl font-bold font-mono text-[#20211E] tracking-tight">
                  {activeSession.evaluationReport?.overallScore || activeSession.score || 0}
                </span>
                <span className="block text-[0.62rem] font-bold uppercase tracking-wider text-[#315B45]">
                  /100
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <Badge variant="green" size="md">
                {activeSession.evaluationReport?.verdict || 'Evaluation Complete'}
              </Badge>
              <p className="text-xs text-[#6F7068] max-w-sm leading-relaxed">
                {activeSession.evaluationReport?.executiveSummary || activeSession.feedback || 'Detailed hiring evaluation.'}
              </p>
            </div>
          </div>

          {/* Dimension Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs w-full sm:w-auto">
            <div className="p-2 rounded-lg bg-[#F5F2EA] border border-[#E5E0D6] text-center">
              <span className="text-[0.65rem] text-[#92928A] uppercase font-bold block">Communication</span>
              <span className="text-sm font-bold font-mono text-[#315B45] mt-0.5 block">
                {activeSession.evaluationReport?.communication || activeSession.communication || 0}%
              </span>
            </div>
            <div className="p-2 rounded-lg bg-[#F5F2EA] border border-[#E5E0D6] text-center">
              <span className="text-[0.65rem] text-[#92928A] uppercase font-bold block">Tech Depth</span>
              <span className="text-sm font-bold font-mono text-[#315B45] mt-0.5 block">
                {activeSession.evaluationReport?.technicalKnowledge || activeSession.technicalKnowledge || 0}%
              </span>
            </div>
            <div className="p-2 rounded-lg bg-[#F5F2EA] border border-[#E5E0D6] text-center">
              <span className="text-[0.65rem] text-[#92928A] uppercase font-bold block">Problem Solving</span>
              <span className="text-sm font-bold font-mono text-[#315B45] mt-0.5 block">
                {activeSession.evaluationReport?.problemSolving || activeSession.problemSolving || 0}%
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Strengths & Weaknesses */}
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Card className="space-y-2.5 p-4">
          <CardHeader
            title="Demonstrated Strengths"
            action={<Badge variant="green">Highlights</Badge>}
          />
          <ul className="space-y-1 text-xs text-[#6F7068]">
            {(activeSession.evaluationReport?.strengths || ['Clear problem statement breakdown.', 'Maintained structured thought process.']).map((s, idx) => (
              <li key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-[#E8F0EA]/40 border border-[#D1E0D7]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#315B45] mt-0.5 shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-2.5 p-4">
          <CardHeader
            title="Critical Growth Areas"
            action={<Badge variant="orange">Actionable</Badge>}
          />
          <ul className="space-y-1 text-xs text-[#6F7068]">
            {(activeSession.evaluationReport?.areasToImprove || activeSession.evaluationReport?.areasForImprovement || ['Quantify STAR impacts with concrete business metrics.', 'Address edge cases before jumping into solution.']).map((w, idx) => (
              <li key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-[#F7E7DD]/40 border border-[#F0D0BF]">
                <AlertTriangle className="h-3.5 w-3.5 text-[#C9683A] mt-0.5 shrink-0" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Recommended Practice Areas */}
      {(activeSession.evaluationReport?.recommendedPracticeAreas?.length > 0 || activeSession.evaluationReport?.depthGaps?.length > 0) && (
        <Card className="space-y-3 p-4">
          <CardHeader
            title="Recommended Practice Topics"
            subtitle="Targeted drills generated directly from your interview gaps."
            action={<Badge variant="green">Next Steps</Badge>}
          />

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(activeSession.evaluationReport?.recommendedPracticeAreas || activeSession.evaluationReport?.depthGaps || []).slice(0, 6).map((topic, tIdx) => (
              <div
                key={tIdx}
                className="p-2.5 rounded-lg border border-[#E5E0D6] bg-[#FFFDF8] flex flex-col justify-between space-y-2"
              >
                <span className="text-xs font-bold text-[#20211E]">
                  {topic}
                </span>
                <div className="pt-1.5 border-t border-[#F0ECE4] flex justify-end">
                  <a
                    href={`/dsa-tracker?topic=${encodeURIComponent(topic)}`}
                    className="text-[0.68rem] font-bold text-[#315B45] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Practice</span>
                    <Sparkles className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Transcript Drawer Toggle */}
      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#315B45]" />
            <h3 className="text-xs sm:text-sm font-bold text-[#20211E]">
              Question-by-Question Transcript
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTranscriptDrawer(!showTranscriptDrawer)}
          >
            {showTranscriptDrawer ? 'Collapse' : `Expand (${activeSession.questions?.length || 0})`}
          </Button>
        </div>

        {showTranscriptDrawer && (
          <div className="space-y-2 pt-2.5 border-t border-[#F0ECE4]">
            {(activeSession.questions || []).map((questionText, qIdx) => (
              <div key={qIdx} className="p-2.5 rounded-lg border border-[#E5E0D6] bg-[#F5F2EA]/60 space-y-1 text-xs">
                <div className="font-bold text-[#20211E]">
                  <span className="text-[#315B45] font-mono">Q{qIdx + 1}: </span>
                  {typeof questionText === 'string' ? questionText : questionText?.question || 'Question'}
                </div>
                <div className="pl-3 border-l-2 border-[#E5E0D6] text-[#6F7068]">
                  <span className="font-semibold text-[#92928A] block text-[0.65rem] uppercase">Your Answer:</span>
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
