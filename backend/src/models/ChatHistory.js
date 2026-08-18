const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatConversation', index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, default: '' },
    prompt: { type: String, default: '' },
    response: { type: String, default: '' },
    metadata: {
      type: Object,
      default: {}
    }
  },
  { timestamps: true }
);

chatHistorySchema.index({ conversationId: 1, createdAt: 1 });
chatHistorySchema.index({ userId: 1, createdAt: -1 });

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

module.exports = { ChatHistory };