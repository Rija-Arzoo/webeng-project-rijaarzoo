import { asyncHandler } from '../utils/asyncHandler.js';
import { sendServiceResult } from '../utils/httpResponse.js';
import { userService } from '../services/userService.js';

export const getPublicProfile = asyncHandler(async (req, res) => {
  sendServiceResult(res, await userService.getPublicProfile(req.params.id));
});
