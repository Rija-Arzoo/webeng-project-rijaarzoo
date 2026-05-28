import { connectDB } from '../lib/db.js';

/**
 * Ensures MongoDB is connected before handling API routes (skipped for health checks).
 */
export const requireDatabase = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB middleware error:', err.message);
    res.status(503).json({
      message: 'Database unavailable',
      hint: 'Check MONGODB_URI in Vercel → Settings → Environment Variables',
    });
  }
};
