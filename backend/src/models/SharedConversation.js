const mongoose = require('mongoose');

const sharedConversationSchema = new mongoose.Schema(
  {
    shareToken: { type: String, required: true, unique: true, index: true },
    title: { type: String, default: 'Shared Conversation' },
    messages: [
      {
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, default: '' },
        metadata: { type: Object, default: {} }
      }
    ]
  },
  { timestamps: true }
);

const SharedConversation = mongoose.model('SharedConversation', sharedConversationSchema);

module.exports = { SharedConversation };
