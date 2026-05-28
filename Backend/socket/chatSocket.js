import { persistMessage } from '../services/persistMessage.js';

/**
 * Registers real-time chat handlers on a Socket.io server instance.
 */
export function registerChatSocket(io) {
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    socket.on('user_connect', (userId) => {
      socket.join(`user_${userId}`);
    });

    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
    });

    socket.on('send_message', (data) => {
      const { conversationId, senderId, text, timestamp, clientTempId } = data;

      (async () => {
        try {
          const { conversation, payload } = await persistMessage({
            conversationId,
            senderId,
            text,
          });

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
            ...payload,
            clientTempId: clientTempId || null,
            timestamp,
            socketId: socket.id,
          });
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

    socket.on('user_typing', (data) => {
      const { conversationId, userId, isTyping } = data;
      io.to(`conversation_${conversationId}`).emit('user_typing', { userId, isTyping });
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });
}
