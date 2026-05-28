import { avatarUrl } from '../lib/avatar.js';

export const slimUser = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  profilePicture: avatarUrl(u.profilePicture, u._id.toString()),
  company: u.company,
  industry: u.industry,
  title: u.title,
  headline: u.headline,
  isVerified: u.isVerified,
});

export const slimProfile = (p, u) => {
  if (p) {
    return {
      headline: p.headline || u.headline || u.title || null,
      bio: (p.bio || '').slice(0, 280) || null,
      company: p.company || u.company || null,
      industry: p.industry || u.industry || null,
      skills: (p.skills?.length ? p.skills : u.skills || []).slice(0, 12),
      isVerified: p.isVerified ?? u.isVerified ?? false,
    };
  }
  return {
    headline: u.headline || u.title || null,
    bio: (u.bio || '').slice(0, 280) || null,
    company: u.company || null,
    industry: u.industry || null,
    skills: (u.skills || []).slice(0, 12),
    isVerified: u.isVerified || false,
  };
};

export const toMentorRow = (user, profile) => ({
  user: slimUser(user),
  profile: slimProfile(profile, user),
});
