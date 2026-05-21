import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import routes
import authRoutes from './routes/authRoutes.js';
import mentorRoutes from './routes/mentorRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import usersRoutes from './routes/usersRoutes.js';
import Message from './models/Message.js';
import Conversation from './models/Conversation.js';

// Load environment variables from the Backend folder.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = __dirname;
dotenv.config({
  path: [path.join(backendRoot, '.env.local'), path.join(backendRoot, '.env')],
});

const app = express();
const httpServer = createServer(app);

// Allow multiple frontend origins (dev often runs on different ports).
const parseOrigins = (val) => {
  if (!val) return [];
  return val
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

const allowedOrigins = Array.from(
  new Set([
    ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
    ...parseOrigins(process.env.CLIENT_ORIGIN),
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
    // Hardcoded dev fallbacks
    'http://localhost:3000',
    'http://localhost:5173',
  ])
);

const corsOrigin = (origin, callback) => {
  // Requests without an Origin header (e.g. server-to-server) are allowed.
  if (!origin) return callback(null, true);

  const isLocalhostAnyPort =
    /^http:\/\/localhost:\d+$/i.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/i.test(origin);

  const isVercelApp =
    /^https:\/\/[a-z0-9-]+(-[a-z0-9-]+)*\.vercel\.app$/i.test(origin);

  if (isLocalhostAnyPort || isVercelApp || allowedOrigins.includes(origin)) {
    return callback(null, true);
  }

  return callback(new Error(`CORS blocked origin: ${origin}`), false);
};

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));
// Large payloads: profile pictures as data URLs or long CDN URLs, resume metadata, etc.
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));

// Database Connection
const connectDB = async () => {
  try {
    // Support both `MONGO_URI` and `MONGODB_URI` to match different env templates.
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      'mongodb://localhost:27017/alumni_mentorship';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected:', mongoUri);
  } catch (err) {
    console.error('❌ DB Connection Error:', err.message);
    process.exit(1);
  }
};

connectDB();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/users', usersRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Socket.io Real-time Messaging
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // Join user to their personal room
  socket.on('user_connect', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their personal room`);
  });

  // Join conversation room
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  });

  // Send message
  socket.on('send_message', (data) => {
    const { conversationId, senderId, text, timestamp, clientTempId } = data;

    // Persist message + update conversation, then broadcast to all users.
    (async () => {
      try {
        const messageDoc = await Message.create({
          conversationId,
          senderId,
          text,
          readBy: [{ userId: senderId, readAt: new Date() }]
        });

        const conversation = await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: text,
          lastMessageSenderId: senderId,
          lastMessageAt: new Date(),
        }, { new: true }).lean();

        // Notify each participant room for unread badge + list ordering updates.
        const participantIds = (conversation?.participants || []).map((p) => p.toString());
        participantIds.forEach((pid) => {
          io.to(`user_${pid}`).emit('conversation_updated', {
            conversationId,
            lastMessage: text,
            lastMessageSenderId: senderId,
            lastMessageAt: new Date().toISOString(),
          });
        });

        io.to(`conversation_${conversationId}`).emit('receive_message', {
          _id: messageDoc._id.toString(),
          conversationId,
          senderId,
          text,
          createdAt: messageDoc.createdAt,
          readBy: [{ userId: senderId, readAt: new Date() }],
          clientTempId: clientTempId || null,
          timestamp,
          socketId: socket.id
        });
        return;
      } catch (err) {
        console.error('Socket persist message error:', err);
      }
    })();
  });

  socket.on('conversation_read', ({ conversationId, userId }) => {
    if (!conversationId || !userId) return;
    io.to(`conversation_${conversationId}`).emit('read_receipt', {
      conversationId,
      userId,
      readAt: new Date().toISOString(),
    });
  });

  // Typing indicator
  socket.on('user_typing', (data) => {
    const { conversationId, userId, isTyping } = data;
    io.to(`conversation_${conversationId}`).emit('user_typing', {
      userId,
      isTyping
    });
  });

  // Leave conversation
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conversation_${conversationId}`);
    console.log(`Socket ${socket.id} left conversation ${conversationId}`);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });

  // Error handling
  socket.on('error', (error) => {
    console.error(`Socket error: ${error}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`
🚀 ==========================================
   Alumni Mentorship Network Server
   Running on: http://localhost:${PORT}
   Environment: ${process.env.NODE_ENV || 'development'}
🚀 ==========================================
  `);
});

export { io };
