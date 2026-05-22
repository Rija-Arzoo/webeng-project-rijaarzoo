import mongoose from 'mongoose';
import './loadEnv.js';

let connectionPromise = null;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      'mongodb://localhost:27017/alumni_mentorship';

    connectionPromise = mongoose
      .connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
      })
      .then(async (conn) => {
        console.log('✅ MongoDB connected');
        await ensureIndexes();
        return conn;
      })
      .catch((err) => {
        connectionPromise = null;
        throw err;
      });
  }

  return connectionPromise;
}

async function ensureIndexes() {
  try {
    const { default: User } = await import('../models/User.js');
    const { default: Conversation } = await import('../models/Conversation.js');
    const { default: Message } = await import('../models/Message.js');
    const { default: MentorshipRequest } = await import('../models/MentorshipRequest.js');

    await Promise.all([
      User.collection.createIndex({ role: 1 }),
      User.collection.createIndex({ email: 1 }),
      Conversation.collection.createIndex({ participants: 1, updatedAt: -1 }),
      Message.collection.createIndex({ conversationId: 1, createdAt: -1 }),
      Message.collection.createIndex({ conversationId: 1, senderId: 1 }),
      MentorshipRequest.collection.createIndex({ studentId: 1, createdAt: -1 }),
      MentorshipRequest.collection.createIndex({ mentorId: 1, createdAt: -1 }),
    ]);
  } catch (err) {
    console.warn('Index setup warning:', err.message);
  }
}
