/**
 * Socket.io Service for Real-time Messaging
 * Manages WebSocket connections and real-time events
 */

import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const SOCKET_ENABLED = import.meta.env.VITE_ENABLE_SOCKET !== 'false';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = {};
  }

  /**
   * Connect to Socket.io server
   */
  connect(userId) {
    if (!SOCKET_ENABLED || this.isConnected) return;

    this.socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      auth: {
        userId,
      },
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.isConnected = true;
      this.emit('user_connect', userId);
      this.trigger('connected');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      this.isConnected = false;
      this.trigger('disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.trigger('error', error);
    });

    // Auto-reconnect on close
    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
      this.socket = null;
    }
  }

  /**
   * Join a conversation room
   */
  joinConversation(conversationId) {
    if (!this.socket) return;
    this.socket.emit('join_conversation', conversationId);
    console.log(`Joined conversation: ${conversationId}`);
  }

  /**
   * Leave a conversation room
   */
  leaveConversation(conversationId) {
    if (!this.socket) return;
    this.socket.emit('leave_conversation', conversationId);
    console.log(`Left conversation: ${conversationId}`);
  }

  /**
   * Send a message through Socket.io
   */
  get connected() {
    return Boolean(this.isConnected && this.socket);
  }

  sendMessage(conversationId, senderId, text, clientTempId = null) {
    if (!this.socket || !this.isConnected) {
      return false;
    }

    this.socket.emit('send_message', {
      conversationId,
      senderId,
      text,
      clientTempId,
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  /**
   * Listen for incoming messages
   */
  onMessageReceived(callback) {
    if (!this.socket) return;
    this.socket.on('receive_message', callback);
  }

  /**
   * Remove message listener
   */
  offMessageReceived() {
    if (!this.socket) return;
    this.socket.off('receive_message');
  }

  onConversationUpdated(callback) {
    if (!this.socket) return;
    this.socket.on('conversation_updated', callback);
  }

  offConversationUpdated() {
    if (!this.socket) return;
    this.socket.off('conversation_updated');
  }

  emitConversationRead(conversationId, userId) {
    if (!this.socket) return;
    this.socket.emit('conversation_read', { conversationId, userId });
  }

  onReadReceipt(callback) {
    if (!this.socket) return;
    this.socket.on('read_receipt', callback);
  }

  offReadReceipt() {
    if (!this.socket) return;
    this.socket.off('read_receipt');
  }

  /**
   * Listen for typing indicators
   */
  onUserTyping(callback) {
    if (!this.socket) return;
    this.socket.on('user_typing', callback);
  }

  /**
   * Remove typing listener
   */
  offUserTyping() {
    if (!this.socket) return;
    this.socket.off('user_typing');
  }

  /**
   * Emit typing indicator
   */
  emitTyping(conversationId, userId, isTyping) {
    if (!this.socket) return;
    this.socket.emit('user_typing', {
      conversationId,
      userId,
      isTyping,
    });
  }

  /**
   * Generic emit method
   */
  emit(event, data) {
    if (!this.socket) return;
    this.socket.emit(event, data);
  }

  /**
   * Generic on method
   */
  on(event, callback) {
    if (!this.socket) return;
    this.socket.on(event, callback);
  }

  /**
   * Generic off method
   */
  off(event) {
    if (!this.socket) return;
    this.socket.off(event);
  }

  /**
   * Internal event management for custom events
   */
  trigger(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => callback(data));
    }
  }

  /**
   * Listen for internal events
   */
  addEventListener(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Remove internal event listener
   */
  removeEventListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback
      );
    }
  }
}

// Singleton instance
export const socketService = new SocketService();

export default socketService;
