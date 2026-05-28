import { avatarUrl } from '../lib/avatar.js';

export const mapSender = (u) => ({
  ...u,
  profilePicture: avatarUrl(u.profilePicture, u._id.toString()),
});

export const formatRequest = (request, userRole, senderById) => {
  const senderId = (userRole === 'alumni' ? request.studentId : request.mentorId).toString();
  return {
    id: request._id.toString(),
    topic: request.goal,
    status: request.status,
    sender: senderById.get(senderId) || null,
  };
};
