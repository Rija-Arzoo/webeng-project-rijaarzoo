import express from 'express';
import { auth } from '../middleware/authMiddleware.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import { avatarUrl } from '../lib/avatar.js';
import { USER_REQUEST_SENDER_FIELDS } from '../lib/userSelect.js';

const router = express.Router();

// Get mentorship requests for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const { userId, userRole } = req;

    const filter = userRole === 'alumni'
      ? { mentorId: userId }
      : { studentId: userId };

    const requests = await MentorshipRequest.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // Populate sender (the "other side")
    const senderIds = requests.map((r) =>
      userRole === 'alumni' ? r.studentId : r.mentorId
    );

    const senders = await User.find({ _id: { $in: senderIds } })
      .select(USER_REQUEST_SENDER_FIELDS)
      .lean();

    const senderById = new Map(
      senders.map((u) => [
        u._id.toString(),
        {
          ...u,
          profilePicture: avatarUrl(u.profilePicture, u._id.toString()),
        },
      ])
    );

    const formatted = requests.map((r) => {
      const senderId = (userRole === 'alumni' ? r.studentId : r.mentorId).toString();
      return {
        id: r._id.toString(),
        topic: r.goal,
        status: r.status,
        sender: senderById.get(senderId) || null,
      };
    });

    res.set('Cache-Control', 'private, max-age=15');
    res.json({ success: true, requests: formatted });
  } catch (err) {
    console.error('Get requests error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create mentorship request (student -> mentor)
router.post('/', auth, async (req, res) => {
  try {
    const { mentorId } = req.body;
    const goalStatement = req.body.goalStatement || req.body.message;

    if (!mentorId || !goalStatement) {
      return res.status(400).json({ message: 'mentorId and goalStatement are required' });
    }

    const currentUser = await User.findById(req.userId).select('role');
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    // Trust the latest role from DB (JWT can become stale after role transitions).
    if (currentUser.role !== 'student') {
      return res.status(403).json({ message: 'Only students can create mentorship requests' });
    }

    const mentor = await User.findById(mentorId).select('role');
    if (!mentor) return res.status(404).json({ message: 'Mentor not found' });
    if (mentor.role !== 'alumni') return res.status(400).json({ message: 'Invalid mentor role' });

    const request = await MentorshipRequest.create({
      mentorId,
      studentId: req.userId,
      goal: goalStatement,
      status: 'pending',
    });

    res.json({
      success: true,
      message: 'Request sent',
      requestId: request._id.toString(),
    });
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update request status (alumni accept/reject)
router.put('/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['accepted', 'rejected'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await MentorshipRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (req.userRole !== 'alumni') {
      return res.status(403).json({ message: 'Only alumni can update request status' });
    }
    if (request.mentorId.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    request.status = status;
    await request.save();

    // If accepted, create a conversation between student and mentor.
    if (status === 'accepted') {
      const participants = [request.mentorId, request.studentId];
      const existing = await Conversation.findOne({
        participants: { $all: participants },
      }).lean();

      if (!existing) {
        await Conversation.create({
          participants,
          lastMessage: '',
          lastMessageAt: new Date(),
        });
      }
    }

    res.json({ success: true, message: 'Request updated', requestId: request._id.toString() });
  } catch (err) {
    console.error('Update request error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete/cancel request (student can delete pending requests)
router.delete('/:id', auth, async (req, res) => {
  try {
    const request = await MentorshipRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be cancelled' });
    }

    const isStudentOwner = request.studentId.toString() === req.userId.toString();
    const isMentorOwner = request.mentorId.toString() === req.userId.toString();

    if (!isStudentOwner && !isMentorOwner) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    if (isStudentOwner && req.userRole === 'student') {
      await request.deleteOne();
      return res.json({ success: true, message: 'Request cancelled' });
    }

    if (isMentorOwner && req.userRole === 'alumni') {
      await request.deleteOne();
      return res.json({ success: true, message: 'Request deleted' });
    }

    return res.status(403).json({ message: 'Not allowed' });
  } catch (err) {
    console.error('Cancel request error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
