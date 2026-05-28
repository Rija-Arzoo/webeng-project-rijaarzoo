import express from 'express';
import { getPublicProfile } from '../controllers/usersController.js';

const router = express.Router();

router.get('/:id/public', getPublicProfile);

export default router;
