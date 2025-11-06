# Real-Time Chat System - MEAN Stack

A full-featured real-time text and video chat application built with the MEAN stack (MongoDB, Express, Angular, Node.js). Features include role-based access control, Socket.io real-time messaging, image uploads, and peer-to-peer video calling.

## 🌟 Features

### Core Functionality

- **Real-Time Messaging** - Socket.io powered instant messaging with join/leave notifications
- **Video Chat** - PeerJS peer-to-peer video calling
- **Image Support** - Profile avatars and image messages with file upload
- **Role-Based Access Control** - Three permission levels (Super Admin, Group Admin, User)
- **MongoDB Integration** - Persistent data storage with real-time synchronization

### User Management

- User authentication with session management
- Profile customization with avatar uploads
- Role-based permissions and access control
- User search and management tools

### Group & Channel System

- Create and manage discussion groups
- Multiple channels per group
- Member management and admin controls
- Channel-specific access permissions

---

## 🚀 Installation & Setup

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
git clone <repo-url>
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

The application will be available at:

- **Frontend**: <http://localhost:4200>
- **Backend API**: <http://localhost:3000>
- **PeerJS Server**: <http://localhost:9000>

### Default Credentials

```
Username: super
Password: 123
Role: Super Admin
```

---

## 📁 Project Structure

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

## 🧪 Testing

### Server Tests (Mocha/Chai)

```bash
cd server
npm run test:coverage
```

**Coverage**: 78.7% (153 tests)

### Angular Tests (Jasmine/Karma)

```bash
npm test
```

**Coverage**: 72.59% (106 tests)

### E2E Tests (Playwright)

```bash
npm run test:e2e
```

**Status**: 12/12 tests passing

### Test Summary

| Test Type | Tests | Coverage | Status |
|-----------|-------|----------|--------|
| Server Unit Tests | 153 | 78.7% | ✅ |
| Angular Unit Tests | 106 | 72.59% | ✅ |
| E2E Tests | 12 | 100% | ✅ |
| **Total** | **271** | - | **✅** |

---

## 🔌 API Documentation

### Authentication

```http
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/current
```

### User Management

```http
GET    /api/users
POST   /api/users
DELETE /api/users/:id
GET    /api/users/search?q=query
POST   /api/users/validate-username
```

### Groups & Channels

```http
GET    /api/groups
POST   /api/groups
DELETE /api/groups/:id

GET    /api/channels/group/:groupId
POST   /api/channels
DELETE /api/channels/:id
```

### Messages

```http
GET  /api/messages/:channelId
POST /api/messages
```

### File Uploads

```http
POST   /api/upload/avatar
DELETE /api/upload/avatar
POST   /api/upload/chat-image
GET    /api/upload/avatars/:filename
GET    /api/upload/chat-images/:filename
```

---

## 🔄 Socket.io Events

### Client → Server

- `join-channel` - Join a channel room
- `leave-channel` - Leave a channel room
- `send-message` - Send a text message
- `typing` - Indicate user is typing
- `stop-typing` - Stop typing indicator

### Server → Client

- `message` - New message received
- `user-joined` - User joined channel
- `user-left` - User left channel
- `channel-history` - Message history on join
- `typing-indicator` - Someone is typing

---

## 🎥 Video Chat

The application uses PeerJS for peer-to-peer video calling:

```typescript
// Initialize PeerJS client
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
```

---

## 🗄️ Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  username: string,           // unique
  email: string,              // unique
  password: string,
  role: "superAdmin" | "admin" | "user",
  groups: string[],
  avatarPath: string,
  createdAt: Date,
  isActive: boolean
}
```

### Groups Collection

```javascript
{
  _id: ObjectId,
  name: string,               // unique
  description: string,
  createdBy: string,
  admins: string[],
  members: string[],
  channels: string[],
  createdAt: Date,
  isActive: boolean
}
```

### Channels Collection

```javascript
{
  _id: ObjectId,
  name: string,
  description: string,
  groupId: string,
  createdBy: string,
  members: string[],
  createdAt: Date,
  isActive: boolean
}
```

### Messages Collection

```javascript
{
  _id: ObjectId,
  channelId: string,
  userId: string,
  username: string,
  content: string,
  type: "text" | "image",
  imagePath: string,
  timestamp: Date
}
```

---

## 👥 User Roles & Permissions

### Super Admin

- Full system access
- User management (create, edit, delete)
- Promote users to admin roles
- Access all groups and channels

### Group Admin

- Create and manage groups
- Create channels within groups
- Add/remove group members
- Manage group settings

### Chat User

- View assigned groups and channels
- Send messages and images
- Participate in video calls
- Upload profile avatar

---

## 🛠️ Technology Stack

### Frontend

- Angular 20.1
- Bootstrap 5
- Socket.io-client
- PeerJS
- RxJS
- TypeScript

### Backend

- Node.js
- Express.js
- MongoDB (native driver)
- Socket.io
- PeerJS Server
- Multer

### Testing

- Mocha/Chai (server)
- Jasmine/Karma (Angular)
- Playwright (E2E)
- NYC (coverage)

---

## 📝 License

This project was created as part of the 3813ICT Software Frameworks course at Griffith University.

---

## 🤝 Contributing

This is an educational project. Feel free to fork and experiment with the codebase.

---

## 📧 Contact

**Developer**: Vo Viet Tien Bui  
**GitHub**: [@TienBui1611](https://github.com/TienBui1611)

---
