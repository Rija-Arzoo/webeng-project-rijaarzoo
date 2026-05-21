import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { auth } from '../../middleware/authMiddleware.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

describe('auth middleware', () => {
  it('returns 401 when no token is provided', () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = vi.fn();

    auth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'No token, authorization denied' });
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches user info and calls next for a valid token', () => {
    const token = jwt.sign(
      { userId: 'user-123', email: 'test@university.edu', role: 'student' },
      JWT_SECRET,
      { expiresIn: '1h' },
    );
    const req = { headers: { 'x-auth-token': token } };
    const res = mockRes();
    const next = vi.fn();

    auth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.userId).toBe('user-123');
    expect(req.userEmail).toBe('test@university.edu');
    expect(req.userRole).toBe('student');
  });
});
