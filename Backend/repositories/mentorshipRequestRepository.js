import MentorshipRequest from '../models/MentorshipRequest.js';

export const mentorshipRequestRepository = {
  findByFilter: (filter) => MentorshipRequest.find(filter).sort({ createdAt: -1 }).lean(),

  findById: (id) => MentorshipRequest.findById(id),

  create: (data) => MentorshipRequest.create(data),

  deleteById: (id) => MentorshipRequest.findByIdAndDelete(id),

  findExistingForPair: (mentorId, studentId) =>
    MentorshipRequest.findOne({
      mentorId,
      studentId,
      status: { $in: ['pending', 'accepted'] },
    }).lean(),

  deleteByUserId: (userId) =>
    MentorshipRequest.deleteMany({ $or: [{ mentorId: userId }, { studentId: userId }] }),
};
