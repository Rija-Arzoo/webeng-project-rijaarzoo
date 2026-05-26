import { avatarUrl } from '../lib/avatar.js';

export const mapAuthUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  profilePicture: avatarUrl(user.profilePicture, user._id.toString()),
  verificationStatus: user.verificationStatus,
});

export const mapLoginUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  profilePicture: avatarUrl(user.profilePicture, user._id.toString()),
});

export const mapProfileResponse = (user) => {
  const pic = user.profilePicture;
  const displayPicture = pic?.startsWith?.('http') ? pic : avatarUrl(pic, user._id.toString());

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profilePicture: displayPicture,
    profilePictureIsUrl: Boolean(pic?.startsWith?.('http')),
    createdAt: user.createdAt,
    university: user.university || null,
    department: user.department || null,
    degreeLevel: user.degreeLevel || null,
    studentId: user.studentId || null,
    batchYear: user.batchYear || null,
    graduationYear: user.graduationYear || null,
    enrollmentStatus: user.enrollmentStatus || null,
    alumniSince: user.alumniSince || null,
    verificationStatus: user.verificationStatus || 'pending',
    bio: user.bio,
    location: user.location,
    skills: user.skills || [],
    company: user.company,
    industry: user.industry || null,
    title: user.title,
    headline: user.headline,
    isVerified: user.isVerified,
    resumeSkills: user.resumeSkills || [],
    resumeSuggestedIndustry: user.resumeSuggestedIndustry || null,
    resumeSuggestedTopics: user.resumeSuggestedTopics || [],
    resumeUploadedAt: user.resumeUploadedAt || null,
  };
};

export const mapPublicProfile = (user, profile) => ({
  id: user._id.toString(),
  name: user.name,
  role: user.role,
  profilePicture: avatarUrl(user.profilePicture, user._id.toString()),
  bio: profile?.bio || user.bio || null,
  location: user.location || null,
  skills: profile?.skills || user.skills || [],
  company: profile?.company || user.company || null,
  industry: user.industry || null,
  title: user.title || profile?.title || null,
  headline: profile?.headline || user.headline || user.title || null,
  isVerified: user.isVerified ?? profile?.isVerified ?? false,
  resumeSkills: user.resumeSkills || [],
  resumeSuggestedIndustry: user.resumeSuggestedIndustry || null,
  resumeSuggestedTopics: user.resumeSuggestedTopics || [],
  resumeUploadedAt: user.resumeUploadedAt || null,
});
