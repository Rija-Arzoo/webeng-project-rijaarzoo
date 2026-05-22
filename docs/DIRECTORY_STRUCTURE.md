# 📁 Directory Structure Reference

Professional project organization for Alumni Mentorship Network.

```
alumni-mentorship-network/
│
├── 📄 index.html                 # Vite entry point (frontend)
├── 📄 index.jsx                  # React app entry (frontend)
├── 📄 index.tsx                  # TypeScript variant (frontend)
├── 📄 package.json               # Project dependencies & scripts
├── 📄 tsconfig.json              # TypeScript configuration
├── 📄 vite.config.ts             # Vite build configuration
├── 📄 server.js                  # [LEGACY - see server/index.js]
├── 📄 .gitignore                 # Git ignore patterns
├── 📄 .env.example               # Environment template
├── 📄 README.md                  # Main project documentation
├── 📄 metadata.json              # Project metadata
│
├── 📁 server/                    # Backend (Express.js + Node.js)
│   ├── 📄 index.js               # Main server entry point ⭐
│   │
│   ├── 📁 routes/                # API route definitions (4 files)
│   │   ├── authRoutes.js         # POST register, login, GET me, PUT profile
│   │   ├── mentorRoutes.js       # GET mentors, search, availability
│   │   ├── requestRoutes.js      # Mentorship request lifecycle
│   │   └── chatRoutes.js         # Conversations & messaging
│   │
│   ├── 📁 controllers/           # Business logic (4 files)
│   │   ├── authController.js     # Auth logic: register, login, profile
│   │   ├── mentorController.js   # Mentor discovery & filtering
│   │   ├── requestController.js  # Request workflow: send, accept, reject
│   │   └── chatController.js     # Messaging: send, retrieve, mark read
│   │
│   ├── 📁 models/                # Mongoose schemas (5 files)
│   │   ├── User.js               # User account & auth
│   │   ├── Profile.js            # Additional profile info
│   │   ├── MentorshipRequest.js  # Request tracking
│   │   ├── Conversation.js       # Chat room tracking
│   │   └── Message.js            # Message storage
│   │
│   ├── 📁 middleware/            # Express middleware (1 file)
│   │   └── authMiddleware.js     # JWT verification & protection
│   │
│   └── 📁 config/                # Configuration modules (empty - future)
│       ├── database.js           # [Future] MongoDB connection
│       └── socket.js             # [Future] Socket.io handlers
│
├── 📁 client/                    # Frontend (React + Vite)
│   ├── 📄 App.jsx                # Main React app component
│   │
│   ├── 📁 pages/                 # Page components (6 files)
│   │   ├── LandingPage.jsx       # Public home page
│   │   ├── Register.jsx          # Sign-up form
│   │   ├── Login.jsx             # Sign-in form
│   │   ├── Dashboard.jsx         # User dashboard
│   │   ├── MentorFinder.jsx      # Mentor search & filter
│   │   ├── ChatInterface.jsx     # Real-time messaging UI
│   │   └── Login.tsx             # [Variant] TypeScript version
│   │
│   ├── 📁 components/            # Reusable UI components (3 files)
│   │   ├── Layout.jsx            # Main layout wrapper
│   │   └── MentorCard.jsx        # Mentor profile card
│   │
│   ├── 📁 context/               # React context providers (1 file)
│   │   └── AuthContext.jsx       # Global auth state & useAuth hook
│   │
│   ├── 📁 services/              # API & WebSocket clients (5 files)
│   │   ├── apiService.jsx        # REST API client (24 endpoints)
│   │   ├── api.jsx               # [Variant] Alternative API client
│   │   ├── api.jsx               # [Duplicate] To be removed
│   │   ├── socketService.jsx     # Socket.io WebSocket client
│   │   ├── geminiService.js      # [Future] AI service
│   │   ├── geminiService.jsx     # [Variant] AI service (React)
│   │   ├── geminiService.ts      # [Variant] AI service (TypeScript)
│   │   └── mockBackend.ts        # Mock backend for development
│   │
│   └── 📁 hooks/                 # Custom React hooks (future)
│       └── useAuth.js            # [Future] Auth hook
│
├── 📁 docs/                      # 📚 Documentation (4 markdown files)
│   ├── 📄 INDEX.md               # Documentation homepage ⭐
│   ├── 📄 ARCHITECTURE.md        # System design & database schema
│   ├── 📄 SETUP_GUIDE.md         # Installation & setup
│   ├── 📄 IMPLEMENTATION_SUMMARY.md # Features checklist
│   ├── 📄 QUICK_REFERENCE.md     # Developer quick reference
│   └── 📄 API_ENDPOINTS.md       # Complete API documentation (24 endpoints)
│
├── 📁 public/                    # Static assets
│   └── 📁 images/                # Image files (placeholder)
│
├── 📁 controllers/               # [LEGACY - see server/controllers/]
├── 📁 models/                    # [LEGACY - see server/models/]
├── 📁 middleware/                # [LEGACY - see server/middleware/]
├── 📁 routes/                    # [LEGACY - see server/routes/]
├── 📁 components/                # [LEGACY - see client/components/]
├── 📁 context/                   # [LEGACY - see client/context/]
├── 📁 pages/                     # [LEGACY - see client/pages/]
├── 📁 services/                  # [LEGACY - see client/services/]
│
└── 📁 node_modules/              # Dependencies (git ignored)
```

