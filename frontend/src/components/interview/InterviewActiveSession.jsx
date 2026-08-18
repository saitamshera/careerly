import React from 'react';
import {
  Clock,
  Bot,
  Activity,
  BrainCircuit,
  Mic,
  MicOff,
  Check,
  Volume2,
  Send,
  Edit3
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export function InterviewActiveSession({
  activeSession,
  interviewState,
  secondsElapsed,
  formatTime,
  currentQuestion,
  onReplayVoice,
  transcript,
  interimText,
  displayedResponse,
  showTextInput,
  setShowTextInput,
  onTranscriptChange,
  onStartSpeaking,
  onStopSpeaking,
  onSubmitAnswer,
  isSubmittingAnswer,
  onOpenEndModal
}) {
  return (
    <section className="space-y-6 max-w-3xl mx-auto animate-fadeIn">
      {/* Top Session Status Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <Badge variant="green" size="md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1 inline-block" />
            <span>LIVE INTERVIEW</span>
          </Badge>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 hidden sm:inline">
            {activeSession.targetRole} • {String(activeSession.type || '').toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{formatTime(secondsElapsed)}</span>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={onOpenEndModal}
          >
            End Interview
          </Button>
        </div>
      </div>

      {/* Main Studio Arena Card */}
      <Card className="p-6 sm:p-10 text-center space-y-7 shadow-md">
        {/* Interviewer Persona Stage */}
        <div className="space-y-3">
          <div className="relative inline-flex items-center justify-center">
            {interviewState === 'AI_SPEAKING' && (
              <>
                <span className="absolute w-24 h-24 rounded-full bg-emerald-500/20 animate-ping" />
                <span className="absolute w-32 h-32 rounded-full bg-emerald-500/10 animate-pulse" />
              </>
            )}
            {interviewState === 'CANDIDATE_SPEAKING' && (
              <span
                className="absolute w-24 h-24 rounded-full bg-emerald-500/20 animate-ping"
              />
            )}

            <div
              className={`relative flex items-center justify-center w-20 h-20 rounded-full border-2 transition-all duration-300 ${
                interviewState === 'AI_SPEAKING'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-600 scale-105 shadow-md dark:bg-emerald-950/40 dark:text-emerald-300'
                  : interviewState === 'CANDIDATE_SPEAKING'
                  ? 'bg-emerald-100 border-emerald-600 text-emerald-700 scale-105 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : interviewState === 'SUBMITTING_ANSWER'
                  ? 'bg-amber-50 border-amber-400 text-amber-600 animate-pulse dark:bg-amber-950/40 dark:text-amber-300'
                  : 'bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
              }`}
            >
              <Bot className="w-9 h-9" />
            </div>
          </div>

          {/* State Indicator */}
          <div>
            <span className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-400 block">
              {interviewState === 'AI_SPEAKING' ? (
                <span className="text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1.5 font-bold">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  <span>INTERVIEWER SPEAKING...</span>
                </span>
              ) : interviewState === 'SUBMITTING_ANSWER' ? (
                <span className="text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1.5 font-bold">
                  <BrainCircuit className="w-3.5 h-3.5 animate-spin" />
                  <span>EVALUATING & FORMULATING FOLLOW-UP...</span>
                </span>
              ) : interviewState === 'CANDIDATE_SPEAKING' ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5 font-bold">
                  <Mic className="w-3.5 h-3.5 animate-bounce" />
                  <span>LISTENING (CANDIDATE SPEAKING)</span>
                </span>
              ) : interviewState === 'ANSWER_READY' ? (
                <span className="text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1.5 font-bold">
                  <Check className="w-3.5 h-3.5" />
                  <span>ANSWER RECORDED — READY FOR SUBMISSION</span>
                </span>
              ) : (
                <span>YOUR TURN</span>
              )}
            </span>
          </div>
        </div>

        {/* Current Question Display */}
        <div className="max-w-xl mx-auto space-y-2">
          <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed tracking-tight">
            "{currentQuestion}"
          </p>

          <button
            type="button"
            onClick={onReplayVoice}
            className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold transition cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Replay Voice Question</span>
          </button>
        </div>

        {/* Candidate Response & Live Transcription Box */}
        <div className="max-w-xl mx-auto space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-left">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              {interviewState === 'CANDIDATE_SPEAKING' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Speech Transcription (English):</span>
                </>
              ) : (
                <span>Your Response:</span>
              )}
            </span>

            <button
              type="button"
              onClick={() => setShowTextInput((prev) => !prev)}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold text-xs transition cursor-pointer flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" />
              <span>{showTextInput ? 'Hide Text Editor' : 'Edit Response Text'}</span>
            </button>
          </div>

          {(!showTextInput || interviewState === 'CANDIDATE_SPEAKING') && (
            <div
              className={`p-4 rounded-xl border text-xs min-h-[90px] leading-relaxed transition ${
                interviewState === 'CANDIDATE_SPEAKING'
                  ? 'bg-emerald-50/50 border-emerald-300 text-slate-900 dark:bg-emerald-950/20 dark:border-emerald-700 dark:text-emerald-100'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
              }`}
            >
              {displayedResponse ? (
                <p className="whitespace-pre-wrap leading-relaxed">
                  {transcript}
                  {interimText && (
                    <span className="text-emerald-600 dark:text-emerald-400 italic"> {interimText}</span>
                  )}
                </p>
              ) : (
                <span className="text-slate-400 italic">
                  {interviewState === 'CANDIDATE_SPEAKING'
                    ? 'Listening... speak clearly. Pauses will not interrupt you.'
                    : 'Click "Start Speaking" or use the text editor to answer.'}
                </span>
              )}
            </div>
          )}

          {showTextInput && (
            <div className="space-y-1">
              <textarea
                rows={4}
                value={transcript}
                onChange={(e) => onTranscriptChange(e.target.value)}
                placeholder="Type or refine your response here..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 transition"
              />
            </div>
          )}

          {/* Action Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            {interviewState === 'CANDIDATE_SPEAKING' ? (
              <Button
                variant="danger"
                size="md"
                className="w-full sm:flex-1"
                icon={MicOff}
                onClick={onStopSpeaking}
              >
                Stop Speaking
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="md"
                className="w-full sm:flex-1"
                icon={Mic}
                disabled={interviewState === 'SUBMITTING_ANSWER'}
                onClick={onStartSpeaking}
              >
                {displayedResponse ? 'Start Speaking Again' : 'Start Speaking'}
              </Button>
            )}

            <Button
              size="md"
              className="w-full sm:flex-1"
              icon={Send}
              isLoading={isSubmittingAnswer}
              disabled={isSubmittingAnswer || !displayedResponse.trim() || interviewState === 'CANDIDATE_SPEAKING'}
              onClick={onSubmitAnswer}
            >
              {isSubmittingAnswer ? 'Evaluating Answer...' : 'Submit Answer'}
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}
