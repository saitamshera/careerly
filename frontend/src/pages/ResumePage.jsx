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
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Card, CardHeader } from '../components/ui/Card';
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
      const status = error?.response?.status;
      const serverMsg = error?.response?.data?.message;
      let msg = serverMsg || error?.message || "We couldn't complete the analysis right now. Please try again.";
      if (status && !msg.includes(String(status))) {
        msg = `${msg} (HTTP ${status})`;
      }
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
    <main className="flex-1 p-6 lg:p-10 space-y-6 max-w-5xl mx-auto w-full animate-fadeIn bg-[#F8F6F0]">
      {/* 1. Header */}
      <SectionHeader
        eyebrow="RECRUITER SCREENING & ATS OPTIMIZER"
        title={
          <span className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-[#315B45] shrink-0" />
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
        <Card className="max-w-md mx-auto p-6 text-center space-y-5">
          <div className="space-y-1">
            <h2 className="text-sm sm:text-base font-bold text-[#20211E] flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-[#315B45] animate-spin" />
              <span>Analyzing Resume...</span>
            </h2>
            <p className="text-xs text-[#5F625C]">
              Benchmarking keywords, qualifications, and role alignment
            </p>
          </div>

          <div className="space-y-2 text-left pt-1">
            {loadingSteps.map((step, idx) => {
              const isDone = idx < loadingStepIndex;
              const isCurrent = idx === loadingStepIndex;
              return (
                <div
                  key={step}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs transition-all ${isDone
                    ? 'bg-[#E8F0EA] border-[#D1E0D7] text-[#315B45] font-semibold'
                    : isCurrent
                      ? 'bg-[#E8F0EA]/60 border-[#315B45] text-[#20211E] font-bold'
                      : 'bg-[#F7F4ED] border-[#E3DED3] text-[#74766F]'
                    }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-[#315B45] shrink-0" />
                  ) : isCurrent ? (
                    <RefreshCw className="w-4 h-4 text-[#315B45] animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#D7D0C4] shrink-0" />
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
        <Card className="max-w-md mx-auto p-6 text-center space-y-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#FDECEB] border border-[#F7CBC9] text-[#B83A35] flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-bold text-[#20211E]">
              Unable to analyze resume
            </h3>
            <p className="text-xs text-[#5F625C] leading-relaxed">
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
        <Card className="max-w-xl mx-auto p-6 space-y-4">
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
              className={`rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${isDragOver
                ? 'border-[#315B45] bg-[#E8F0EA]/40'
                : 'border-[#E3DED3] hover:border-[#315B45] bg-[#F7F4ED]'
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                className="hidden"
              />
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-lg bg-[#E8F0EA] border border-[#D1E0D7] text-[#315B45] flex items-center justify-center mx-auto">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs sm:text-sm font-bold text-[#20211E]">
                    Upload your resume
                  </p>
                  <p className="text-xs text-[#5F625C]">
                    Drag & drop file here or <span className="text-[#315B45] font-semibold underline underline-offset-2">browse files</span>
                  </p>
                </div>
                <p className="text-[0.68rem] text-[#74766F]">
                  Supported: PDF, DOCX • Maximum 5 MB
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#F7F4ED] border border-[#E3DED3]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-md bg-[#E8F0EA] border border-[#D1E0D7] text-[#315B45] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#20211E] truncate max-w-xs">
                    {file.name}
                  </p>
                  <p className="text-[0.68rem] text-[#74766F]">
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
                  className="p-1 rounded-md text-[#74766F] hover:text-[#B83A35] hover:bg-[#FDECEB] transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Target Role Field */}
          <div>
            <label className="block text-xs font-bold text-[#20211E] mb-1">
              Target Role <span className="text-[#74766F] font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Software Engineer, Backend Developer"
              className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] px-3 py-2 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
            />
          </div>

          {/* Expandable JD */}
          <div>
            <button
              type="button"
              onClick={() => setShowJobDescription(!showJobDescription)}
              className="text-xs font-semibold text-[#315B45] hover:underline cursor-pointer"
            >
              {showJobDescription ? '− Hide job description' : '+ Add job description for exact keyword matching'}
            </button>

            {showJobDescription && (
              <textarea
                rows={3}
                value={targetJobDescription}
                onChange={(e) => setTargetJobDescription(e.target.value)}
                placeholder="Paste the target job description requirements..."
                className="mt-2 w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] p-2.5 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
              />
            )}
          </div>

          <div className="pt-1">
            <Button
              size="md"
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
        <section className="space-y-5">
          {/* Dedicated Job Match Analysis Card (Rendered when a Job Description was provided) */}
          {(activeReport.targetJobDescription || typeof activeReport.jobMatchScore === 'number') && (
            <Card className="p-5 space-y-4 border-[#D1E0D7] bg-[#FFFDF8]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E3DED3]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#E8F0EA] border border-[#D1E0D7] text-[#315B45] flex items-center justify-center">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-[#20211E]">
                        Job Description Match Analysis
                      </h3>
                      <Badge variant="green" size="sm">
                        Role Targeted
                      </Badge>
                    </div>
                    <p className="text-xs text-[#5F625C] mt-0.5">
                      Targeted evaluation against your customized job description requirements
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto bg-[#F7F4ED] px-3 py-1.5 rounded-lg border border-[#E3DED3]">
                  <div className="text-right">
                    <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[#74766F] block">
                      Role Match Score
                    </span>
                    <span className="text-xl font-bold font-mono text-[#315B45]">
                      {activeReport.jobMatchScore ?? activeReport.atsKeywordMatch ?? 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Matched vs Missing Skills Grid */}
              <div className="grid gap-3.5 sm:grid-cols-2">
                {/* Matched Qualifications */}
                <div className="p-3.5 rounded-lg border border-[#D1E0D7] bg-[#E8F0EA]/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#315B45] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      Matched Qualifications ({activeReport.matchedKeywords?.length || 0})
                    </span>
                    <Badge variant="green" size="sm">Present</Badge>
                  </div>

                  {activeReport.matchedKeywords && activeReport.matchedKeywords.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {activeReport.matchedKeywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-xs font-semibold bg-[#E8F0EA] text-[#315B45] border border-[#D1E0D7]"
                        >
                          ✓ {kw}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#74766F] italic">No direct keywords matched yet.</p>
                  )}
                </div>

                {/* Missing Job Requirements */}
                <div className="p-3.5 rounded-lg border border-[#F0D0BF] bg-[#F7E7DD]/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#C9683A] flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      Missing Requirements ({activeReport.missingSkills?.length || 0})
                    </span>
                    <Badge variant="orange" size="sm">Gaps</Badge>
                  </div>

                  {activeReport.missingSkills && activeReport.missingSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {activeReport.missingSkills.map((sk, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-xs font-semibold bg-[#F7E7DD] text-[#C9683A] border border-[#F0D0BF]"
                        >
                          ✕ {sk}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#74766F] italic">All key job requirements found in resume.</p>
                  )}
                </div>
              </div>

              {/* Top 3 Gaps & Fast Recommendations */}
              {activeReport.topGaps && activeReport.topGaps.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[#74766F] block">
                    Top High-Impact Fixes to Qualify:
                  </span>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {activeReport.topGaps.map((item, gIdx) => (
                      <div
                        key={gIdx}
                        className="p-3 rounded-lg border border-[#E3DED3] bg-[#FFFDF8] space-y-1"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#E8F0EA] text-[0.65rem] font-bold text-[#315B45] shrink-0">
                            {gIdx + 1}
                          </span>
                          <p className="text-xs font-bold text-[#20211E] truncate">
                            {item.gap}
                          </p>
                        </div>
                        <p className="text-[0.7rem] text-[#5F625C] leading-relaxed">
                          {item.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Main Scorecard Banner */}
          <Card className="p-5 space-y-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5 pb-4 border-b border-[#E3DED3]">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-20 h-20 rounded-full border-2 border-[#315B45]/40 bg-[#E8F0EA]">
                  <div className="text-center">
                    <span className="text-2xl font-bold font-mono text-[#20211E]">
                      {activeReport.atsScore || 0}
                    </span>
                    <span className="block text-[0.62rem] font-bold uppercase tracking-wider text-[#315B45]">
                      /100
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Badge variant={scoreVerdict?.variant || 'green'} size="md">
                    {scoreVerdict?.title || 'Evaluated'}
                  </Badge>
                  <p className="text-xs font-medium text-[#5F625C] max-w-md leading-relaxed">
                    {scoreVerdict?.description}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[0.65rem] font-bold uppercase text-[#74766F] block">Document</span>
                <span className="text-xs font-bold text-[#20211E] truncate max-w-xs block mt-0.5">
                  {latestResumeName}
                </span>
              </div>
            </div>

            {/* Dimension Progress Bars */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-1">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#5F625C] font-medium">Keyword Density</span>
                  <span className="font-bold text-[#20211E]">{activeReport.categoryScores?.skills || 75}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#F7F4ED] border border-[#E3DED3] overflow-hidden">
                  <div className="h-full bg-[#315B45] rounded-full" style={{ width: `${activeReport.categoryScores?.skills || 75}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#5F625C] font-medium">Quantified Impact</span>
                  <span className="font-bold text-[#20211E]">{activeReport.categoryScores?.impact || 70}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#F7F4ED] border border-[#E3DED3] overflow-hidden">
                  <div className="h-full bg-[#315B45] rounded-full" style={{ width: `${activeReport.categoryScores?.impact || 70}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#5F625C] font-medium">Formatting & Layout</span>
                  <span className="font-bold text-[#20211E]">{activeReport.categoryScores?.formatting || 85}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#F7F4ED] border border-[#E3DED3] overflow-hidden">
                  <div className="h-full bg-[#315B45] rounded-full" style={{ width: `${activeReport.categoryScores?.formatting || 85}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#5F625C] font-medium">Experience Match</span>
                  <span className="font-bold text-[#20211E]">{activeReport.categoryScores?.experience || 80}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#F7F4ED] border border-[#E3DED3] overflow-hidden">
                  <div className="h-full bg-[#B9822E] rounded-full" style={{ width: `${activeReport.categoryScores?.experience || 80}%` }} />
                </div>
              </div>
            </div>
          </Card>

          {/* Strengths & Weaknesses Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="space-y-3 p-4">
              <CardHeader
                title="Resume Strengths"
                action={<Badge variant="green">Verified</Badge>}
              />
              <ul className="space-y-1.5 text-xs text-[#20211E]">
                {(activeReport.strengths || []).map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-[#E8F0EA]/50 border border-[#D1E0D7]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#315B45] mt-0.5 shrink-0" />
                    <span className="leading-relaxed">{s}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="space-y-3 p-4">
              <CardHeader
                title="Missing Keywords & Gaps"
                action={<Badge variant="orange">High Leverage</Badge>}
              />
              <ul className="space-y-1.5 text-xs text-[#20211E]">
                {(activeReport.missingKeywords || activeReport.weaknesses || []).map((w, idx) => (
                  <li key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-[#F7E7DD]/50 border border-[#F0D0BF]">
                    <AlertTriangle className="h-3.5 w-3.5 text-[#C9683A] mt-0.5 shrink-0" />
                    <span className="leading-relaxed">{w}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Recommendations List */}
          {activeReport.recommendations && activeReport.recommendations.length > 0 && (
            <Card className="space-y-3 p-4">
              <CardHeader
                title="Actionable Bullet Rewrites & Recommendations"
                subtitle="High-impact phrasing to increase keyword match rate."
              />
              <div className="space-y-2">
                {activeReport.recommendations.map((rec, rIdx) => (
                  <div
                    key={rIdx}
                    className="p-3 rounded-lg border border-[#E3DED3] bg-[#F7F4ED] text-xs space-y-1"
                  >
                    <p className="font-semibold text-[#20211E]">
                      {typeof rec === 'string' ? rec : rec.suggestion || rec.title}
                    </p>
                    {rec.example && (
                      <p className="text-[0.7rem] font-mono text-[#315B45] bg-[#E8F0EA] p-1.5 rounded border border-[#D1E0D7]">
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
