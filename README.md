# 3813ICT Assignment Phase 2 - Real-Time Chat System

**🔗 GitHub Repository:** <https://github.com/TienBui1611/3813ICT_Assignment>

## Project Overview

A full-featured real-time text/video chat system built using the MEAN stack with three user permission levels. This project demonstrates professional development practices with comprehensive testing, MongoDB integration, Socket.io real-time messaging, image uploads, and PeerJS video chat functionality.

**Assignment Details:**

- **Course:** 3813ICT Software Frameworks
- **Student**: Vo Viet Tien Bui - s5325217
- **Phase:** 2 - MongoDB, Real-Time Chat, Media Support & Testing
- **Technology Stack:** Angular 20.1 + Node.js + Express + MongoDB + Socket.io + PeerJS
- **Data Storage:** MongoDB (native driver) with real-time synchronization

---

## 🎯 Phase 2 Features

### ✅ New Features Implemented

- **MongoDB Integration** - Complete migration from JSON files to MongoDB database
- **Real-Time Chat** - Socket.io powered instant messaging with join/leave notifications
- **Image Support** - Profile avatars and image messages with file upload
- **Video Chat** - PeerJS video calling with peer-to-peer connections
- **Comprehensive Testing** - 283 total tests with excellent coverage:
  - Server: 153 tests (78.7% coverage) ✅
  - Angular: 106 tests (72.59% coverage) ✅
  - E2E: 12 Playwright tests (100% passing) ✅

---

## Project Structure

```
3813ICT_Assignment/
├── README.md                     // Complete project documentation
├── package.json                  // Root dependencies & scripts
├── angular.json                  // Angular CLI configuration
├── playwright.config.ts          // Playwright E2E test configuration
├── src/                          // Angular frontend application
│   ├── app/
│   │   ├── components/           // Angular components
│   │   │   ├── auth/            // Authentication components
│   │   │   ├── dashboard/       // Main dashboard
│   │   │   ├── users/           // User management
│   │   │   ├── groups/          // Group management
│   │   │   ├── channels/        // Channel management
│   │   │   ├── chat/            // Real-time chat interface
│   │   │   └── video/           // Video chat component
│   │   ├── services/            // Angular services
│   │   │   ├── auth.service.ts       // Authentication
│   │   │   ├── socket.service.ts     // Socket.io client
│   │   │   ├── user.service.ts       // User operations
│   │   │   ├── group.service.ts      // Group operations
│   │   │   └── channel.service.ts    // Channel operations
│   │   ├── models/              // TypeScript interfaces
│   │   └── guards/              // Route guards
│   ├── index.html               // Main HTML file
│   └── styles.css               // Global styles with Bootstrap
├── server/                      // Node.js backend application
│   ├── routes/                  // Express route handlers
│   │   ├── auth.js             // Authentication routes
│   │   ├── users.js            // User management routes
│   │   ├── groups.js           // Group management routes
│   │   ├── channels.js         // Channel management routes
│   │   ├── messages.js         // Message routes
│   │   └── upload.js           // File upload routes
│   ├── services/               // Business logic services
│   │   └── mongodb.js          // MongoDB connection service
│   ├── middleware/             // Express middleware
│   │   └── auth.js             // Authentication middleware
│   ├── uploads/                // Uploaded files storage
│   │   ├── avatars/            // User profile images
│   │   └── chat-images/        // Chat image messages
│   ├── test/                   // Server tests (Mocha/Chai)
│   │   ├── setup.js            // Test database setup
│   │   ├── auth.test.js        // Authentication tests
│   │   ├── users.test.js       // User management tests
│   │   ├── groups.test.js      // Group management tests
│   │   ├── channels.test.js    // Channel management tests
│   │   └── upload.test.js      // File upload tests
│   └── server.js               // Main server entry point
├── e2e/                        // Playwright E2E tests
│   ├── login.spec.ts           // Login/logout E2E tests
│   ├── groups-channels.spec.ts // Group/channel creation tests
│   ├── chat.spec.ts            // Chat messaging tests
│   └── images.spec.ts          // Image upload tests
└── tsconfig.json               // TypeScript configuration
```

---

## Installation & Setup

### Prerequisites

