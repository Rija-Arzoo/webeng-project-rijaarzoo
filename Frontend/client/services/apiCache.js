const cache = new Map();

const DEFAULT_TTL_MS = 45_000;

export function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCached(key, data, ttlMs = DEFAULT_TTL_MS) {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

export function invalidateCache(prefix = '') {
  for (const key of cache.keys()) {
    if (!prefix || key.startsWith(prefix)) cache.delete(key);
  }
}
