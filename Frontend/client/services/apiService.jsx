/**
 * API Service for Alumni Mentorship Network
 * Handles all HTTP requests to the backend
 */

import { getCached, setCached, invalidateCache } from './apiCache.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const cachedGet = async (cacheKey, endpoint, ttlMs = 45000) => {
  const hit = getCached(cacheKey);
  if (hit) return hit;
  const data = await request(endpoint, { method: 'GET' });
  setCached(cacheKey, data, ttlMs);
  return data;
};

// Helper to get auth token
const getAuthToken = () => {
  const session = localStorage.getItem('alumni_session');
  if (session) {
    try {
      const { token } = JSON.parse(session);
      return token;
    } catch {
      return null;
    }
  }
  return null;
};

// Helper to make API requests
const request = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...options.headers,
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['x-auth-token'] = token;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * API Service exports
 */
export const api = {
  // ========== PUBLIC USERS ==========
  users: {
    getPublicProfile: async (userId) => {
      return request(`/users/${userId}/public`, { method: 'GET' });
    },
  },

  // ========== AUTHENTICATION ==========
  auth: {
    register: async (userData) => {
      return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },

    login: async (email, password) => {
      return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },

    forgotPasswordQuestions: async (email) => {
      return request('/auth/forgot-password/questions', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    resetPasswordWithSecurityQuestions: async (email, answers, newPassword) => {
      return request('/auth/forgot-password/reset', {
        method: 'POST',
        body: JSON.stringify({ email, answers, newPassword }),
      });
    },

    getMe: async () => {
      return request('/auth/me', {
        method: 'GET',
      });
    },

    updateProfile: async (profileData) => {
      return request('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
    },

    deleteMyAccount: async (password) => {
      return request('/auth/account', {
        method: 'DELETE',
        body: JSON.stringify({ password }),
      });
    },

    // Upload resume (PDF) and extract skills/insights on the backend
    uploadResume: async (resumeFile) => {
      const fd = new FormData();
      fd.append('resume', resumeFile);
      return request('/auth/resume', {
        method: 'POST',
        body: fd,
      });
    },
  },

  // ========== MENTORS ==========
  mentors: {
    getAll: async (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.industry) params.append('industry', filters.industry);
      if (filters.skill) params.append('skill', filters.skill);
      if (filters.search) params.append('search', filters.search);

      const queryString = params.toString();
      const endpoint = `/mentors${queryString ? '?' + queryString : ''}`;
      const cacheKey = `mentors:${queryString}`;
      return cachedGet(cacheKey, endpoint, 30000);
    },

    getById: async (mentorId) => {
      return request(`/mentors/${mentorId}`, { method: 'GET' });
    },

    search: async (industry, skills) => {
      return request('/mentors/search', {
        method: 'POST',
        body: JSON.stringify({ industry, skills }),
      });
    },

    toggleAvailability: async (isAcceptingMentorship) => {
      return request('/mentors/availability', {
        method: 'PUT',
        body: JSON.stringify({ isAcceptingMentorship }),
      });
    },
  },

  // ========== MENTORSHIP REQUESTS ==========
  requests: {
    send: async (mentorId, goalStatement) => {
      return request('/requests', {
        method: 'POST',
        body: JSON.stringify({ mentorId, goalStatement }),
      });
    },

    // Used by Dashboard.jsx
    getUserRequests: async (userId, role) => {
      const params = new URLSearchParams({
        userId: userId.toString(),
        role: role,
      });
      const qs = params.toString();
      const res = await cachedGet(`requests:${qs}`, `/requests?${qs}`, 20000);
      return res.requests || [];
    },

    // Used by Dashboard.jsx buttons
    updateStatus: async (requestId, status) => {
      const res = await request(`/requests/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      invalidateCache('requests:');
      return res;
    },

    getAll: async () => {
      return request('/requests', { method: 'GET' });
    },

    getById: async (requestId) => {
      return request(`/requests/${requestId}`, { method: 'GET' });
    },

    accept: async (requestId) => {
      return request(`/requests/${requestId}/accept`, {
        method: 'PUT',
      });
    },

    reject: async (requestId) => {
      return request(`/requests/${requestId}/reject`, {
        method: 'PUT',
      });
    },

    cancel: async (requestId) => {
      return request(`/requests/${requestId}`, {
        method: 'DELETE',
      });
    },
  },

  // ========== CHAT & MESSAGING ==========
  chats: {
    getUnreadTotal: async () => {
      return cachedGet('chats:unread', '/chats/unread-total', 15000);
    },

    // Conversations
    getConversations: async () => {
      return cachedGet('chats:conversations', '/chats/conversations', 12000);
    },

    getConversation: async (conversationId) => {
      return request(`/chats/conversations/${conversationId}`, {
        method: 'GET',
      });
    },

    createConversation: async (participantId) => {
      return request('/chats/conversations', {
        method: 'POST',
        body: JSON.stringify({ participantId }),
      });
    },

    markConversationAsRead: async (conversationId) => {
      return request(`/chats/conversations/${conversationId}/read`, {
        method: 'PUT',
      });
    },

    // Messages
    sendMessage: async (conversationId, text) => {
      const res = await request('/chats/messages', {
        method: 'POST',
        body: JSON.stringify({ conversationId, text }),
      });
      invalidateCache('chats:');
      return res.message || res;
    },

    invalidateChatCache: () => invalidateCache('chats:'),

    getMessages: async (conversationId, limit = 50, skip = 0) => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        skip: skip.toString(),
      });
      return request(
        `/chats/conversations/${conversationId}/messages?${params}`,
        { method: 'GET' }
      );
    },

    markMessageAsRead: async (messageId) => {
      return request(`/chats/messages/${messageId}/read`, {
        method: 'PUT',
      });
    },
  },
};

export default api;
