# 🔌 API Endpoints Reference

Complete documentation of all 24 REST API endpoints in the Alumni Mentorship Network.

---

## 📋 Table of Contents

1. [Authentication Endpoints](#1-authentication-endpoints)
2. [Mentor Endpoints](#2-mentor-endpoints)
3. [Mentorship Request Endpoints](#3-mentorship-request-endpoints)
4. [Chat Endpoints](#4-chat-endpoints)
5. [Error Responses](#error-responses)
6. [Socket.io Events](#socketio-events)

---

## 1. Authentication Endpoints

Base URL: `/api/auth`

### Register (POST /register)
Create a new account.

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@university.edu",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student"
}
```

**Requirements:**
- Email must end with `.edu`
- Password minimum 8 characters
- Role: "student" | "alumni"
- firstName & lastName: 1-100 chars

**Success Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "student@university.edu",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student"
    }
  }
}
```

**Error Responses:**
- `400` - Invalid email domain (must be .edu)
- `400` - Email already exists
- `400` - Missing required fields
- `400` - Password too weak

---

### Login (POST /login)
Authenticate and receive JWT token.

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@university.edu",
  "password": "SecurePass123!"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "student@university.edu",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student"
    }
  }
}
```

**Error Responses:**
- `401` - Invalid credentials
- `404` - User not found

---

### Get Current User (GET /me)
Retrieve authenticated user profile.

**Request:**
```http
GET /api/auth/me
Authorization: Bearer {token}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "student@university.edu",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "profile": {
      "bio": "Passionate about software development...",
      "industry": "Technology",
      "skills": ["React", "Node.js", "MongoDB"],
      "isAcceptingMentorship": true
    },
    "createdAt": "2024-02-17T10:30:00Z"
  }
}
```

**Error Responses:**
- `401` - No token provided
- `401` - Invalid token
- `404` - User not found

---

### Update Profile (PUT /profile)
Update user profile information.

**Request:**
```http
PUT /api/auth/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Senior software engineer passionate about mentoring junior developers.",
  "industry": "Technology",
  "skills": ["React", "Node.js", "MongoDB", "AWS"],
  "linkedinUrl": "https://linkedin.com/in/johndoe",
  "isAcceptingMentorship": true
}
```

**Requirements:**
- Bio: 50-1000 characters (if provided)
- Skills: maximum 10 items
- Industry: predefined enum list
- LinkedIn/Personal sites must be valid URLs

**Success Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "profile": { /* updated profile */ }
  }
}
```

**Error Responses:**
- `400` - Bio too short (minimum 50 chars)
- `400` - Invalid URL format
- `404` - User not found

---

## 2. Mentor Endpoints

Base URL: `/api/mentors`

### Get All Mentors (GET /)
List all alumni mentors with optional pagination.

**Request:**
```http
GET /api/mentors?page=1&limit=10
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)

**Success Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@companygraduates.edu",
      "profile": {
        "bio": "Former Google engineer, now startup founder",
        "industry": "Technology",
        "skills": ["React", "Python", "Leadership"],
        "isAcceptingMentorship": true
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalMentors": 48
  }
}
```

**Error Responses:**
- `401` - Unauthorized

---

### Get Mentor by ID (GET /:mentorId)
Get detailed profile of a specific mentor.

**Request:**
```http
GET /api/mentors/507f1f77bcf86cd799439012
Authorization: Bearer {token}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@companygraduates.edu",
    "profile": {
      "bio": "Former Google engineer, now startup founder",
      "industry": "Technology",
      "skills": ["React", "Python", "Leadership"],
      "isAcceptingMentorship": true,
      "linkedinUrl": "https://linkedin.com/in/janesmith"
    }
  }
}
```

**Error Responses:**
- `404` - Mentor not found
- `401` - Unauthorized

---

### Search Mentors (POST /search)
Advanced search with industry and skills filtering.

**Request:**
```http
POST /api/mentors/search
Authorization: Bearer {token}
Content-Type: application/json

{
  "industry": "Technology",
  "skills": ["React", "Node.js"],
  "searchTerm": "engineer"
}
```

**Parameters:**
- `industry` (optional) - Single industry to filter
- `skills` (optional) - Array of skills (AND operator - mentor must have ALL)
- `searchTerm` (optional) - Search in bio/name

**Success Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "firstName": "Jane",
      "lastName": "Smith",
      "profile": {
        "industry": "Technology",
        "skills": ["React", "Node.js", "Leadership"]
      }
    }
  ]
}
```

**Error Responses:**
- `400` - Invalid industry value
- `401` - Unauthorized

---

### Update Mentor Availability (PUT /availability)
Toggle mentor acceptance status (alumni only).

**Request:**
```http
PUT /api/mentors/availability
Authorization: Bearer {token}
Content-Type: application/json

