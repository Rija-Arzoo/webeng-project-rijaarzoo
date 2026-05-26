import { asyncHandler } from '../utils/asyncHandler.js';
import { sendServiceResult } from '../utils/httpResponse.js';
import { chatService } from '../services/chatService.js';

export const getUnreadTotal = asyncHandler(async (req, res) => {
  sendServiceResult(res, await chatService.getUnreadTotal(req.userId));
});

export const listConversations = asyncHandler(async (req, res) => {
  sendServiceResult(res, await chatService.listConversations(req.userId));
});

export const getConversation = asyncHandler(async (req, res) => {
  sendServiceResult(res, await chatService.getConversation(req.params.conversationId, req.userId));
});

export const markConversationRead = asyncHandler(async (req, res) => {
  sendServiceResult(
    res,
    await chatService.markConversationRead(req.params.conversationId, req.userId)
  );
});

export const getMessages = asyncHandler(async (req, res) => {
  sendServiceResult(
    res,
    await chatService.getMessages(req.params.conversationId, req.userId, req.query)
  );
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId, text } = req.body || {};
  sendServiceResult(res, await chatService.sendMessage(conversationId, req.userId, text));
});

export const markMessageRead = asyncHandler(async (req, res) => {
  sendServiceResult(res, await chatService.markMessageRead(req.params.messageId, req.userId));
});
