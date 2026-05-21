# Alumni Career Mentorship Network - Setup & Installation Guide

## 🚀 Project Overview

The **Alumni Career Mentorship Network** is a comprehensive MERN (MongoDB, Express, React, Node.js) application that connects students with experienced alumni mentors. It features real-time messaging with Socket.io, advanced mentor filtering by industry and skills, and a complete mentorship workflow.

### Key Features
✅ User registration with .edu email validation
✅ Mentor discovery with industry + skills filtering
✅ Mentorship request system with goal statements
✅ Real-time messaging with Socket.io
✅ Typing indicators and read receipts
✅ Role-based access control (student, alumni, admin)
✅ Password hashing (bcryptjs)
✅ JWT authentication
✅ Responsive UI with Tailwind CSS

---

## 📦 Tech Stack

### Backend
- **Framework**: Express.js 5.x
- **Database**: MongoDB 4.4+
- **ODM**: Mongoose 9.x
- **Real-time**: Socket.io 4.7.x
- **Auth**: JWT (jsonwebtoken), bcryptjs
- **Utilities**: dotenv, cors

### Frontend
- **Framework**: React 19.x
- **Routing**: React Router v7
- **Styling**: Tailwind CSS 3
- **Real-time**: Socket.io-client 4.7.x
- **Build Tool**: Vite 6.x

---

## 🛠️ Installation & Setup

