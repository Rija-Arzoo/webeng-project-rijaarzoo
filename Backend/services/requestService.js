import { userRepository } from '../repositories/userRepository.js';
import { mentorshipRequestRepository } from '../repositories/mentorshipRequestRepository.js';
import { conversationRepository } from '../repositories/conversationRepository.js';
import { formatRequest, mapSender } from '../mappers/requestMapper.js';

export const requestService = {
  async listForUser(userId, userRole) {
    const filter = userRole === 'alumni' ? { mentorId: userId } : { studentId: userId };
    const requests = await mentorshipRequestRepository.findByFilter(filter);

    const senderIds = requests.map((r) =>
      userRole === 'alumni' ? r.studentId : r.mentorId
    );

    const senders = await userRepository.findByIdsLean(senderIds);
    const senderById = new Map(senders.map((u) => [u._id.toString(), mapSender(u)]));

    const formatted = requests.map((r) => formatRequest(r, userRole, senderById));

    return {
      status: 200,
      body: { success: true, requests: formatted },
      cacheControl: 'private, max-age=15',
    };
  },

  async createRequest(userId, { mentorId, goalStatement, message }) {
    const goal = goalStatement || message;

    if (!mentorId || !goal) {
      return { status: 400, body: { message: 'mentorId and goalStatement are required' } };
    }

    const currentUser = await userRepository.findById(userId, 'role');
    if (!currentUser) {
      return { status: 404, body: { message: 'User not found' } };
    }
    if (currentUser.role !== 'student') {
      return { status: 403, body: { message: 'Only students can create mentorship requests' } };
    }

    const mentor = await userRepository.findById(mentorId, 'role');
    if (!mentor) {
      return { status: 404, body: { message: 'Mentor not found' } };
    }
    if (mentor.role !== 'alumni') {
      return { status: 400, body: { message: 'Invalid mentor role' } };
    }

    const request = await mentorshipRequestRepository.create({
      mentorId,
      studentId: userId,
      goal,
      status: 'pending',
    });

    return {
      status: 200,
      body: {
        success: true,
        message: 'Request sent',
        requestId: request._id.toString(),
      },
    };
  },

  async updateStatus(requestId, userId, userRole, status) {
    const allowed = ['accepted', 'rejected'];
    if (!allowed.includes(status)) {
      return { status: 400, body: { message: 'Invalid status' } };
    }

    const request = await mentorshipRequestRepository.findById(requestId);
    if (!request) {
      return { status: 404, body: { message: 'Request not found' } };
    }

    if (userRole !== 'alumni') {
      return { status: 403, body: { message: 'Only alumni can update request status' } };
    }
    if (request.mentorId.toString() !== userId.toString()) {
      return { status: 403, body: { message: 'Not allowed' } };
    }
    if (request.status !== 'pending') {
      return { status: 400, body: { message: 'Request already processed' } };
    }

    request.status = status;
    await request.save();

    if (status === 'accepted') {
      const participants = [request.mentorId, request.studentId];
      const existing = await conversationRepository.findByParticipants(participants);
      if (!existing) {
        await conversationRepository.create({
          participants,
          lastMessage: '',
          lastMessageAt: new Date(),
        });
      }
    }

    return {
      status: 200,
      body: {
        success: true,
        message: 'Request updated',
        requestId: request._id.toString(),
      },
    };
  },

  async cancelRequest(requestId, userId, userRole) {
    const request = await mentorshipRequestRepository.findById(requestId);
    if (!request) {
      return { status: 404, body: { message: 'Request not found' } };
    }

    if (request.status !== 'pending') {
      return { status: 400, body: { message: 'Only pending requests can be cancelled' } };
    }

    const isStudentOwner = request.studentId.toString() === userId.toString();
    const isMentorOwner = request.mentorId.toString() === userId.toString();

    if (!isStudentOwner && !isMentorOwner) {
      return { status: 403, body: { message: 'Not allowed' } };
    }

    if (isStudentOwner && userRole === 'student') {
      await request.deleteOne();
      return { status: 200, body: { success: true, message: 'Request cancelled' } };
    }

    if (isMentorOwner && userRole === 'alumni') {
      await request.deleteOne();
      return { status: 200, body: { success: true, message: 'Request deleted' } };
    }

    return { status: 403, body: { message: 'Not allowed' } };
  },
};