- **Node.js** (v16+)
- **npm** (v8+)
- **Angular CLI** (v18+)
- **MongoDB** (v5.0+) - Must be running locally on port 27017

### MongoDB Setup

1. **Install MongoDB Community Edition:**
   - Download from: <https://www.mongodb.com/try/download/community>
   - Follow installation instructions for your OS

2. **Start MongoDB Service:**

   **Windows:**

```bash
   net start MongoDB
   ```

   **macOS/Linux:**

   ```bash
   sudo systemctl start mongod
   # OR
   brew services start mongodb-community
   ```

3. **Verify MongoDB is Running:**

   ```bash
   mongosh
   # Should connect to mongodb://localhost:27017
   ```

### Project Installation

```bash
# Clone the repository
git clone https://github.com/TienBui1611/3813ICT_Assignment.git
cd 3813ICT_Assignment

# Install all dependencies (root, server, and client)
npm run setup

# Start MongoDB (if not already running)
# Windows: net start MongoDB
# macOS/Linux: brew services start mongodb-community

# Start both frontend and backend
npm start

# OR start separately:
ng serve  # Angular on http://localhost:4200
nodemon server/server.js  # Node.js API on http://localhost:3000
```

### Default Login Credentials

- **Super Admin:**
- Username: `super`
- Password: `123`
- Role: Super Admin (full system access)

### Quick Troubleshooting

- **MongoDB Connection Issues**: Ensure MongoDB is running on `mongodb://localhost:27017`
- **Port Conflicts**: Frontend runs on :4200, backend on :3000, PeerJS on :9000
- **CORS Issues**: Backend configured for localhost:4200 requests
- **Authentication**: Clear localStorage if login issues occur
- **Socket Connection**: Check browser console for Socket.io connection status
- **Video Chat**: Ensure camera/microphone permissions are granted

---

## Testing

### Running Tests

#### Server Tests (Mocha/Chai)

```bash
# Navigate to server directory
cd server

# Run tests with coverage report
npm run test:coverage
```

**Coverage Report Location:** `server/coverage/index.html`

**Current Coverage:** 78.7% (153 tests passing)

#### Angular Tests (Jasmine/Karma)

```bash
# From root directory
npm test

# Tests run with coverage enabled by default
```

**Coverage Report Location:** `coverage/index.html`

**Current Coverage:** 72.59% (106 tests passing)

#### E2E Tests (Playwright)

```bash
# Run E2E tests (headless)
npm run test:e2e

# Open test report
npx playwright show-report
```

**Current Status:** 12/12 tests passing (100%)

### Test Coverage Summary

```
┌─────────────────────────┬──────────┬──────────┬────────┐
│ Test Type               │ Required │ Achieved │ Status │
├─────────────────────────┼──────────┼──────────┼────────┤
│ Server Unit Tests       │  >75%    │  78.7%   │   ✅   │
│ Angular Unit Tests      │  >50%    │  72.59%  │   ✅   │
│ E2E Tests (Playwright)  │          │  12/12   │   ✅   │
└─────────────────────────┴──────────┴──────────┴────────┘

TOTAL: 283 TESTS
- Server: 153 tests (100% passing)
- Angular: 106 tests (100% passing)
- E2E: 12 tests (100% passing)

OVERALL: 100% PASS RATE ✅
```

### Test Database

Tests use a separate `chatApp_test` database to avoid interfering with development data. Test data persists after test runs for inspection in MongoDB Compass.

**To inspect test data:**

```bash
mongosh
use chatApp_test
db.users.find().pretty()
db.groups.find().pretty()
db.channels.find().pretty()
db.messages.find().pretty()
```

---

## MongoDB Data Structures

### Users Collection

```javascript
{
  _id: "user_001" | ObjectId,        // String ID or MongoDB ObjectId
  username: string,                   // Unique username
  email: string,                      // Unique email address
  password: string,                   // Plain text (Phase 2) / Hashed (future)
  role: "superAdmin" | "admin" | "user",
  groups: string[],                   // Array of group IDs user belongs to
  avatarPath: string,                 // Path to profile image (optional)
  createdAt: Date,
  isActive: boolean                   // Soft delete flag
}

// Indexes:
// - username: unique
// - email: unique
// - role: for role-based queries
```

