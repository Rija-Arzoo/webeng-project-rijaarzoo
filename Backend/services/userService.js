import { userRepository } from '../repositories/userRepository.js';
import { profileRepository } from '../repositories/profileRepository.js';
import { mapPublicProfile } from '../mappers/userMapper.js';

export const userService = {
  async getPublicProfile(userId) {
    const user = await userRepository.findPublicById(userId);
    if (!user) {
      return { status: 404, body: { message: 'User not found' } };
    }

    const profile = await profileRepository.findByUserId(
      userId,
      'bio skills company industry title headline isVerified'
    );

    return {
      status: 200,
      body: { success: true, person: mapPublicProfile(user, profile) },
    };
  },
};