## 📊 Directory Statistics

| Directory | Type | Purpose | Files |
|-----------|------|---------|-------|
| `server/` | Backend | Express API server | ~15 |
| `client/` | Frontend | React application | ~20 |
| `docs/` | Documentation | Setup & architecture | 6 |
| `public/` | Assets | Static files | - |

## 🎯 Key Entry Points

### Backend
- **Entry Point**: `server/index.js` ⭐
- **Start Command**: `npm start` or `npm run dev:server`
- **Port**: 5000
- **Database**: MongoDB (local or Atlas)

### Frontend
- **Entry Point**: `index.html` (served by Vite)
- **App Root**: `client/App.jsx`
- **Start Command**: `npm run dev:client`
- **Port**: 5173
- **Build**: `npm run build`

## 📂 Organization Principles

### 1. **Server Structure** (`/server`)
```
server/
├── index.js           # Bootstrap & middleware setup
├── routes/            # Endpoint definitions
├── controllers/       # Business logic
├── models/            # Database schemas
├── middleware/        # Auth & validation
└── config/            # Configuration modules
```

**Why?** Clear separation of concerns:
- Routes define endpoints
- Controllers implement logic
- Models define data structure
- Middleware handles cross-cutting concerns

### 2. **Client Structure** (`/client`)
```
client/
├── App.jsx            # Root component
├── pages/             # Page-level components
├── components/        # Reusable components
├── context/           # Global state
├── services/          # API & WebSocket
└── hooks/             # Custom React hooks
```

**Why?** Standard React patterns:
- Pages for routing
- Components for UI reusability
- Context for state management
- Services for external communication

### 3. **Models Organization** (`/server/models`)
Each file = one data model:
- `User.js` → User authentication & account
- `Profile.js` → Extended profile info
- `MentorshipRequest.js` → Request tracking
- `Conversation.js` → Chat rooms
- `Message.js` → Messages

**Why?** Easy to find, modify, and test individual schemas

### 4. **Controllers Organization** (`/server/controllers`)
One controller per resource/feature:
- `authController.js` → Auth operations (4 methods)
- `mentorController.js` → Mentor operations (4 methods)
- `requestController.js` → Request operations (5 methods)
- `chatController.js` → Chat operations (3+ methods)

**Why?** Logical grouping by feature domain

### 5. **Routes Organization** (`/server/routes`)
One route file per controller:
- `authRoutes.js` → Auth endpoints (4 routes)
- `mentorRoutes.js` → Mentor endpoints (4 routes)
- `requestRoutes.js` → Request endpoints (6 routes)
- `chatRoutes.js` → Chat endpoints (10 routes)

