import express from 'express';
import cors from 'cors';
import './lib/loadEnv.js';
import { corsOrigin } from './lib/cors.js';
import { connectDB } from './lib/db.js';
import { hasGeminiKey } from './lib/geminiConfig.js';
import authRoutes from './routes/authRoutes.js';
import mentorRoutes from './routes/mentorRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import usersRoutes from './routes/usersRoutes.js';

const app = express();

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));

// Health + root — no database required (works even if MongoDB env is missing).
app.get('/', (req, res) => {
  res.json({
    name: 'Alumni Mentorship API',
    health: '/api/health',
    docs: 'Set Vercel env: MONGODB_URI, JWT_SECRET, FRONTEND_URL',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    realtime: process.env.VERCEL ? 'rest-only' : 'socket.io',
    config: {
      hasMongoUri: Boolean(process.env.MONGODB_URI || process.env.MONGO_URI),
      hasJwtSecret: Boolean(process.env.JWT_SECRET),
      hasGeminiKey: hasGeminiKey(),
      nodeEnv: process.env.NODE_ENV || 'development',
    },
  });
});

// All other routes need MongoDB.
app.use(async (req, res, next) => {
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
});

app.use('/api/auth', authRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/users', usersRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

export default app;
