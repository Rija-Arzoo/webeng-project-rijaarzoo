/**
 * Starts the API for Playwright full-stack tests.
 * Default: local MongoDB at mongodb://127.0.0.1:27017/alumni_mentorship_e2e
 * Set E2E_USE_MEMORY_MONGO=1 to use mongodb-memory-server (Linux/CI).
 * Or set MONGODB_URI to your own database.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, '..');

let mongoUri =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  'mongodb://127.0.0.1:27017/alumni_mentorship_e2e';

let mongod = null;

if (
  !process.env.MONGODB_URI &&
  !process.env.MONGO_URI &&
  process.env.E2E_USE_MEMORY_MONGO === '1'
) {
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    mongoUri = mongod.getUri();
    console.log('E2E: using in-memory MongoDB');
  } catch (err) {
    console.warn('E2E: in-memory MongoDB failed, falling back to local:', err.message);
  }
} else {
  console.log(`E2E: using MongoDB (${mongoUri})`);
}

const child = spawn(process.execPath, ['scripts/e2e-server.mjs'], {
  cwd: backendRoot,
  env: {
    ...process.env,
    MONGODB_URI: mongoUri,
    JWT_SECRET: process.env.JWT_SECRET || 'e2e-test-secret',
    PORT: '5000',
    NODE_ENV: 'test',
  },
  stdio: 'inherit',
});

let stopping = false;

async function shutdown(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  if (child.pid) child.kill('SIGTERM');
  if (mongod) await mongod.stop();
  process.exit(exitCode);
}

process.on('SIGINT', () => shutdown(130));
process.on('SIGTERM', () => shutdown(0));

child.on('exit', (code) => {
  if (!stopping) shutdown(code ?? 1);
});
