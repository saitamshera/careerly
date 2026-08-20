const express = require('express');
const multer = require('multer');
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
  deleteConversation,
  renameConversation,
  shareConversation,
  getSharedConversationHandler,
  deleteInterview
} = require('../controllers/ai.controller');

const aiRoutes = express.Router();

const chatUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    const validExtension = /\.(pdf|docx|doc|txt|PDF|DOCX|DOC|TXT)$/.test(file.originalname || '');
    if (validExtension) {
      return callback(null, true);
    }
    return callback(new Error('Unsupported file type. Please upload PDF, DOC, DOCX, or TXT.'));
  }
});

// Public shared conversation route (no auth required)
aiRoutes.get('/chat/shared/:token', getSharedConversationHandler);

aiRoutes.use(protect);

aiRoutes.post('/chat', chatUpload.single('file'), chatMentor);
aiRoutes.get('/chat/history', getChatHistory);
aiRoutes.get('/chat/conversations', getChatHistory);
aiRoutes.get('/chat/conversations/:id', getConversation);
aiRoutes.patch('/chat/conversations/:id', renameConversation);
aiRoutes.put('/chat/conversations/:id', renameConversation);
aiRoutes.get('/chat/history/:id', getConversation);
aiRoutes.delete('/chat/conversations/:id', deleteConversation);
aiRoutes.post('/chat/conversations/:id/share', shareConversation);

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
aiRoutes.delete('/interviews/:id', deleteInterview);
aiRoutes.post('/interviews/:id/answer', submitAnswer);
aiRoutes.post('/interviews/:id/complete', completeInterview);

module.exports = { aiRoutes };