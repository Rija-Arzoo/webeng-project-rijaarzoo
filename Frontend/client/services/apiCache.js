/** In-memory GET cache with TTL (used by apiService). */
const store = new Map();

export function getCached(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function setCached(key, data, ttlMs = 45_000) {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function invalidateCache(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
