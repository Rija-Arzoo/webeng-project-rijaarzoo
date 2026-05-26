import bcryptjs from 'bcryptjs';
import { userRepository } from '../repositories/userRepository.js';
import { profileRepository } from '../repositories/profileRepository.js';
import { mentorshipRequestRepository } from '../repositories/mentorshipRequestRepository.js';
import { messageRepository } from '../repositories/messageRepository.js';
import { conversationRepository } from '../repositories/conversationRepository.js';
import Conversation from '../models/Conversation.js';

export const accountDeletionService = {
  async deleteAccount(userId, password) {
    if (!password) {
      return { status: 400, body: { message: 'Password is required' } };
    }

    const user = await userRepository.findById(userId, 'password');
    if (!user) {
      return { status: 404, body: { message: 'User not found' } };
    }

    const ok = await bcryptjs.compare(password.toString(), user.password);
    if (!ok) {
      return { status: 401, body: { message: 'Invalid password' } };
    }

    const userObjectId = user._id;

    await profileRepository.deleteByUserId(userObjectId);
    await mentorshipRequestRepository.deleteByUserId(userObjectId);
    await messageRepository.deleteBySender(userObjectId);

    const conversations = await Conversation.find({ participants: userObjectId })
      .select('_id')
      .lean();
    const conversationIds = conversations.map((c) => c._id);

    if (conversationIds.length > 0) {
      await messageRepository.deleteByConversationIds(conversationIds);
      await conversationRepository.deleteManyByIds(conversationIds);
    }

    await userRepository.removeFromFollowLists(userObjectId);
    await userRepository.deleteById(userObjectId);

    return { status: 200, body: { success: true, message: 'Account deleted' } };
  },
};
