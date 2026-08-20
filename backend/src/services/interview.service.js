const mongoose = require('mongoose');
const { ApiError } = require('../utils/apiError');
const { env } = require('../config/env');
const { logger } = require('../config/logger');
const { z } = require('zod');
const { generateWithGemini, generateStructuredJSON } = require('../utils/geminiClient');
const {
  createInterviewSession,
  findInterviewsByUserId,
  findInterviewByIdAndUserId,
  deleteInterviewByIdAndUserId,
  saveInterviewFeedback
} = require('../repositories/ai.repository');
const { findResumesByUserId } = require('../repositories/resume.repository');

const MAX_INTERVIEW_QUESTIONS = 15;

const QUESTION_BANK = {
  technical: [
    'Explain how event loops and asynchronous execution work in Node.js/JavaScript.',
    'How do database indexes improve query performance, and what are their tradeoffs?',
    'Explain the differences between SQL and NoSQL databases for high-concurrency systems.',
    'What is the difference between process and thread? How does context switching work?'
  ],
  hr: [
    'Tell me about yourself and why you are interested in this role.',
    'Where do you see yourself in three years professionally?',
    'Why do you want to join our engineering team specifically?'
  ],
  behavioral: [
    'Describe a situation where you had a disagreement with a team member. How did you resolve it?',
    'Tell me about a challenging project deadline you faced and how you prioritize tasks.',
    'Describe a time you failed or made a technical mistake. What did you learn?'
  ],
  'system-design': [
    'Design a URL shortening service like Bitly handling 100M requests per day.',
    'How would you design a real-time chat application like Slack or WhatsApp?',
    'Design an ATS Resume Parser and Job Tracking Notification System.'
  ],
  'resume-based': [
    'Walk me through your most complex project. What architectural decisions did you make?',
    'Why did you select this specific tech stack over alternatives for your project?',
    'If you had to rewrite your recent project from scratch, what would you change?'
  ]
};

function validateObjectId(id, message = 'Invalid id') {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, message);
  }
}

function analyzeAnswer(answer = '') {
  const normalized = String(answer).trim().toLowerCase();
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  const hasExample = /because|example|project|team|result|impact|improved|built|architected/.test(normalized);
  const hasStructure = /first|second|finally|situation|task|action|result|tradeoff/.test(normalized);

  const confidence = Math.min(100, 50 + (wordCount > 40 ? 20 : 10) + (hasExample ? 15 : 0));
  const communication = Math.min(100, 55 + (wordCount > 35 ? 15 : 0) + (hasStructure ? 15 : 0));
  const correctness = Math.min(100, 50 + (normalized.includes('because') ? 15 : 5) + (hasExample ? 20 : 5));
  const overallRating = Math.round((confidence + communication + correctness) / 3);

  return {
    confidence,
    communication,
    correctness,
    overallRating,
    suggestions: [
      wordCount < 30 ? 'Provide a more detailed answer with concrete technical specifics.' : 'Good response length and context.',
      hasExample ? 'Strong inclusion of practical project context.' : 'Use the STAR method (Situation, Task, Action, Result) with measurable outcomes.'
    ]
  };
}

async function callGeminiJson(prompt, schema) {
  const result = await generateStructuredJSON({
    prompt,
    schema
  });

  if (result) {
    return result;
  }

  throw new Error('All candidate Gemini models failed');
}

/**
 * Researches real-life interview question patterns for a given company using Google Search Grounding.
 * Sets an 8s timeout and fails silently back to generic role patterns.
 */
