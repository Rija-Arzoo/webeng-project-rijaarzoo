import bcryptjs from 'bcryptjs';
import { currentYear } from '../config/index.js';
import { avatarUrl } from '../lib/avatar.js';
import { uploadAvatarDataUrl } from '../lib/cloudinary.js';
import { userRepository } from '../repositories/userRepository.js';
import { mapProfileResponse } from '../mappers/userMapper.js';
import { parseSkillsInput } from '../utils/skills.js';
import { syncProfileFromUser } from './profileSyncService.js';
import {
  normalizeSecurityAnswer,
  validateSecurityQuestions,
} from '../validators/securityQuestions.js';

const hashSecurityQuestions = async (cleaned) =>
  Promise.all(
    cleaned.map(async (q) => ({
      question: q.question,
      answerHash: await bcryptjs.hash(normalizeSecurityAnswer(q.answer), 10),
    }))
  );

export const profileService = {
  async getMe(userId) {
    const user = await userRepository.findById(
      userId,
      '-password -resumeText -securityQuestions'
    );
    if (!user) {
      return { status: 404, body: { message: 'User not found' } };
    }
    return { status: 200, body: { profile: mapProfileResponse(user) } };
  },

  async updateProfile(userId, body) {
    const {
      name,
      profilePicture,
      bio,
      location,
      skills,
      company,
      industry,
      title,
      headline,
      isVerified,
      university,
      department,
      studentId,
      batchYear,
      graduationYear,
      promoteToAlumni,
      degreeLevel,
      securityQuestions,
    } = body;

    const normalizedSkills = parseSkillsInput(skills);

    const user = await userRepository.findById(userId, '-password');
    if (!user) {
      return { status: 404, body: { message: 'User not found' } };
    }

    if (name !== undefined) user.name = name;
    if (profilePicture !== undefined) {
      if (typeof profilePicture === 'string' && profilePicture.startsWith('data:image')) {
        const uploaded = await uploadAvatarDataUrl(profilePicture, userId);
        user.profilePicture = uploaded || avatarUrl(null, userId);
      } else if (
        typeof profilePicture === 'string' &&
        (profilePicture.startsWith('http://') || profilePicture.startsWith('https://'))
      ) {
        user.profilePicture = profilePicture;
      } else if (!profilePicture) {
        user.profilePicture = avatarUrl(null, userId);
      }
    }
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (normalizedSkills !== undefined) user.skills = normalizedSkills;
    if (company !== undefined) user.company = company;
    if (industry !== undefined) user.industry = industry;
    if (title !== undefined) user.title = title;
    if (headline !== undefined) user.headline = headline;
    if (typeof isVerified === 'boolean') user.isVerified = isVerified;
    if (university !== undefined) user.university = university;
    if (department !== undefined) user.department = department;
    if (degreeLevel !== undefined) user.degreeLevel = degreeLevel;
    if (studentId !== undefined) user.studentId = studentId;
    if (batchYear !== undefined) user.batchYear = Number(batchYear) || null;
    if (graduationYear !== undefined) user.graduationYear = Number(graduationYear) || null;

    if (securityQuestions !== undefined) {
      const sec = validateSecurityQuestions(securityQuestions);
      if (!sec.ok) {
        return { status: 400, body: { message: sec.message } };
      }
      user.securityQuestions = await hashSecurityQuestions(sec.cleaned);
    }

    if (user.role === 'alumni' && user.graduationYear && user.graduationYear > currentYear) {
      return {
        status: 400,
        body: { message: 'Alumni graduation year must be this year or earlier' },
      };
    }

    if (promoteToAlumni === true && user.role === 'student') {
      const gradYear = Number(graduationYear || user.graduationYear);
      if (!gradYear || Number.isNaN(gradYear)) {
        return { status: 400, body: { message: 'Graduation year is required to become alumni' } };
      }
      if (gradYear > currentYear) {
        return {
          status: 400,
          body: {
            message: 'Graduation year must be this year or earlier before switching to alumni',
          },
        };
      }
      user.role = 'alumni';
      user.enrollmentStatus = 'graduated';
      user.alumniSince = new Date();
      user.graduationYear = gradYear;
    }

    await userRepository.save(user);

    await syncProfileFromUser(userId, user, {
      bio,
      location,
      skills: normalizedSkills,
      company,
      industry,
      title,
      headline,
      isVerified,
    });

    return {
      status: 200,
      body: {
        message: 'Profile updated successfully',
        profile: mapProfileResponse(user),
      },
    };
  },
};
