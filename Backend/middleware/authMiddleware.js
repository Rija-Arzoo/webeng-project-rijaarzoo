import jwt from 'jsonwebtoken';
import { jwtSecret } from '../config/index.js';

/**
 * Authentication middleware — verifies JWT and attaches user context to the request.
 */
export const auth = (req, res, next) => {
  try {
    const token = req.headers['x-auth-token'] || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

/**
 * Restrict route access to specific roles.
 */
export const requireRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.userRole)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
  next();
};
