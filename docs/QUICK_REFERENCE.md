# Quick Reference Guide

Fast lookup for common tasks, troubleshooting, and development patterns.

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Start backend (development)
npm run dev:server

# Start frontend (development)
npm run dev:client

# Start backend (production)
npm start

# Build frontend for production
npm run build
```

---

## 📂 File Organization

| Location | Purpose | Files |
|----------|---------|-------|
| `/server/index.js` | Backend entry point | Express + Socket.io setup |
| `/server/controllers/` | Business logic | auth, mentor, request, chat |
| `/server/models/` | Database schemas | User, Profile, Request, Conversation, Message |
| `/server/routes/` | API endpoints | 24 total endpoints |
| `/server/middleware/` | Auth & validation | authMiddleware.js |
| `/client/pages/` | Full-page components | Dashboard, MentorFinder, ChatInterface, etc |
| `/client/components/` | Reusable components | MentorCard, Layout |
| `/client/services/` | API & WebSocket | apiService, socketService |
| `/client/context/` | Global state | AuthContext with useAuth hook |
| `/docs/` | Documentation | Setup, Architecture, API ref |

---

## 🔑 Key Concepts

### Authentication Flow
```
User Registers → Email validated (.edu) → Password hashed → Account created
    ↓
User Logs In → Credentials verified → JWT token issued (7 days)
    ↓
Token sent in Authorization header → authMiddleware validates → Request allowed
```

### Mentorship Workflow
```
Student searches mentors → Filter by industry/skills → Find match → Send request
    ↓
Mentor receives request → Reviews goal → Accepts → Conversation created automatically
    ↓
Both can chat in real-time (Socket.io) → Build mentor relationship
```

### Real-time Messaging
```
User types message → Socket.io sends instantly → Appears in other user's browser
User typing → Typing indicator sent → "User is typing..." shows
Message received → Read receipt sent back → Checkmark appears
```

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot GET /api/mentors"
**Problem**: Backend not running or wrong URL
```bash
Solution:
✓ npm run dev:server
✓ Check http://localhost:5000 responds
✓ Frontend should use VITE_API_URL=http://localhost:5000
```

### Issue: "MongoDB connection refused"
**Problem**: MongoDB not running
```bash
Solution:
✓ Start MongoDB: mongod
✓ Or: net start MongoDB (Windows)
✓ Verify: mongosh (should connect)
```

### Issue: "Cannot find module" in React
**Problem**: Wrong file path or missing extension
```bash
Solution:
✓ Use .jsx for React components: import from './MyComponent.jsx'
✓ Use .js for services: import from './services/apiService.jsx'
✓ Check relative paths: ../ for parent directory
```

### Issue: "Socket.io connection failed"
**Problem**: WebSocket not connecting
```bash
Checklist:
✓ Backend running on :5000
✓ VITE_SOCKET_URL=http://localhost:5000 set
✓ Firewall allows WebSocket
✓ Check browser console F12 → Network → WS
```

### Issue: "Messages not appearing"
**Problem**: Socket.io not connected or not in right room
```bash
Solution:
✓ Verify both users in same conversation
✓ Check browser console for errors
✓ Restart both browser and server
✓ Check MongoDB has data
```

### Issue: "Empty mentor list"
**Problem**: No mentors created or not visible
```bash
Checklist:
✓ Mentor profile must be completed (bio 50+ chars)
✓ Mentor must set "Accepting mentorship" = ON
✓ You must be logged in as STUDENT
✓ Check database: mentors exist with alumni role
```

---

## 🔐 Security Checklist

- ✅ Never commit `.env` file
- ✅ Always use `.env.example` template
- ✅ Change JWT_SECRET in production
- ✅ Use HTTPS in production (not HTTP)
- ✅ Validate all inputs server-side
- ✅ Never return passwords in API responses
- ✅ Use CORS correctly (specify allowed origins)
- ✅ Keep dependencies updated: `npm audit`

---

## 📊 API Endpoint Reference

### Quick Look
```
POST   /api/auth/register        - Create account
POST   /api/auth/login           - Get JWT token
GET    /api/auth/me              - Current user profile
GET    /api/mentors              - List all mentors
POST   /api/mentors/search       - Filter mentors
POST   /api/requests             - Send request
PUT    /api/requests/:id/accept  - Accept request (alumni)
GET    /api/chats/conversations  - Get conversations
POST   /api/chats/messages       - Send message
```

Full reference: [API_ENDPOINTS.md](./API_ENDPOINTS.md)

---

## 🧪 Testing Checklist

### Before Deploying
- [ ] Backend starts: `npm run dev:server` 
- [ ] Frontend starts: `npm run dev:client`
- [ ] Can register with .edu email
- [ ] Can login with credentials
- [ ] Can view mentors list
- [ ] Can send mentorship request
- [ ] Can accept request (as alumni)
- [ ] Real-time chat works
- [ ] Typing indicators work
- [ ] Read receipts work
- [ ] MongoDB connected
- [ ] No console errors (F12)
- [ ] All imports resolve
- [ ] API calls return data

---

## 🎯 Development Workflow

### Adding New Feature
```
1. Create controller function in server/controllers/
2. Add route in server/routes/
3. Test with Postman/curl
4. Create React component in client/pages/ or client/components/
5. Create service method in client/services/apiService.jsx
6. Connect component to API
7. Style with Tailwind CSS
8. Test end-to-end
```

### Debug Mode
```bash
# Backend: See all logs
NODE_ENV=development npm run dev:server