async function researchCompanyInterviewIntel(targetCompany, targetRole, type) {
  if (!targetCompany || typeof targetCompany !== 'string' || !targetCompany.trim()) {
    return '';
  }

  const cleanCompany = targetCompany.trim();
  const cleanRole = (targetRole || 'Software Engineer').trim();

  const prompt = `Research real-life engineering interview patterns and questions for ${cleanCompany} for the role of ${cleanRole} (${type} interview track).
Summarize in 3-4 bullet points:
- Core interview themes and question styles asked by ${cleanCompany} (e.g. Amazon Leadership Principles / STAR questions, Google algorithms/distributed systems, Meta product design).
- Specific evaluation priorities and company values.
Keep the summary concise, factual, and actionable.`;

  try {
    const searchPromise = generateWithGemini({
      prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Search grounding timed out')), 8000)
    );

    const result = await Promise.race([searchPromise, timeoutPromise]);
    if (result && result.text && result.text.trim()) {
      return result.text.trim();
    }
  } catch (err) {
    logger.warn(`Company search grounding skipped for ${cleanCompany}:`, {
      message: err?.message || String(err)
    });
  }

  return '';
}

/**
 * Process an interview turn with memory tracking, natural reactions, and adaptive follow-ups.
 */
async function processInterviewTurn({
  type = 'technical',
  difficulty = 'medium',
  targetRole = 'SDE-1',
  targetCompany = '',
  companyIntel = '',
  topic = '',
  jobDescription = '',
  resumeText = '',
  transcript = [],
  structuredMemory = {}
}) {
  const isOpening = !transcript || transcript.length === 0;

  if (isOpening) {
    const openingPrompt = `You are an experienced, high-standards senior software engineering interviewer${targetCompany ? ` at ${targetCompany}` : ' at a top technology company'}.
Conducting a ${difficulty} difficulty ${type} interview for the target role: ${targetRole}${topic ? ` (${topic})` : ''}.
${targetCompany ? `Target Company: ${targetCompany}\n` : ''}${companyIntel ? `Real Company Interview Intelligence & Rubrics:\n"""\n${companyIntel}\n"""\n` : ''}${jobDescription ? `Target Job Description:\n"""\n${jobDescription.substring(0, 2000)}\n"""\n` : ''}${resumeText ? `Candidate Resume Context:\n"""\n${resumeText.substring(0, 3000)}\n"""\n` : ''}
Generate the opening question for this interview.
${companyIntel ? `- IMPORTANT: Ground your opening question in ${targetCompany}'s actual real-life interview patterns and criteria provided above (e.g. Amazon Leadership Principles/STAR for behavioral, Google CS/algorithmic fundamentals for technical).\n` : ''}- Match the interview style (${type}):
  * behavioral / STAR: Start with a concrete behavioral opener about a challenging project, leadership, or ownership.
  * technical / coding: Start with a solid engineering question on fundamentals, data structures, or project architecture.
  * system-design: Set a clear, realistic architectural design scenario.
  * resume-based: Open with a direct question regarding their most significant project or experience on their resume.
  * hr: Open with a concise question on motivation, team dynamics, or career path.
- Tone: Professional, conversational, direct, and realistic. Has personality, no robotic greetings.
- Do NOT praise or give motivational speeches.
- Ask ONE clear, focused question (1-3 sentences).

Respond STRICTLY in JSON format:
{
  "interviewerReaction": "Welcome. Let's get started.",
  "nextQuestion": "your opening interview question",
  "fullSpokenMessage": "Welcome. Let's get started. <opening question>",
  "currentTopic": "Introduction and Project Overview",
  "adaptedDifficulty": "${difficulty}"
}`;

    const openingSchema = z.object({
      interviewerReaction: z.string().default('Welcome. Let\'s get started.'),
      nextQuestion: z.string().min(8),
      fullSpokenMessage: z.string().min(8),
      currentTopic: z.string().default('Opening'),
      adaptedDifficulty: z.string().default(difficulty)
    });

    try {
      const result = await callGeminiJson(openingPrompt, openingSchema);
      return {
        ...result,
        extractedMemory: {
          newTechnologies: [],
          newProjects: [],
          newClaims: [],
          newDecisions: [],
          weakAreas: [],
          strongAreas: []
        },
        nextAction: 'OPENING'
      };
    } catch (err) {
      logger.error('Failed to generate opening question with AI, using fallback', err?.message);
      const fallback = QUESTION_BANK[type]?.[0] || 'Can you walk me through your technical background and engineering projects?';
      return {
        interviewerReaction: "Welcome. Let's get started.",
        nextQuestion: fallback,
        fullSpokenMessage: `Welcome. Let's get started. ${fallback}`,
        currentTopic: 'Opening',
        adaptedDifficulty: difficulty,
        extractedMemory: { newTechnologies: [], newProjects: [], newClaims: [], newDecisions: [], weakAreas: [], strongAreas: [] },
        nextAction: 'OPENING'
      };
    }
  }

  // Active turn: analyze last answer, update memory, decide action, formulate natural reaction + follow-up
  const formattedTranscript = transcript
    .map((t) => `${t.speaker === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${t.message}`)
    .join('\n\n');

  const memoryContext = `
Structured Memory accumulated so far:
- Technologies Mentioned: ${JSON.stringify(structuredMemory.technologiesMentioned || [])}
- Projects Mentioned: ${JSON.stringify(structuredMemory.projectsMentioned || [])}
- Claims Made: ${JSON.stringify((structuredMemory.claimsMade || []).map(c => c.claim || c))}
- Architectural Decisions: ${JSON.stringify(structuredMemory.decisionsMade || [])}
- Identified Weak Areas: ${JSON.stringify(structuredMemory.weakAreas || [])}
- Identified Strong Areas: ${JSON.stringify(structuredMemory.strongAreas || [])}
- Topics Covered: ${JSON.stringify(structuredMemory.topicsCovered || [])}
- Current Topic: "${structuredMemory.currentTopic || ''}" (explored for ${structuredMemory.topicTurnCount || 0} turn(s))
- Adapted Difficulty: "${structuredMemory.adaptedDifficulty || difficulty}"
`.trim();

  const turnPrompt = `You are a real-life, rigorous senior software engineering interviewer${targetCompany ? ` at ${targetCompany}` : ' at a top technology company'}.
You are in the middle of a live interview with a candidate.

Role: ${targetRole}
${targetCompany ? `Target Company: ${targetCompany}\n` : ''}Interview Style: ${type}
Base Difficulty: ${difficulty}
${companyIntel ? `Real Company Interview Intelligence & Rubrics:\n"""\n${companyIntel}\n"""\n` : ''}${jobDescription ? `Job Description:\n"""\n${jobDescription.substring(0, 2000)}\n"""\n` : ''}
${resumeText ? `Candidate Resume Context:\n"""\n${resumeText.substring(0, 3000)}\n"""\n` : ''}

${memoryContext}

Live Interview Transcript:
"""
${formattedTranscript}
"""

CRITICAL LANGUAGE REQUIREMENT:
The interview is conducted exclusively in English (standard English and Indian English en-IN). You MUST interpret all candidate transcripts as English. Do NOT translate into German or any other language.

YOUR TASK:
1. Understand and rigorously evaluate the candidate's last answer.
2. Extract any new technologies, projects, specific claims (e.g. metrics like '40% latency reduction', scale like '100k RPS'), architectural decisions, weak points, and strong points.
3. Decide the next strategic interviewer action:
   - "CHALLENGE": Candidate made an unsupported, vague, or exaggerated claim (e.g. claims huge scale or caching without explaining bottlenecks or cache invalidation). Directly challenge them on the failure mode, edge case, or trade-off!
   - "PROBE_METRIC": Candidate claimed a quantitative metric (e.g. "improved speed by 40%") or scale without detailing how it was measured or validated. Probe for profiling tools, baseline vs peak numbers, or DB capacity.
   - "FOLLOW_UP": Candidate mentioned a concrete technical decision (e.g. choosing Redis, Kafka, WebSockets, or a specific DB). Drill into concurrency, race conditions, consistency models, or fallback strategies.
   - "ASK_CLARIFICATION": Candidate gave an incomplete or hand-wavy response. Ask for the exact algorithm or implementation step.
   - "TRANSITION_NEW_TOPIC": Current topic has been thoroughly explored (usually 2-3 turns) or candidate reached a dead-end. Transition to a new topic or connect to an earlier statement.
4. Formulate the Interviewer's natural response:
   - Natural conversational reaction: Acknowledge what the candidate said with character and realistic pacing.
     Examples:
     * "You mentioned improving latency by 40% with Redis. What exactly were you caching, and how did you handle cache invalidation when data updated?"
     * "You mentioned scaling to 100k requests per second. Where was your database bottleneck during write spikes, and how did you prevent connection exhaustion?"
     * "Why did you choose MongoDB over Postgres for that transactional payment flow?"
     * "Suppose the network partitions right after the message is published to the queue. How do you prevent duplicate processing?"
   - DO NOT praise every answer (NEVER say "Great answer!", "Excellent!", "Good job!").
   - Stay professional and direct. Never be a robotic assistant ("Thank you for your response. Here is the next question.").
   - Keep full message to 1-3 direct sentences asking ONE clear follow-up question.

Respond STRICTLY in JSON format:
{
  "assessment": {
    "relevance": number (1-10),
    "clarity": number (1-10),
    "technicalDepth": number (1-10),
    "specificity": number (1-10)
  },
  "extractedMemory": {
    "newTechnologies": ["string"],
    "newProjects": ["string"],
    "newClaims": ["string"],
    "newDecisions": ["string"],
    "weakAreas": ["string"],
    "strongAreas": ["string"]
  },
  "nextAction": "FOLLOW_UP" | "CHALLENGE" | "PROBE_METRIC" | "ASK_CLARIFICATION" | "TRANSITION_NEW_TOPIC",
  "currentTopic": "string",
  "interviewerReaction": "string",
  "nextQuestion": "string",
  "fullSpokenMessage": "string",
  "adaptedDifficulty": "easy" | "medium" | "hard"
}`;

  const turnSchema = z.object({
    assessment: z.object({
      relevance: z.number().min(1).max(10).default(7),
      clarity: z.number().min(1).max(10).default(7),
      technicalDepth: z.number().min(1).max(10).default(7),
      specificity: z.number().min(1).max(10).default(7)
    }).default({ relevance: 7, clarity: 7, technicalDepth: 7, specificity: 7 }),
    extractedMemory: z.object({
      newTechnologies: z.array(z.string()).default([]),
      newProjects: z.array(z.string()).default([]),
      newClaims: z.array(z.string()).default([]),
      newDecisions: z.array(z.string()).default([]),
      weakAreas: z.array(z.string()).default([]),
      strongAreas: z.array(z.string()).default([])
    }).default({ newTechnologies: [], newProjects: [], newClaims: [], newDecisions: [], weakAreas: [], strongAreas: [] }),
    nextAction: z.enum(['FOLLOW_UP', 'CHALLENGE', 'PROBE_METRIC', 'ASK_CLARIFICATION', 'TRANSITION_NEW_TOPIC']).default('FOLLOW_UP'),
    currentTopic: z.string().default(structuredMemory.currentTopic || 'Technical Deep Dive'),
    interviewerReaction: z.string().default('Fair enough.'),
    nextQuestion: z.string().min(8),
    fullSpokenMessage: z.string().min(8),
    adaptedDifficulty: z.string().default(difficulty)
  });

  try {
    return await callGeminiJson(turnPrompt, turnSchema);
  } catch (error) {
    logger.error('Gemini turn processing failed, using fallback', { message: error?.message || error });
    const bank = QUESTION_BANK[type] || QUESTION_BANK.technical;
    const fallbackIndex = Math.min(Math.floor(transcript.length / 2), bank.length - 1);
    const fallbackQ = bank[fallbackIndex] || 'Can you walk me through your technical trade-offs on this architecture?';
    return {
      assessment: { relevance: 7, clarity: 7, technicalDepth: 6, specificity: 6 },
      extractedMemory: { newTechnologies: [], newProjects: [], newClaims: [], newDecisions: [], weakAreas: [], strongAreas: [] },
      nextAction: 'FOLLOW_UP',
      currentTopic: structuredMemory.currentTopic || 'System Architecture',
      interviewerReaction: 'Fair enough. Let\'s look at another angle.',
      nextQuestion: fallbackQ,
      fullSpokenMessage: `Fair enough. Let's look at another angle. ${fallbackQ}`,
      adaptedDifficulty: difficulty
    };
  }
}

