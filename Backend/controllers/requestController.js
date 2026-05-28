import { asyncHandler } from '../utils/asyncHandler.js';
import { sendServiceResult } from '../utils/httpResponse.js';
import { requestService } from '../services/requestService.js';

export const listRequests = asyncHandler(async (req, res) => {
  sendServiceResult(res, await requestService.listForUser(req.userId, req.userRole));
});

export const createRequest = asyncHandler(async (req, res) => {
  sendServiceResult(res, await requestService.createRequest(req.userId, req.body));
});

export const updateRequestStatus = asyncHandler(async (req, res) => {
  sendServiceResult(
    res,
    await requestService.updateStatus(req.params.id, req.userId, req.userRole, req.body.status)
  );
});

export const cancelRequest = asyncHandler(async (req, res) => {
  sendServiceResult(
    res,
    await requestService.cancelRequest(req.params.id, req.userId, req.userRole)
  );
});