### Step 1: Prerequisites
Ensure you have installed:
- **Node.js** 16.x or higher (Download from [nodejs.org](https://nodejs.org/))
- **MongoDB** 4.4+ (Download from [mongodb.com](https://www.mongodb.com/))
- **npm** (comes with Node.js)

### Step 2: Clone or Extract the Project
```bash
cd "path/to/ACM"
```

### Step 3: Install Dependencies
```bash
# Install all dependencies (both backend and frontend)
npm install
```

### Step 4: Environment Setup

#### Create `.env.local` file in the root directory:
```env
# ============ SERVER ============
PORT=5000
NODE_ENV=development

# ============ DATABASE ============
MONGO_URI=mongodb://localhost:27017/alumni_mentorship

# ============ JWT ============
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# ============ CLIENT ============
CLIENT_URL=http://localhost:5173

# ============ API ============
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# ============ OPTIONAL: AI ============
GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key
```

### Step 5: Start MongoDB
```bash
# Windows - If installed as service
# MongoDB should start automatically

# Or start manually:
mongod --dbpath "C:\path\to\your\data\directory"

# Verify MongoDB is running
# Visit: mongodb://localhost:27017 (should connect)
```

### Step 6: Start the Backend Server
```bash
npm start
# or use nodemon for auto-restart
npm run dev:server
```

You should see:
```
🚀 ==========================================
   Alumni Mentorship Network Server
   Running on: http://localhost:5000
   Environment: development
🚀 ==========================================
✅ MongoDB Connected
```

### Step 7: Start the Frontend Server (in a new terminal)
```bash
npm run dev:client
```

The frontend will be available at: **http://localhost:5173**

---

## 📁 Project Structure

The project uses a professional, modular structure:

```
ACM/
├── server/               # Backend (Express.js)
│   ├── models/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   └── index.js          # Entry point
│
├── client/               # Frontend (React)
│   ├── pages/
│   ├── components/
│   ├── services/
│   ├── context/
│   └── App.jsx
│
├── docs/                 # Documentation
│   ├── INDEX.md
│   ├── ARCHITECTURE.md
│   ├── API_ENDPOINTS.md
│   └── ...
│
└── public/               # Static assets
```

For detailed structure, see [DIRECTORY_STRUCTURE.md](./DIRECTORY_STRUCTURE.md)

---

## 🔑 Database Models

### User Model
```javascript
{
  name: String,
  email: String (unique, .edu domain required),
  password: String (hashed),
  role: String ("student", "alumni", "admin"),
  avatarUrl: String,
  isActive: Boolean,
  createdAt: Date
}
```

### Profile Model
```javascript
{
  userId: ObjectId (ref: User),
  bio: String (min 50 chars),
  headline: String,
  industry: String (Technology, Finance, etc.),
  yearsExperience: Number,
  skills: [String],
  linkedInUrl: String,
  isVerified: Boolean,
  isAcceptingMentorship: Boolean,
  company: String
}
```

### MentorshipRequest Model
```javascript
{
  menteeId: ObjectId (ref: User),
  mentorId: ObjectId (ref: User),
  goalStatement: String (20-500 chars),
  status: String ("pending", "accepted", "rejected"),
  createdAt: Date
}
```

### Conversation & Message Models
- Store participant relationships and messages
- Support read receipts and typing indicators

---

## 🔌 API Endpoints

### Authentication (`/api/auth`)
```bash
POST   /api/auth/register        # Register new user
POST   /api/auth/login           # Login user
GET    /api/auth/me              # Get current user (protected)
PUT    /api/auth/profile         # Update profile (protected)
```

### Mentors (`/api/mentors`)
```bash
GET    /api/mentors              # Get all mentors with filters
GET    /api/mentors/:id          # Get single mentor
POST   /api/mentors/search       # Advanced search
PUT    /api/mentors/availability # Toggle mentorship (alumni)
```

### Mentorship Requests (`/api/requests`)
```bash
POST   /api/requests             # Send request
GET    /api/requests             # Get user's requests
GET    /api/requests/:id         # Get request details
PUT    /api/requests/:id/accept  # Accept request (alumni)
PUT    /api/requests/:id/reject  # Reject request (alumni)
DELETE /api/requests/:id         # Cancel request (mentee)
```

### Chat (`/api/chats`)
```bash
GET    /api/chats/conversations        # Get all conversations
POST   /api/chats/conversations        # Create conversation
GET    /api/chats/conversations/:id    # Get conversation
POST   /api/chats/messages             # Send message
GET    /api/chats/conversations/:id/messages  # Get messages
```

See [API_ENDPOINTS.md](./API_ENDPOINTS.md) for comprehensive endpoint documentation.

---

## 👥 Demo Accounts

After registration with `.edu` emails, you can create test accounts:

**Alumni Mentor:**
- Email: `mentor@university.edu`
- Password: `password123`
- Role: `alumni`

**Student:**
- Email: `student@university.edu`
- Password: `password123`
- Role: `student`

---

## 🧪 Testing the System

### Test Flow 1: Find & Request Mentorship
1. Login as **student**
2. Go to "Mentor Finder"
3. Filter by Industry and Skills
4. Click "Send Request" on a mentor
5. Fill in your goal statement (min 20 chars)
6. Submit request

### Test Flow 2: Accept Request & Chat
1. Login as **alumni**
2. Go to Dashboard → "Pipeline"
3. View pending requests
4. Click "Accept" button
5. Chat window will open automatically
6. Start messaging!

### Test Flow 3: Real-time Messaging
1. Both users in chat window
2. Type message → click send
3. Message appears immediately (via Socket.io)
4. Typing indicator shows when other user types
5. Read receipts show message status

---

## 🔒 Security Features

✅ **Password Hashing**: bcryptjs (10 rounds)
✅ **JWT Authentication**: Tokens expire in 7 days
✅ **Email Validation**: Must use `.edu` domain
✅ **Input Validation**: All inputs validated server-side
✅ **Authorization Checks**: Role and ownership verification
✅ **CORS**: Configured for frontend safety
✅ **No Password in Responses**: Password field excluded

---

## 🚨 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Make sure MongoDB is running
```bash
# Windows
net start MongoDB

# Or start manually
mongod
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Change PORT in `.env.local`
```env
PORT=5001  # Use different port
```

### Import Errors in Frontend
```
Error: Cannot find module './services/api.js'
```
**Solution**: Use `.jsx` extension instead of `.js` for React files
```javascript
import { api } from '../services/apiService.jsx';
```

### Socket.io Connection Failed
```
Socket connection error
```
**Solution**: Check that:
1. Backend server is running on port 5000
2. `VITE_SOCKET_URL=http://localhost:5000` is set
3. Firewall allows WebSocket connections

---

## 📝 Development Tips

### Adding a New API Endpoint
1. Create controller function in `server/controllers/`
2. Add route to `server/routes/`
3. Import route in `server/index.js`
4. Test with REST client (Postman, Thunder Client)

### Adding a New React Component
1. Create in `client/pages/` or `client/components/`
2. Use `useAuth()` hook for user data
3. Use `api` service for API calls
4. Style with Tailwind CSS

### Debugging Backend
```javascript
// Add console logs
console.log('Request received:', req.body);

// Check user ID
console.log('User ID:', req.user.id);

// Verify database operations
console.log('Saved to DB:', savedDocument);
```

### Debugging Frontend
```javascript
// React DevTools
// Check component state
console.log('Auth context:', user);

// Check API responses
console.log('API response:', response);

// Check socket events
socketService.on('message', (data) => console.log('Message:', data));
```

---

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Socket.io Guide](https://socket.io/docs/v4/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)

---

## 🤝 Contributing

Feel free to submit issues or improvements! The codebase follows these conventions:

- **Controller functions**: Named by action (getUser, createRequest, etc.)
- **Routes**: Grouped by resource (auth, mentors, requests, chats)
- **Components**: Functional components with hooks
- **Styling**: Tailwind CSS utility classes

---

## 📄 License

This project is for educational purposes.

---

## 🎯 Project Status

✅ **Complete MERN Stack Implementation**
✅ **Real-time Messaging with Socket.io**
✅ **Advanced Mentor Filtering**
✅ **Authentication & Authorization**
✅ **Production-Ready Code**

---

## 📞 Support

If you encounter issues:
1. Check the [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design
2. Review error messages in browser console
3. Check backend server logs for API errors
4. Verify MongoDB connection
5. Use browser DevTools to inspect network requests
6. Read [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for common solutions

---

**Last Updated**: February 17, 2026
**Version**: 1.0 - Production Ready ✅

Happy mentoring! 🚀
