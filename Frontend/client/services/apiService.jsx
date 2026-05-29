/**
 * API Service — local dev uses Vite proxy `/api`; production uses VITE_API_URL from Vercel.
 */

import { API_BASE_URL } from './apiConfig.js';
import { getCached, setCached, invalidateCache, cachedGetSWR } from './apiCache.js';
import { dedupeRequest } from './requestDedupe.js';

const REQUEST_TIMEOUT_MS = 35_000;

const getAuthToken = () => {
  try {
    return JSON.parse(localStorage.getItem('alumni_session') || '{}').token || null;
  } catch {
    return null;
  }
};

const request = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = { ...options.headers };

  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers['x-auth-token'] = token;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      cache: 'no-store',
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('Invalid response from server');
    }

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(
        'Request timed out. Start the backend: cd Backend && npm run dev'
      );
    }
    if (error instanceof TypeError) {
      throw new Error(
        import.meta.env.DEV
          ? 'Cannot reach API. Run backend on port 5000 (cd Backend && npm run dev) and use VITE_API_URL=/api in Frontend/.env.local'
          : 'Network error — check API URL and that the backend is deployed.'
      );
    }
    throw error;
  }
};

export const api = {
  users: {
    getPublicProfile: (userId) => request(`/users/${userId}/public`, { method: 'GET' }),
  },

  auth: {
    register: (userData) =>
      request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    login: (email, password) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    forgotPasswordQuestions: (email) =>
      request('/auth/forgot-password/questions', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    resetPasswordWithSecurityQuestions: (email, answers, newPassword) =>
      request('/auth/forgot-password/reset', {
        method: 'POST',
        body: JSON.stringify({ email, answers, newPassword }),
      }),
    getMe: () => request('/auth/me', { method: 'GET' }),
    updateProfile: (profileData) =>
      request('/auth/profile', { method: 'PUT', body: JSON.stringify(profileData) }),
    deleteMyAccount: (password) =>
      request('/auth/account', { method: 'DELETE', body: JSON.stringify({ password }) }),
    uploadResume: (resumeFile) => {
      const fd = new FormData();
      fd.append('resume', resumeFile);
      return request('/auth/resume', { method: 'POST', body: fd });
    },
    refreshResumeInsights: () =>
      request('/auth/resume/refresh', { method: 'POST', body: JSON.stringify({}) }),
  },

  mentors: {
    getAll: async (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.industry) params.append('industry', filters.industry);
      if (filters.skill) params.append('skill', filters.skill);
      if (filters.search) params.append('search', filters.search);
      const queryString = params.toString();
      const endpoint = `/mentors${queryString ? `?${queryString}` : ''}`;
      const cacheKey = `mentors:${queryString}`;
      return dedupeRequest(cacheKey, () =>
        cachedGetSWR(cacheKey, () => request(endpoint, { method: 'GET' }), 120_000)
      );
    },
    getById: (mentorId) => request(`/mentors/${mentorId}`, { method: 'GET' }),
    search: (industry, skills) =>
      request('/mentors/search', {
        method: 'POST',
        body: JSON.stringify({ industry, skills }),
      }),
    toggleAvailability: (isAcceptingMentorship) =>
      request('/mentors/availability', {
        method: 'PUT',
        body: JSON.stringify({ isAcceptingMentorship }),
      }),
  },

  requests: {
    send: async (mentorId, goalStatement) => {
      const res = await request('/requests', {
        method: 'POST',
        body: JSON.stringify({ mentorId, goalStatement }),
      });
      invalidateCache('requests:');
      return res;
    },

    getUserRequests: () =>
      dedupeRequest('requests:list', () =>
        cachedGetSWR('requests:list', () => request('/requests', { method: 'GET' }), 90_000)
      ).then((data) => data.requests || []),

    updateStatus: async (requestId, status) => {
      const res = await request(`/requests/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      invalidateCache('requests:');
      return res;
    },

    getAll: () => request('/requests', { method: 'GET' }),
    getById: (requestId) => request(`/requests/${requestId}`, { method: 'GET' }),
    accept: (requestId) => request(`/requests/${requestId}/accept`, { method: 'PUT' }),
    reject: (requestId) => request(`/requests/${requestId}/reject`, { method: 'PUT' }),
    cancel: async (requestId) => {
      const res = await request(`/requests/${requestId}`, { method: 'DELETE' });
      invalidateCache('requests:');
      return res;
    },
  },

  chats: {
    getUnreadTotal: () =>
      cachedGetSWR('chats:unread', () => request('/chats/unread-total', { method: 'GET' }), 45_000),

    getConversations: ({ fresh = false } = {}) => {
      const cacheKey = 'chats:conversations';
      if (fresh) {
        return request('/chats/conversations', { method: 'GET' }).then((data) => {
          setCached(cacheKey, data, 30_000);
          return data;
        });
      }
      return cachedGetSWR(
        cacheKey,
        () => request('/chats/conversations', { method: 'GET' }),
        30_000
      );
    },

    getConversation: (conversationId) =>
      request(`/chats/conversations/${conversationId}`, { method: 'GET' }),

    createConversation: (participantId) =>
      request('/chats/conversations', {
        method: 'POST',
        body: JSON.stringify({ participantId }),
      }),

    markConversationAsRead: (conversationId) =>
      request(`/chats/conversations/${conversationId}/read`, { method: 'PUT' }),

    sendMessage: async (conversationId, text) => {
      const res = await request('/chats/messages', {
        method: 'POST',
        body: JSON.stringify({ conversationId, text }),
      });
      invalidateCache('chats:');
      return res.message || res;
    },

    invalidateChatCache: () => invalidateCache('chats:'),

    getMessages: (conversationId, limit = 30, skip = 0) => {
      const params = new URLSearchParams({ limit: String(limit), skip: String(skip) });
      const cacheKey = `chats:messages:${conversationId}:${limit}:${skip}`;
      return cachedGetSWR(
        cacheKey,
        () =>
          request(`/chats/conversations/${conversationId}/messages?${params}`, {
            method: 'GET',
          }),
        20_000
      );
    },

    markMessageAsRead: (messageId) =>
      request(`/chats/messages/${messageId}/read`, { method: 'PUT' }),
  },
};

export default api;
