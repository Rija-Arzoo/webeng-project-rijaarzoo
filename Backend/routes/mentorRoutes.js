import express from 'express';
import { auth } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import { rankMentorIdsForStudent, applyMentorOrder } from '../services/geminiMentorRank.js';
import { withTimeout } from '../lib/withTimeout.js';
import { avatarUrl } from '../lib/avatar.js';
import { USER_MENTOR_FIELDS } from '../lib/userSelect.js';

const router = express.Router();
const GEMINI_RANK_TIMEOUT_MS = 1500;

const normalizeSkill = (value) => {
  const key = (value || '').toString().trim().toLowerCase();
  if (key === 'js' || key === 'javascript') return 'javascript';
  if (key === 'cpp' || key === 'c++') return 'c++';
  return key;
};

const slimProfile = (p, u) => {
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

const slimUser = (u) => ({
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

// Get all mentors — ?rank=ai enables Gemini (slow); default is fast DB order
router.get('/', auth, async (req, res) => {
  try {
    const { industry, skill, search, rank } = req.query;
    const useAiRank = rank === 'ai' && req.userRole === 'student';

    const alumni = await User.find({ role: 'alumni' })
      .select(USER_MENTOR_FIELDS)
      .lean();

    const alumniIds = alumni.map((u) => u._id);
    const profiles = await Profile.find({ user: { $in: alumniIds } })
      .select('user headline bio company industry skills isVerified')
      .lean();
    const profileByUserId = new Map(profiles.map((p) => [p.user.toString(), p]));

    const regex = (val) => new RegExp(val?.toString().trim(), 'i');

    const filtered = alumni.filter((u) => {
      const p = profileByUserId.get(u._id.toString()) || null;
      const skills = p?.skills || u.skills || [];
      const company = (p?.company || u.company || '');
      const industryVal = (p?.industry || u.industry || u.company || '');
      const headline = (p?.headline || u.headline || u.title || '');

      if (industry && !regex(industry).test(industryVal.toString())) return false;
      if (skill) {
        const normalizedRequested = normalizeSkill(skill);
        if (!skills.map((s) => normalizeSkill(s)).includes(normalizedRequested)) return false;
      }
      if (search) {
        const nameOk = regex(search).test(u.name || '');
        const headlineOk = regex(search).test(headline || '');
        const companyOk = regex(search).test(company || '');
        const industryOk = regex(search).test(industryVal || '');
        if (!nameOk && !headlineOk && !companyOk && !industryOk) return false;
      }
      return true;
    });

    let mentorRows = filtered.map((u) => ({
      user: slimUser(u),
      profile: slimProfile(profileByUserId.get(u._id.toString()), u),
    }));

    let aiRanked = false;
    if (useAiRank && mentorRows.length > 0) {
      const student = await User.findById(req.userId)
        .select('skills headline industry bio resumeSkills resumeSuggestedIndustry resumeSuggestedTopics')
        .lean();

      const head = mentorRows.slice(0, 40);
      const mentorsCompact = head.map(({ user: u, profile: pr }) => ({
        id: u._id.toString(),
        name: u.name || '',
        headline: pr?.headline || '',
        industry: pr?.industry || '',
        company: pr?.company || '',
        skills: pr?.skills || [],
      }));

      const orderedIds = await withTimeout(
        rankMentorIdsForStudent(student, mentorsCompact),
        GEMINI_RANK_TIMEOUT_MS,
        null
      );
      if (orderedIds?.length) {
        const byId = new Map(head.map((m) => [m.user._id.toString(), m]));
        const ordered = orderedIds.map((id) => byId.get(String(id))).filter(Boolean);
        const rest = head.filter((m) => !orderedIds.includes(m.user._id.toString()));
        mentorRows = [...ordered, ...rest, ...mentorRows.slice(40)];
        aiRanked = true;
      }
    }

    res.set('Cache-Control', 'private, max-age=30');
    res.json({ success: true, mentors: mentorRows, aiRanked });
  } catch (err) {
    console.error('Get mentors error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(USER_MENTOR_FIELDS).lean();
    if (!user) return res.status(404).json({ message: 'Mentor not found' });
    if (user.role !== 'alumni') return res.status(400).json({ message: 'Invalid mentor role' });

    const profile = await Profile.findOne({ user: req.params.id })
      .select('headline bio company industry skills isVerified')
      .lean();

    res.json({
      success: true,
      mentor: {
        user: slimUser(user),
        profile: slimProfile(profile, user),
      },
    });
  } catch (err) {
    console.error('Get mentor error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', auth, async (req, res) => {
  res.json({ success: true, message: 'Profile update not implemented yet' });
});

export default router;
