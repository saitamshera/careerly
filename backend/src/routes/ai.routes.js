const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const {
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
  deleteConversation
} = require('../controllers/ai.controller');

const aiRoutes = express.Router();

aiRoutes.use(protect);

aiRoutes.post('/chat', chatMentor);
aiRoutes.get('/chat/history', getChatHistory);
aiRoutes.get('/chat/conversations', getChatHistory);
aiRoutes.get('/chat/conversations/:id', getConversation);
aiRoutes.get('/chat/history/:id', getConversation);
aiRoutes.delete('/chat/conversations/:id', deleteConversation);

aiRoutes.get('/roadmap/context', getRoadmapContext);
aiRoutes.get('/roadmap', getRoadmap);
aiRoutes.post('/roadmap', roadmapGenerator);
aiRoutes.post('/roadmap/toggle-task', toggleRoadmapTaskHandler);
aiRoutes.post('/interview', createInterview);
aiRoutes.post('/feedback', feedback);
aiRoutes.post('/resume-review', resumeReview);
aiRoutes.post('/recruiter-analysis', recruiterAnalysis);

aiRoutes.get('/interviews', listInterviews);
aiRoutes.get('/interviews/:id', getInterview);
aiRoutes.post('/interviews/:id/answer', submitAnswer);
aiRoutes.post('/interviews/:id/complete', completeInterview);

module.exports = { aiRoutes };