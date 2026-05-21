import express from 'express';
import { auth } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import { rankMentorIdsForStudent, applyMentorOrder } from '../services/geminiMentorRank.js';
import { withTimeout } from '../lib/withTimeout.js';

const GEMINI_RANK_TIMEOUT_MS = 2500;

const router = express.Router();

const normalizeSkill = (value) => {
  const key = (value || '').toString().trim().toLowerCase();
  if (key === 'js' || key === 'javascript') return 'javascript';
  if (key === 'cpp' || key === 'c++') return 'c++';
  return key;
};

// Get all mentors
router.get('/', auth, async (req, res) => {
  try {
    const { industry, skill, search } = req.query;

    const alumni = await User.find({ role: 'alumni' }).lean();
    const alumniIds = alumni.map((u) => u._id);

    const profiles = await Profile.find({ user: { $in: alumniIds } }).lean();
    const profileByUserId = new Map(profiles.map((p) => [p.user.toString(), p]));

    const regex = (val) => new RegExp(val?.toString().trim(), 'i');

    const filtered = alumni.filter((u) => {
      const p = profileByUserId.get(u._id.toString()) || null;
      const skills = (p?.skills || u.skills || []);
      const company = (p?.company || u.company || '');
      const industryVal = (p?.industry || u.industry || u.company || '');
      const headline = (p?.headline || u.headline || u.title || '');

      if (industry) {
        if (!regex(industry).test(industryVal.toString())) return false;
      }

      if (skill) {
        const normalizedRequested = normalizeSkill(skill);
        const normalizedSkills = skills.map((s) => normalizeSkill(s));
        if (!normalizedSkills.includes(normalizedRequested)) return false;
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
      user: u,
      profile: (() => {
        const p = profileByUserId.get(u._id.toString());
        if (p) return { ...p, industry: p.industry || u.industry || null };
        return {
          headline: u.headline || u.title || null,
          bio: u.bio || null,
          company: u.company || null,
          industry: u.industry || null,
          skills: u.skills || [],
          isVerified: u.isVerified || false,
        };
      })(),
    }));

    let aiRanked = false;
    const MAX_GEMINI_MENTORS = 60;
    if (req.userRole === 'student' && mentorRows.length > 0) {
      const student = await User.findById(req.userId)
        .select(
          'skills headline industry bio resumeSkills resumeSuggestedIndustry resumeSuggestedTopics',
        )
        .lean();

      const head = mentorRows.slice(0, MAX_GEMINI_MENTORS);
      const mentorsCompact = head.map(({ user: u, profile: pr }) => ({
        id: u._id.toString(),
        name: u.name || '',
        headline: pr?.headline || u.headline || u.title || '',
        industry: pr?.industry || u.industry || '',
        company: pr?.company || u.company || '',
        skills: pr?.skills?.length ? pr.skills : u.skills || [],
      }));

      const orderedIds = await withTimeout(
        rankMentorIdsForStudent(student, mentorsCompact),
        GEMINI_RANK_TIMEOUT_MS,
        null
      );
      if (orderedIds?.length) {
        mentorRows = [...applyMentorOrder(head, orderedIds), ...mentorRows.slice(MAX_GEMINI_MENTORS)];
        aiRanked = true;
      }
    }

    res.json({ success: true, mentors: mentorRows, aiRanked });
  } catch (err) {
    console.error('Get mentors error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get mentor by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).lean();
    if (!user) return res.status(404).json({ message: 'Mentor not found' });
    if (user.role !== 'alumni') return res.status(400).json({ message: 'Invalid mentor role' });

    const profile = await Profile.findOne({ user: id }).lean();
    res.json({
      success: true,
      mentor: {
        user,
        profile: (() => {
          if (profile) return { ...profile, industry: profile.industry || user.industry || null };
          return {
            headline: user.headline || user.title || null,
            bio: user.bio || null,
            company: user.company || null,
            industry: user.industry || null,
            skills: user.skills || [],
            isVerified: user.isVerified || false,
          };
        })(),
      },
    });
  } catch (err) {
    console.error('Get mentor error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update mentor profile
router.put('/:id', auth, async (req, res) => {
  try {
    res.json({ success: true, message: 'Profile update not implemented yet' });
  } catch (err) {
    console.error('Update mentor error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
