import { profileRepository } from '../repositories/profileRepository.js';

/**
 * Keeps Profile collection in sync with User document fields.
 */
export const syncProfileFromUser = async (userId, user, fields = {}) => {
  const profileUpdate = {
    ...(fields.bio !== undefined && { bio: fields.bio }),
    ...(fields.location !== undefined && { location: fields.location }),
    ...(fields.skills !== undefined && { skills: fields.skills }),
    ...(fields.company !== undefined && { company: fields.company }),
    ...(fields.industry !== undefined && { industry: fields.industry }),
    ...(fields.title !== undefined && { title: fields.title }),
    ...(fields.headline !== undefined && { headline: fields.headline }),
    ...(fields.isVerified !== undefined && { isVerified: fields.isVerified }),
  };

  if (Object.keys(profileUpdate).length === 0) return;

  await profileRepository.upsertByUserId(userId, profileUpdate);
};

export const createInitialProfile = async (user) =>
  profileRepository.create({
    user: user._id,
    bio: user.bio ?? null,
    location: user.location ?? null,
    skills: user.skills ?? [],
    company: user.company ?? null,
    title: user.title ?? null,
    headline: user.headline ?? null,
    industry: user.industry ?? null,
    isVerified: user.isVerified ?? false,
  });
