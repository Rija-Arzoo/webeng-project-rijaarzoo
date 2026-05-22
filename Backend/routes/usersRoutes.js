import express from 'express';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import { avatarUrl } from '../lib/avatar.js';

const router = express.Router();

// Public user profile (no auth)
router.get('/:id/public', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('name role profilePicture bio location skills company industry title headline isVerified resumeSkills resumeSuggestedIndustry resumeSuggestedTopics resumeUploadedAt')
      .lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const profile = await Profile.findOne({ user: id })
      .select('bio skills company industry title headline isVerified')
      .lean();

    const resolved = {
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

      // Student resume insights (safe to expose as "public suggestions")
      resumeSkills: user.resumeSkills || [],
      resumeSuggestedIndustry: user.resumeSuggestedIndustry || null,
      resumeSuggestedTopics: user.resumeSuggestedTopics || [],
      resumeUploadedAt: user.resumeUploadedAt || null,
    };

    res.json({ success: true, person: resolved });
  } catch (err) {
    console.error('Public profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

