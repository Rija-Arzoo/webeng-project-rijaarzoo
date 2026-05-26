import express from 'express';
import { auth } from '../middleware/authMiddleware.js';
import {
  listRequests,
  createRequest,
  updateRequestStatus,
  cancelRequest,
} from '../controllers/requestController.js';

const router = express.Router();

router.get('/', auth, listRequests);
router.post('/', auth, createRequest);
router.put('/:id', auth, updateRequestStatus);
router.delete('/:id', auth, cancelRequest);

export default router;
