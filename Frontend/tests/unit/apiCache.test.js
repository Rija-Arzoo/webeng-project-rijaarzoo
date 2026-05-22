import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCached, setCached, invalidateCache } from '../../client/services/apiCache.js';

describe('apiCache', () => {
  beforeEach(() => {
    invalidateCache('');
  });

  it('returns cached data before TTL expires', () => {
    setCached('mentors:all', [{ id: 'm1' }], 60_000);
    expect(getCached('mentors:all')).toEqual([{ id: 'm1' }]);
  });

  it('returns null after TTL and clears entries by prefix', () => {
    vi.useFakeTimers();
    setCached('requests:u1', { ok: true }, 100);
    vi.advanceTimersByTime(150);
    expect(getCached('requests:u1')).toBeNull();

    setCached('requests:a', 1, 60_000);
    setCached('chats:b', 2, 60_000);
    invalidateCache('requests:');
    expect(getCached('requests:a')).toBeNull();
    expect(getCached('chats:b')).toBe(2);
    vi.useRealTimers();
  });
});