/**
 * Evaluate an interview answer using Gemini AI or heuristic fallback.
 */
async function evaluateAnswerWithAI(question, answer, type, difficulty) {
  const fallback = analyzeAnswer(answer);

  if (!env.GEMINI_API_KEY) {
    logger.warn('GEMINI_API_KEY not set — using regex-based answer evaluation');
    return fallback;
  }

  try {
    const prompt = `You are a senior ${type} interviewer evaluating a candidate's answer.

Difficulty level: ${difficulty}
Question: "${question}"
Candidate's answer: "${answer}"

Evaluate the answer on these dimensions (0-100 each):
- confidence: Does the candidate sound sure and decisive? Do they demonstrate ownership of their knowledge?
- communication: Is the answer well-structured, clear, and concise? Does it use proper technical vocabulary?
- correctness: Is the technical content accurate? Are the concepts explained correctly?
- overallRating: A weighted overall score (correctness 50%, communication 30%, confidence 20%)

Also provide:
- suggestions: 2-3 specific, actionable improvement tips for this answer
- feedback: A 1-2 sentence qualitative summary of the answer's strengths and areas to improve

Respond STRICTLY in JSON format:
{
  "confidence": number,
  "communication": number,
  "correctness": number,
  "overallRating": number,
  "suggestions": ["string", ...],
  "feedback": "string"
}`;

    const responseSchema = z.object({
      confidence: z.number().min(0).max(100),
      communication: z.number().min(0).max(100),
      correctness: z.number().min(0).max(100),
      overallRating: z.number().min(0).max(100),
      suggestions: z.array(z.string()),
      feedback: z.string()
    });

    return await callGeminiJson(prompt, responseSchema);
  } catch (error) {
    logger.error('Gemini answer evaluation failed, using regex fallback', {
      message: error?.message || error
    });
    return { ...fallback, feedback: 'Answer evaluated using basic heuristics.' };
  }
}

