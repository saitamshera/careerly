const mongoose = require('mongoose');
const { ApiError } = require('../utils/apiError');
const { env } = require('../config/env');
const { configureCloudinary } = require('../config/cloudinary');
const { generateStructuredJSON } = require('../utils/geminiClient');
const { logger } = require('../config/logger');
const { createResume, findResumesByUserId, findResumeByIdAndUserId, deleteResumeByIdAndUserId, updateResumeScore, createResumeReport, findReportsByUserId, findLatestReportByUserId, findReportsByResumeId } = require('../repositories/resume.repository');
const path = require('path');
const { z } = require('zod');

function normalizeText(input) {
  return String(input || '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function scoreResume(text, targetJobDescription = '') {
  const normalizedText = normalizeText(text);
  const hasJobDescription = Boolean(String(targetJobDescription || '').trim());
  
  if (!env.GEMINI_API_KEY) {
    logger.warn('GEMINI_API_KEY is not set. Falling back to basic scoring.');
    return {
      atsScore: 50,
      jobMatchScore: hasJobDescription ? 50 : null,
      grammar: 80,
      keywords: [],
      targetKeywords: [],
      matchedKeywords: [],
      atsKeywordMatch: 0,
      missingSkills: [],
      strengths: ['Add GEMINI_API_KEY to enable AI scoring'],
      weaknesses: [],
      topGaps: [],
      suggestions: []
    };
  }

  const responseSchema = z.object({
    atsScore: z.number().min(0).max(100),
    jobMatchScore: z.number().min(0).max(100).nullable().optional(),
    grammar: z.number().min(0).max(100),
    keywords: z.array(z.string()).default([]),
    targetKeywords: z.array(z.string()).default([]),
    matchedKeywords: z.array(z.string()).default([]),
    atsKeywordMatch: z.number().min(0).max(100).default(0),
    missingSkills: z.array(z.string()).default([]),
    strengths: z.array(z.string()).default([]),
    weaknesses: z.array(z.string()).default([]),
    topGaps: z.array(
      z.object({
        gap: z.string(),
        recommendation: z.string()
      })
    ).default([]),
    suggestions: z.array(z.string()).default([])
  });

  const prompt = `You are an expert ATS (Applicant Tracking System) and senior technical recruiter.
Analyze the following resume text.

Resume Text:
"""
${normalizedText.substring(0, 8000)}
"""

${hasJobDescription ? `Target Job Description:
"""
${targetJobDescription.substring(0, 3000)}
"""

SPECIAL INSTRUCTION FOR JOB MATCH MODE:
Because a specific Job Description was provided, thoroughly evaluate the alignment between this candidate's resume and the target role:
1. "jobMatchScore": Calculate an accurate match score (0-100) specifically measuring how well the candidate's skills, experience, and tools fulfill the requirements in this Job Description.
2. "matchedKeywords": List the key technologies, qualifications, and domain skills from the Job Description that ARE present in the resume.
3. "missingSkills": List required or highly preferred skills/tools from the Job Description that are MISSING or weak in the resume.
4. "topGaps": Provide the top 3 highest-priority qualification gaps with specific actionable recommendations to quickly close them.
5. "atsKeywordMatch": Percentage (0-100) of target job keywords found.
` : `Target Job Description:
None provided. Evaluate based on general software engineering ATS standards. Set "jobMatchScore" to null and "topGaps" to empty array.`}

Respond STRICTLY in JSON format with the following schema:
{
  "atsScore": number (0-100, general ATS formatting & structure score),
  "jobMatchScore": ${hasJobDescription ? 'number (0-100, specific match score against the provided job description)' : 'null'},
  "grammar": number (0-100),
  "keywords": string[] (core technical competencies found in resume),
  "targetKeywords": string[] (key technologies required in job description, or general tech stack),
  "matchedKeywords": string[] (skills from job description that candidate possesses),
  "atsKeywordMatch": number (0-100),
  "missingSkills": string[] (must-have qualifications candidate lacks for this role),
  "strengths": string[] (3-5 verified resume strengths),
  "weaknesses": string[] (3-5 general resume improvement areas),
  "topGaps": [
    { "gap": "string (specific missing skill/tool/experience)", "recommendation": "string (how to address or frame it)" }
  ],
  "suggestions": string[] (actionable phrasing recommendations)
}`;

  const result = await generateStructuredJSON({
    prompt,
    schema: responseSchema
  });

  if (result) {
    return result;
  }

  logger.error('All candidate Gemini models failed for resume scoring');
  throw new ApiError(503, 'AI resume scoring service is temporarily busy. Please retry in a few moments.');
}

function validateObjectId(id, message = 'Invalid id') {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, message);
  }
}

