import { avatarUrl, avatarThumbUrl } from '../lib/avatar.js';
import { toId } from '../utils/id.js';

export const participantSelect = 'name profilePicture role headline company title';

export const mapParticipant = (p, { thumb = false } = {}) => ({
  _id: toId(p._id),
  name: p.name,
  role: p.role,
  headline: p.headline,
  company: p.company,
  title: p.title,
  profilePicture: thumb
    ? avatarThumbUrl(p.profilePicture, toId(p._id), 96)
    : avatarUrl(p.profilePicture, toId(p._id)),
});

export const mapConversation = (conversation, unreadCount = 0) => ({
  _id: toId(conversation._id),
  participants: (conversation.participants || []).map((p) => mapParticipant(p, { thumb: true })),
  lastMessage: (conversation.lastMessage || '').slice(0, 200),
  lastMessageSenderId: conversation.lastMessageSenderId
    ? toId(conversation.lastMessageSenderId)
    : null,
  lastMessageAt: conversation.lastMessageAt || null,
  unreadCount,
});

export const mapConversationDetail = (conversation) => ({
  _id: toId(conversation._id),
  participants: (conversation.participants || []).map(mapParticipant),
  lastMessage: conversation.lastMessage || '',
  lastMessageSenderId: conversation.lastMessageSenderId
    ? toId(conversation.lastMessageSenderId)
    : null,
  lastMessageAt: conversation.lastMessageAt || null,
});

export const mapMessage = (m) => ({
  _id: toId(m._id),
  conversationId: toId(m.conversationId),
  senderId: toId(m.senderId),
  text: m.text,
  createdAt: m.createdAt,
  readBy: (m.readBy || []).map((rb) => ({
    userId: toId(rb.userId),
    readAt: rb.readAt || null,
  })),
});