### Groups Collection

```javascript
{
  _id: "group_001" | ObjectId,       // String ID or MongoDB ObjectId
  name: string,                       // Unique group name
  description: string,
  createdBy: string,                  // User ID of creator
  admins: string[],                   // Array of user IDs with admin rights
  members: string[],                  // Array of all member user IDs
  channels: string[],                 // Array of channel IDs in this group
  createdAt: Date,
  isActive: boolean                   // Soft delete flag
}

// Indexes:
// - name: unique
// - createdBy: for creator queries
// - members: for membership queries
```

### Channels Collection

```javascript
{
  _id: "channel_001" | ObjectId,     // String ID or MongoDB ObjectId
  name: string,                       // Channel name (unique within group)
  description: string,
  groupId: string,                    // Parent group ID
  createdBy: string,                  // User ID of creator
  members: string[],                  // Array of user IDs with access
  createdAt: Date,
  isActive: boolean                   // Soft delete flag
}

// Indexes:
// - groupId: for group-based queries
// - name + groupId: compound unique index
// - members: for membership queries
```

### Messages Collection

```javascript
{
  _id: "msg_timestamp_random" | ObjectId,  // Generated message ID
  channelId: string,                        // Channel this message belongs to
  userId: string,                           // User who sent the message
  username: string,                         // Username (denormalized for display)
  content: string,                          // Message text or image path
  type: "text" | "image",                   // Message type
  timestamp: Date,                          // When message was sent
  
  // Optional fields for image messages:
  imagePath: string                         // Path to uploaded image
}

// Indexes:
// - channelId: for channel message queries
// - timestamp: for chronological ordering
// - channelId + timestamp: compound index for efficient history queries
```

### Relationships Between Collections

```
Users ←→ Groups (many-to-many)
  - User.groups[] contains Group IDs
  - Group.members[] contains User IDs
  - Group.admins[] contains User IDs with admin rights

Groups → Channels (one-to-many)
  - Group.channels[] contains Channel IDs
  - Channel.groupId references parent Group

Users ←→ Channels (many-to-many)
  - Channel.members[] contains User IDs

Channels → Messages (one-to-many)
  - Message.channelId references Channel
  - Messages are deleted when Channel is deleted (cascading)
```

---

## REST API Documentation

### 🔐 Authentication Routes

#### POST `/api/auth/login`

Login with username and password.

**Request Body:**

```json
{
  "username": "super",
  "password": "123"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "user": {
    "_id": "user_001",
    "username": "super",
    "email": "super@example.com",
    "role": "superAdmin",
    "groups": []
  },
  "token": "session_user_001_1234567890"
}
```

**Error Response (401):**

```json
{
  "success": false,
  "error": "INVALID_CREDENTIALS",
  "message": "Invalid username or password"
}
```

---

#### POST `/api/auth/logout`

Logout current user (requires authentication).

**Headers:**