**Why?** Easy to maintain HTTP methods and URL patterns

## 🔄 Data Flow

```
User Request
    ↓
[index.html - Vite entry]
    ↓
client/App.jsx [React Root]
    ↓
    ├→ client/pages/* [Page Components]
    │   ↓
    │   └→ client/components/* [UI Components]
    │       ↓
    │       └→ client/services/apiService.jsx [REST API]
    │           ↓
    │           └→ server/index.js [Express Server]
    │               ↓
    │               └→ server/routes/* [Route Handlers]
    │                   ↓
    │                   └→ server/controllers/* [Business Logic]
    │                       ↓
    │                       └→ server/models/* [Database]
    │
    └→ client/services/socketService.jsx [WebSocket]
        ↓
        └→ server/index.js [Socket.io Server]
            ↓
            └→ Real-time messaging
```

## 🚨 Legacy Directories (To Be Removed)

The following directories at root level are **LEGACY** and have been moved:

| Legacy | New Location | Status |
|--------|--------------|--------|
| `/controllers` | `/server/controllers` | Use new location |
| `/models` | `/server/models` | Use new location |
| `/middleware` | `/server/middleware` | Use new location |
| `/routes` | `/server/routes` | Use new location |
| `/components` | `/client/components` | Use new location |
| `/context` | `/client/context` | Use new location |
| `/pages` | `/client/pages` | Use new location |
| `/services` | `/client/services` | Use new location |
| `server.js` | `server/index.js` | Use new entry point |

🗑️ **To Clean Up**: These can be deleted after verifying all imports are updated.

## 📝 File Naming Conventions

### Backend Files
- `*.js` - JavaScript files
- PascalCase for models: `User.js`, `Profile.js`
- camelCase for controllers: `authController.js`
- camelCase for routes: `authRoutes.js`

### Frontend Files
- `*.jsx` - React components
- `*.ts` / `*.tsx` - TypeScript variants
- PascalCase for components: `MentorCard.jsx`
- camelCase for services: `apiService.jsx`

### Documentation Files
- `*.md` - Markdown documentation
- UPPERCASE for main docs: `README.md`, `ARCHITECTURE.md`
- descriptive names: `SETUP_GUIDE.md`

## 🔐 Protected Directories

**Git Ignored** (sensitive data):
- `node_modules/` - Dependencies
- `.env` / `.env.local` - Secrets (never commit!)
- `.DS_Store`, `Thumbs.db` - OS files
- `dist/`, `build/` - Build outputs

✅ **Safe to Commit**:
- `.env.example` - Template only
- All source files
- Documentation

## 📦 Total File Counts

**Backend**: ~15 files
- 1 entry point
- 4 route files
- 4 controller files
- 5 model files
- 1 middleware file
- Future config files

**Frontend**: ~20+ files
- 1 app root
- 6 pages
- 3+ components
- 1 context
- 5+ services
- Future hooks

**Documentation**: 6 files
- INDEX.md, ARCHITECTURE.md, SETUP_GUIDE.md, QUICK_REFERENCE.md, IMPLEMENTATION_SUMMARY.md, API_ENDPOINTS.md

**Configuration**: 5 files
- package.json, tsconfig.json, vite.config.ts, .gitignore, .env.example

**Total**: ~50+ files (excluding node_modules and build artifacts)

## 🎓 Learning Path

1. **Start Here**: [docs/INDEX.md](../docs/INDEX.md)
2. **Setup**: [docs/SETUP_GUIDE.md](../docs/SETUP_GUIDE.md)
3. **Architecture**: [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
4. **Development**: [docs/QUICK_REFERENCE.md](../docs/QUICK_REFERENCE.md)
5. **API**: [docs/API_ENDPOINTS.md](../docs/API_ENDPOINTS.md)

---

**Last Updated**: February 17, 2024  
**Status**: Professional structure ✅  
**Production Ready**: Yes 🟢