async function startInterview(arg1, arg2 = {}) {
  // Support both (userId, options) and ({ userId, ...options })
  const userId = typeof arg1 === 'object' ? arg1.userId : arg1;
  const options = typeof arg1 === 'object' ? arg1 : arg2;
  const {
    type = 'technical',
    difficulty = 'medium',
    targetRole = 'SDE-1',
    targetCompany = '',
    topic = '',
    jobDescription = '',
    priorityFocus = ''
  } = options;

  validateObjectId(userId, 'Invalid user id');

  const difficultyMap = { beginner: 'easy', intermediate: 'medium', senior: 'hard' };
  const normalizedDifficulty = difficultyMap[String(difficulty || '').toLowerCase()] || String(difficulty || 'medium').toLowerCase();

  // Fetch candidate's prior interview weaknesses to adapt the new session
  const priorInterviews = await findInterviewsByUserId(userId).catch(() => []);
  const completedPriors = priorInterviews.filter((i) => i.status === 'completed');
  const pastWeaknesses = completedPriors
    .flatMap((i) => i.evaluationReport?.areasToImprove || i.weaknesses || [])
    .slice(0, 3);

  // Fetch resume context if available
  const resumes = await findResumesByUserId(userId).catch(() => []);
  const resumeText = resumes[0]?.extractedText || '';

  // Research company-specific interview intelligence if targetCompany is provided
  const companyIntel = targetCompany
    ? await researchCompanyInterviewIntel(targetCompany, targetRole, type)
    : '';

  const initialTurn = await processInterviewTurn({
    type,
    difficulty: normalizedDifficulty,
    targetRole,
    targetCompany,
    companyIntel,
    topic: topic || priorityFocus || targetRole,
    jobDescription,
    resumeText,
    pastWeaknesses,
    transcript: [],
    structuredMemory: {
      technologiesMentioned: [],
      projectsMentioned: [],
      claimsMade: [],
      decisionsMade: [],
      weakAreas: pastWeaknesses,
      strongAreas: [],
      topicsCovered: [priorityFocus || topic || 'Core Engineering'],
      currentTopic: priorityFocus || topic || 'Core Engineering',
      topicTurnCount: 0,
      adaptedDifficulty: normalizedDifficulty,
      companyIntel
    }
  });

  const openingQuestion = initialTurn.nextQuestion || initialTurn.fullSpokenMessage || 'Welcome. Walk me through your most complex software project and architectural decisions.';

  const session = await createInterviewSession({
    userId,
    type,
    difficulty: normalizedDifficulty,
    topic: topic || priorityFocus || targetRole,
    targetRole,
    targetCompany,
    companyIntel,
    jobDescription,
    status: 'in-progress',
    questions: [openingQuestion],
    answers: [],
    transcript: [
      {
        speaker: 'interviewer',
        message: openingQuestion,
        timestamp: new Date()
      }
    ],
    structuredMemory: {
      technologiesMentioned: initialTurn.extractedMemory?.newTechnologies || [],
      projectsMentioned: initialTurn.extractedMemory?.newProjects || [],
      claimsMade: [],
      decisionsMade: initialTurn.extractedMemory?.newDecisions || [],
      weakAreas: pastWeaknesses,
      strongAreas: initialTurn.extractedMemory?.strongAreas || [],
      topicsCovered: [initialTurn.currentTopic || 'Core Engineering'],
      currentTopic: initialTurn.currentTopic || 'Core Engineering',
      topicTurnCount: 1,
      adaptedDifficulty: initialTurn.adaptedDifficulty || normalizedDifficulty,
      companyIntel
    },
    score: 0,
    confidence: 0,
    communication: 0,
    technicalKnowledge: 0,
    problemSolving: 0,
    behavioralScore: 0,
    correctness: 0,
    overallRating: 0,
    strengths: [],
    weaknesses: [],
    suggestions: [],
    keyImprovement: '',
    sampleImprovements: [],
    feedback: `Live adaptive interview session active for ${targetRole} (${type.toUpperCase()} - ${normalizedDifficulty.toUpperCase()}).`
  });

  return session;
}

