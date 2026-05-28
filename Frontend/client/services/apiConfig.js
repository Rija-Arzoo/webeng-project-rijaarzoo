/**
 * API base URL for local dev vs Vercel production.
 * In dev, defaults to Vite proxy `/api` → localhost:5000 (avoids CORS + "Failed to fetch").
 */
export function resolveApiBase() {
  const configured = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');

  if (import.meta.env.DEV) {
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/api$/i.test(configured)) {
      return configured;
    }
    if (configured === '/api') {
      return '/api';
    }
    if (configured && !configured.startsWith('http')) {
      return configured.startsWith('/') ? configured : `/${configured}`;
    }
    return '/api';
  }

  return configured || '/api';
}

export const API_BASE_URL = resolveApiBase();
