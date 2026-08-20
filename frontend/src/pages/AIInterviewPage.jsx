import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { InterviewConfigCard } from '../components/interview/InterviewConfigCard';
import { InterviewActiveSession } from '../components/interview/InterviewActiveSession';
import { InterviewEvaluationView } from '../components/interview/InterviewEvaluationView';
import { InterviewEndModal } from '../components/interview/InterviewEndModal';
import { Button } from '../components/ui/Button';

export function AIInterviewPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id: paramInterviewId } = useParams();
  const [searchParams] = useSearchParams();
  const urlCompany = searchParams.get('company') || '';
  const urlRole = searchParams.get('role') || searchParams.get('topic') || '';
  const urlType = searchParams.get('type') || '';
  const urlId = paramInterviewId || searchParams.get('id') || null;

  // State Machine: 'IDLE' | 'STARTING' | 'AI_SPEAKING' | 'WAITING_FOR_CANDIDATE' | 'CANDIDATE_SPEAKING' | 'ANSWER_READY' | 'SUBMITTING_ANSWER' | 'INTERVIEW_COMPLETE' | 'ERROR'
  const [interviewState, setInterviewState] = useState('IDLE');
  const [activeSessionId, setActiveSessionId] = useState(urlId);

  // Sync URL ID to activeSessionId
  useEffect(() => {
    if (urlId && urlId !== activeSessionId) {
      setActiveSessionId(urlId);
    }
  }, [urlId]);

  // Transcription & UI controls
  const [showTextInput, setShowTextInput] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Config Form State
  const [selectedType, setSelectedType] = useState(urlType || 'technical');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [targetRole, setTargetRole] = useState(urlRole || 'SDE-1');
  const [targetCompany, setTargetCompany] = useState(urlCompany || '');
  const [jobDescription, setJobDescription] = useState('');
  const [showJobDescField, setShowJobDescField] = useState(false);

  // Synchronize company & role from query params if navigated with new params
  useEffect(() => {
    if (urlCompany) {
      setTargetCompany(urlCompany);
    }
    if (urlRole) {
      setTargetRole(urlRole);
    }
    if (urlType) {
      setSelectedType(urlType);
    }
  }, [urlCompany, urlRole, urlType]);

  const sessionTimerRef = useRef(null);

  // Stop Speaking Callback
  const handleSilenceDetected = useCallback(() => {
    setInterviewState('ANSWER_READY');
  }, []);

  // Speech Recognition Hook
  const {
    isListening,
    transcript,
    interimText,
    startListening,
    stopListening,
    resetTranscript,
    setTranscriptManually,
    speakText,
    error: speechError,
    setError: setSpeechError
  } = useSpeechRecognition();

  // Query: User Interviews List
  const interviewsQuery = useQuery({
    queryKey: ['ai-interviews'],
    queryFn: async () => {
      const res = await api.get('/ai/interviews');
      return res.data?.data || [];
    }
  });

  // Query: Single Interview by ID (if direct link or deep load)
  const singleInterviewQuery = useQuery({
    queryKey: ['ai-interview', activeSessionId],
    queryFn: async () => {
      const res = await api.get(`/ai/interviews/${activeSessionId}`);
      return res.data?.data || null;
    },
    enabled: Boolean(activeSessionId)
  });

  const activeSession = useMemo(() => {
    if (!activeSessionId) return null;
    return (
      interviewsQuery.data?.find((item) => item._id === activeSessionId) ||
      singleInterviewQuery.data ||
      null
    );
  }, [interviewsQuery.data, singleInterviewQuery.data, activeSessionId]);

  const deleteInterviewMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/ai/interviews/${id}`);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['ai-interviews'] });
      if (activeSessionId === deletedId) {
        setActiveSessionId(null);
        setInterviewState('IDLE');
        navigate('/interview-prep');
      }
    }
  });

  // Sync state when session changes
  useEffect(() => {
    if (activeSession) {
      if (activeSession.status === 'completed') {
        setInterviewState('INTERVIEW_COMPLETE');
      } else if (activeSession.status === 'in-progress' && interviewState === 'IDLE') {
        setInterviewState('WAITING_FOR_CANDIDATE');
      }
    }
  }, [activeSession, interviewState]);

  // Session elapsed timer
  useEffect(() => {
    if (activeSession && activeSession.status === 'in-progress') {
      sessionTimerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(sessionTimerRef.current);
    }
    return () => clearInterval(sessionTimerRef.current);
  }, [activeSession?.status]);

  // Combined full live response text
  const displayedResponse = useMemo(() => {
    const finalPart = transcript.trim();
    const interimPart = interimText.trim();
    if (finalPart && interimPart) return `${finalPart} ${interimPart}`;
    return finalPart || interimPart || '';
  }, [transcript, interimText]);

  // Start Voice Recording action
  const handleStartSpeaking = useCallback(() => {
    const ok = startListening();
    if (ok) {
      setInterviewState('CANDIDATE_SPEAKING');
    }
  }, [startListening]);

  // Stop Voice Recording action
  const handleStopSpeaking = useCallback(() => {
    stopListening();
    setInterviewState('ANSWER_READY');
  }, [stopListening]);

  // Mutations
  const startInterviewMutation = useMutation({
    mutationFn: async (payload) => {
      setInterviewState('STARTING');
      const res = await api.post('/ai/interview', payload);
      return res.data?.data;
    },
    onSuccess: async (data) => {
      if (data && data._id) {
        queryClient.setQueryData(['ai-interviews'], (prev = []) => {
          const list = Array.isArray(prev) ? prev : [];
          return [data, ...list.filter((item) => item._id !== data._id)];
        });
        setActiveSessionId(data._id);
        setSecondsElapsed(0);
        resetTranscript();
        await queryClient.invalidateQueries({ queryKey: ['ai-interviews'] });
        const openingQ = data.questions?.[0];
        if (openingQ) {
          setInterviewState('AI_SPEAKING');
          speakText(openingQ, () => {
            setInterviewState('WAITING_FOR_CANDIDATE');
          });
        } else {
          setInterviewState('WAITING_FOR_CANDIDATE');
        }
      }
    },
    onError: (error) => {
      setInterviewState('IDLE');
      setSpeechError(error.response?.data?.message || 'Could not start interview. Please try again.');
    }
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async ({ interviewId, answer }) => {
      setInterviewState('SUBMITTING_ANSWER');
      const res = await api.post(`/ai/interviews/${interviewId}/answer`, { answer });
      return res.data?.data;
    },
    onSuccess: async (updatedSession) => {
      resetTranscript();
      if (updatedSession && updatedSession._id) {
        queryClient.setQueryData(['ai-interviews'], (prev = []) => {
          const list = Array.isArray(prev) ? prev : [];
          return list.map((item) => (item._id === updatedSession._id ? updatedSession : item));
        });
      }
      await queryClient.invalidateQueries({ queryKey: ['ai-interviews'] });
      const latestQ = updatedSession?.questions?.[updatedSession.questions.length - 1];
      if (latestQ) {
        setInterviewState('AI_SPEAKING');
        speakText(latestQ, () => {
          setInterviewState('WAITING_FOR_CANDIDATE');
        });
      } else {
        setInterviewState('WAITING_FOR_CANDIDATE');
      }
    },
    onError: (error) => {
      setInterviewState('ANSWER_READY');
      setSpeechError(error.response?.data?.message || 'Failed to evaluate answer. Your response is preserved below. Click Submit Answer to retry.');
    }
  });

  const completeInterviewMutation = useMutation({
    mutationFn: async (interviewId) => {
      setInterviewState('SUBMITTING_ANSWER');
      const res = await api.post(`/ai/interviews/${interviewId}/complete`);
      return res.data?.data;
    },
    onSuccess: async (completedSession) => {
      setShowEndModal(false);
      stopListening();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (completedSession && completedSession._id) {
        queryClient.setQueryData(['ai-interviews'], (prev = []) => {
          const list = Array.isArray(prev) ? prev : [];
          return list.map((item) => (item._id === completedSession._id ? completedSession : item));
        });
      }
      setInterviewState('INTERVIEW_COMPLETE');
      await queryClient.invalidateQueries({ queryKey: ['ai-interviews'] });
    },
    onError: (error) => {
      setInterviewState('ANSWER_READY');
      setSpeechError(error.response?.data?.message || 'Could not complete interview evaluation report. Please click Retry.');
    }
  });

  function handleStartInterviewForm(e) {
    e.preventDefault();
    startInterviewMutation.mutate({
      type: selectedType,
      difficulty: selectedDifficulty,
      targetRole: targetRole.trim() || 'SDE-1',
      targetCompany: targetCompany.trim(),
      topic: targetRole.trim() || 'SDE-1',
      jobDescription: jobDescription.trim()
    });
  }

  function handleSubmitAnswerClick() {
    const fullText = displayedResponse.trim();
    if (!activeSession || !fullText || submitAnswerMutation.isPending) return;
    stopListening();
    submitAnswerMutation.mutate({
      interviewId: activeSession._id,
      answer: fullText
    });
  }

  function handleEndSessionClick() {
    if (!activeSession) return;
    completeInterviewMutation.mutate(activeSession._id);
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // Markdown Report Generator
  function downloadReport(session) {
    if (!session) return;
    const report = session.evaluationReport || {};
    const reportContent = `