# Frontend: React DevTools
# Install: React Developer Tools browser extension

# Database: Check data
mongosh
> use alumni-mentorship-network
> db.users.find()
> db.conversations.find()
```

### Common Patterns

**Fetch data in React:**
```javascript
import { useEffect, useState } from 'react';
import { api } from '../services/apiService.jsx';

function MyComponent() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    api.get('/mentors').then(res => setData(res.data));
  }, []);
  
  return <div>{data?.length} mentors found</div>;
}
```

**Use auth context:**
```javascript
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { user, logout } = useAuth();
  
  if (!user) return <p>Not logged in</p>;
  return <p>Welcome, {user.firstName}!</p>;
}
```

**Real-time chat:**
```javascript
useEffect(() => {
  socketService.joinConversation(conversationId);
  
  socketService.onMessageReceived((message) => {
    setMessages(prev => [...prev, message]);
  });
  
  return () => socketService.leaveConversation(conversationId);
}, [conversationId]);
```

---

## 📚 Documentation Structure

| File | Use When |
|------|----------|
| [INDEX.md](./INDEX.md) | Starting out, need overview |
| [SETUP_GUIDE.md](./SETUP_GUIDE.md) | Installing and configuring  |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Understanding system design |
| [API_ENDPOINTS.md](./API_ENDPOINTS.md) | Integrating API calls |
| [DIRECTORY_STRUCTURE.md](./DIRECTORY_STRUCTURE.md) | Finding files, organization |
| [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) | Quick lookups (this file) |

---

## 🚀 Deployment Checklist

```bash
# Before going live:
[ ] npm install (production)
[ ] npm run build (build frontend)
[ ] Test: npm start & npm run dev:client
[ ] Check .env variables set
[ ] Verify MongoDB Atlas connection
[ ] Enable HTTPS
[ ] Configure CORS for production domain
[ ] Set up monitoring/logging
[ ] Run npm audit (fix vulnerabilities)
[ ] Create admin account
[ ] Backup database
[ ] Set up CI/CD if needed
```

---

## 💡 Pro Tips

**Speed up development:**
- Use VS Code REST Client extension for API testing
- Install React DevTools browser extension
- Use MongoDB Compass GUI for database viewing
- Set up auto-reload with nodemon

**Debug faster:**
- Use `console.log()` liberally during development
- Check browser DevTools Network tab for API calls
- Check MongoDB Compass to verify data saved
- Use browser DevTools Console for Socket.io debugging

**Keep code clean:**
- Use consistent naming: `getMentors`, `createRequest`, etc
- Comment complex logic
- Use .eslint if available
- Run tests regularly

---

**Last Updated**: February 17, 2026  
**Status**: Production Ready ✅
