# Alumni Career Mentorship Network

MERN app connecting students with alumni mentors: real-time chat, mentorship requests, mentor search, and optional Gemini-powered ranking.

## Project layout

```
ACM/
├── Frontend/          # React + Vite → deploy on Vercel
│   ├── client/        # Pages, components, services
│   ├── index.html
│   └── package.json
├── Backend/           # Express + Socket.io → deploy on Render
│   ├── routes/
│   ├── models/
│   ├── controllers/
│   └── package.json
├── docs/              # Architecture & API docs
└── DEPLOYMENT.md      # GitHub, Vercel, Render steps
```

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
