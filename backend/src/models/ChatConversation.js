const mongoose = require('mongoose');

const chatConversationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, default: 'New Conversation' },
    metadata: {
      type: Object,
      default: {}
    }
  },
  { timestamps: true }
);

chatConversationSchema.index({ userId: 1, updatedAt: -1 });

const ChatConversation = mongoose.model('ChatConversation', chatConversationSchema);

module.exports = { ChatConversation };
