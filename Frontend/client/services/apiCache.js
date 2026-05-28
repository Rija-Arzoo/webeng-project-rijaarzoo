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

export function getCachedStale(key) {
  return store.get(key)?.data ?? null;
}

export function setCached(key, data, ttlMs = 45_000) {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function invalidateCache(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/** Return cached data immediately; refresh in background when stale. */
export async function cachedGetSWR(key, fetcher, ttlMs = 45_000) {
  const fresh = getCached(key);
  if (fresh) {
    fetcher()
      .then((data) => setCached(key, data, ttlMs))
      .catch(() => {});
    return fresh;
  }

  const stale = getCachedStale(key);
  if (stale) {
    fetcher()
      .then((data) => setCached(key, data, ttlMs))
      .catch(() => {});
    return stale;
  }

  const data = await fetcher();
  setCached(key, data, ttlMs);
  return data;
}