{
  "isAcceptingMentorship": false
}
```

**Requirements:**
- Only users with "alumni" role can toggle availability
- Boolean value required

**Success Response:**
```json
{
  "success": true,
  "message": "Availability updated",
  "data": {
    "isAcceptingMentorship": false
  }
}
```

**Error Responses:**
- `403` - Must be alumni to update availability
- `400` - Invalid value provided
- `401` - Unauthorized

---

## 3. Mentorship Request Endpoints

Base URL: `/api/requests`

### Send Mentorship Request (POST /)
Send a mentorship request to a mentor.

**Request:**
```http
POST /api/requests
Authorization: Bearer {token}
Content-Type: application/json

{
  "mentorId": "507f1f77bcf86cd799439012",
  "goal": "Learn React best practices and system design"
}
```

**Requirements:**
- `mentorId` - Valid mentor ID (must be alumni)
- `goal` - 20-500 characters

**Success Response:**
```json
{
  "success": true,
  "message": "Mentorship request sent",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "mentorId": "507f1f77bcf86cd799439012",
    "studentId": "507f1f77bcf86cd799439011",
    "goal": "Learn React best practices and system design",
    "status": "pending",
    "createdAt": "2024-02-17T11:00:00Z"
  }
}
```

**Error Responses:**
- `400` - Duplicate request (already pending)
- `400` - Goal too short (minimum 20 chars)
- `404` - Mentor not found or not accepting requests
- `401` - Unauthorized

---

### Get Mentorship Requests (GET /)
List all requests for current user.

**Request:**
```http
GET /api/requests
Authorization: Bearer {token}
```

**Success Response (Alumni):**
```json
{
  "success": true,
  "data": {
    "incoming": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "mentorId": "507f1f77bcf86cd799439012",
        "student": {
          "_id": "507f1f77bcf86cd799439011",
          "firstName": "John",
          "lastName": "Doe",
          "profile": { "bio": "..." }
        },
        "goal": "Learn React best practices",
        "status": "pending",
        "createdAt": "2024-02-17T11:00:00Z"
      }
    ],
    "outgoing": []
  }
}
```

**Success Response (Student):**
```json
{
  "success": true,
  "data": {
    "incoming": [],
    "outgoing": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "mentor": {
          "_id": "507f1f77bcf86cd799439012",
          "firstName": "Jane",
          "lastName": "Smith"
        },
        "goal": "Learn React best practices",
        "status": "pending"
      }
    ]
  }
}
```

**Error Responses:**
- `401` - Unauthorized

---

### Accept Mentorship Request (PUT /:requestId/accept)
Accept an incoming mentorship request (alumni only).

**Request:**
```http
PUT /api/requests/507f1f77bcf86cd799439013/accept
Authorization: Bearer {token}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Request accepted",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "status": "accepted",
    "conversation": {
      "_id": "507f1f77bcf86cd799439014",
      "participants": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439011"],
      "createdAt": "2024-02-17T11:05:00Z"
    }
  }
}
```

**Error Responses:**
- `404` - Request not found
- `403` - Not authorized to accept this request
- `400` - Request already processed

---

### Reject Mentorship Request (PUT /:requestId/reject)
Reject an incoming mentorship request.

**Request:**
```http
PUT /api/requests/507f1f77bcf86cd799439013/reject
Authorization: Bearer {token}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Request rejected",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "status": "rejected"
  }
}
```

**Error Responses:**
- `404` - Request not found
- `403` - Not authorized

---

### Cancel Mentorship Request (DELETE /:requestId)
Cancel an outgoing mentorship request.

**Request:**
```http
DELETE /api/requests/507f1f77bcf86cd799439013
Authorization: Bearer {token}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Request cancelled"
}
```

**Error Responses:**
- `404` - Request not found
- `403` - Not authorized to cancel

---

## 4. Chat Endpoints

Base URL: `/api/chat`

### Get Conversations (GET /conversations)
List all conversations for current user.

**Request:**
```http
GET /api/chat/conversations
Authorization: Bearer {token}
```

**Success Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "participants": [
        {
          "_id": "507f1f77bcf86cd799439012",
          "firstName": "Jane",
          "lastName": "Smith"
        }
      ],
      "lastMessage": "That sounds great! Let's start with...",
      "lastMessageAt": "2024-02-17T14:30:00Z",
      "createdAt": "2024-02-17T11:05:00Z"
    }
  ]
}
```

**Error Responses:**
- `401` - Unauthorized

---

### Get Conversation Messages (GET /conversations/:conversationId/messages)
Retrieve paginated messages from a conversation.

**Request:**
```http
GET /api/chat/conversations/507f1f77bcf86cd799439014/messages?page=1&limit=20
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Messages per page (default: 20)

**Success Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "conversationId": "507f1f77bcf86cd799439014",
      "sender": {
        "_id": "507f1f77bcf86cd799439012",
        "firstName": "Jane"
      },
      "text": "Hi John! Great to start our mentorship!",
      "readBy": [
        {
          "userId": "507f1f77bcf86cd799439011",
          "readAt": "2024-02-17T11:10:00Z"
        }
      ],
      "createdAt": "2024-02-17T11:06:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 3,
    "total": 45
  }
}
```

