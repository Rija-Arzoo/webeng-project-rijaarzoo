import express from 'express';
import mongoose from 'mongoose';
import { auth } from '../middleware/authMiddleware.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { persistMessage } from '../services/persistMessage.js';

const router = express.Router();

const participantSelect =
  'name profilePicture role headline company title';

// Frontend expects these routes (mounted at `/api/chats`):
// - GET  /api/chats/conversations
// - GET  /api/chats/conversations/:conversationId/messages
// - PUT  /api/chats/conversations/:conversationId/read
// - POST /api/chats/messages              (client uses this as "send", but persistence happens via Socket.IO)
// - PUT  /api/chats/messages/:messageId/read

const toId = (v) => (v ? v.toString() : v);

const ensureConversationParticipant = (conversation, userId) => {
  const ids = (conversation.participants || []).map((p) => toId(p._id || p));
  return ids.includes(toId(userId));
};

// Lightweight unread badge for sidebar (avoids heavy conversation fetch every few seconds)
router.get('/unread-total', auth, async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.userId);
    const rows = await Conversation.find({ participants: req.userId }).select('_id').lean();
    const conversationIds = rows.map((c) => c._id);
    if (conversationIds.length === 0) {
      return res.json({ total: 0 });
    }

    const result = await Message.aggregate([
      {
        $match: {
          conversationId: { $in: conversationIds },
          senderId: { $ne: userObjectId },
          readBy: { $not: { $elemMatch: { userId: userObjectId } } },
        },
      },
      { $count: 'total' },
    ]);

    res.json({ total: result[0]?.total || 0 });
  } catch (err) {
    console.error('Unread total error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all conversations for the current user
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.userId })
      .sort({ updatedAt: -1 })
      .populate({
        path: 'participants',
        select: participantSelect,
      })
      .lean();

    const conversationIds = conversations.map((c) => c._id);
    const unreadByConversation = new Map();

    if (conversationIds.length > 0) {
      const unreadRows = await Message.aggregate([
        {
          $match: {
            conversationId: { $in: conversationIds },
            senderId: { $ne: new mongoose.Types.ObjectId(req.userId) },
            readBy: { $not: { $elemMatch: { userId: new mongoose.Types.ObjectId(req.userId) } } },
          },
        },
        {
          $group: {
            _id: '$conversationId',
            unreadCount: { $sum: 1 },
          },
        },
      ]);
      unreadRows.forEach((row) => unreadByConversation.set(toId(row._id), row.unreadCount || 0));
    }

    const formatted = conversations.map((c) => ({
      _id: toId(c._id),
      participants: (c.participants || []).map((p) => ({
        ...p,
        _id: toId(p._id),
      })),
      lastMessage: c.lastMessage || '',
      lastMessageSenderId: c.lastMessageSenderId ? toId(c.lastMessageSenderId) : null,
      lastMessageAt: c.lastMessageAt || null,
      unreadCount: unreadByConversation.get(toId(c._id)) || 0,
    }));

    res.json({ conversations: formatted });
  } catch (err) {
    console.error('Get conversations error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single conversation
router.get('/conversations/:conversationId', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId)
      .populate({
        path: 'participants',
        select: participantSelect,
      })
      .lean();

    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    if (!ensureConversationParticipant(conversation, req.userId)) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    res.json({
      conversation: {
        _id: toId(conversation._id),
        participants: (conversation.participants || []).map((p) => ({
          ...p,
          _id: toId(p._id),
        })),
        lastMessage: conversation.lastMessage || '',
        lastMessageSenderId: conversation.lastMessageSenderId
          ? toId(conversation.lastMessageSenderId)
          : null,
        lastMessageAt: conversation.lastMessageAt || null,
      },
    });
  } catch (err) {
    console.error('Get conversation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark conversation as read
router.put('/conversations/:conversationId/read', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId).lean();
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    if (!conversation.participants.map(toId).includes(toId(req.userId))) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    await Message.updateMany(
      {
        conversationId: req.params.conversationId,
        senderId: { $ne: req.userId },
        'readBy.userId': { $ne: req.userId },
      },
      { $push: { readBy: { userId: req.userId, readAt: new Date() } } }
    );

    res.json({ success: true, message: 'Conversation read' });
  } catch (err) {
    console.error('Conversation read error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get conversation messages
router.get('/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId).lean();
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    if (!conversation.participants.map(toId).includes(toId(req.userId))) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const messages = await Message.find({ conversationId: req.params.conversationId })
      .sort({ createdAt: 1 })
      .lean();

    const formatted = messages.map((m) => ({
      _id: toId(m._id),
      conversationId: toId(m.conversationId),
      senderId: toId(m.senderId),
      text: m.text,
      createdAt: m.createdAt,
      readBy: (m.readBy || []).map((rb) => ({
        userId: toId(rb.userId),
        readAt: rb.readAt || null,
      })),
    }));

    res.json({ messages: formatted });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message — persists via REST (required on Vercel; also used locally)
router.post('/messages', auth, async (req, res) => {
  try {
    const { conversationId, text } = req.body || {};
    if (!conversationId || !text?.trim()) {
      return res.status(400).json({ message: 'conversationId and text are required' });
    }

    const conversation = await Conversation.findById(conversationId).lean();
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    if (!conversation.participants.map(toId).includes(toId(req.userId))) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const { payload } = await persistMessage({
      conversationId,
      senderId: req.userId,
      text: text.trim(),
    });

    res.json({ success: true, message: payload });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark message as read (best-effort)
router.put('/messages/:messageId/read', auth, async (req, res) => {
  try {
    await Message.updateOne(
      { _id: req.params.messageId },
      { $push: { readBy: { userId: req.userId, readAt: new Date() } } }
    );
    res.json({ success: true, message: 'Message read' });
  } catch (err) {
    console.error('Message read error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
