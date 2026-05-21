# Deployment Guide (GitHub + Vercel)

Both apps deploy on **Vercel** as two projects from the same repo.

| Project | Root directory | URL example |
|---------|----------------|-------------|
| Frontend | `Frontend` | `https://webeng-project-rijaarzoo.vercel.app` |
| Backend API | `Backend` | `https://your-api.vercel.app` |

> **Socket.io does not run on Vercel.** Chat uses the REST API (`POST /api/chats/messages`). Set `VITE_ENABLE_SOCKET=false` on the frontend in production.

---

## 1. Deploy Backend (Vercel)

1. [vercel.com](https://vercel.com) → **Add New Project** → import `Rija-Arzoo/webeng-project-rijaarzoo`
2. **Root Directory:** `Backend` ← required (not repo root)
3. **Framework:** Other (uses `api/index.js`)
4. **Environment variables** (Project → Settings → Environment Variables):

   | Key | Value |
   |-----|-------|
   | `MONGODB_URI` | MongoDB Atlas connection string |
   | `JWT_SECRET` | Long random secret (32+ chars) |
   | `FRONTEND_URL` | Your frontend Vercel URL |
   | `CLIENT_ORIGIN` | Same as `FRONTEND_URL` |
   | `GEMINI_API_KEY` | Optional |

   **Important:** `.env.local` is only for your computer. It is **not** uploaded to GitHub or Vercel. You must copy each variable into the Vercel dashboard manually.

5. **MongoDB Atlas:** Network Access → allow `0.0.0.0/0` (or Vercel will be blocked).
6. Deploy → copy URL, e.g. `https://webeng-api.vercel.app`
7. Test: `https://YOUR-BACKEND.vercel.app/api/health`  
   - `hasMongoUri: true` and `hasJwtSecret: true` means env is set correctly.

---

## 2. Deploy Frontend (Vercel)

1. **Add another project** from the same repo
2. **Root Directory:** `Frontend`
3. **Framework:** Vite
4. **Environment variables:**

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://YOUR-BACKEND.vercel.app/api` |
   | `VITE_ENABLE_SOCKET` | `false` |
   | `VITE_GEMINI_API_KEY` | Optional |

5. Deploy

Do **not** set `VITE_SOCKET_URL` in production (real-time uses REST).

---

## 3. Local development

```bash
npm run install:all

# Terminal 1 — API + Socket.io (port 5000)
cd Backend
npm run dev

# Terminal 2 — UI (port 3000)
cd Frontend
npm run dev
```

`Frontend/.env.local` for local:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_ENABLE_SOCKET=true
```

---

## 4. Performance notes

Slowness was caused by:

- Sidebar polling **full conversations every 3 seconds** → now uses lightweight `/api/chats/unread-total` every 30s
- Dashboard **waiting for Gemini** before showing content → requests load first, AI tip loads in background
- Mentor list **waiting up to several seconds for Gemini ranking** → 2.5s server timeout, then default order
- Chat **double-saving** via REST + socket → socket when connected, REST on Vercel

First request after idle on Vercel may be slow (serverless cold start + MongoDB connect).

---

## Alternative: Render / Railway for backend

If you need **live Socket.io**, deploy `Backend/` on Render or Railway (`npm start`) and point `VITE_SOCKET_URL` + `VITE_ENABLE_SOCKET=true` at that URL.

See `render.yaml` at repo root for Render blueprint.
