const { asyncHandler } = require('../utils/asyncHandler');
const { ApiResponse } = require('../utils/apiResponse');
const {
  generateInterview,
  listUserInterviews,
  getUserInterview,
  deleteUserInterview,
  submitInterviewAnswer,
  completeInterviewSession,
  evaluateAnswerWithAI
} = require('../services/interview.service');
const {
  getUserProfileContext,
  getSavedRoadmap,
  generateRoadmapWithAI,
  toggleRoadmapTask,
  generateRecruiterAnalysis
} = require('../services/roadmap.service');
const {
  createChatMessage,
  getUserConversations,
  getConversationMessages,
  deleteUserConversation,
  shareUserConversation,
  getSharedConversation
} = require('../services/chatMentor.service');
const { reviewResumeWithAI } = require('../services/resume.service');

const createInterview = asyncHandler(async (request, response) => {
  const interview = await generateInterview({
    userId: request.user.id,
    type: request.body.type,
    difficulty: request.body.difficulty,
    topic: request.body.topic,
    targetRole: request.body.targetRole || request.body.topic || 'SDE-1',
    targetCompany: request.body.targetCompany || '',
    jobDescription: request.body.jobDescription || ''
  });

  response.status(201).json(new ApiResponse(201, interview, 'Interview generated'));
});

const listInterviews = asyncHandler(async (request, response) => {
  const interviews = await listUserInterviews(request.user.id);
  response.status(200).json(new ApiResponse(200, interviews, 'Interviews loaded'));
});

const getInterview = asyncHandler(async (request, response) => {
  const interview = await getUserInterview(request.user.id, request.params.id);
  response.status(200).json(new ApiResponse(200, interview, 'Interview loaded'));
});

const submitAnswer = asyncHandler(async (request, response) => {
  const interview = await submitInterviewAnswer({
    userId: request.user.id,
    interviewId: request.params.id,
    answer: request.body.answer
  });

  response.status(200).json(new ApiResponse(200, interview, 'Answer submitted'));
});

const completeInterview = asyncHandler(async (request, response) => {
  const interview = await completeInterviewSession({
    userId: request.user.id,
    interviewId: request.params.id
  });

  response.status(200).json(new ApiResponse(200, interview, 'Interview completed and report generated'));
});

const deleteInterview = asyncHandler(async (request, response) => {
  await deleteUserInterview(request.user.id, request.params.id);
  response.status(200).json(new ApiResponse(200, null, 'Interview evaluation deleted'));
});

const chatMentor = asyncHandler(async (request, response) => {
  let context = {};
  if (typeof request.body.context === 'string') {
    try {
      context = JSON.parse(request.body.context);
    } catch {
      context = {};
    }
  } else if (request.body.context && typeof request.body.context === 'object') {
    context = request.body.context;
  }

  const result = await createChatMessage({
    userId: request.user.id,
    conversationId: request.body.conversationId,
    prompt: request.body.prompt,
    context,
    file: request.file || null
  });

  response.status(200).json(new ApiResponse(200, result, 'Chat response generated'));
});

const getRoadmapContext = asyncHandler(async (request, response) => {
  const context = await getUserProfileContext(request.user.id);
  response.status(200).json(new ApiResponse(200, context, 'Profile context loaded'));
});

const getRoadmap = asyncHandler(async (request, response) => {
  const roadmap = await getSavedRoadmap(request.user.id);
  response.status(200).json(new ApiResponse(200, roadmap, 'Saved roadmap loaded'));
});

const roadmapGenerator = asyncHandler(async (request, response) => {
  const roadmap = await generateRoadmapWithAI(request.user.id, request.body);

  response.status(200).json(
    new ApiResponse(
      200,
      roadmap,
      'Roadmap generated'
    )
  );
});

const toggleRoadmapTaskHandler = asyncHandler(async (request, response) => {
  const roadmap = await toggleRoadmapTask(request.user.id, request.body.taskId);
  response.status(200).json(new ApiResponse(200, roadmap, 'Task status updated'));
});

const resumeReview = asyncHandler(async (request, response) => {
  const review = await reviewResumeWithAI(
    request.body.resumeText,
    request.body.targetJobDescription
  );

  response.status(200).json(new ApiResponse(200, review, 'Resume review generated'));
});

const feedback = asyncHandler(async (request, response) => {
  const payload = await evaluateAnswerWithAI(
    request.body.question || 'General interview question',
    request.body.answer || '',
    request.body.type || 'technical',
    request.body.difficulty || 'medium'
  );

  response.status(200).json(new ApiResponse(200, payload, 'Feedback generated'));
});

const recruiterAnalysis = asyncHandler(async (request, response) => {
  const payload = generateRecruiterAnalysis(request.body || {});
  response.status(200).json(new ApiResponse(200, payload, 'Recruiter analysis generated'));
});

const getChatHistory = asyncHandler(async (request, response) => {
  const history = await getUserConversations(request.user.id);
  response.status(200).json(new ApiResponse(200, history, 'Chat history loaded'));
});

const getConversation = asyncHandler(async (request, response) => {
  const result = await getConversationMessages(request.params.id, request.user.id);
  response.status(200).json(new ApiResponse(200, result, 'Conversation loaded'));
});

const deleteConversation = asyncHandler(async (request, response) => {
  await deleteUserConversation(request.params.id, request.user.id);
  response.status(200).json(new ApiResponse(200, null, 'Conversation deleted'));
});

const renameConversation = asyncHandler(async (request, response) => {
  const { renameUserConversation } = require('../services/chatMentor.service');
  const result = await renameUserConversation(request.params.id, request.user.id, request.body.title);
  response.status(200).json(new ApiResponse(200, result, 'Conversation renamed successfully'));
});

const shareConversation = asyncHandler(async (request, response) => {
  const result = await shareUserConversation(request.params.id, request.user.id);
  response.status(201).json(new ApiResponse(201, result, 'Conversation shared successfully'));
});

const getSharedConversationHandler = asyncHandler(async (request, response) => {
  const result = await getSharedConversation(request.params.token);
  response.status(200).json(new ApiResponse(200, result, 'Shared conversation loaded'));
});

module.exports = {
  createInterview,
  listInterviews,
  getInterview,
  submitAnswer,
  completeInterview,
  chatMentor,
  getRoadmapContext,
  getRoadmap,
  roadmapGenerator,
  toggleRoadmapTaskHandler,
  resumeReview,
  feedback,
  recruiterAnalysis,
  getChatHistory,
  getConversation,
  deleteConversation,
  renameConversation,
  shareConversation,
  getSharedConversationHandler,
  deleteInterview
};