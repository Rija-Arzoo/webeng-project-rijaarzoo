import bcryptjs from 'bcryptjs';
import { currentYear } from '../config/index.js';
import { avatarUrl } from '../lib/avatar.js';
import { userRepository } from '../repositories/userRepository.js';
<<<<<<< HEAD
import { mapAuthUser, mapLoginUser } from '../mappers/userMapper.js';
=======
import { mapAuthUser } from '../mappers/userMapper.js';
>>>>>>> a2b84ca3c62e4c999de1856aaf496bcedaab114d
import { createInitialProfile } from './profileSyncService.js';
import { signAuthToken } from './tokenService.js';
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

export const authService = {
  async register(body) {
    const {
      name,
      email,
      password,
      role,
      profilePicture,
      university,
      department,
      degreeLevel,
      studentId,
      batchYear,
      graduationYear,
      securityQuestions,
    } = body;
    const normalizedRole = role || 'student';

    if (!name || !email || !password) {
      return { status: 400, body: { message: 'Name, email, and password are required' } };
    }
    if (!university || !department) {
      return { status: 400, body: { message: 'University and department are required' } };
    }
    if (!degreeLevel || !['BS', 'MS', 'PHD'].includes(degreeLevel)) {
      return { status: 400, body: { message: 'Degree level must be BS, MS, or PHD' } };
    }
    if (normalizedRole === 'student' && !studentId) {
      return { status: 400, body: { message: 'Student ID is required for student registration' } };
    }
    if (normalizedRole === 'student' && !batchYear) {
      return { status: 400, body: { message: 'Batch year is required for students' } };
    }
    if (normalizedRole === 'alumni' && !graduationYear) {
      return { status: 400, body: { message: 'Graduation year is required for alumni registration' } };
    }

    const parsedBatchYear = batchYear ? Number(batchYear) : undefined;
    const parsedGraduationYear = graduationYear ? Number(graduationYear) : undefined;
    if (parsedBatchYear && Number.isNaN(parsedBatchYear)) {
      return { status: 400, body: { message: 'Batch year must be a valid number' } };
    }
    if (parsedGraduationYear && Number.isNaN(parsedGraduationYear)) {
      return { status: 400, body: { message: 'Graduation year must be a valid number' } };
    }
    if (normalizedRole === 'student' && parsedGraduationYear && parsedGraduationYear <= currentYear) {
      return {
        status: 400,
        body: { message: 'If you have already graduated, register as alumni instead of student' },
      };
    }
    if (normalizedRole === 'alumni' && parsedGraduationYear > currentYear) {
      return {
        status: 400,
        body: { message: 'Alumni graduation year must be this year or earlier' },
      };
    }

    const sec = validateSecurityQuestions(securityQuestions);
    if (!sec.ok) {
      return { status: 400, body: { message: sec.message } };
    }

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return { status: 400, body: { message: 'Email already in use' } };
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const hashedSecurityQuestions = await hashSecurityQuestions(sec.cleaned);

    const user = await userRepository.create({
      name,
      email,
      password: hashedPassword,
      role: normalizedRole,
      university: university.trim(),
      department: department.trim(),
      degreeLevel,
      studentId: studentId?.trim() || undefined,
      batchYear: parsedBatchYear,
      graduationYear: parsedGraduationYear,
      enrollmentStatus: normalizedRole === 'alumni' ? 'graduated' : 'enrolled',
      alumniSince: normalizedRole === 'alumni' ? new Date() : null,
      profilePicture: profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      securityQuestions: hashedSecurityQuestions,
    });

    await createInitialProfile(user);

    const token = signAuthToken(user);

    return {
      status: 201,
      body: {
        message: 'User registered successfully',
        token,
        user: mapAuthUser(user),
      },
    };
  },

  async login({ email, password }) {
    if (!email || !password) {
      return { status: 400, body: { message: 'Email and password are required' } };
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      return { status: 401, body: { message: 'Invalid email or password' } };
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return { status: 401, body: { message: 'Invalid email or password' } };
    }

    const token = signAuthToken(user);

    return {
      status: 200,
      body: {
        message: 'Login successful',
        token,
<<<<<<< HEAD
        user: mapLoginUser(user),
=======
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePicture: avatarUrl(user.profilePicture, user._id.toString()),
        },
>>>>>>> a2b84ca3c62e4c999de1856aaf496bcedaab114d
      },
    };
  },
};