async function listUserInterviews(userId) {
  return findInterviewsByUserId(userId);
}

async function getUserInterview(userId, interviewId) {
  validateObjectId(interviewId, 'Invalid interview id');
  const interview = await findInterviewByIdAndUserId(interviewId, userId);
  if (!interview) {
    throw new ApiError(404, 'Interview not found');
  }
  return interview;
}

async function deleteUserInterview(userId, interviewId) {
  validateObjectId(interviewId, 'Invalid interview id');
  const interview = await deleteInterviewByIdAndUserId(interviewId, userId);
  if (!interview) {
    throw new ApiError(404, 'Interview not found');
  }
  return interview;
}

async function submitInterviewAnswer({ userId, interviewId, answer }) {
  validateObjectId(interviewId, 'Invalid interview id');

  const interview = await findInterviewByIdAndUserId(interviewId, userId);
  if (!interview) {
    throw new ApiError(404, 'Interview not found');
  }

  if (interview.status === 'completed') {
    throw new ApiError(400, 'Interview session is already completed.');
  }

  const answerText = String(answer || '').trim();
  if (!answerText) {
    throw new ApiError(400, 'Answer cannot be empty');
  }

  // Get current transcript or reconstruct from questions/answers if missing
  let currentTranscript = Array.isArray(interview.transcript) && interview.transcript.length > 0
    ? [...interview.transcript]
    : [];

  if (currentTranscript.length === 0) {
    (interview.questions || []).forEach((q, idx) => {
      currentTranscript.push({ speaker: 'interviewer', message: q, timestamp: new Date() });
      if (interview.answers?.[idx]) {
        currentTranscript.push({ speaker: 'candidate', message: interview.answers[idx], timestamp: new Date() });
      }
    });
  }

  // Append candidate's answer
  currentTranscript.push({
    speaker: 'candidate',
    message: answerText,
    timestamp: new Date()
  });

  const updatedAnswers = [...(interview.answers || []), answerText];
  const existingQuestions = [...(interview.questions || [])];

  // Retrieve user's resume text if available
  let resumeText = '';
  try {
    const resumes = await findResumesByUserId(userId);
    if (resumes && resumes.length > 0) {
      resumeText = resumes[0].extractedText || '';
    }
  } catch (err) {
    logger.warn('Could not fetch resume text for interview question generation', err?.message);
  }

  const prevMemory = interview.structuredMemory || {};
  const companyIntel = interview.companyIntel || prevMemory.companyIntel || '';

  // Process the turn through the conversational interviewer brain
  const turnResult = await processInterviewTurn({
    type: interview.type,
    difficulty: interview.difficulty,
    targetRole: interview.targetRole || interview.topic || 'SDE-1',
    targetCompany: interview.targetCompany || '',
    companyIntel,
    topic: interview.topic,
    jobDescription: interview.jobDescription || '',
    resumeText,
    transcript: currentTranscript,
    structuredMemory: prevMemory
  });

  const nextSpeech = turnResult.fullSpokenMessage || `${turnResult.interviewerReaction} ${turnResult.nextQuestion}`.trim();

  // Append interviewer question to transcript and questions list
  currentTranscript.push({
    speaker: 'interviewer',
    message: nextSpeech,
    timestamp: new Date()
  });

  existingQuestions.push(nextSpeech);

  // Update structured memory
  const newTech = Array.from(new Set([...(prevMemory.technologiesMentioned || []), ...(turnResult.extractedMemory?.newTechnologies || [])]));
  const newProjects = Array.from(new Set([...(prevMemory.projectsMentioned || []), ...(turnResult.extractedMemory?.newProjects || [])]));
  const newClaims = [
    ...(prevMemory.claimsMade || []),
    ...(turnResult.extractedMemory?.newClaims || []).map((c) => ({
      claim: c,
      turnIndex: updatedAnswers.length,
      challenged: turnResult.nextAction === 'CHALLENGE' || turnResult.nextAction === 'PROBE_METRIC'
    }))
  ];
  const newDecisions = Array.from(new Set([...(prevMemory.decisionsMade || []), ...(turnResult.extractedMemory?.newDecisions || [])]));
  const newWeak = Array.from(new Set([...(prevMemory.weakAreas || []), ...(turnResult.extractedMemory?.weakAreas || [])]));
  const newStrong = Array.from(new Set([...(prevMemory.strongAreas || []), ...(turnResult.extractedMemory?.strongAreas || [])]));

  const topicChanged = turnResult.currentTopic && turnResult.currentTopic !== prevMemory.currentTopic;
  const newTopicsCovered = topicChanged && prevMemory.currentTopic
    ? Array.from(new Set([...(prevMemory.topicsCovered || []), prevMemory.currentTopic]))
    : (prevMemory.topicsCovered || []);

  const newTurnCount = topicChanged ? 1 : ((prevMemory.topicTurnCount || 1) + 1);

  const updatedMemory = {
    technologiesMentioned: newTech,
    projectsMentioned: newProjects,
    claimsMade: newClaims,
    decisionsMade: newDecisions,
    weakAreas: newWeak,
    strongAreas: newStrong,
    topicsCovered: newTopicsCovered,
    currentTopic: turnResult.currentTopic || prevMemory.currentTopic || 'Technical Discussion',
    topicTurnCount: newTurnCount,
    adaptedDifficulty: turnResult.adaptedDifficulty || prevMemory.adaptedDifficulty || interview.difficulty
  };

  const updatedSession = await saveInterviewFeedback(interviewId, userId, {
    questions: existingQuestions,
    answers: updatedAnswers,
    transcript: currentTranscript,
    structuredMemory: updatedMemory,
    feedback: `Interview in progress (${updatedAnswers.length} responses recorded). Topic: ${updatedMemory.currentTopic}.`
  });

  return updatedSession;
}

