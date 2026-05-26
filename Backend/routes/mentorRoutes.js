import express from 'express';
import { auth } from '../middleware/authMiddleware.js';
import {
  listMentors,
  getMentorById,
  updateMentorPlaceholder,
} from '../controllers/mentorController.js';

const router = express.Router();

router.get('/', auth, listMentors);
router.get('/:id', auth, getMentorById);
router.put('/:id', auth, updateMentorPlaceholder);

export default router;
