const { Interview } = require('../models/Interview');
const { ChatHistory } = require('../models/ChatHistory');
const { ChatConversation } = require('../models/ChatConversation');
const { SharedConversation } = require('../models/SharedConversation');

async function createInterviewSession(interviewData) {
  return Interview.create(interviewData);
}

async function findInterviewsByUserId(userId) {
  return Interview.find({ userId }).sort({ createdAt: -1 });
}

async function findInterviewByIdAndUserId(interviewId, userId) {
  return Interview.findOne({ _id: interviewId, userId });
}

async function deleteInterviewByIdAndUserId(interviewId, userId) {
  return Interview.findOneAndDelete({ _id: interviewId, userId });
}

async function saveInterviewFeedback(interviewId, userId, payload) {
  return Interview.findOneAndUpdate({ _id: interviewId, userId }, payload, { new: true, runValidators: true });
}

async function createConversation(conversationData) {
  return ChatConversation.create(conversationData);
}

async function findConversationsByUserId(userId) {
  const conversations = await ChatConversation.find({ userId }).sort({ updatedAt: -1 });
  
  // Aggregate message count, preview text, and attachment indicator for each conversation
  const results = await Promise.all(
    conversations.map(async (conv) => {
      const count = await ChatHistory.countDocuments({ conversationId: conv._id });
      const firstUserMsg = await ChatHistory.findOne({ conversationId: conv._id, role: 'user' }).sort({ createdAt: 1 });
      const latestMsg = await ChatHistory.findOne({ conversationId: conv._id }).sort({ createdAt: -1 });
      const hasAttachment = Boolean(firstUserMsg?.metadata?.attachment || latestMsg?.metadata?.attachment);
      const attachmentName = firstUserMsg?.metadata?.attachment?.name || latestMsg?.metadata?.attachment?.name || '';
      
      let preview = '';
      if (firstUserMsg?.content) {
        preview = firstUserMsg.content;
      } else if (hasAttachment) {
        preview = `${attachmentName || 'Document'} attached`;
      } else if (latestMsg?.content) {
        preview = latestMsg.content;
      }

      return {
        _id: conv._id,
        id: conv._id,
        title: conv.title,
        preview: preview ? preview.slice(0, 90) : '',
        hasAttachment,
        attachmentName,
        messageCount: count,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt
      };
    })
  );

  return results;
}

async function findConversationById(conversationId, userId) {
  return ChatConversation.findOne({ _id: conversationId, userId });
}

async function updateConversation(conversationId, userId, payload) {
  return ChatConversation.findOneAndUpdate(
    { _id: conversationId, userId },
    { ...payload, updatedAt: new Date() },
    { new: true }
  );
}

async function deleteConversationById(conversationId, userId) {
  await ChatHistory.deleteMany({ conversationId, userId });
  return ChatConversation.findOneAndDelete({ _id: conversationId, userId });
}

async function createChatEntry(chatData) {
  return ChatHistory.create(chatData);
}

async function findMessagesByConversationId(conversationId) {
  return ChatHistory.find({ conversationId }).sort({ createdAt: 1 });
}

async function findChatHistoryByUserId(userId, limit = 20) {
  return ChatHistory.find({ userId }).sort({ createdAt: -1 }).limit(limit);
}

async function createSharedConversation(data) {
  return SharedConversation.create(data);
}

async function findSharedConversationByToken(shareToken) {
  return SharedConversation.findOne({ shareToken });
}

module.exports = {
  createInterviewSession,
  findInterviewsByUserId,
  findInterviewByIdAndUserId,
  saveInterviewFeedback,
  createConversation,
  findConversationsByUserId,
  findConversationById,
  updateConversation,
  deleteConversationById,
  createChatEntry,
  findMessagesByConversationId,
  findChatHistoryByUserId,
  createSharedConversation,
  findSharedConversationByToken,
  deleteInterviewByIdAndUserId
};