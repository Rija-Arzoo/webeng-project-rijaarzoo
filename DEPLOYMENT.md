# Deployment Guide (GitHub + Vercel + Render)

## What lives at the repo root (`ACM/`)

| Item | Purpose |
|------|---------|
| `package.json` | Convenience scripts only (`install:all`, `dev:frontend`, `test:e2e`, …) — **no** `node_modules` here |
| `.gitignore` | Repo-wide ignores (env files, Playwright output, `dist/`) |
| `README.md`, `DEPLOYMENT.md`, `render.yaml` | Docs and Render blueprint |
| `docs/` | Architecture and API documentation |
| `Frontend/` | Full Vite app + Playwright e2e tests |
| `Backend/` | Express API + Vitest unit tests |

**Not at root:** `.env.local`, `playwright.config.js`, `playwright-report/`, `test-results/`, or app `package-lock.json` paths — those belong under `Frontend/` or `Backend/`.

---

This repo is split into two deployable apps:

| Folder | Platform | Purpose |
|--------|----------|---------|
| `Frontend/` | [Vercel](https://vercel.com) | React + Vite UI |
| `Backend/` | [Render](https://render.com) | Express API + Socket.io |

## 1. Push to GitHub

```bash
git init
git add .
git commit -m "Split Frontend and Backend for Vercel and Render"
git branch -M main
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

## 2. Deploy Backend on Render

1. **New → Web Service** → connect your GitHub repo.
2. **Root Directory**: `Backend`
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`
5. **Environment variables** (from `Backend/.env.example`):

   | Key | Example |
   |-----|---------|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | Long random secret (32+ chars) |
   | `FRONTEND_URL` | `https://your-app.vercel.app` |
   | `CLIENT_ORIGIN` | `https://your-app.vercel.app` |
   | `GEMINI_API_KEY` | Optional, for AI mentor ranking |

6. Deploy and copy your service URL, e.g. `https://alumni-mentorship-api.onrender.com`.

Health check: `GET /api/health`

You can also use the included `render.yaml` blueprint at the repo root.

## 3. Deploy Frontend on Vercel

1. **New Project** → import the same GitHub repo.
2. **Root Directory**: `Frontend`
3. **Framework Preset**: Vite (auto-detected)
4. **Environment variables**:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://YOUR-RENDER-URL.onrender.com/api` |
   | `VITE_SOCKET_URL` | `https://YOUR-RENDER-URL.onrender.com` |
   | `VITE_GEMINI_API_KEY` | Optional |

5. Deploy.

`Frontend/vercel.json` configures the Vite build and SPA fallback.

## 4. Local development

```bash
# Install both apps
npm run install:all

# Terminal 1 — API (port 5000)
cd Backend
cp .env.example .env.local
# Edit MONGODB_URI and JWT_SECRET
npm run dev

# Terminal 2 — UI (port 3000)
cd Frontend
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000

## 5. After first deploy

1. Set Render `FRONTEND_URL` / `CLIENT_ORIGIN` to your **production** Vercel URL.
2. Redeploy Render if you change CORS origins.
3. Confirm WebSocket chat works (Render free tier may sleep; first request can be slow).