```
Authorization: Bearer session_user_001_1234567890
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### GET `/api/auth/current`

Get current authenticated user details.

**Headers:**

```
Authorization: Bearer session_user_001_1234567890
```

**Success Response (200):**

```json
{
  "success": true,
  "user": {
    "_id": "user_001",
    "username": "super",
    "email": "super@example.com",
    "role": "superAdmin",
    "groups": []
  }
}
```

---

### 👥 User Management Routes

#### GET `/api/users`

Get all users (Group Admin+ for member management).

**Success Response (200):**

```json
{
  "success": true,
  "users": [
    {
      "_id": "user_001",
      "username": "super",
      "email": "super@example.com",
      "role": "superAdmin",
      "groups": []
    }
  ]
}
```

---

#### POST `/api/users`

Create new user (Super Admin only).

**Request Body:**

```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "role": "user"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "user": {
    "_id": "user_1234567890_123",
    "username": "newuser",
    "email": "newuser@example.com",
    "role": "user",
    "groups": []
  },
  "message": "User created successfully"
}
```

---

#### DELETE `/api/users/:id`

Delete user with cascading cleanup (Super Admin only).

**Success Response (200):**

```json
{
  "success": true,
  "message": "User deleted successfully with all associated data"
}
```

**Cascading Actions:**

- Removes user from all groups and channels
- Deletes all messages sent by user
- Transfers ownership of created groups/channels to next admin
- Marks groups/channels as inactive if no successor found

---

#### POST `/api/users/validate-username`

Check if username is available.

**Request Body:**

```json
{
  "username": "testuser"
}
```

**Success Response (200):**

```json
{
  "available": false
}
```

---

#### GET `/api/users/search`

Search users by username, email, or role (Super Admin only).

**Query Parameters:**

- `q` - Search query string

**Example:** `/api/users/search?q=admin`

**Success Response (200):**

```json
{
  "success": true,
  "users": [
    {
      "_id": "admin_001",
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin"
    }
  ]
}
```

---

### 🏢 Group Management Routes

#### GET `/api/groups`

Get groups filtered by user permissions.

**Success Response (200):**

```json
{
  "groups": [
    {
      "_id": "group_001",
      "name": "Test Group",
      "description": "A test group",
      "createdBy": "user_001",
      "admins": ["user_001"],
      "members": ["user_001", "user_002"],
      "channels": ["channel_001"]
    }
  ]
}
```

---

#### POST `/api/groups`

Create new group (Group Admin+ only).

**Request Body:**

```json
{
  "name": "New Group",
  "description": "Group description"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "group": {
    "_id": "group_1234567890_123",
    "name": "New Group",
    "description": "Group description",
    "createdBy": "user_001",
    "admins": ["user_001"],
    "members": ["user_001"],
    "channels": []
  },
  "message": "Group created successfully"
}
```

---

#### DELETE `/api/groups/:id`

Delete group with cascading cleanup (creators, Super Admin only).

**Success Response (200):**

```json
{
  "success": true,
  "message": "Group and all associated channels deleted successfully"
}
```

**Cascading Actions:**

- Deletes all channels in the group
- Deletes all messages in all channels
- Removes group from all users' groups arrays

---

### 📺 Channel Management Routes

#### GET `/api/channels/group/:groupId`

Get all channels in a group (group members only).

**Success Response (200):**

```json
{
  "channels": [
    {
      "_id": "channel_001",
      "name": "General",
      "description": "General discussion",
      "groupId": "group_001",
      "createdBy": "user_001",
      "members": ["user_001", "user_002"]
    }
  ]
}
```

---

#### POST `/api/channels`

Create channel in group (group managers only).

**Request Body:**

```json
{
  "name": "New Channel",
  "description": "Channel description",
  "groupId": "group_001"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "channel": {
    "_id": "channel_1234567890_123",
    "name": "New Channel",
    "description": "Channel description",
    "groupId": "group_001",
    "createdBy": "user_001",
    "members": []
  },
  "message": "Channel created successfully"
}
```

---

#### DELETE `/api/channels/:id`

Delete channel with cascading cleanup (channel/group managers).

**Success Response (200):**

```json
{
  "success": true,
  "message": "Channel and all messages deleted successfully"
}
```

**Cascading Actions:**

- Deletes all messages in the channel
- Removes channel from parent group's channels array

---

### 💬 Message Routes

#### GET `/api/messages/:channelId`

Get message history for a channel.

**Query Parameters:**

- `limit` - Number of messages to retrieve (default: 50)

**Example:** `/api/messages/channel_001?limit=100`

**Success Response (200):**

```json
{
  "success": true,
  "messages": [
    {
      "_id": "msg_1234567890_123",
      "channelId": "channel_001",
      "userId": "user_001",
      "username": "super",
      "content": "Hello world!",
      "type": "text",
      "timestamp": "2025-10-07T10:30:00.000Z"
    }
  ]
}
```

---

#### POST `/api/messages`

Send a text message (via REST, Socket.io preferred).

**Request Body:**

```json
{
  "channelId": "channel_001",
  "content": "Hello world!",
  "type": "text"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": {
    "_id": "msg_1234567890_123",
    "channelId": "channel_001",
    "userId": "user_001",
    "username": "super",
    "content": "Hello world!",
    "type": "text",
    "timestamp": "2025-10-07T10:30:00.000Z"
  }
}
```

---

### 📤 File Upload Routes

#### POST `/api/upload/avatar`

Upload profile avatar image.

**Request:**

- Content-Type: `multipart/form-data`
- Field name: `avatar`
- Accepted formats: JPG, JPEG, PNG, GIF
- Max file size: 5MB

**Success Response (200):**

```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "avatarPath": "/uploads/avatars/user_001_1234567890.jpg",
  "user": {
    "_id": "user_001",
    "username": "super",
    "avatarPath": "/uploads/avatars/user_001_1234567890.jpg"
  }
}
```

---

#### DELETE `/api/upload/avatar`

Remove profile avatar.

**Success Response (200):**

```json
{
  "success": true,
  "message": "Avatar removed successfully"
}
```

---

#### POST `/api/upload/chat-image`

Upload image as chat message.

**Request:**

- Content-Type: `multipart/form-data`
- Field name: `image`
- Body field: `channelId`
- Accepted formats: JPG, JPEG, PNG, GIF
- Max file size: 10MB

**Success Response (200):**

```json
{
  "success": true,
  "message": "Image uploaded and sent successfully",
  "imageMessage": {
    "_id": "msg_1234567890_123",
    "channelId": "channel_001",
    "userId": "user_001",
    "username": "super",
    "content": "/uploads/chat-images/channel_001_1234567890.jpg",
    "type": "image",
    "timestamp": "2025-10-07T10:30:00.000Z"
  }
}
```

---

#### GET `/api/upload/avatars/:filename`

Serve avatar image file.

**Example:** `/api/upload/avatars/user_001_1234567890.jpg`

**Success Response (200):**

- Content-Type: `image/jpeg` (or appropriate image type)
- Binary image data

---

#### GET `/api/upload/chat-images/:filename`

Serve chat image file.

**Example:** `/api/upload/chat-images/channel_001_1234567890.jpg`

**Success Response (200):**

- Content-Type: `image/jpeg` (or appropriate image type)
- Binary image data

---

## Socket.io Events Documentation

### Client → Server Events

#### `join-channel`

User joins a specific channel to receive messages.

**Payload:**

```javascript
{
  channelId: "channel_001",
  userId: "user_001",
  username: "super"
}
```

**Server Actions:**

- Adds socket to channel room
- Loads last 50 messages from MongoDB
- Emits `channel-history` with message history
- Broadcasts `user-joined` to other users in channel

---

#### `leave-channel`

User leaves a channel.

**Payload:**

```javascript
{
  channelId: "channel_001",
  userId: "user_001",
  username: "super"
}
```

**Server Actions:**

- Removes socket from channel room
- Broadcasts `user-left` to remaining users in channel

---

#### `send-message`

User sends a text message to a channel.

**Payload:**

```javascript
{
  channelId: "channel_001",
  userId: "user_001",
  username: "super",
  content: "Hello world!",
  type: "text"
}
```

**Server Actions:**

- Saves message to MongoDB messages collection
- Broadcasts `message` event to all users in channel

---

#### `typing`

User is typing a message (optional feature).

**Payload:**

```javascript
{
  channelId: "channel_001",
  userId: "user_001",
  username: "super"
}
```

**Server Actions:**

- Broadcasts `typing-indicator` to other users in channel

---

#### `stop-typing`

User stopped typing.

**Payload:**

```javascript
{
  channelId: "channel_001",
  userId: "user_001"
}
```

**Server Actions:**

- Broadcasts `stop-typing-indicator` to other users in channel

---

### Server → Client Events

#### `message`

New message received in channel.

**Payload:**

```javascript
{
  _id: "msg_1234567890_123",
  channelId: "channel_001",
  userId: "user_001",
  username: "super",
  content: "Hello world!",
  type: "text",
  timestamp: "2025-10-07T10:30:00.000Z"
}
```

**Client Actions:**

- Append message to chat display
- Scroll to bottom
- Play notification sound (if enabled)

---

#### `user-joined`

Another user joined the channel.

**Payload:**

```javascript
{
  username: "admin",
  timestamp: "2025-10-07T10:30:00.000Z"
}
```

**Client Actions:**

- Display system message: "admin joined the channel"
- Update online users list

---

#### `user-left`

Another user left the channel.

**Payload:**

```javascript
{
  username: "admin",
  timestamp: "2025-10-07T10:30:00.000Z"
}
```

**Client Actions:**

- Display system message: "admin left the channel"
- Update online users list

---

#### `channel-history`

Message history loaded when joining channel.

**Payload:**

```javascript
{
  messages: [
    {
      _id: "msg_001",
      channelId: "channel_001",
      userId: "user_001",
      username: "super",
      content: "Hello!",
      type: "text",
      timestamp: "2025-10-07T10:00:00.000Z"
    },
    // ... more messages
  ]
}
```

**Client Actions:**

- Clear current message display
- Render all messages in chronological order
- Scroll to bottom

---

#### `typing-indicator`

Someone is typing in the channel.

**Payload:**

```javascript
{
  userId: "user_002",
  username: "admin"
}
```

**Client Actions:**

- Display "admin is typing..." indicator
- Auto-hide after 3 seconds

---

### Socket Connection Management

```javascript
// Client-side Socket.io setup (Angular)
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: localStorage.getItem('authToken')
  }
});