function getFileUrl(file) {
  const pathPart = file?.filename || file?.originalname || 'resume-file';
  const primaryClientUrl = String(env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
  return `${primaryClientUrl}/uploads/${encodeURIComponent(pathPart)}`;
}

async function uploadResumeFileToCloudinary(file) {
  const cloudinary = configureCloudinary();

  if (!cloudinary || !file?.buffer || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    return {
      secureUrl: getFileUrl(file),
      publicId: ''
    };
  }

  try {
    return await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: 'placement-companion/resumes',
          public_id: `${Date.now()}-${String(file.originalname || 'resume').replace(/[^a-zA-Z0-9_-]/g, '_')}`
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          resolve({
            secureUrl: result.secure_url,
            publicId: result.public_id
          });
        }
      );

      uploadStream.end(file.buffer);
    });
  } catch (cloudErr) {
    logger.warn('Cloudinary upload failed, falling back to local file reference:', cloudErr?.message || cloudErr);
    return {
      secureUrl: getFileUrl(file),
      publicId: ''
    };
  }
}

async function extractTextFromUploadedFile(file) {
  // Validate file buffer
  if (!file?.buffer || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    throw new ApiError(400, 'Invalid file buffer');
  }

  const fileName = String(file.originalname || '').toLowerCase();
  const mimeType = String(file.mimetype || '').toLowerCase();
  const fileExt = path.extname(fileName);

  // Explicit extension-to-MIME mapping
  const ALLOWED_MIME_BY_EXT = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };

  const expectedMime = ALLOWED_MIME_BY_EXT[fileExt];
  if (!expectedMime || mimeType !== expectedMime) {
    throw new ApiError(400, 'Unsupported file type or MIME mismatch');
  }

  // Basic signature check: first few bytes
  const buffer = file.buffer;
  if (fileExt === '.pdf') {
    // PDF files start with "%PDF-" (offset 0)
    if (!buffer.toString('ascii', 0, 5).startsWith('%PDF-')) {
      throw new ApiError(400, 'Invalid PDF file signature');
    }
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    try {
      const parsed = await parser.getText();
      return normalizeText(parsed?.text || '');
    } finally {
      await parser.destroy();
    }
  }

  if (fileExt === '.docx') {
    // DOCX is ZIP: check magic number at offset 0-3 (0x50 0x4B 0x03 0x04)
    if (buffer[0] !== 0x50 || buffer[1] !== 0x4B || buffer[2] !== 0x03 || buffer[3] !== 0x04) {
      throw new ApiError(400, 'Invalid DOCX file signature');
    }
    const mammothModule = await import('mammoth');
    const mammoth = mammothModule.default?.extractRawText || mammothModule.extractRawText;
    const result = await mammoth({ buffer: file.buffer });
    return normalizeText(result.value || '');
  }

  throw new ApiError(400, 'Unsupported file format');
}

async function storeResume(userId, file, extractedText, targetJobDescription = '') {
  if (!file) {
    throw new ApiError(400, 'Resume file is required');
  }

  const extractedFileText = normalizeText(extractedText || (await extractTextFromUploadedFile(file)));
  const reportInput = await scoreResume(extractedFileText || file.originalname, targetJobDescription);
  const uploadedFile = await uploadResumeFileToCloudinary(file);
  const resume = await createResume({
    userId,
    fileUrl: uploadedFile.secureUrl,
    originalName: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.size,
    version: 1,
    atsScore: reportInput.atsScore,
    extractedText: extractedFileText,
    cloudinaryPublicId: uploadedFile.publicId
  });

  const report = await createResumeReport({
    resumeId: resume._id,
    userId,
    atsScore: reportInput.atsScore,
    jobMatchScore: typeof reportInput.jobMatchScore === 'number' ? reportInput.jobMatchScore : null,
    grammar: reportInput.grammar,
    keywords: reportInput.keywords,
    missingSkills: reportInput.missingSkills,
    strengths: reportInput.strengths,
    weaknesses: reportInput.weaknesses,
    topGaps: reportInput.topGaps || [],
    suggestions: reportInput.suggestions,
    targetJobDescription: normalizeText(targetJobDescription),
    matchedKeywords: reportInput.matchedKeywords,
    atsKeywordMatch: reportInput.atsKeywordMatch,
    sourceText: extractedFileText
  });

  return { resume, report };
}

async function listUserResumes(userId) {
  return findResumesByUserId(userId);
}

async function getUserResume(userId, resumeId) {
  validateObjectId(resumeId, 'Invalid resume id');

  const resume = await findResumeByIdAndUserId(resumeId, userId);

  if (!resume) {
    throw new ApiError(404, 'Resume not found');
  }

  return resume;
}

async function removeUserResume(userId, resumeId) {
  validateObjectId(resumeId, 'Invalid resume id');

  const resume = await findResumeByIdAndUserId(resumeId, userId);

  if (!resume) {
    throw new ApiError(404, 'Resume not found');
  }

  const cloudinary = configureCloudinary();

  if (cloudinary && resume.cloudinaryPublicId) {
    await cloudinary.uploader.destroy(resume.cloudinaryPublicId, { resource_type: 'auto' });
  }

  const deleted = await deleteResumeByIdAndUserId(resumeId, userId);

  if (!deleted) {
    throw new ApiError(404, 'Resume not found');
  }

  return deleted;
}

