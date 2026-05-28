import { asyncHandler } from '../utils/asyncHandler.js';
import { sendServiceResult } from '../utils/httpResponse.js';
import { authService } from '../services/authService.js';
import { profileService } from '../services/profileService.js';
import { resumeService } from '../services/resumeService.js';
import { passwordRecoveryService } from '../services/passwordRecoveryService.js';
import { accountDeletionService } from '../services/accountDeletionService.js';

export const register = asyncHandler(async (req, res) => {
  sendServiceResult(res, await authService.register(req.body));
});

export const login = asyncHandler(async (req, res) => {
  sendServiceResult(res, await authService.login(req.body));
});

export const getMe = asyncHandler(async (req, res) => {
  sendServiceResult(res, await profileService.getMe(req.userId));
});

export const updateProfile = asyncHandler(async (req, res) => {
  sendServiceResult(res, await profileService.updateProfile(req.userId, req.body));
});

export const uploadResume = asyncHandler(async (req, res) => {
  try {
    const result = await resumeService.uploadResume(
      req.userId,
      req.file?.buffer
    );
    sendServiceResult(res, result);
  } catch (err) {
    console.error('Resume upload error:', err);
    res.status(500).json({
      message:
        'Server error during resume processing: ' + (err?.message || String(err)),
      error: err?.message || String(err),
    });
  }
});

export const refreshResumeInsights = asyncHandler(async (req, res) => {
  try {
    sendServiceResult(res, await resumeService.refreshInsights(req.userId));
  } catch (err) {
    console.error('Resume insights refresh error:', err);
    res.status(500).json({
      message: 'Could not refresh resume insights: ' + (err?.message || String(err)),
    });
  }
});

export const forgotPasswordQuestions = asyncHandler(async (req, res) => {
  sendServiceResult(res, await passwordRecoveryService.getSecurityQuestions(req.body?.email));
});

export const resetPasswordWithSecurityQuestions = asyncHandler(async (req, res) => {
  sendServiceResult(res, await passwordRecoveryService.resetPassword(req.body));
});

export const deleteMyAccount = asyncHandler(async (req, res) => {
  sendServiceResult(res, await accountDeletionService.deleteAccount(req.userId, req.body?.password));
});