// Join channel
socket.emit('join-channel', {
  channelId: 'channel_001',
  userId: 'user_001',
  username: 'super'
});

// Listen for messages
socket.on('message', (data) => {
  console.log('New message:', data);
});

// Send message
socket.emit('send-message', {
  channelId: 'channel_001',
  userId: 'user_001',
  username: 'super',
  content: 'Hello world!',
  type: 'text'
});
```

---

## Angular Architecture

### Component Structure

```
src/app/components/
├── auth/
│   └── login/                   # User authentication interface
├── dashboard/                   # Role-based main dashboard
├── users/
│   └── user-list/              # User management (Super Admin)
├── groups/
│   ├── group-list/             # Group management (Admin+)
│   └── my-groups/              # User's groups view
├── channels/
│   └── channel-list/           # Channel management within groups
├── chat/
│   ├── chat-room/              # Real-time chat interface (NEW)
│   └── message/                # Individual message display (NEW)
└── video/
    └── video-call/             # PeerJS video chat component (NEW)
```

### Services Implementation

#### Core Services

- **AuthService** (`auth.service.ts`)
  - User authentication and session management
  - Token-based authentication with localStorage
  - Role checking and permission validation
  - Login/logout functionality

- **SocketService** (`socket.service.ts`)
  - Socket.io client connection management
  - Real-time message sending and receiving
  - Channel join/leave operations
  - Typing indicators
  - Connection state management

- **UserService** (`user.service.ts`)
  - User CRUD operations
  - Role assignments and promotions
  - Username/email validation
  - User search functionality

- **GroupService** (`group.service.ts`)
  - Group CRUD operations
  - Member management (add/remove)
  - Admin assignment
  - Group filtering by permissions

- **ChannelService** (`channel.service.ts`)
  - Channel CRUD operations within groups
  - Member management
  - Channel access control
  - Channel filtering by group

- **StorageService** (`storage.service.ts`)
  - localStorage operations for session persistence
  - Token management
  - User data caching

### Models & Interfaces

#### User Interface

```typescript
interface User {
  id: string;
  _id?: string;           // MongoDB compatibility
  username: string;
  email: string;
  password?: string;      // Not returned in API responses
  role: 'superAdmin' | 'admin' | 'user';
  groups: string[];
  avatarPath?: string;    // Profile image path
  createdAt?: Date;
  isActive?: boolean;
}
```

#### Group Interface

```typescript
interface Group {
  id: string;
  _id?: string;           // MongoDB compatibility
  name: string;
  description: string;
  createdBy: string;
  admins: string[];
  members: string[];
  channels: string[];
  createdAt?: Date;
  isActive?: boolean;
}
```

#### Channel Interface

```typescript
interface Channel {
  id: string;
  _id?: string;           // MongoDB compatibility
  name: string;
  description: string;
  groupId: string;
  createdBy: string;
  members: string[];
  createdAt?: Date;
  isActive?: boolean;
}
```

#### Message Interface

```typescript
interface Message {
  _id: string;
  channelId: string;
  userId: string;
  username: string;
  content: string;
  type: 'text' | 'image';
  imagePath?: string;     // For image messages
  timestamp: Date;
}
```

### Route Protection

- **AuthGuard** - Ensures only authenticated users access protected routes
- **SuperAdminGuard** - Restricts user management to Super Admins only
- **GroupAdminGuard** - Allows Group Admins and Super Admins to manage groups

### Component Interactions

- Services provide reactive data streams using RxJS Observables
- Components communicate through shared services and route parameters
- State management handled through service-based caching and localStorage
- Real-time updates via Socket.io subscriptions

---

## Video Chat Implementation

### PeerJS Setup

The application uses PeerJS for peer-to-peer video calling:

**Server-side:**

```javascript
// server/server.js
const { ExpressPeerServer } = require('peer');

