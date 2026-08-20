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
    <section className="space-y-5 max-w-2xl mx-auto animate-fadeIn">
      {/* Top Session Status Bar */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-[#FFFDF8] border border-[#E5E0D6] shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Badge variant="green" size="sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#315B45] mr-1 inline-block" />
            <span>LIVE INTERVIEW</span>
          </Badge>
          <span className="text-xs font-semibold text-[#20211E] hidden sm:inline">
            {activeSession.targetRole} • {String(activeSession.type || '').toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 font-mono text-[#20211E] bg-[#F5F2EA] px-2.5 py-1 rounded-md border border-[#E5E0D6]">
            <Clock className="w-3.5 h-3.5 text-[#315B45]" />
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
      <Card className="p-6 sm:p-8 text-center space-y-5">
        {/* Interviewer Persona Stage */}
        <div className="space-y-2">
          <div className="relative inline-flex items-center justify-center">
            <div
              className={`relative flex items-center justify-center w-14 h-14 rounded-full border transition-all duration-200 ${interviewState === 'AI_SPEAKING'
                ? 'bg-[#E8F0EA] border-[#315B45] text-[#315B45]'
                : interviewState === 'CANDIDATE_SPEAKING'
                  ? 'bg-[#E8F0EA] border-[#315B45] text-[#315B45]'
                  : interviewState === 'SUBMITTING_ANSWER'
                    ? 'bg-[#F7E7DD] border-[#C9683A] text-[#C9683A]'
                    : 'bg-[#F5F2EA] border-[#E5E0D6] text-[#92928A]'
                }`}
            >
              <Bot className="w-6 h-6" />
            </div>
          </div>

          {/* State Indicator */}
          <div>
            <span className="text-[0.68rem] font-bold uppercase tracking-wider text-[#92928A] block">
              {interviewState === 'AI_SPEAKING' ? (
                <span className="text-[#315B45] flex items-center justify-center gap-1.5 font-bold">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Interviewer Speaking...</span>
                </span>
              ) : interviewState === 'SUBMITTING_ANSWER' ? (
                <span className="text-[#C9683A] flex items-center justify-center gap-1.5 font-bold">
                  <BrainCircuit className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating Response...</span>
                </span>
              ) : interviewState === 'CANDIDATE_SPEAKING' ? (
                <span className="text-[#315B45] flex items-center justify-center gap-1.5 font-bold">
                  <Mic className="w-3.5 h-3.5" />
                  <span>Listening to Candidate...</span>
                </span>
              ) : interviewState === 'ANSWER_READY' ? (
                <span className="text-[#315B45] flex items-center justify-center gap-1.5 font-bold">
                  <Check className="w-3.5 h-3.5" />
                  <span>Answer Recorded — Ready to Submit</span>
                </span>
              ) : (
                <span>Your Turn</span>
              )}
            </span>
          </div>
        </div>

        {/* Current Question Display */}
        <div className="max-w-lg mx-auto space-y-2">
          <p className="text-sm sm:text-base font-bold text-[#20211E] leading-relaxed tracking-tight">
            "{currentQuestion}"
          </p>

          <button
            type="button"
            onClick={onReplayVoice}
            className="inline-flex items-center gap-1.5 text-xs text-[#315B45] hover:underline font-semibold transition cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Replay Voice Question</span>
          </button>
        </div>

        {/* Candidate Response & Live Transcription Box */}
        <div className="max-w-lg mx-auto space-y-2 pt-3 border-t border-[#F0ECE4] text-left">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#20211E] flex items-center gap-1.5">
              {interviewState === 'CANDIDATE_SPEAKING' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#315B45]" />
                  <span>Live Speech Transcription:</span>
                </>
              ) : (
                <span>Your Response:</span>
              )}
            </span>

            <button
              type="button"
              onClick={() => setShowTextInput((prev) => !prev)}
              className="text-[#315B45] hover:underline font-semibold text-xs transition cursor-pointer flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" />
              <span>{showTextInput ? 'Hide Text Editor' : 'Edit Response Text'}</span>
            </button>
          </div>

          {(!showTextInput || interviewState === 'CANDIDATE_SPEAKING') && (
            <div
              className={`p-3 rounded-lg border text-xs min-h-[75px] leading-relaxed transition ${interviewState === 'CANDIDATE_SPEAKING'
                ? 'bg-[#E8F0EA]/50 border-[#D1E0D7] text-[#20211E]'
                : 'bg-[#F5F2EA] border-[#E5E0D6] text-[#20211E]'
                }`}
            >
              {displayedResponse ? (
                <p className="whitespace-pre-wrap leading-relaxed">
                  {transcript}
                  {interimText && (
                    <span className="text-[#315B45] italic"> {interimText}</span>
                  )}
                </p>
              ) : (
                <span className="text-[#92928A] italic">
                  {interviewState === 'CANDIDATE_SPEAKING'
                    ? 'Listening... speak clearly. Natural pauses will not interrupt you.'
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
                className="w-full rounded-lg border border-[#E5E0D6] bg-[#FFFDF8] p-2.5 text-xs text-[#20211E] outline-none focus:border-[#315B45] transition"
              />
            </div>
          )}

          {/* Action Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
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