**Error Responses:**
- `404` - Conversation not found
- `403` - Not a participant
- `401` - Unauthorized

---

### Send Message (POST /conversations/:conversationId/messages)
Send a message to a conversation.

**Request:**
```http
POST /api/chat/conversations/507f1f77bcf86cd799439014/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "text": "Thanks for your guidance on React performance!"
}
```

**Requirements:**
- `text` - 1-5000 characters

**Success Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439016",
    "conversationId": "507f1f77bcf86cd799439014",
    "sender": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John"
    },
    "text": "Thanks for your guidance on React performance!",
    "readBy": [],
    "createdAt": "2024-02-17T14:35:00Z"
  }
}
```

**Error Responses:**
- `400` - Message too long (max 5000 chars)
- `400` - Empty message
- `404` - Conversation not found
- `403` - Not a participant

---

### Mark Messages as Read (PUT /conversations/:conversationId/read)
Mark all messages in a conversation as read.

**Request:**
```http
PUT /api/chat/conversations/507f1f77bcf86cd799439014/read
Authorization: Bearer {token}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Messages marked as read",
  "data": {
    "conversationId": "507f1f77bcf86cd799439014",
    "markedReadCount": 5
  }
}
```

**Error Responses:**
- `404` - Conversation not found
- `403` - Not a participant

---

## Error Responses

### Standard Error Format
All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

### Common HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 400 | Bad Request | Invalid input, validation failed |
| 401 | Unauthorized | No token, expired token, invalid token |
| 403 | Forbidden | User doesn't have permission |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate request, unique constraint violation |
| 500 | Server Error | Unexpected server error |

### Common Error Codes

| Code | HTTP | Message | Solution |
|------|------|---------|----------|
| `INVALID_CREDENTIALS` | 401 | Invalid email or password | Check credentials |
| `TOKEN_EXPIRED` | 401 | Token has expired | Re-login to get new token |
| `INVALID_TOKEN` | 401 | Token is invalid or malformed | Check token format |
| `EMAIL_EXISTS` | 400 | Email already registered | Use different email |
| `INVALID_EMAIL_DOMAIN` | 400 | Email must be .edu domain | Use university email |
| `WEAK_PASSWORD` | 400 | Password doesn't meet requirements | Use stronger password |
| `DUPLICATE_REQUEST` | 409 | Mentorship request already pending | Wait for response |
| `NOT_FOUND` | 404 | Resource not found | Check ID is correct |
| `NOT_AUTHORIZED` | 403 | You don't have permission | Check your role |
| `VALIDATION_ERROR` | 400 | Field validation failed | Check required fields |

---

## Socket.io Events

Real-time events for instant messaging and notifications.

### Client → Server Events

**send_message**
```javascript
socket.emit('send_message', {
  conversationId: '507f1f77bcf86cd799439014',
  text: 'Hello mentor!',
  userId: '507f1f77bcf86cd799439011'
});
```

**user_typing**
```javascript
socket.emit('user_typing', {
  conversationId: '507f1f77bcf86cd799439014',
  userName: 'John Doe'
});
```

**leave_conversation**
```javascript
socket.emit('leave_conversation', {
  conversationId: '507f1f77bcf86cd799439014'
});
```

### Server → Client Events

**receive_message**
```javascript
socket.on('receive_message', (data) => {
  // data: { _id, conversationId, sender, text, createdAt, readBy }
});
```

**user_typing**
```javascript
socket.on('user_typing', (data) => {
  // data: { userName, conversationId }
});
```

**message_read**
```javascript
socket.on('message_read', (data) => {
  // data: { messageId, readBy: { userId, readAt } }
});
```

---

## Authentication Headers

All authenticated endpoints require the JWT token in the Authorization header:

```
Authorization: Bearer {token_from_login}
```

Example:
```
GET /api/auth/me HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJpYXQiOjE3MDg4NzQwMDB9.N0KcK...
Host: localhost:5000
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production:

**Recommended:**
- 100 requests per minute per IP for public endpoints
- 1000 requests per minute per user for authenticated endpoints
- Implement using `express-rate-limit` package

---

## Testing the API

### Using cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@university.edu",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@university.edu",
    "password": "SecurePass123!"
  }'

# Get Mentors (with token)
curl -X GET http://localhost:5000/api/mentors \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman

1. Import the collection from [postman-collection.json]
2. Set environment variable `BASE_URL` = `http://localhost:5000`
3. After login, the token is automatically saved to `access_token`
4. All authenticated requests automatically include the token

### Using REST Client (VS Code)

Create `requests.http` file:
```http
### Register
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "student@university.edu",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student"
}

### Login (save token)
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "student@university.edu",
  "password": "SecurePass123!"
}

### Get Me (uses token from login)
GET http://localhost:5000/api/auth/me
Authorization: Bearer {{token}}
```

---

**Last Updated**: February 17, 2024  
**API Version**: 1.0  
**Status**: Production Ready

For more information, see [ARCHITECTURE.md](./ARCHITECTURE.md) for system design details.
