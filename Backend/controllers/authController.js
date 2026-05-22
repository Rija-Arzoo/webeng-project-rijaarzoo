import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { createRequire } from 'module';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import { avatarUrl } from '../lib/avatar.js';
import { uploadAvatarDataUrl } from '../lib/cloudinary.js';

// Lazy-load pdf-parse (can break serverless cold start if required at import time).
let PDFParseClass = null;
async function getPDFParse() {
  if (!PDFParseClass) {
    const require = createRequire(import.meta.url);
    const mod = require('pdf-parse');
    PDFParseClass = mod.PDFParse || mod.default?.PDFParse || mod;
  }
  return PDFParseClass;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const CURRENT_YEAR = new Date().getFullYear();

const normalizeSecurityAnswer = (value) =>
  (value || '')
    .toString()
    // Normalize Unicode so “smart quotes” and similar variations match
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    // Normalize common apostrophe variants
    .replace(/[’‘`´]/g, "'")
    // collapse internal whitespace to reduce "same answer different spaces" issues
    .replace(/\s+/g, ' ');

// Backwards-compatible normalization for accounts created before the Unicode/apostrophe normalization existed.
const normalizeSecurityAnswerLegacy = (value) =>
  (value || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const validateSecurityQuestions = (raw) => {
  if (!Array.isArray(raw) || raw.length !== 2) {
    return { ok: false, message: 'Two security questions are required' };
  }
  const cleaned = raw.map((q) => ({
    question: (q?.question || '').toString().trim(),
    answer: (q?.answer || '').toString(),
  }));
  if (cleaned.some((q) => !q.question || !q.answer.trim())) {
    return { ok: false, message: 'Security questions and answers cannot be empty' };
  }
  const q1 = cleaned[0].question.toLowerCase();
  const q2 = cleaned[1].question.toLowerCase();
  if (q1 === q2) {
    return { ok: false, message: 'Security questions must be different' };
  }
  return { ok: true, cleaned };
};

/**
 * Register new user
 */
export const register = async (req, res) => {
  try {
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
    } = req.body;
    const normalizedRole = role || 'student';

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (!university || !department) {
      return res.status(400).json({ message: 'University and department are required' });
    }
    if (!degreeLevel || !['BS', 'MS', 'PHD'].includes(degreeLevel)) {
      return res.status(400).json({ message: 'Degree level must be BS, MS, or PHD' });
    }
    if (normalizedRole === 'student' && !studentId) {
      return res.status(400).json({ message: 'Student ID is required for student registration' });
    }
    if (normalizedRole === 'student' && !batchYear) {
      return res.status(400).json({ message: 'Batch year is required for students' });
    }
    if (normalizedRole === 'alumni' && !graduationYear) {
      return res.status(400).json({ message: 'Graduation year is required for alumni registration' });
    }

    const parsedBatchYear = batchYear ? Number(batchYear) : undefined;
    const parsedGraduationYear = graduationYear ? Number(graduationYear) : undefined;
    if (parsedBatchYear && Number.isNaN(parsedBatchYear)) {
      return res.status(400).json({ message: 'Batch year must be a valid number' });
    }
    if (parsedGraduationYear && Number.isNaN(parsedGraduationYear)) {
      return res.status(400).json({ message: 'Graduation year must be a valid number' });
    }
    if (normalizedRole === 'student' && parsedGraduationYear && parsedGraduationYear <= CURRENT_YEAR) {
      return res.status(400).json({
        message: 'If you have already graduated, register as alumni instead of student',
      });
    }
    if (normalizedRole === 'alumni' && parsedGraduationYear > CURRENT_YEAR) {
      return res.status(400).json({
        message: 'Alumni graduation year must be this year or earlier',
      });
    }

    const sec = validateSecurityQuestions(securityQuestions);
    if (!sec.ok) {
      return res.status(400).json({ message: sec.message });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);
    const hashedSecurityQuestions = await Promise.all(
      sec.cleaned.map(async (q) => ({
        question: q.question,
        answerHash: await bcryptjs.hash(normalizeSecurityAnswer(q.answer), 10),
      }))
    );

    // Create new user
    const user = new User({
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

    await user.save();

    // Keep `profiles` collection in sync for Atlas diagrams + mentor/public profile lookups.
    // Your app currently stores most profile fields on `User`, but other routes query `Profile`.
    await Profile.create({
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

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: avatarUrl(user.profilePicture, user._id.toString()),
        verificationStatus: user.verificationStatus,
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * Login user
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare passwords
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: avatarUrl(user.profilePicture, user._id.toString()),
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * Get current user profile
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -resumeText -securityQuestions');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const pic = user.profilePicture;
    const displayPicture =
      pic?.startsWith?.('http') ? pic : avatarUrl(pic, user._id.toString());

    res.json({
      profile: {
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
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const SKILL_PATTERNS = [
  { skill: 'AI', re: /(ai|artificial intelligence|llm|large language model)/i },
  { skill: 'Machine Learning', re: /(machine learning|\bml\b|deep learning|neural network)/i },
  { skill: 'NLP', re: /\b(nlp|natural language processing)\b/i },
  { skill: 'Data Science', re: /(data science|data scientist)/i },
  { skill: 'Python', re: /\bpython\b/i },
  { skill: 'JavaScript', re: /\bjavascript\b|\bjs\b/i },
  { skill: 'C++', re: /\b(c\+\+|cpp)\b/i },
  { skill: 'React', re: /\breact\b/i },
  { skill: 'Node.js', re: /(node\.?js|nodejs|\bnode\b)/i },
  { skill: 'Go', re: /\bgo\b/i },
  { skill: 'Systems Design', re: /(systems design|system design|architecture|distributed systems)/i },
  { skill: 'Project Management', re: /(project management|agile|scrum)/i },
  { skill: 'Leadership', re: /(leadership|tech lead|team lead|mentorship|leading)/i },
  { skill: 'Strategy', re: /(strategy|strategic|roadmap|planning)/i },
];

const INDUSTRY_PATTERNS = [
  { industry: 'Technology', re: /(software|cloud|backend|frontend|engineering|technology|devops)/i },
  { industry: 'Finance', re: /(finance|fintech|bank|investment|payments|trading|wealth|credit)/i },
  { industry: 'Healthcare', re: /(healthcare|medical|clinical|hospital|pharma|biomedical)/i },
  { industry: 'Education', re: /(education|teaching|university|academia|curriculum|tutor)/i },
  { industry: 'Consulting', re: /(consulting|advisory|consultant|strategy consulting)/i },
  { industry: 'Manufacturing', re: /(manufacturing|industrial|factory|operations)/i },
  { industry: 'Retail', re: /(retail|ecommerce|e-commerce|consumer)/i },
  { industry: 'Media & Entertainment', re: /(media|entertainment|streaming|content|video|podcast)/i },
  { industry: 'Transportation', re: /(transportation|logistics|supply chain|shipping|aviation|mobility)/i },
];

const extractSkills = (text) => {
  const found = new Set();
  for (const { skill, re } of SKILL_PATTERNS) {
    if (re.test(text)) found.add(skill);
  }
  // Ensure we only keep skills present in the UI list
  const allowed = new Set([
    'AI',
    'Python',
    'JavaScript',
    'C++',
    'React',
    'Node.js',
    'Go',
    'Systems Design',
    'Project Management',
    'Data Science',
    'Machine Learning',
    'Leadership',
    'Strategy',
  ]);
  return Array.from(found).filter((s) => allowed.has(s));
};

const normalizeSkill = (value) => {
  const raw = (value || '').toString().trim();
  const key = raw.toLowerCase();
  if (key === 'js' || key === 'javascript') return 'JavaScript';
  if (key === 'cpp' || key === 'c++') return 'C++';
  return raw;
};

const extractIndustry = (text) => {
  for (const { industry, re } of INDUSTRY_PATTERNS) {
    if (re.test(text)) return industry;
  }
  return 'Technology';
};

const suggestedTopicsForSkills = (skills, industry) => {
  const topics = [];
  const push = (t) => {
    if (!topics.includes(t)) topics.push(t);
  };

  for (const s of skills) {
    switch (s) {
      case 'AI':
        push('AI career roadmap and portfolio strategy');
        break;
      case 'Machine Learning':
        push('Machine learning project roadmap (end-to-end delivery)');
        break;
      case 'Data Science':
        push('Data science case studies and storytelling for interviews');
        break;
      case 'Python':
        push('Python projects that demonstrate real-world impact');
        break;
      case 'JavaScript':
        push('JavaScript fundamentals + practical hiring readiness');
        break;
      case 'React':
        push('React architecture and portfolio improvements');
        break;
      case 'Node.js':
        push('Backend systems and scalability practice');
        break;
      case 'Go':
        push('Systems programming projects and performance engineering');
        break;
      case 'Systems Design':
        push('Systems design preparation (framework + practice plan)');
        break;
      case 'Project Management':
        push('Agile execution and delivery roadmap planning');
        break;
      case 'Leadership':
        push('Leadership growth: mentoring, influencing, and impact');
        break;
      case 'Strategy':
        push('Career strategy: positioning and long-term roadmap');
        break;
      default:
        break;
    }
  }

  // Fallback if no keywords were detected
  if (topics.length === 0) {
    topics.push(`A ${industry}-focused mentorship plan (portfolio + interview prep).`);
  }

  return topics.slice(0, 4);
};

export const uploadResume = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'Resume file is required' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const PDFParse = await getPDFParse();
    const parser = new PDFParse({ data: req.file.buffer });
    const parsed = await parser.getText();
    const text = (parsed?.text || '').toString();
    if (!text.trim()) {
      return res.status(400).json({ message: 'Could not extract text from this PDF' });
    }

    const resumeSkills = extractSkills(text);
    const resumeSuggestedIndustry = extractIndustry(text);
    const resumeSuggestedTopics = suggestedTopicsForSkills(resumeSkills, resumeSuggestedIndustry);

    // Store only the first chunk to keep document sizes reasonable
    const resumeText = text.slice(0, 200000);

    user.resumeText = resumeText;
    user.resumeSkills = resumeSkills;
    user.resumeSuggestedIndustry = resumeSuggestedIndustry;
    user.resumeSuggestedTopics = resumeSuggestedTopics;
    user.resumeUploadedAt = new Date();

    await user.save();

    res.json({
      success: true,
      resumeSkills,
      resumeSuggestedIndustry,
      resumeSuggestedTopics,
    });
  } catch (err) {
    console.error('Resume upload error:', err);
    res.status(500).json({
      message:
        'Server error during resume processing: ' +
        (err?.message || String(err)),
      error: err?.message || String(err),
    });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res) => {
  try {
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
    } = req.body;

    const normalizedSkills = Array.isArray(skills)
      ? skills
          .map(normalizeSkill)
          .filter(Boolean)
      : typeof skills === 'string'
        ? skills
            .split(',')
            .map(normalizeSkill)
            .filter(Boolean)
        : undefined;

    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name !== undefined) user.name = name;
    if (profilePicture !== undefined) {
      if (typeof profilePicture === 'string' && profilePicture.startsWith('data:image')) {
        const uploaded = await uploadAvatarDataUrl(profilePicture, req.userId);
        user.profilePicture = uploaded || avatarUrl(null, req.userId);
      } else if (
        typeof profilePicture === 'string' &&
        (profilePicture.startsWith('http://') || profilePicture.startsWith('https://'))
      ) {
        user.profilePicture = profilePicture;
      } else if (!profilePicture) {
        user.profilePicture = avatarUrl(null, req.userId);
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
        return res.status(400).json({ message: sec.message });
      }
      user.securityQuestions = await Promise.all(
        sec.cleaned.map(async (q) => ({
          question: q.question,
          answerHash: await bcryptjs.hash(normalizeSecurityAnswer(q.answer), 10),
        }))
      );
    }

    if (user.role === 'alumni' && user.graduationYear && user.graduationYear > CURRENT_YEAR) {
      return res.status(400).json({
        message: 'Alumni graduation year must be this year or earlier',
      });
    }

    if (promoteToAlumni === true && user.role === 'student') {
      const gradYear = Number(graduationYear || user.graduationYear);
      if (!gradYear || Number.isNaN(gradYear)) {
        return res.status(400).json({ message: 'Graduation year is required to become alumni' });
      }
      if (gradYear > CURRENT_YEAR) {
        return res.status(400).json({
          message: 'Graduation year must be this year or earlier before switching to alumni',
        });
      }
      user.role = 'alumni';
      user.enrollmentStatus = 'graduated';
      user.alumniSince = new Date();
      user.graduationYear = gradYear;
    }

    await user.save();

    // Mirror updates into `profiles` so MongoDB/Atlas shows real linked documents.
    // This also keeps mentor/public lookups consistent because they read from `Profile`.
    const profileUpdate = {
      ...(bio !== undefined && { bio }),
      ...(location !== undefined && { location }),
      ...(normalizedSkills !== undefined && { skills: normalizedSkills }),
      ...(company !== undefined && { company }),
      ...(industry !== undefined && { industry }),
      ...(title !== undefined && { title }),
      ...(headline !== undefined && { headline }),
      ...(typeof isVerified === 'boolean' && { isVerified }),
    };

    await Profile.findOneAndUpdate(
      { user: req.userId },
      profileUpdate,
      { upsert: true, new: true }
    );

    res.json({
      message: 'Profile updated successfully',
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture?.startsWith?.('http')
          ? user.profilePicture
          : avatarUrl(user.profilePicture, user._id.toString()),
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
        profilePictureIsUrl: Boolean(user.profilePicture?.startsWith?.('http')),
        resumeSkills: user.resumeSkills || [],
        resumeSuggestedIndustry: user.resumeSuggestedIndustry || null,
        resumeSuggestedTopics: user.resumeSuggestedTopics || [],
        resumeUploadedAt: user.resumeUploadedAt || null,
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Forgot password: fetch the user's security questions
 */
export const forgotPasswordQuestions = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toString().trim().toLowerCase() })
      .select('securityQuestions')
      .lean();

    if (!user) return res.status(404).json({ message: 'Account not found' });
    if (!Array.isArray(user.securityQuestions) || user.securityQuestions.length !== 2) {
      return res.status(400).json({
        message:
          'Password recovery is not set up for this account. Please contact support or log in to configure security questions.',
      });
    }

    return res.json({
      success: true,
      questions: user.securityQuestions.map((q) => ({ question: q.question })),
    });
  } catch (err) {
    console.error('Forgot password questions error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Forgot password: verify answers and set new password
 */
export const resetPasswordWithSecurityQuestions = async (req, res) => {
  try {
    const { email, answers, newPassword } = req.body || {};
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and newPassword are required' });
    }
    const providedAnswers =
      Array.isArray(answers)
        ? answers
        : answers && typeof answers === 'object'
          ? [answers.answer1, answers.answer2]
          : null;
    if (!Array.isArray(providedAnswers) || providedAnswers.length !== 2) {
      return res.status(400).json({ message: 'Two answers are required' });
    }
    if (newPassword.toString().length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email: email.toString().trim().toLowerCase() }).select(
      'password securityQuestions'
    );
    if (!user) return res.status(404).json({ message: 'Account not found' });
    if (!Array.isArray(user.securityQuestions) || user.securityQuestions.length !== 2) {
      return res.status(400).json({ message: 'Password recovery is not set up for this account' });
    }

    // Compare answers order-independently to avoid "swapped answers" failures.
    const normalizedAnswers = providedAnswers.map((a) => ({
      primary: normalizeSecurityAnswer(a),
      legacy: normalizeSecurityAnswerLegacy(a),
    }));
    const hashes = user.securityQuestions.map((q) => q.answerHash);

    const matchMatrix = await Promise.all(
      normalizedAnswers.map((ans) =>
        Promise.all(
          hashes.map(async (h) => {
            if (await bcryptjs.compare(ans.primary, h)) return true;
            if (ans.legacy !== ans.primary && (await bcryptjs.compare(ans.legacy, h))) return true;
            return false;
          })
        )
      )
    );

    const usedHashIdx = new Set();
    let matches = 0;
    for (let i = 0; i < matchMatrix.length; i++) {
      const row = matchMatrix[i];
      const idx = row.findIndex((ok, j) => ok && !usedHashIdx.has(j));
      if (idx >= 0) {
        usedHashIdx.add(idx);
        matches += 1;
      }
    }

    if (matches !== 2) {
      return res.status(401).json({ message: 'Security answers do not match' });
    }

    user.password = await bcryptjs.hash(newPassword.toString(), 10);
    await user.save();

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete the currently authenticated user's account (danger zone).
 * Also cleans up related docs to avoid orphaned references.
 */
export const deleteMyAccount = async (req, res) => {
  try {
    const { password } = req.body || {};
    if (!password) return res.status(400).json({ message: 'Password is required' });

    const user = await User.findById(req.userId).select('password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const ok = await bcryptjs.compare(password.toString(), user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid password' });

    const userId = user._id;

    // Remove profile mirror
    await Profile.deleteOne({ user: userId });

    // Remove mentorship requests where the user is either side
    await MentorshipRequest.deleteMany({ $or: [{ mentorId: userId }, { studentId: userId }] });

    // Remove messages authored by user
    await Message.deleteMany({ senderId: userId });

    // Remove conversations the user participated in (and associated messages)
    const conversations = await Conversation.find({ participants: userId }).select('_id').lean();
    const conversationIds = conversations.map((c) => c._id);
    if (conversationIds.length > 0) {
      await Message.deleteMany({ conversationId: { $in: conversationIds } });
      await Conversation.deleteMany({ _id: { $in: conversationIds } });
    }

    // Remove this user from other users' follower/following lists
    await User.updateMany(
      { $or: [{ followers: userId }, { following: userId }] },
      { $pull: { followers: userId, following: userId } }
    );

    // Finally delete the user
    await User.deleteOne({ _id: userId });

    return res.json({ success: true, message: 'Account deleted' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};