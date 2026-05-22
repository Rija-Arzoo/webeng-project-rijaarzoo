import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

/**
 * Persist a chat message and update conversation metadata.
 * Used by REST API (Vercel) and Socket.io (local dev).
 */
export async function persistMessage({ conversationId, senderId, text }) {
  const messageDoc = await Message.create({
    conversationId,
    senderId,
    text,
    readBy: [{ userId: senderId, readAt: new Date() }],
  });

  const conversation = await Conversation.findByIdAndUpdate(
    conversationId,
    {
      lastMessage: text,
      lastMessageSenderId: senderId,
      lastMessageAt: new Date(),
    },
    { new: true }
  ).lean();

  return {
    messageDoc,
    conversation,
    payload: {
      _id: messageDoc._id.toString(),
      conversationId: conversationId.toString(),
      senderId: senderId.toString(),
      text,
      createdAt: messageDoc.createdAt,
      readBy: [{ userId: senderId, readAt: new Date() }],
    },
  };
}
