import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileCheck2,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  X,
  RotateCcw,
  Target,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  TrendingUp,
  Check,
  CircleDot
} from 'lucide-react';
import { api } from '../services/api';
import { Card, CardHeader } from '../components/ui/Card';
import { MetricCard } from '../components/ui/MetricCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';

const loadingSteps = [
  'Reading resume structure',
  'Extracting skills & technology stack',
  'Cross-referencing ATS keyword density',
  'Generating senior recruiter recommendations'
];

function isFailedReport(report) {
  if (!report) return false;
  if (!Array.isArray(report.strengths)) return false;
  return report.strengths.some(
    (s) =>
      typeof s === 'string' &&
      (s.toLowerCase().includes('scoring failed') ||
        s.toLowerCase().includes('gemini_api_key') ||
        s.toLowerCase().includes('failed due to an error'))
  );
}

export function ResumePage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  // Form & File state
  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [targetJobDescription, setTargetJobDescription] = useState('');
  const [extractedText, setExtractedText] = useState('');

  // Expandable UI state
  const [showJobDescription, setShowJobDescription] = useState(false);
  const [showExtractedText, setShowExtractedText] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // View state
  const [activeReportOverride, setActiveReportOverride] = useState(null);
  const [isNewAnalysisMode, setIsNewAnalysisMode] = useState(false);
  const [formError, setFormError] = useState('');

  // Loading step tracker
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  const resumesQuery = useQuery({
    queryKey: ['resumes'],
    queryFn: async () => {
      const response = await api.get('/resume');
      return response.data?.data || [];
    }
  });

  const latestReportQuery = useQuery({
    queryKey: ['resume-latest-report'],
    queryFn: async () => {
      const response = await api.get('/resume/reports/latest');
      return response.data?.data || null;
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ fileToUpload, extractedTextData, targetJobData }) => {
      const formData = new FormData();
      if (fileToUpload) {
        formData.append('resume', fileToUpload);
      }
      formData.append('extractedText', extractedTextData || '');
      formData.append('targetJobDescription', targetJobData || '');

      const response = await api.post('/resume/upload', formData);
      return response.data?.data;
    },
    onSuccess: async (data) => {
      setFormError('');
      if (data?.report) {
        if (isFailedReport(data.report)) {
          setFormError('Unable to analyze your resume right now. Please try again.');
          setActiveReportOverride(null);
        } else {
          setActiveReportOverride(data.report);
          setIsNewAnalysisMode(false);
        }
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['resumes'] }),
        queryClient.invalidateQueries({ queryKey: ['resume-latest-report'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      ]);
    },
    onError: (error) => {
      setActiveReportOverride(null);
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "We couldn't complete the analysis right now. Please try again.";
      setFormError(msg);
    }
  });

  useEffect(() => {
    let interval;
    if (uploadMutation.isPending) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 1400);
    } else {
      setLoadingStepIndex(0);
    }
    return () => clearInterval(interval);
  }, [uploadMutation.isPending]);

  const rawReport = activeReportOverride || latestReportQuery.data;
  const isReportValid = rawReport && !isFailedReport(rawReport);
  const activeReport = isReportValid ? rawReport : null;

  const showResults = Boolean(activeReport) && !isNewAnalysisMode && !uploadMutation.isPending;
  const showFailedState = Boolean(formError) && !uploadMutation.isPending;

  function handleFileSelect(selected) {
    if (!selected) return;
    const validExtensions = ['.pdf', '.doc', '.docx'];
    const lowerName = selected.name.toLowerCase();
    const isValid = validExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isValid) {
      setFormError('Please select a valid PDF, DOC, or DOCX document.');
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setFormError('File size exceeds the 5MB limit.');
      return;
    }

    setFile(selected);
    setFormError('');
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }

  function handleRemoveFile() {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleAnalyze(e) {
    if (e) e.preventDefault();

    if (!file && !extractedText.trim()) {
      setFormError('Please upload your resume (PDF or DOCX) or provide extracted text.');
      return;
    }

    setFormError('');

    const combinedJobContext = [
      targetRole.trim() ? `Target Role: ${targetRole.trim()}` : '',
      targetJobDescription.trim()
    ]
      .filter(Boolean)
      .join('\n\n');

    await uploadMutation.mutateAsync({
      fileToUpload: file,
      extractedTextData: extractedText,
      targetJobData: combinedJobContext
    });
  }

  function formatFileSize(bytes) {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    const kb = bytes / 1024;
    return `${Math.round(kb)} KB`;
  }

  const scoreVerdict = useMemo(() => {
    if (!activeReport) return null;
    const score = activeReport.atsScore;
    if (typeof score !== 'number') return null;

    if (score >= 90) {
      return {
        title: 'Outstanding Match',
        description: 'Your resume shows exceptional keyword coverage and high alignment with senior screening standards.',
        variant: 'green'
      };
    }
    if (score >= 75) {
      return {
        title: 'Strong Match',
        description: 'Your resume shows strong alignment with core technical qualifications and standard ATS scanners.',
        variant: 'green'
      };
    }
    if (score >= 60) {
      return {
        title: 'Moderate Match',
        description: 'Core requirements are met, but several high-conviction keywords or quantified impacts are missing.',
        variant: 'orange'
      };
    }
    return {
      title: 'Needs Optimization',
      description: 'Your resume requires substantial keyword enrichment and structural formatting to pass screening filters.',
      variant: 'red'
    };
  }, [activeReport]);

  const latestResumeName =
    file?.name || resumesQuery.data?.[0]?.originalName || 'Resume Document';

  return (
    <main className="flex-1 p-6 lg:p-10 space-y-8 max-w-5xl mx-auto w-full animate-fadeIn">
      {/* 1. Header */}
      <SectionHeader
        eyebrow="RECRUITER SCREENING & ATS OPTIMIZER"
        title={
          <span className="flex items-center gap-2.5">
            <FileCheck2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Resume Lab & ATS Scanner</span>
          </span>
        }
        description="Upload your resume to benchmark keyword density, extract core technical competencies, and receive senior recruiter recommendations."
        action={
          showResults ? (
            <Button
              variant="secondary"
              size="sm"
              icon={RotateCcw}
              onClick={() => {
                setIsNewAnalysisMode(true);
                setFile(null);
              }}
            >
              Analyze New Resume
            </Button>
          ) : null
        }
      />

      {/* 2. Loading State */}
      {uploadMutation.isPending && (
        <Card className="max-w-md mx-auto p-8 text-center space-y-6">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600 animate-spin" />
              <span>Analyzing Resume...</span>
            </h2>
            <p className="text-xs text-slate-500">
              Benchmarking keywords, qualifications, and role alignment
            </p>
          </div>

          <div className="space-y-2.5 text-left pt-2">
            {loadingSteps.map((step, idx) => {
              const isDone = idx < loadingStepIndex;
              const isCurrent = idx === loadingStepIndex;
              return (
                <div
                  key={step}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-xs transition-all duration-300 ${
                    isDone
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                      : isCurrent
                      ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900 font-bold dark:bg-emerald-950/20 dark:text-emerald-200'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60 dark:bg-slate-800/40 dark:border-slate-700'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : isCurrent ? (
                    <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                  )}
                  <span className="truncate">{step}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 3. Error State */}
      {showFailedState && (
        <Card className="max-w-md mx-auto p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto dark:bg-rose-950/40 dark:text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Unable to analyze resume
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {formError || 'We could not complete the analysis right now. Please try again.'}
            </p>
          </div>
          <Button
            size="sm"
            icon={RotateCcw}
            onClick={() => {
              setFormError('');
              setIsNewAnalysisMode(true);
              setActiveReportOverride(null);
            }}
          >
            Try Again
          </Button>
        </Card>
      )}

      {/* 4. Upload / Workspace Form */}
      {!showResults && !uploadMutation.isPending && !showFailedState && (
        <Card className="max-w-xl mx-auto p-6 sm:p-8 space-y-5">
          <CardHeader
            title="Upload Document"
            subtitle="Upload your PDF or DOCX resume to start the screening analysis."
          />

          {!file ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
                isDragOver
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-slate-200 hover:border-emerald-400 bg-slate-50/50 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                className="hidden"
              />
              <div className="space-y-2.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Upload your resume
                  </p>
                  <p className="text-xs text-slate-500">
                    Drag & drop file here or <span className="text-emerald-600 font-semibold underline underline-offset-2">browse files</span>
                  </p>
                </div>
                <p className="text-[0.68rem] text-slate-400">
                  Supported: PDF, DOCX • Maximum 5 MB
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-xs">
                    {file.name}
                  </p>
                  <p className="text-[0.68rem] text-slate-400">
                    {file.name.endsWith('.pdf') ? 'PDF' : 'DOCX'} • {formatFileSize(file.size)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change
                </Button>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Target Role Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Target Role <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Software Engineer, Backend Developer"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
            />
          </div>

          {/* Expandable JD */}
          <div>
            <button
              type="button"
              onClick={() => setShowJobDescription(!showJobDescription)}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              {showJobDescription ? '− Hide job description' : '+ Add job description for exact keyword matching'}
            </button>

            {showJobDescription && (
              <textarea
                rows={3}
                value={targetJobDescription}
                onChange={(e) => setTargetJobDescription(e.target.value)}
                placeholder="Paste the target job description requirements..."
                className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
              />
            )}
          </div>

          <div className="pt-2">
            <Button
              size="lg"
              className="w-full"
              icon={Sparkles}
              onClick={handleAnalyze}
            >
              Analyze Resume & ATS Score
            </Button>
          </div>
        </Card>
      )}

      {/* 5. Scorecard & Results Dashboard */}
      {showResults && activeReport && (
        <section className="space-y-6">
          {/* Main Scorecard Banner */}
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-5">
                <div className="flex items-center justify-center w-24 h-24 rounded-full border-4 border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-inner">
                  <div className="text-center">
                    <span className="text-3xl font-black font-mono text-slate-900 dark:text-slate-100">
                      {activeReport.atsScore || 0}
                    </span>
                    <span className="block text-[0.62rem] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      /100
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Badge variant={scoreVerdict?.variant || 'green'} size="md">
                    {scoreVerdict?.title || 'Evaluated'}
                  </Badge>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 max-w-md leading-relaxed">
                    {scoreVerdict?.description}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[0.68rem] font-bold uppercase text-slate-400 block">Document</span>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-xs block mt-0.5">
                  {latestResumeName}
                </span>
              </div>
            </div>

            {/* Dimension Progress Bars */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-400">Keyword Density</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{activeReport.categoryScores?.skills || 75}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${activeReport.categoryScores?.skills || 75}%` }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-400">Quantified Impact</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{activeReport.categoryScores?.impact || 70}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${activeReport.categoryScores?.impact || 70}%` }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-400">Formatting & Layout</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{activeReport.categoryScores?.formatting || 85}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full" style={{ width: `${activeReport.categoryScores?.formatting || 85}%` }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-400">Experience Match</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{activeReport.categoryScores?.experience || 80}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${activeReport.categoryScores?.experience || 80}%` }} />
                </div>
              </div>
            </div>
          </Card>

          {/* Strengths & Weaknesses Grid */}
          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="space-y-3">
              <CardHeader
                title="Resume Strengths"
                action={<Badge variant="green">Verified</Badge>}
              />
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                {(activeReport.strengths || []).map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2 p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="space-y-3">
              <CardHeader
                title="Missing Keywords & Gaps"
                action={<Badge variant="orange">High Leverage</Badge>}
              />
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                {(activeReport.missingKeywords || activeReport.weaknesses || []).map((w, idx) => (
                  <li key={idx} className="flex items-start gap-2 p-2 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/40">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Recommendations List */}
          {activeReport.recommendations && activeReport.recommendations.length > 0 && (
            <Card className="space-y-3">
              <CardHeader
                title="Actionable Bullet Rewrites & Recommendations"
                subtitle="High-impact phrasing to increase keyword match rate."
              />
              <div className="space-y-2">
                {activeReport.recommendations.map((rec, rIdx) => (
                  <div
                    key={rIdx}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 text-xs space-y-1"
                  >
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {typeof rec === 'string' ? rec : rec.suggestion || rec.title}
                    </p>
                    {rec.example && (
                      <p className="text-[0.7rem] font-mono text-emerald-700 dark:text-emerald-400">
                        "{rec.example}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </section>
      )}
    </main>
  );
}
