/**
 * Resolve with `fallback` if `promise` exceeds `ms` milliseconds.
 */
export function withTimeout(promise, ms, fallback = null) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}