# Software Engineering Interview Performance Report
- **Role**: ${session.targetRole || session.topic || 'SDE-1'}
- **Interview Style**: ${String(session.type || '').toUpperCase()} (${String(session.difficulty || '').toUpperCase()})
- **Verdict**: ${report.verdict || 'Evaluation Complete'}
- **Overall Score**: ${report.overallScore || session.score || 0} / 100

---

## 1. Score Breakdown
- **Communication**: ${report.communication || session.communication || 0}%
- **Technical Knowledge**: ${report.technicalKnowledge || session.technicalKnowledge || 0}%
- **Problem Solving**: ${report.problemSolving || session.problemSolving || 0}%

---

## 2. Executive Summary
${report.executiveSummary || session.feedback || 'Completed simulated engineering interview.'}

## 3. Key Improvement
${report.keyImprovement || session.keyImprovement || 'Focus on structured STAR responses with quantifiable impacts.'}

---

## 4. Strengths
${(report.strengths || session.strengths || []).map((s) => `- ${s}`).join('\n')}

## 5. Critical Growth Areas
${(report.areasToImprove || session.weaknesses || []).map((w) => `- ${w}`).join('\n')}

---
*Report generated by Careerly AI Interview Simulator*
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Interview_Report_${session.type}_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const currentQuestion =
    activeSession?.questions?.[activeSession.questions.length - 1] ||
    'Welcome. Let\'s begin by walking me through your background and the most complex software project you\'ve built.';

  const isSessionActive = activeSession && activeSession.status === 'in-progress';
  const isSessionCompleted =
    activeSession &&
    (activeSession.status === 'completed' ||
      Boolean(activeSession.evaluationReport) ||
      Boolean(activeSession.score !== undefined && activeSession.score !== null));

  return (
    <main className="flex-1 p-6 lg:p-10 space-y-8 max-w-5xl mx-auto w-full animate-fadeIn">
      {/* Error / Alert Banner */}
      {speechError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{speechError}</span>
          </div>
          <div className="flex items-center gap-2">
            {interviewState === 'ANSWER_READY' && (
              <Button size="sm" variant="danger" onClick={handleEndSessionClick}>
                Retry Report
              </Button>
            )}
            <button
              onClick={() => setSpeechError('')}
              className="text-xs text-rose-700 hover:text-rose-900 font-bold ml-2 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 1. STATE: PRE-INTERVIEW CONFIGURATION */}
      {!isSessionActive && !isSessionCompleted && (
        <InterviewConfigCard
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          selectedDifficulty={selectedDifficulty}
          setSelectedDifficulty={setSelectedDifficulty}
          targetRole={targetRole}
          setTargetRole={setTargetRole}
          targetCompany={targetCompany}
          setTargetCompany={setTargetCompany}
          jobDescription={jobDescription}
          setJobDescription={setJobDescription}
          showJobDescField={showJobDescField}
          setShowJobDescField={setShowJobDescField}
          onSubmit={handleStartInterviewForm}
          isPending={startInterviewMutation.isPending}
          pastSessions={interviewsQuery.data || []}
          onSelectSession={(id) => {
            setActiveSessionId(id);
            navigate(`/interview-prep/${id}`);
          }}
          onDeleteSession={(id) => deleteInterviewMutation.mutateAsync(id)}
          isDeleting={deleteInterviewMutation.isPending}
        />
      )}

      {/* 2. STATE: ACTIVE INTERVIEW ARENA */}
      {isSessionActive && (
        <InterviewActiveSession
          activeSession={activeSession}
          interviewState={interviewState}
          secondsElapsed={secondsElapsed}
          formatTime={formatTime}
          currentQuestion={currentQuestion}
          onReplayVoice={() => {
            setInterviewState('AI_SPEAKING');
            speakText(currentQuestion, () =>
              setInterviewState('WAITING_FOR_CANDIDATE')
            );
          }}
          transcript={transcript}
          interimText={interimText}
          displayedResponse={displayedResponse}
          showTextInput={showTextInput}
          setShowTextInput={setShowTextInput}
          onTranscriptChange={setTranscriptManually}
          onStartSpeaking={handleStartSpeaking}
          onStopSpeaking={handleStopSpeaking}
          onSubmitAnswer={handleSubmitAnswerClick}
          isSubmittingAnswer={submitAnswerMutation.isPending}
          onOpenEndModal={() => setShowEndModal(true)}
        />
      )}

      {/* 3. MODAL: END INTERVIEW CONFIRMATION */}
      <InterviewEndModal
        show={showEndModal}
        onClose={() => setShowEndModal(false)}
        onConfirm={handleEndSessionClick}
        isPending={completeInterviewMutation.isPending}
      />

      {/* 4. STATE: COMPREHENSIVE EVALUATION VIEW */}
      {isSessionCompleted && activeSession && (
        <InterviewEvaluationView
          activeSession={activeSession}
          onResetInterview={() => {
            setActiveSessionId(null);
            setInterviewState('IDLE');
            navigate('/interview-prep');
          }}
          onDownloadReport={downloadReport}
        />
      )}
    </main>
  );
}
