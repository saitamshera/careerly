const crypto = require('crypto');
const { ApiError } = require('../utils/apiError');
const { env } = require('../config/env');
const { logger } = require('../config/logger');
const { User } = require('../models/User');
const { redactText } = require('../utils/redact');
const { generateWithGemini } = require('../utils/geminiClient');
const { extractTextFromDocument } = require('../utils/documentExtractor');
const {
  createConversation,
  findConversationsByUserId,
  findConversationById,
  deleteConversationById,
  createChatEntry,
  findMessagesByConversationId,
  createSharedConversation,
  findSharedConversationByToken
} = require('../repositories/ai.repository');

function generateConversationTitle(prompt) {
  if (!prompt) return 'New Conversation';

  const cleanPrompt = prompt.replace(/[^\w\s\-\+\#\.\/]/g, ' ').replace(/\s+/g, ' ').trim();
  const lower = cleanPrompt.toLowerCase();

  if (lower.includes('intern') || lower.includes('internship')) {
    if (lower.includes('sde') || lower.includes('software')) return 'SDE Internship Preparation';
    return 'Internship Preparation';
  }
  if (lower.includes('resume') || lower.includes('cv') || lower.includes('ats')) {
    return 'Resume Optimization';
  }
  if (lower.includes('salary') || lower.includes('negotiat') || lower.includes('offer')) {
    return 'Salary & Offer Strategy';
  }
  if (lower.includes('system design') || lower.includes('hld') || lower.includes('lld')) {
    return 'System Design Preparation';
  }
  if (lower.includes('dsa') || lower.includes('leetcode') || lower.includes('algorithm')) {
    if (lower.includes('react') || lower.includes('node')) return 'DSA vs Web Development';
    return 'DSA & Algorithms Roadmap';
  }
  if (lower.includes('react') && lower.includes('node')) {
    return 'React & Node.js Strategy';
  }
  if (lower.includes('mock interview') || lower.includes('behavioral') || lower.includes('star')) {
    return 'Behavioral & Interview Prep';
  }

  const words = cleanPrompt.split(' ').slice(0, 6);
  let title = words.join(' ');
  if (title.length > 40) {
    title = title.substring(0, 37) + '...';
  }
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function buildAssistantResponse(prompt, context) {
  const lowerPrompt = (prompt || '').toLowerCase();

  if (lowerPrompt.includes('salary')) {
    return 'When discussing salary expectations, benchmark your target role using levels.fyi and Glassdoor. Provide a tight range rather than a fixed number and anchor your value to specific technical accomplishments.';
  }

  if (lowerPrompt.includes('resume')) {
    return 'For software engineering resumes, structure every bullet point as: "Action Verb + Technical Solution + Quantified Impact" (e.g., "Architected Redis caching layer, reducing API latency by 45%").';
  }

  if (lowerPrompt.includes('interview')) {
    return 'Structure technical answers clearly: 1) Clarify requirements & edge cases, 2) State naive approach & tradeoffs, 3) Propose optimal algorithm, 4) Dry run with sample input, 5) State Time & Space Complexity.';
  }

  return 'Set clear objectives, focus on your highest-leverage skill gaps, and practice consistently. Share more details about your current prep stage if you want a tailored recommendation.';
}

/**
 * Generate a career mentor response using Gemini AI.
 * Falls back to rule-based buildAssistantResponse() on failure.
 */
async function generateChatMentorResponseWithAI(prompt, context = {}, userId, previousMessages = []) {
  const fallback = buildAssistantResponse(prompt, context);

  if (!env.GEMINI_API_KEY) {
    logger.warn('GEMINI_API_KEY not set — using fallback response for chat mentor');
    return fallback;
  }

  let historyText = '';
  if (previousMessages && previousMessages.length > 0) {
    const recentThreadMessages = previousMessages.slice(-6);
    historyText = recentThreadMessages
      .map((entry) => `${entry.role === 'user' ? 'Candidate' : 'Mentor'}: ${entry.content || (entry.role === 'user' ? entry.prompt : entry.response)}`)
      .join('\n\n');
  }

  const systemPrompt = `You are an expert AI Career Mentor for software engineering, tech placements, resumes, compensation negotiation, and tech careers.

Core Persona & Communication Style:
- Conversational Mentor: Talk directly, naturally, and concisely like an experienced senior mentor or hiring manager in a 1-on-1 chat—NOT like a blog post or textbook.
- Dynamic Length & Conciseness:
  * For simple, short, or follow-up questions: keep answers concise (typically 100-350 words). Answer the exact question immediately without unnecessary background preamble.
  * Only provide long, detailed, multi-phase frameworks when the user explicitly asks for a complete roadmap, comprehensive guide, study plan, or deep breakdown.
- Context-Aware & Direct: Seamlessly build upon previous messages in the conversation. Never restart explanations from scratch or re-introduce yourself when answering a follow-up.
- Document Analysis: When an attached document is provided in the candidate's input, thoroughly analyze its text, highlight specific strengths and concrete areas for improvement, and address any user questions directly.
- Avoid Formulaic Headers: Do NOT automatically use generic headers like "Phase 1 / Phase 2 / Phase 3", "Golden Rules", or "Concrete Next Steps" unless explicitly requested.
- No Absolute Claims or False Certainty: Never present uncertain advice as absolute fact. Avoid definitive assertions about careers, salaries, recruiters, hiring outcomes, fixed timelines, or technologies.
- Explicit Decision Factors: When a recommendation depends on the candidate's specific situation, clearly identify the factors that matter and state your reasoning.
- Missing Context Handling: If critical context is missing to give a precise answer, state what it depends on and ask the candidate for the specific detail.
- Single Focused Follow-up: When helpful, end with ONE direct, relevant follow-up question or offer to inspect their specific draft/message.
- No Fabrications: Never invent personal facts or background not provided by the candidate.
${historyText ? `\nConversation History:\n${historyText}\n` : ''}
Latest message from candidate:
${prompt}

Respond as the Career Mentor:`;

  const result = await generateWithGemini({
    prompt: systemPrompt
  });

  if (result && result.text && result.text.trim()) {
    return result.text.trim();
  }

  logger.error('All Gemini candidate models failed, using fallback');
  return fallback;
}

async function getUserConversations(userId) {
  return findConversationsByUserId(userId);
}

async function getUserChatHistory(userId) {
  return findConversationsByUserId(userId);
}

async function getConversationMessages(conversationId, userId) {
  const conversation = await findConversationById(conversationId, userId);
  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }
  const messages = await findMessagesByConversationId(conversationId);
  return {
    conversation: {
      _id: conversation._id,
      id: conversation._id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt
    },
    messages
  };
}

async function deleteUserConversation(conversationId, userId) {
  return deleteConversationById(conversationId, userId);
}

async function shareUserConversation(conversationId, userId) {
  const conversation = await findConversationById(conversationId, userId);
  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }

  const rawMessages = await findMessagesByConversationId(conversationId);
  const user = await User.findById(userId).lean();

  const userProfile = {
    name: user?.name,
    college: user?.college,
    branch: user?.branch,
    leetcodeUsername: user?.leetcodeUsername
  };

  const sanitizedMessages = rawMessages.map((msg) => {
    const rawContent = msg.content || (msg.role === 'user' ? msg.prompt : msg.response) || '';
    return {
      role: msg.role,
      content: redactText(rawContent, userProfile),
      metadata: msg.metadata || {}
    };
  });

  const shareToken = crypto.randomBytes(16).toString('hex');
  await createSharedConversation({
    shareToken,
    title: redactText(conversation.title, userProfile),
    messages: sanitizedMessages
  });

  return { shareToken };
}

async function getSharedConversation(shareToken) {
  const shared = await findSharedConversationByToken(shareToken);
  if (!shared) {
    throw new ApiError(404, 'Shared conversation not found');
  }

  return {
    title: shared.title,
    messages: shared.messages,
    createdAt: shared.createdAt
  };
}

async function createChatMessage({ userId, conversationId, prompt, context = {}, file = null }) {
  let rawPrompt = String(prompt || '').trim();
  let extractedDocText = '';
  let attachmentMeta = null;

  if (file) {
    extractedDocText = await extractTextFromDocument(file);
    const sanitizedFilename = String(file.originalname || 'document').replace(/[^\w\s\-\.\(\)]/g, '_');
    attachmentMeta = {
      name: sanitizedFilename,
      size: file.size,
      mimeType: file.mimetype
    };

    if (!rawPrompt) {
      rawPrompt = `Review and analyze this attached document: ${sanitizedFilename}`;
    }
  }

  if (!rawPrompt) {
    throw new ApiError(400, 'Chat prompt is required');
  }

  // Construct the prompt passed to the AI
  let promptForAI = rawPrompt;
  if (extractedDocText && attachmentMeta) {
    promptForAI = `[Attached Document: ${attachmentMeta.name}]\n"""\n${extractedDocText}\n"""\n\nCandidate Request: ${rawPrompt}`;
  }

  let conversation = null;
  if (conversationId) {
    conversation = await findConversationById(conversationId, userId);
  }

  if (!conversation) {
    const title = generateConversationTitle(rawPrompt);
    conversation = await createConversation({
      userId,
      title,
      metadata: context
    });
  } else {
    conversation.updatedAt = new Date();
    await conversation.save();
  }

  const previousMessages = await findMessagesByConversationId(conversation._id);
  const response = await generateChatMentorResponseWithAI(promptForAI, context, userId, previousMessages);

  const userMeta = {
    ...context,
    ...(attachmentMeta ? { attachment: attachmentMeta } : {})
  };

  await createChatEntry({
    conversationId: conversation._id,
    userId,
    role: 'user',
    content: rawPrompt,
    prompt: rawPrompt,
    response: '',
    metadata: userMeta
  });

  await createChatEntry({
    conversationId: conversation._id,
    userId,
    role: 'assistant',
    content: response,
    prompt: rawPrompt,
    response,
    metadata: context
  });

  const updatedMessages = await findMessagesByConversationId(conversation._id);

  return {
    conversationId: conversation._id,
    conversationTitle: conversation.title,
    response,
    messages: updatedMessages
  };
}

async function renameUserConversation(conversationId, userId, title) {
  const cleanTitle = String(title || '').trim();
  if (!cleanTitle) {
    throw new ApiError(400, 'Conversation title is required');
  }

  const updated = await updateConversation(conversationId, userId, { title: cleanTitle });
  if (!updated) {
    throw new ApiError(404, 'Conversation not found');
  }

  return {
    _id: updated._id,
    id: updated._id,
    title: updated.title,
    updatedAt: updated.updatedAt
  };
}

module.exports = {
  createChatMessage,
  getUserChatHistory,
  getUserConversations,
  getConversationMessages,
  deleteUserConversation,
  shareUserConversation,
  getSharedConversation,
  renameUserConversation,
  buildAssistantResponse,
  generateConversationTitle
};

