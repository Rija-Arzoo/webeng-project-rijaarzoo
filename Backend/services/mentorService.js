import { config } from '../config/index.js';
import { withTimeout } from '../lib/withTimeout.js';
import { userRepository, USER_MENTOR_FIELDS } from '../repositories/userRepository.js';
import { profileRepository } from '../repositories/profileRepository.js';
import { toMentorRow } from '../mappers/mentorMapper.js';
import { normalizeSkillFilter } from '../utils/skills.js';
import { rankMentorIdsForStudent } from './geminiMentorRank.js';

const regex = (val) => new RegExp(val?.toString().trim(), 'i');

const filterAlumni = (alumni, profileByUserId, { industry, skill, search }) =>
  alumni.filter((u) => {
    const p = profileByUserId.get(u._id.toString()) || null;
    const skills = p?.skills || u.skills || [];
    const company = (p?.company || u.company || '');
    const industryVal = (p?.industry || u.industry || u.company || '');
    const headline = (p?.headline || u.headline || u.title || '');

    if (industry && !regex(industry).test(industryVal.toString())) return false;
    if (skill) {
      const normalizedRequested = normalizeSkillFilter(skill);
      if (!skills.map((s) => normalizeSkillFilter(s)).includes(normalizedRequested)) return false;
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

export const mentorService = {
  async listMentors({ userId, userRole, industry, skill, search, rank }) {
    const useAiRank = rank === 'ai' && userRole === 'student';

    const alumni = await userRepository.findAlumni();
    const alumniIds = alumni.map((u) => u._id);
    const profiles = await profileRepository.findByUserIds(
      alumniIds,
      'user headline bio company industry skills isVerified'
    );
    const profileByUserId = new Map(profiles.map((p) => [p.user.toString(), p]));

    const filtered = filterAlumni(alumni, profileByUserId, { industry, skill, search });

    let mentorRows = filtered.map((u) =>
      toMentorRow(u, profileByUserId.get(u._id.toString()) || null)
    );

    let aiRanked = false;
    if (useAiRank && mentorRows.length > 0) {
      const student = await userRepository.findByIdLean(
        userId,
        'skills headline industry bio resumeSkills resumeSuggestedIndustry resumeSuggestedTopics'
      );

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
        config.geminiRankTimeoutMs,
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

    return {
      status: 200,
      body: { success: true, mentors: mentorRows, aiRanked },
      cacheControl: 'private, max-age=30',
    };
  },

  async getMentorById(mentorId) {
    const user = await userRepository.findByIdLean(mentorId, USER_MENTOR_FIELDS);
    if (!user) {
      return { status: 404, body: { message: 'Mentor not found' } };
    }
    if (user.role !== 'alumni') {
      return { status: 400, body: { message: 'Invalid mentor role' } };
    }

    const profile = await profileRepository.findByUserId(
      mentorId,
      'headline bio company industry skills isVerified'
    );

    return {
      status: 200,
      body: {
        success: true,
        mentor: toMentorRow(user, profile),
      },
    };
  },
};
