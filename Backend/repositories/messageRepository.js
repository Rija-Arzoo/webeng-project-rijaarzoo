import mongoose from 'mongoose';
import Message from '../models/Message.js';

export const messageRepository = {
  create: (data) => Message.create(data),

  findByConversation: (conversationId, { skip, limit }) =>
    Message.find({ conversationId })
      .select('conversationId senderId text createdAt readBy')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

  deleteBySender: (senderId) => Message.deleteMany({ senderId }),

  deleteByConversationIds: (conversationIds) =>
    Message.deleteMany({ conversationId: { $in: conversationIds } }),

  markConversationRead: (conversationId, userId) =>
    Message.updateMany(
      {
        conversationId,
        senderId: { $ne: userId },
        'readBy.userId': { $ne: userId },
      },
      { $push: { readBy: { userId, readAt: new Date() } } }
    ),

  markMessageRead: (messageId, userId) =>
    Message.updateOne(
      { _id: messageId },
      { $push: { readBy: { userId, readAt: new Date() } } }
    ),

  countUnreadTotal: async (conversationIds, userId) => {
    if (conversationIds.length === 0) return 0;
    const userObjectId = new mongoose.Types.ObjectId(userId);
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
    return result[0]?.total || 0;
  },

  aggregateUnreadByConversation: (conversationIds, userId) => {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    return Message.aggregate([
      {
        $match: {
          conversationId: { $in: conversationIds },
          senderId: { $ne: userObjectId },
          readBy: { $not: { $elemMatch: { userId: userObjectId } } },
        },
      },
      {
        $group: {
          _id: '$conversationId',
          unreadCount: { $sum: 1 },
        },
      },
    ]);
  },
};
