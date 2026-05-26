import { asyncHandler } from '../utils/asyncHandler.js';
import { sendServiceResult } from '../utils/httpResponse.js';
import { mentorService } from '../services/mentorService.js';

export const listMentors = asyncHandler(async (req, res) => {
  const { industry, skill, search, rank } = req.query;
  sendServiceResult(
    res,
    await mentorService.listMentors({
      userId: req.userId,
      userRole: req.userRole,
      industry,
      skill,
      search,
      rank,
    })
  );
});

export const getMentorById = asyncHandler(async (req, res) => {
  sendServiceResult(res, await mentorService.getMentorById(req.params.id));
});

export const updateMentorPlaceholder = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Profile update not implemented yet' });
});
