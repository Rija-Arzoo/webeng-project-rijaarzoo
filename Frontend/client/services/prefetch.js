import { api } from './apiService.jsx';
import { writeRequestsSessionCache } from '../utils/requestList.js';
import { writeMentorsSessionCache } from '../utils/mentorCache.js';
import { dedupeRequest } from './requestDedupe.js';

export function prefetchAfterLogin(user) {
  if (!user?.id) return;

  dedupeRequest('prefetch:requests', async () => {
    const list = await api.requests.getUserRequests();
    writeRequestsSessionCache(user.id, user.role, list);
    return list;
  }).catch(() => {});

  if (user.role === 'student') {
    dedupeRequest('prefetch:mentors', async () => {
      const res = await api.mentors.getAll({});
      writeMentorsSessionCache('', res);
      return res;
    }).catch(() => {});
  }

  dedupeRequest('prefetch:chats', () => api.chats.getConversations()).catch(() => {});
}