async function analyzeResumeInput({ userId, resumeId, file, extractedText, targetJobDescription = '' }) {
  let targetResumeId = resumeId;
  let resume = null;

  if (targetResumeId) {
    validateObjectId(targetResumeId, 'Invalid resume id');
    resume = await findResumeByIdAndUserId(targetResumeId, userId);

    if (!resume) {
      throw new ApiError(404, 'Resume not found');
    }
  }

  if (file) {
    const stored = await storeResume(userId, file, extractedText, targetJobDescription);
    resume = stored.resume;
    targetResumeId = stored.resume._id;
  }

  const analysisSourceText = normalizeText(extractedText || resume?.extractedText || (file ? await extractTextFromUploadedFile(file) : '') || resume?.originalName || '');
  const analysis = await scoreResume(analysisSourceText, targetJobDescription);

  if (resume) {
    await updateResumeScore(resume._id, userId, analysis.atsScore, analysisSourceText);
  }

  const report = await createResumeReport({
    resumeId: targetResumeId || resume?._id,
    userId,
    atsScore: analysis.atsScore,
    jobMatchScore: typeof analysis.jobMatchScore === 'number' ? analysis.jobMatchScore : null,
    grammar: analysis.grammar,
    keywords: analysis.keywords,
    missingSkills: analysis.missingSkills,
    strengths: analysis.strengths,
    weaknesses: analysis.weaknesses,
    topGaps: analysis.topGaps || [],
    suggestions: analysis.suggestions,
    targetJobDescription: normalizeText(targetJobDescription),
    matchedKeywords: analysis.matchedKeywords,
    atsKeywordMatch: analysis.atsKeywordMatch,
    sourceText: analysisSourceText
  });

  return { resume, report, analysis };
}

async function listUserReports(userId) {
  return findReportsByUserId(userId);
}

async function getUserResumeReports(userId, resumeId) {
  validateObjectId(resumeId, 'Invalid resume id');
  return findReportsByResumeId(resumeId, userId);
}

async function getLatestUserResumeReport(userId) {
  return findLatestReportByUserId(userId);
}

async function reviewResumeWithAI(resumeText, targetJobDescription = '') {
  const safeText = String(resumeText || '').trim();
  if (!safeText) {
    throw new ApiError(400, 'Resume text is required for review');
  }

  const atsAnalysis = await scoreResume(safeText, targetJobDescription);

  if (!env.GEMINI_API_KEY) {
    logger.warn('GEMINI_API_KEY not set — returning ATS-only resume review');
    return {
      ...atsAnalysis,
      careerGuidance: 'AI career guidance unavailable. Review the ATS analysis above for improvement areas.'
    };
  }

  try {
    const prompt = `You are a senior technical recruiter and career advisor. A candidate has submitted their resume for review.

ATS Analysis Results:
- ATS Score: ${atsAnalysis.atsScore}/100
- Grammar Score: ${atsAnalysis.grammar}/100
- Strengths: ${(atsAnalysis.strengths || []).join(', ') || 'None identified'}
- Weaknesses: ${(atsAnalysis.weaknesses || []).join(', ') || 'None identified'}
- Missing Skills: ${(atsAnalysis.missingSkills || []).join(', ') || 'None identified'}
${targetJobDescription ? `\nTarget Job Description: "${targetJobDescription.substring(0, 2000)}"` : ''}

Resume excerpt (first 4000 chars):
"${safeText.substring(0, 4000)}"

Based on this analysis, provide actionable career guidance in 2-4 paragraphs. Cover:
1. What the resume does well and what a recruiter would notice first
2. The most impactful improvements the candidate should make this week
3. How to better position this resume for their target role
${targetJobDescription ? '4. Specific alignment suggestions for the target job description' : ''}

Respond ONLY in plain text. Be concise, specific, and encouraging.`;

    const { generateWithGemini } = require('../utils/geminiClient');
    const result = await generateWithGemini({ prompt });

    if (result && result.text) {
      return {
        ...atsAnalysis,
        careerGuidance: result.text.trim()
      };
    }

    return {
      ...atsAnalysis,
      careerGuidance: 'AI career guidance unavailable. Review the ATS analysis above for improvement areas.'
    };
  } catch (error) {
    logger.error('Gemini resume career guidance failed, returning ATS-only results', {
      message: error.message,
      status: error.status || error.code
    });
    return {
      ...atsAnalysis,
      careerGuidance: 'AI career guidance unavailable. Review the ATS analysis above for improvement areas.'
    };
  }
}

module.exports = {
  storeResume,
  listUserResumes,
  getUserResume,
  removeUserResume,
  analyzeResumeInput,
  listUserReports,
  getUserResumeReports,
  getLatestUserResumeReport,
  scoreResume,
  reviewResumeWithAI
};

