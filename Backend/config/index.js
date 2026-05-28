/**
 * Centralized configuration — single source for env-derived values.
 */
export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  geminiRankTimeoutMs: 1500,
  messagePageSize: 80,
  messagePageMax: 150,
  resumeTextMaxLength: 200000,
  currentYear: new Date().getFullYear(),
};

export const { jwtSecret, jwtExpire, currentYear } = config;
