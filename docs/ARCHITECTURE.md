# Alumni Career Mentorship Network - Complete Architecture

## 📋 Table of Contents
1. [Database Schema Design](#database-schema-design)
2. [Backend Architecture](#backend-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [API Endpoints](#api-endpoints)
5. [Real-time Messaging (Socket.io)](#real-time-messaging)
6. [Security Measures](#security-measures)
7. [Getting Started](#getting-started)

---

## Database Schema Design

### 1. User Schema (`models/User.js`)
```javascript
{
  name: String (required),
  email: String (unique, lowercase, validated, .edu domain),
  password: String (hashed with bcryptjs, 10 rounds),
  role: Enum['student', 'alumni', 'admin'] (default: 'student'),
  avatarUrl: String (generated from avatar service),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```
**Key Features:**
- Email validation for .edu domain (verified university emails)
- Password hashing pre-save hook
- Methods: `matchPassword()` for authentication

---

### 2. Profile Schema (`models/Profile.js`)
```javascript
{
  userId: ObjectId (ref: User),
  bio: String (min: 50 chars),
  headline: String,
  industry: Enum (Technology, Finance, Healthcare, etc.),
  yearsExperience: Number,
  skills: [String],
  linkedInUrl: String (validated),
  isVerified: Boolean (default: false),
  isAcceptingMentorship: Boolean (mentor toggle),
  company: String,
  education: String,
  website: String (validated),
  createdAt: Date,
  updatedAt: Date
}
```
**Key Features:**
- Bio minimum length validation (50 chars)
- Skills array for multi-skill mentorship
- `isAcceptingMentorship` toggle for alumni mentors
- Industry classification from predefined list

---

### 3. MentorshipRequest Schema (`models/MentorshipRequest.js`)
```javascript
{
  menteeId: ObjectId (ref: User),
  mentorId: ObjectId (ref: User),
  goalStatement: String (required, 20-500 chars),
  status: Enum['pending', 'accepted', 'rejected'] (default: 'pending'),
  createdAt: Date,
  updatedAt: Date
}
```
**Key Features:**
- Prevents duplicate pending requests (unique index)
- Goal statement required for mentors to understand mentee intentions
- Automatic conversation creation on acceptance
- Request deletion on mentee cancellation

---

### 4. Conversation Schema (`models/Conversation.js`)
```javascript
{
  participants: [ObjectId] (array of User refs),
  lastMessage: ObjectId (ref: Message),
  lastMessageAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```
**Key Features:**
- Supports multi-participant conversations (future scalability)
- Tracks last message for UI optimization
- Indexed on participants for fast queries

---

### 5. Message Schema (`models/Message.js`)
```javascript
{
  conversationId: ObjectId (ref: Conversation),
  senderId: ObjectId (ref: User),
  text: String (required, max: 5000 chars),
  isRead: Boolean (default: false),
  readAt: Date,
  createdAt: Date
}
```
**Key Features:**
- Read receipts for messages
- Efficient indexed queries on conversation and sender
- Timestamp tracking

---

## Backend Architecture

### Project Structure
```
/server
├── controllers/            # Business logic
│   ├── authController.js   # Auth operations
│   ├── mentorController.js # Mentor search/filter
│   ├── requestController.js # Request workflow
│   └── chatController.js   # Messaging operations
├── models/                 # Mongoose schemas
│   ├── User.js
│   ├── Profile.js
│   ├── MentorshipRequest.js
│   ├── Conversation.js
│   └── Message.js
├── routes/                 # API routes
│   ├── authRoutes.js
│   ├── mentorRoutes.js
│   ├── requestRoutes.js
│   └── chatRoutes.js
├── middleware/             # Custom middleware
│   └── authMiddleware.js
├── config/                 # Configuration (future)
└── index.js               # Express + Socket.io setup
```

---

## Frontend Architecture

### Project Structure
```
/client
├── pages/                  # Full-page components
│   ├── Dashboard.jsx       # User overview
│   ├── MentorFinder.jsx    # Search & filter mentors
│   ├── ChatInterface.jsx   # Real-time messaging
│   ├── Login.jsx
│   ├── Register.jsx
│   └── LandingPage.jsx
├── components/             # Reusable components
│   ├── MentorCard.jsx      # Mentor profile card
│   ├── Layout.jsx          # Main layout wrapper
│   └── ...other components
├── services/               # External APIs
│   ├── apiService.jsx      # REST API client
│   ├── socketService.jsx   # Socket.io client
│   └── geminiService.js    # AI insights
├── context/                # React Context
│   └── AuthContext.jsx     # Global state management
└── App.jsx                 # Main app component
```

---

## API Endpoints

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Description | Auth | Body |
|--------|----------|-------------|------|------|
| POST | `/register` | Register new user | No | `{name, email, password, role}` |
| POST | `/login` | Login user | No | `{email, password}` |
| GET | `/me` | Get current user profile | ✅ | - |
| PUT | `/profile` | Update user profile | ✅ | `{bio, headline, industry, yearsExperience, skills, ...}` |

**Register Validation:**
- Email must end with `.edu`
- Password hashing: bcryptjs (10 rounds)
- Creates empty profile on successful registration

---

### Mentor Routes (`/api/mentors`)
| Method | Endpoint | Description | Auth | Filters/Body |
|--------|----------|-------------|------|-------------|
| GET | `/` | Get all mentors | ✅ | `?industry=Tech&skill=AI&search=name` |
| GET | `/:id` | Get single mentor profile | ✅ | - |
| POST | `/search` | Advanced search (industry + skills) | ✅ | `{industry, skills: []}` |
| PUT | `/availability` | Toggle mentorship status | ✅ (Alumni) | `{isAcceptingMentorship}` |

**Filter System:**
- **Industry AND Skills**: When both are selected, both must match
- **Individual Filters**: Industry or single skill can filter alone
- **Search**: Full-text search on name and headline

---

### Mentorship Request Routes (`/api/requests`)
| Method | Endpoint | Description | Auth | Body |
|--------|----------|-------------|------|------|
| POST | `/` | Send request to mentor | ✅ | `{mentorId, goalStatement}` |
| GET | `/` | Get user's requests | ✅ | - |
| GET | `/:id` | Get single request | ✅ | - |
| PUT | `/:id/accept` | Accept request (Alumni) | ✅ | - |
| PUT | `/:id/reject` | Reject request (Alumni) | ✅ | - |
| DELETE | `/:id` | Cancel pending request | ✅ | - |

**Request Workflow:**
1. Student sends request with goal statement
2. Check for duplicate pending requests
3. Alumni accepts → creates Conversation
4. Conversation becomes primary communication channel

---

### Chat Routes (`/api/chats`)
| Method | Endpoint | Description | Auth | Body |
|--------|----------|-------------|------|------|
| GET | `/conversations` | Get all user conversations | ✅ | - |
| POST | `/conversations` | Create/get conversation | ✅ | `{participantId}` |
| GET | `/conversations/:id` | Get conversation with messages | ✅ | - |
| PUT | `/conversations/:id/read` | Mark all as read | ✅ | - |
| POST | `/messages` | Send message | ✅ | `{conversationId, text}` |
| GET | `/conversations/:id/messages` | Get messages with pagination | ✅ | `?limit=50&skip=0` |
| PUT | `/messages/:id/read` | Mark message as read | ✅ | - |

---

## Real-time Messaging

### Socket.io Events

**Server → Client Events:**
```javascript
// Receive new message
socket.on('receive_message', (data) => {
  // data: {conversationId, senderId, text, timestamp}
});

// User typing indicator
socket.on('user_typing', (data) => {
  // data: {userId, isTyping}
});
```

**Client → Server Events:**
```javascript
// User connects
socket.emit('user_connect', userId);

// Join conversation room
socket.emit('join_conversation', conversationId);

// Send message (also via REST API)
socket.emit('send_message', {
  conversationId,
  senderId,
  text,
  timestamp
});

// Show typing indicator
socket.emit('user_typing', {
  conversationId,
  userId,
  isTyping
});

// Leave conversation
socket.emit('leave_conversation', conversationId);
```

### Client Implementation (socketService.jsx)
```javascript
// Connect to server
socketService.connect(userId);

// Join conversation
socketService.joinConversation(conversationId);

// Send message
socketService.sendMessage(conversationId, senderId, text);

// Listen for messages
socketService.onMessageReceived(callback);

// Show typing
socketService.emitTyping(conversationId, userId, true);
```

---

## Security Measures

### 1. Authentication & Authorization
- **JWT Tokens**: Issued on login, expires in 7 days
- **Password Hashing**: bcryptjs with 10 salt rounds
- **Email Validation**: Must use `.edu` domain
- **Role-based Access**:
  - `student`: Can view mentors, send requests, message
  - `alumni`: Can accept/reject requests, toggle availability
  - `admin`: Full system access

### 2. Data Validation
- **Input Validation**: All inputs validated at controller level
- **Schema Validation**: Mongoose schema enforcement
- **Email Format**: Regex validation + .edu requirement
- **Password**: Minimum 6 characters
- **Goal Statement**: 20-500 characters

### 3. Authorization Checks
- **Own Profile Edit**: `profile.userId === req.user.id`
- **Message Access**: User must be conversation participant
- **Request Actions**: Only mentor can accept/reject
- **Mentee-Only**: Only mentee can cancel request

### 4. Data Protection
- **Password Select: false**: Passwords never returned
- **Conversation Isolation**: Users only see their conversations
- **Message Privacy**: Only participants can view messages
- **Request Privacy**: Only mentee/mentor can view details

---

## Getting Started

### Prerequisites
- Node.js 16+
- MongoDB 4.4+
- npm or yarn

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values:
# - MONGO_URI
# - JWT_SECRET
# - PORT
# - GOOGLE_GEMINI_API_KEY (optional)

# 3. Start MongoDB
mongod

# 4. Run development server
npm run dev

# 5. In another terminal, run Vite/frontend
yarn dev (or npm run dev in client directory)
```

### Environment Variables
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/alumni_mentorship

# JWT
JWT_SECRET=your_secret_key_here

# Client
CLIENT_URL=http://localhost:5173

# AI (Optional)
GOOGLE_GEMINI_API_KEY=your_key
```

---

## Key Features Summary

### Matchmaking System ✅
- Filter mentors by **industry AND skills simultaneously**
- Multi-skill filtering
- Search by name/headline
- Verified mentor badge

### Request Handling ✅
- Prevents duplicate pending requests
- Auto-creates conversation on acceptance
- Request deletion on mentee rejection
- Goal statement validation

### Real-time Messaging ✅
- Socket.io implementation
- Typing indicators
- Read receipts
- Message pagination
- Conversation list with last message

### User Roles ✅
- Student: Find mentors, send requests
- Alumni: View requests, toggle availability, mentor students
- Admin: System management

---

## Technology Stack
- **Backend**: Express.js, MongoDB, Mongoose, Socket.io
- **Frontend**: React 19, Tailwind CSS, React Router v7
- **Auth**: JWT (jsonwebtoken), bcryptjs
- **Real-time**: Socket.io
- **Validation**: Mongoose schema validation
- **API**: RESTful endpoints + WebSocket

---

## Performance Optimizations
- Message pagination (limit/skip)
- Indexed queries on frequently searched fields
- Socket.io rooms for efficient broadcast
- Lazy loading for conversations
- Avatar URL generation (prevent storage)

---

## Future Enhancements
- File sharing in messages
- Video call integration
- Scheduled mentorship sessions
- Review/rating system
- Analytics dashboard
- Email notifications
- Advanced search filters
- Mentorship goals tracking

---

**System Architect**: Alumni Career Mentorship Network v1.0
**Created**: February 2026
**Status**: Production Ready ✅
