# Alumni Career Mentorship Network

MERN app connecting students with alumni mentors: real-time chat, mentorship requests, mentor search, and optional Gemini-powered ranking.

## Project layout

```
ACM/
├── package.json       # Root scripts only (no node_modules here)
├── .gitignore         # Env files, Playwright output, dist/
├── Frontend/          # React + Vite → Vercel
│   ├── client/
│   ├── playwright.config.js
│   ├── tests/e2e/     # Playwright browser tests
│   ├── .env.example   # VITE_* variables
│   └── package.json
├── Backend/           # Express + Socket.io → Render
│   ├── tests/unit/    # Vitest
│   ├── .env.example
│   └── package.json
├── docs/
└── DEPLOYMENT.md
```

Copy `Backend/.env.example` → `Backend/.env.local` and `Frontend/.env.example` → `Frontend/.env.local` before running locally (these files are gitignored).

## Quick start (local)

**Prerequisites:** Node.js 18+, MongoDB

```bash
npm run install:all

# Backend (port 5000)
cd Backend
cp .env.example .env.local
# Set MONGODB_URI and JWT_SECRET
npm run dev

# Frontend (port 3000) — new terminal
cd Frontend
cp .env.example .env.local
npm run dev
```

- **UI:** http://localhost:3000  
- **API:** http://localhost:5000/api  

## Deploy

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for:

- GitHub push
- Render (backend) — root directory `Backend`
- Vercel (frontend) — root directory `Frontend`

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/INDEX.md](./docs/INDEX.md) | Documentation index |
| [docs/SETUP_GUIDE.md](./docs/SETUP_GUIDE.md) | Detailed setup |
| [docs/API_ENDPOINTS.md](./docs/API_ENDPOINTS.md) | API reference |

## Features

- JWT auth with role-based access (student / alumni)
- Mentor discovery and mentorship request workflow
- Real-time messaging (Socket.io)
- Resume upload and skill extraction
- Optional Gemini mentor ranking and dashboard insights
