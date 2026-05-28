import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  uploadResume,
  refreshResumeInsights,
  forgotPasswordQuestions,
  resetPasswordWithSecurityQuestions,
  deleteMyAccount,
} from '../controllers/authController.js';
import { auth } from '../middleware/authMiddleware.js';
import multer from 'multer';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password/questions', forgotPasswordQuestions);
router.post('/forgot-password/reset', resetPasswordWithSecurityQuestions);

// Protected routes
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);
router.delete('/account', auth, deleteMyAccount);

// Resume upload (PDF)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

router.post('/resume', auth, upload.single('resume'), uploadResume);
router.post('/resume/refresh', auth, refreshResumeInsights);

export default router;
