import express from 'express';
import { auth } from '../middleware/authMiddleware.js';
import {
  getUnreadTotal,
  listConversations,
  getConversation,
  markConversationRead,
  getMessages,
  sendMessage,
  markMessageRead,
} from '../controllers/chatController.js';

const router = express.Router();

router.get('/unread-total', auth, getUnreadTotal);
router.get('/conversations', auth, listConversations);
router.get('/conversations/:conversationId', auth, getConversation);
router.put('/conversations/:conversationId/read', auth, markConversationRead);
router.get('/conversations/:conversationId/messages', auth, getMessages);
router.post('/messages', auth, sendMessage);
router.put('/messages/:messageId/read', auth, markMessageRead);

export default router;