const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/peerjs'
});

app.use('/peerjs', peerServer);
```

**Client-side:**

```typescript
// src/app/components/video/video-call/video-call.component.ts
import Peer from 'peerjs';

const peer = new Peer(userId, {
  host: 'localhost',
  port: 9000,
  path: '/peerjs'
});

// Call another user
const call = peer.call(remoteUserId, localStream);
call.on('stream', (remoteStream) => {
  // Display remote video
});

// Answer incoming call
peer.on('call', (call) => {
  call.answer(localStream);
  call.on('stream', (remoteStream) => {
    // Display remote video
  });
});
```

### Video Features

- ✅ Peer-to-peer video connections
- ✅ Audio/video stream management
- ✅ Camera controls

---

## User Roles & Permissions

### Super Admin

- ✅ Create, edit, remove any user
- ✅ Promote users to Group Admin or Super Admin
- ✅ Access all groups and channels
- ✅ Full system administration
- ✅ Delete any group or channel

### Group Admin

- ✅ Create new groups
- ✅ Create channels within their groups
- ✅ Add/remove users from their groups
- ✅ Manage group settings
- ✅ Delete their own groups

### Chat User

- ✅ View groups they belong to
- ✅ View accessible channels
- ✅ Join/leave channels
- ✅ Send text and image messages
- ✅ Participate in video calls
- ✅ Upload profile avatar
- ✅ Basic profile management

---

## Technology Stack

### Frontend (Angular 20.1)

- **Angular 20.1** - Modern web framework with standalone components
- **Bootstrap 5** - Professional UI framework
- **Bootstrap Icons** - Comprehensive icon library
- **Socket.io-client** - Real-time communication
- **PeerJS** - WebRTC video calling
- **RxJS** - Reactive programming
- **TypeScript** - Type-safe development
- **Jasmine/Karma** - Unit testing framework

### Backend (Node.js)

- **Express.js** - Web application framework
- **MongoDB (native driver)** - Database (NO Mongoose)
- **Socket.io** - Real-time bidirectional communication
- **PeerJS Server** - WebRTC signalling server
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing
- **Mocha/Chai** - Testing framework

### Testing

- **Mocha** - Server-side test framework
- **Chai** - Assertion library
- **Chai-HTTP** - HTTP integration testing
- **NYC** - Code coverage reporting
- **Jasmine** - Angular unit testing
- **Karma** - Angular test runner
- **Playwright** - E2E testing framework

---

## Git Repository Organization

### Repository Structure

The project follows a clean, organized structure with clear separation of concerns:

```
3813ICT_Assignment/
├── src/                    # Angular frontend application
├── server/                 # Node.js backend application
├── e2e/                    # Playwright E2E tests
├── README.md              # Complete project documentation
├── package.json           # Root project dependencies
├── angular.json           # Angular CLI configuration
└── playwright.config.ts   # Playwright configuration
```

### Development Workflow

- **Branching Strategy**: Main branch development with feature-based commits
- **Commit Frequency**: 40+ commits showing consistent development
- **Development Period**: 20+ days of active development
- **Version Control**: Git used for all code changes and project history
- **Repository Management**: Clean structure with node_modules excluded

### Phase 2 Development Timeline

- **MongoDB Migration**: Complete database migration from JSON to MongoDB
- **Socket.io Integration**: Real-time chat implementation
- **Image Upload System**: Avatar and chat image functionality
- **Video Chat**: PeerJS video calling implementation
- **Comprehensive Testing**: 283 tests across all layers
- **Documentation**: Complete API and architecture documentation
