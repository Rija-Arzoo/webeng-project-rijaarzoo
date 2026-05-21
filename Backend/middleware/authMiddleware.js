import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export const auth = (req, res, next) => {
  try {
    // Get token from headers
    const token = req.headers['x-auth-token'] || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
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
 * Check if user has specific role
 */
export const requireRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.userRole)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
  next();
};
