import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Vercel injects env from Project Settings — .env.local is never uploaded (gitignored).
if (!process.env.VERCEL) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const backendRoot = path.resolve(__dirname, '..');
  dotenv.config({
    path: [path.join(backendRoot, '.env.local'), path.join(backendRoot, '.env')],
  });
}
