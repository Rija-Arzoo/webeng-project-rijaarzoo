const parseOrigins = (val) => {
  if (!val) return [];
  return val
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

const allowedOrigins = Array.from(
  new Set([
    ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
    ...parseOrigins(process.env.CLIENT_ORIGIN),
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
    'http://localhost:3000',
    'http://localhost:5173',
  ])
);

export const corsOrigin = (origin, callback) => {
  if (!origin) return callback(null, true);

  const isLocalhostAnyPort =
    /^http:\/\/localhost:\d+$/i.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/i.test(origin);

  const isVercelApp =
    /^https:\/\/[a-z0-9-]+(-[a-z0-9-]+)*\.vercel\.app$/i.test(origin);

  if (isLocalhostAnyPort || isVercelApp || allowedOrigins.includes(origin)) {
    return callback(null, true);
  }

  return callback(new Error(`CORS blocked origin: ${origin}`), false);
};
