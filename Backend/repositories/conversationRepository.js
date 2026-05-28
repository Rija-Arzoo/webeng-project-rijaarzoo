import Conversation from '../models/Conversation.js';

const listFields =
  'participants lastMessage lastMessageSenderId lastMessageAt updatedAt createdAt';

export const conversationRepository = {
  findByParticipant: (userId) =>
    Conversation.find({ participants: userId }).select('_id').lean(),

  findByParticipantUserId: (userId) =>
    Conversation.find({ participants: userId }).select('_id').lean(),

  findByParticipantSortedLean: (userId) =>
    Conversation.find({ participants: userId })
      .select(listFields)
      .sort({ updatedAt: -1 })
      .lean(),

  findByParticipantSorted: (userId) =>
    Conversation.find({ participants: userId }).sort({ updatedAt: -1 }),

  findById: (id) => Conversation.findById(id),

  findByIdLean: (id) => Conversation.findById(id).lean(),

  findByParticipants: (participants) =>
    Conversation.findOne({ participants: { $all: participants } }).lean(),

  create: (data) => Conversation.create(data),

  updateById: (id, update, options = {}) =>
    Conversation.findByIdAndUpdate(id, update, options),

  deleteManyByIds: (ids) => Conversation.deleteMany({ _id: { $in: ids } }),
};
