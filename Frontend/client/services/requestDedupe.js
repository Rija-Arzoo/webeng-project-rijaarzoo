const inflight = new Map();

export function dedupeRequest(key, fetcher) {
  if (inflight.has(key)) return inflight.get(key);
  const promise = Promise.resolve(fetcher()).finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}
