import express from 'express';
import cors from 'cors';
import './lib/loadEnv.js';
import { corsOrigin } from './lib/cors.js';
import { connectDB } from './lib/db.js';
import authRoutes from './routes/authRoutes.js';
import mentorRoutes from './routes/mentorRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import usersRoutes from './routes/usersRoutes.js';

const app = express();

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));

// Ensure DB is ready (critical for Vercel serverless cold starts).
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB middleware error:', err.message);
    res.status(503).json({ message: 'Database unavailable' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/users', usersRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    realtime: process.env.VERCEL ? 'rest-only' : 'socket.io',
  });
});

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
