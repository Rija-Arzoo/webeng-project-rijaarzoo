import { config } from '../config/index.js';
import { conversationRepository } from '../repositories/conversationRepository.js';
import { messageRepository } from '../repositories/messageRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import {
  mapConversation,
  mapConversationDetail,
  mapMessage,
  participantSelect,
} from '../mappers/chatMapper.js';
import { toId } from '../utils/id.js';
import { persistMessage } from './persistMessage.js';

const ensureParticipant = (conversation, userId) => {
  const ids = (conversation.participants || []).map((p) => toId(p._id || p));
  return ids.includes(toId(userId));
};

const attachParticipants = (conversations, usersById) =>
  conversations.map((c) => ({
    ...c,
    participants: (c.participants || [])
      .map((pid) => usersById.get(toId(pid)) || usersById.get(pid?.toString?.()))
      .filter(Boolean),
  }));

export const chatService = {
  async getUnreadTotal(userId) {
    const rows = await conversationRepository.findByParticipantUserId(userId);
    const conversationIds = rows.map((c) => c._id);
    const total = await messageRepository.countUnreadTotal(conversationIds, userId);
    return { status: 200, body: { total } };
  },

  async listConversations(userId) {
    const conversations = await conversationRepository.findByParticipantSortedLean(userId);

    const participantIds = [
      ...new Set(
        conversations.flatMap((c) => (c.participants || []).map((p) => toId(p)))
      ),
    ];

    const [users, unreadRows] = await Promise.all([
      participantIds.length > 0
        ? userRepository.findByIdsLean(participantIds, participantSelect)
        : [],
      conversations.length > 0
        ? messageRepository.aggregateUnreadByConversation(
            conversations.map((c) => c._id),
            userId
          )
        : [],
    ]);

    const usersById = new Map(users.map((u) => [u._id.toString(), u]));
    const unreadByConversation = new Map();
    unreadRows.forEach((row) =>
      unreadByConversation.set(toId(row._id), row.unreadCount || 0)
    );

    const withParticipants = attachParticipants(conversations, usersById);
    const formatted = withParticipants.map((c) =>
      mapConversation(c, unreadByConversation.get(toId(c._id)) || 0)
    );

    return {
      status: 200,
      body: { conversations: formatted },
      cacheControl: 'private, max-age=15',
    };
  },

  async getConversation(conversationId, userId) {
    const conversation = await conversationRepository.findByIdLean(conversationId);
    if (!conversation) {
      return { status: 404, body: { message: 'Conversation not found' } };
    }
    if (!ensureParticipant(conversation, userId)) {
      return { status: 403, body: { message: 'Not allowed' } };
    }

    const participantIds = (conversation.participants || []).map((p) => toId(p));
    const users = await userRepository.findByIdsLean(participantIds, participantSelect);
    const usersById = new Map(users.map((u) => [u._id.toString(), u]));
    const withParticipants = attachParticipants([conversation], usersById)[0];

    return {
      status: 200,
      body: { conversation: mapConversationDetail(withParticipants) },
    };
  },

  async markConversationRead(conversationId, userId) {
    const conversation = await conversationRepository.findByIdLean(conversationId);
    if (!conversation) {
      return { status: 404, body: { message: 'Conversation not found' } };
    }
    if (!conversation.participants.map(toId).includes(toId(userId))) {
      return { status: 403, body: { message: 'Not allowed' } };
    }

    await messageRepository.markConversationRead(conversationId, userId);
    return { status: 200, body: { success: true, message: 'Conversation read' } };
  },

  async getMessages(conversationId, userId, { limit, skip }) {
    const conversation = await conversationRepository.findByIdLean(conversationId);
    if (!conversation) {
      return { status: 404, body: { message: 'Conversation not found' } };
    }
    if (!conversation.participants.map(toId).includes(toId(userId))) {
      return { status: 403, body: { message: 'Not allowed' } };
    }

    const pageLimit = Math.min(
      parseInt(limit, 10) || config.messagePageSize,
      config.messagePageMax
    );
    const pageSkip = Math.max(parseInt(skip, 10) || 0, 0);

    const messages = await messageRepository.findByConversation(conversationId, {
      skip: pageSkip,
      limit: pageLimit,
    });

    messages.reverse();

    return {
      status: 200,
      body: { messages: messages.map(mapMessage) },
      cacheControl: 'private, max-age=5',
    };
  },

  async sendMessage(conversationId, userId, text) {
    if (!conversationId || !text?.trim()) {
      return { status: 400, body: { message: 'conversationId and text are required' } };
    }

    const conversation = await conversationRepository.findByIdLean(conversationId);
    if (!conversation) {
      return { status: 404, body: { message: 'Conversation not found' } };
    }
    if (!conversation.participants.map(toId).includes(toId(userId))) {
      return { status: 403, body: { message: 'Not allowed' } };
    }

    const { payload } = await persistMessage({
      conversationId,
      senderId: userId,
      text: text.trim(),
    });

    return { status: 200, body: { success: true, message: payload } };
  },

  async markMessageRead(messageId, userId) {
    await messageRepository.markMessageRead(messageId, userId);
    return { status: 200, body: { success: true, message: 'Message read' } };
  },
};