async function completeInterviewSession({ userId, interviewId }) {
  validateObjectId(interviewId, 'Invalid interview id');

  const interview = await findInterviewByIdAndUserId(interviewId, userId);
  if (!interview) {
    throw new ApiError(404, 'Interview not found');
  }

  // If already completed and has evaluation report, return it
  if (interview.status === 'completed' && interview.evaluationReport?.overallScore > 0) {
    return interview;
  }

  const answers = interview.answers || [];
  const questions = interview.questions || [];

  if (answers.length === 0) {
    const emptyReport = {
      overallScore: 0,
      communication: 0,
      technicalKnowledge: 0,
      problemSolving: 0,
      clarity: 0,
      confidence: 0,
      relevance: 0,
      conciseness: 0,
      starStructure: 0,
      ownership: 0,
      technicalDepth: 0,
      architectureScore: 0,
      tradeoffAnalysis: 0,
      strengths: ['Interview session initiated.'],
      areasToImprove: ['No answers were submitted before concluding the session.'],
      struggledQuestions: [],
      strongestAnswer: { question: '', candidateAnswer: '', reason: 'No responses recorded.' },
      weakestAnswer: { question: '', candidateAnswer: '', missing: 'No responses recorded.' },
      verdict: 'Incomplete Interview (0 answers)',
      executiveSummary: 'Session ended with no responses recorded.',
      keyImprovement: 'Complete at least 3-5 interview questions to receive full evaluation.',
      sampleImprovements: []
    };

    const updated = await saveInterviewFeedback(interviewId, userId, {
      status: 'completed',
      score: 0,
      confidence: 0,
      communication: 0,
      technicalKnowledge: 0,
      problemSolving: 0,
      behavioralScore: 0,
      correctness: 0,
      overallRating: 0,
      strengths: emptyReport.strengths,
      weaknesses: emptyReport.areasToImprove,
      keyImprovement: emptyReport.keyImprovement,
      sampleImprovements: [],
      feedback: emptyReport.executiveSummary,
      evaluationReport: emptyReport
    });
    return updated;
  }

  // Reconstruct transcript
  const transcript = Array.isArray(interview.transcript) && interview.transcript.length > 0
    ? interview.transcript
    : questions.map((q, idx) => [
        { speaker: 'interviewer', message: q },
        ...(answers[idx] ? [{ speaker: 'candidate', message: answers[idx] }] : [])
      ]).flat();

  const formattedTranscript = transcript
    .map((t) => `${t.speaker === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${t.message}`)
    .join('\n\n');

  try {
    const prompt = `You are a Principal Software Engineer and Bar-Raiser evaluating a candidate's completed software engineering interview.

Target Role: ${interview.targetRole || interview.topic || 'SDE-1'}
Interview Style: ${interview.type}
Difficulty Level: ${interview.difficulty}
${interview.jobDescription ? `Target Job Description:\n"""\n${interview.jobDescription.substring(0, 2000)}\n"""\n` : ''}

Structured Memory from the Interview:
- Technologies Discussed: ${JSON.stringify(interview.structuredMemory?.technologiesMentioned || [])}
- Projects Discussed: ${JSON.stringify(interview.structuredMemory?.projectsMentioned || [])}
- Identified Weak Areas: ${JSON.stringify(interview.structuredMemory?.weakAreas || [])}
- Identified Strong Areas: ${JSON.stringify(interview.structuredMemory?.strongAreas || [])}
- Topics Covered: ${JSON.stringify(interview.structuredMemory?.topicsCovered || [])}

Complete Interview Transcript:
"""
${formattedTranscript}
"""

CRITICAL LANGUAGE REQUIREMENT:
The interview was conducted strictly in English. Evaluate all candidate responses in English.

Provide a thorough, honest, and rigorous Bar-Raiser performance evaluation.

CRITICAL EVALUATION GUIDELINES:
1. Provide REALISTIC, uninflated scores (0-100):
   - overallScore: Overall performance score (0-100).
   - communication, technicalKnowledge, problemSolving, clarity, confidence, relevance, conciseness (0-100 each).
   - starStructure (for behavioral), ownership (0-100 each).
   - technicalDepth, architectureScore, tradeoffAnalysis (for technical/system-design) (0-100 each).
2. Strengths ("What You Did Well"): 3 to 4 specific bullet points detailing what the candidate actually did well, referencing specific transcript statements.
3. Areas to Improve ("What Hurt Your Performance"): 3 to 4 concrete shortcomings (e.g. unverified claims, surface-level explanations, missing metrics, lack of edge cases), referencing actual transcript quotes.
4. strongestDefendedClaim: The candidate's most convincingly defended technical claim or performance achievement.
5. weakestDefendedClaim: The technical claim or metric that crumbled or lacked substance when probed.
6. strongestTechnicalDecision: The best architectural or design choice made and justified by the candidate.
7. weakestTradeoffAnalysis: The decision where the candidate ignored crucial trade-offs (e.g. latency vs consistency, memory vs CPU, lock contention).
8. depthGaps: Array of specific technical topics where candidate explanations remained hand-wavy or superficial.
9. recommendedPracticeAreas: Array of concrete, actionable practice areas (e.g. "Cache Invalidation Patterns", "Distributed Transactions", "Dynamic Programming - Subsequences").
10. struggledQuestions: Array of specific questions where the candidate gave a weak, vague, or incomplete answer.
11. strongestAnswer: The candidate's best answer, quoting the question and answer with explanation.
12. weakestAnswer: The candidate's weakest answer, quoting the question and answer with what was missing.
13. verdict: Clear hiring verdict (e.g. "Strong Hire", "Hire", "Lean Hire", "Lean No Hire", "No Hire - Needs Deeper Technical Depth").
14. executiveSummary: 2-3 sentence executive hiring summary.
15. keyImprovement: The single highest-leverage, most actionable recommendation for this specific candidate.
16. sampleImprovements: 1 to 2 detailed examples contrasting the candidate's actual answer with how a senior engineer would deliver the model response.

Respond STRICTLY in JSON format:
{
  "overallScore": number,
  "communication": number,
  "technicalKnowledge": number,
  "problemSolving": number,
  "clarity": number,
  "confidence": number,
  "relevance": number,
  "conciseness": number,
  "starStructure": number,
  "ownership": number,
  "technicalDepth": number,
  "architectureScore": number,
  "tradeoffAnalysis": number,
  "strengths": string[],
  "areasToImprove": string[],
  "strongestDefendedClaim": {
    "claim": "string",
    "technology": "string",
    "defenseSummary": "string"
  },
  "weakestDefendedClaim": {
    "claim": "string",
    "technology": "string",
    "issue": "string"
  },
  "strongestTechnicalDecision": {
    "decision": "string",
    "justification": "string"
  },
  "weakestTradeoffAnalysis": {
    "decision": "string",
    "missingTradeoff": "string"
  },
  "depthGaps": string[],
  "recommendedPracticeAreas": string[],
  "struggledQuestions": [
    {
      "question": "string",
      "candidateAnswer": "string",
      "analysis": "string"
    }
  ],
  "strongestAnswer": {
    "question": "string",
    "candidateAnswer": "string",
    "reason": "string"
  },
  "weakestAnswer": {
    "question": "string",
    "candidateAnswer": "string",
    "missing": "string"
  },
  "verdict": "string",
  "executiveSummary": "string",
  "keyImprovement": "string",
  "sampleImprovements": [
    {
      "question": "string",
      "candidateAnswer": "string",
      "betterAnswer": "string"
    }
  ]
}`;

    const reportSchema = z.object({
      overallScore: z.number().min(0).max(100),
      communication: z.number().min(0).max(100),
      technicalKnowledge: z.number().min(0).max(100),
      problemSolving: z.number().min(0).max(100),
      clarity: z.number().min(0).max(100).default(70),
      confidence: z.number().min(0).max(100).default(70),
      relevance: z.number().min(0).max(100).default(70),
      conciseness: z.number().min(0).max(100).default(70),
      starStructure: z.number().min(0).max(100).default(70),
      ownership: z.number().min(0).max(100).default(70),
      technicalDepth: z.number().min(0).max(100).default(70),
      architectureScore: z.number().min(0).max(100).default(70),
      tradeoffAnalysis: z.number().min(0).max(100).default(70),
      strengths: z.array(z.string()).default([]),
      areasToImprove: z.array(z.string()).default([]),
      strongestDefendedClaim: z.object({
        claim: z.string().default(''),
        technology: z.string().default(''),
        defenseSummary: z.string().default('')
      }).default({ claim: '', technology: '', defenseSummary: '' }),
      weakestDefendedClaim: z.object({
        claim: z.string().default(''),
        technology: z.string().default(''),
        issue: z.string().default('')
      }).default({ claim: '', technology: '', issue: '' }),
      strongestTechnicalDecision: z.object({
        decision: z.string().default(''),
        justification: z.string().default('')
      }).default({ decision: '', justification: '' }),
      weakestTradeoffAnalysis: z.object({
        decision: z.string().default(''),
        missingTradeoff: z.string().default('')
      }).default({ decision: '', missingTradeoff: '' }),
      depthGaps: z.array(z.string()).default([]),
      recommendedPracticeAreas: z.array(z.string()).default([]),
      struggledQuestions: z.array(
        z.object({
          question: z.string(),
          candidateAnswer: z.string(),
          analysis: z.string()
        })
      ).default([]),
      strongestAnswer: z.object({
        question: z.string().default(''),
        candidateAnswer: z.string().default(''),
        reason: z.string().default('')
      }).default({ question: '', candidateAnswer: '', reason: '' }),
      weakestAnswer: z.object({
        question: z.string().default(''),
        candidateAnswer: z.string().default(''),
        missing: z.string().default('')
      }).default({ question: '', candidateAnswer: '', missing: '' }),
      verdict: z.string().default('Candidate Evaluation Completed'),
      executiveSummary: z.string().default('Evaluation report generated.'),
      keyImprovement: z.string().default('Practice technical problem articulation.'),
      sampleImprovements: z.array(
        z.object({
          question: z.string(),
          candidateAnswer: z.string(),
          betterAnswer: z.string()
        })
      ).default([])
    });

    const report = await callGeminiJson(prompt, reportSchema);

    const updated = await saveInterviewFeedback(interviewId, userId, {
      status: 'completed',
      score: report.overallScore,
      overallRating: report.overallScore,
      communication: report.communication,
      technicalKnowledge: report.technicalKnowledge,
      problemSolving: report.problemSolving,
      confidence: report.confidence,
      behavioralScore: report.starStructure || report.communication,
      correctness: report.technicalKnowledge,
      strengths: report.strengths,
      weaknesses: report.areasToImprove,
      suggestions: report.areasToImprove,
      keyImprovement: report.keyImprovement,
      sampleImprovements: report.sampleImprovements,
      feedback: report.executiveSummary,
      evaluationReport: report
    });

    return updated;
  } catch (error) {
    logger.error('Failed to generate complete interview report with Gemini', {
      message: error?.message || error
    });

    const fallbackScore = Math.min(85, Math.max(45, answers.length * 14));
    const fallbackReport = {
      overallScore: fallbackScore,
      communication: 68,
      technicalKnowledge: 65,
      problemSolving: 68,
      clarity: 70,
      confidence: 70,
      relevance: 72,
      conciseness: 68,
      starStructure: 65,
      ownership: 70,
      technicalDepth: 65,
      architectureScore: 65,
      tradeoffAnalysis: 62,
      strengths: ['Completed all questions under simulation with full participation.'],
      areasToImprove: ['Provide deeper justification and explicit trade-offs when making architectural claims.'],
      struggledQuestions: [],
      strongestAnswer: { question: questions[0] || '', candidateAnswer: answers[0] || '', reason: 'Good initial engagement.' },
      weakestAnswer: { question: questions[questions.length - 1] || '', candidateAnswer: answers[answers.length - 1] || '', missing: 'More depth required.' },
      verdict: 'Completed Practice Session',
      executiveSummary: `Interview session completed (${answers.length} responses recorded). Review your performance areas.`,
      keyImprovement: 'Focus on explaining the "why" and trade-offs behind your technical decisions.',
      sampleImprovements: []
    };

    const updated = await saveInterviewFeedback(interviewId, userId, {
      status: 'completed',
      score: fallbackScore,
      overallRating: fallbackScore,
      communication: 68,
      technicalKnowledge: 65,
      problemSolving: 68,
      confidence: 70,
      behavioralScore: 65,
      correctness: 65,
      strengths: fallbackReport.strengths,
      weaknesses: fallbackReport.areasToImprove,
      suggestions: fallbackReport.areasToImprove,
      keyImprovement: fallbackReport.keyImprovement,
      sampleImprovements: [],
      feedback: fallbackReport.executiveSummary,
      evaluationReport: fallbackReport
    });

    return updated;
  }
}

module.exports = {
  generateInterview: startInterview,
  startInterview,
  listUserInterviews,
  getUserInterview,
  deleteUserInterview,
  submitInterviewAnswer,
  completeInterviewSession,
  evaluateAnswerWithAI,
  researchCompanyInterviewIntel,
  processInterviewTurn
};


