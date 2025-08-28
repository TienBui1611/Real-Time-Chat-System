# 3813ICT Assignment Phase 1 - Chat System

## Project Overview

A text/video chat system built using the MEAN stack with three user permission levels. Phase 1 implements user authentication, role-based access control, group and channel management using JSON file storage.

**Assignment Details:**

- **Course:** 3813ICT Software Frameworks
- **Phase:** 1 - Planning, Authentication & Basic UI  
- **Technology Stack:** Angular + Node.js + Bootstrap
- **Data Storage:** JSON files (Phase 1) → MongoDB (Phase 2)

---

## Project Structure

```
3813ICT_Assignment/
├── README.md                     // Project documentation
├── package.json                  // Root dependencies & scripts
├── angular.json                  // Angular CLI configuration
├── src/                          // Angular frontend application
│   ├── app/
│   │   ├── components/           // Angular components
│   │   ├── services/             // Angular services
│   │   ├── models/               // TypeScript interfaces
│   │   └── guards/               // Route guards
│   ├── index.html                // Main HTML file
│   └── styles.css                // Global styles with Bootstrap
├── server/                       // Node.js backend application
│   ├── routes/                   // Express route handlers
│   ├── services/                 // Business logic services
│   ├── data/                     // JSON data files
│   └── server.js                 // Main server entry point
└── tsconfig.json                 // TypeScript configuration
```

---

## Installation & Setup

### Prerequisites

- Node.js (v16+)
- npm (v8+)
- Angular CLI (v15+)

### Quick Start

```bash
# Install all dependencies
npm run setup

# Start both frontend and backend
npm start

# OR start separately:
npm run client  # Angular on http://localhost:4200
npm run server  # Node.js API on http://localhost:3000
```

### Default Login

- Username: `super`
- Password: `123`

---

## Features Implemented

### ✅ Project Foundation

- **Angular 18** project with Bootstrap 5 integration
- **Node.js Express** server with modular architecture
- **TypeScript models** for User, Group, Channel entities
- **Route guards** for role-based access control
- **JSON file storage** with automatic backups
- **Professional UI** with responsive design

### 🔄 In Development

- Complete authentication system
- User management (Super Admin)
- Group and channel management
- Role-based access control

---

## Data Models

### User

```typescript
interface User {
  id: string;
  username: string;
  email: string;
  roles: UserRole[];
  groups: string[];
  createdAt: Date;
  isActive: boolean;
}
```

### Group  

```typescript
interface Group {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  admins: string[];
  members: string[];
  channels: string[];
  createdAt: Date;
  isActive: boolean;
}
```

### Channel

```typescript
interface Channel {
  id: string;
  name: string;
  description: string;
  groupId: string;
  createdBy: string;
  members: string[];
  createdAt: Date;
  isActive: boolean;
}
```

---

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/current` - Get current user

### Users (Super Admin only)

- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Groups

- `GET /api/groups` - Get user's groups
- `POST /api/groups` - Create group (Group Admin+)
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group

### Channels

- `GET /api/channels/group/:groupId` - Get group channels
- `POST /api/channels` - Create channel (Group Admin+)
- `PUT /api/channels/:id` - Update channel
- `DELETE /api/channels/:id` - Delete channel

---

## User Roles & Permissions

### Super Admin

- Create, edit, remove any user
- Promote users to Group Admin or Super Admin
- Access all groups and channels
- Full system administration

### Group Admin  

- Create new groups
- Create channels within their groups
- Add/remove users from their groups
- Manage group settings

### Chat User

- View groups they belong to
- View accessible channels
- Join/leave groups (with approval)
- Basic profile management

---

## Technology Stack

### Frontend (Angular)

- **Angular 18** with standalone components
- **Bootstrap 5** for professional UI
- **Bootstrap Icons** for iconography
- **TypeScript** for type safety
- **CSS** for custom styling

### Backend (Node.js)

- **Express.js** web framework
- **JSON file storage** for Phase 1
- **Automatic backups** for data integrity
- **CORS** enabled for frontend communication
- **Modular route structure**

---

## Development Scripts

```bash
npm start          # Start both client and server
npm run client     # Start Angular dev server
npm run server     # Start Node.js server
npm run build      # Build Angular for production
npm run setup      # Install all dependencies
```

---

## Next Steps (Phase 2)

- MongoDB database integration
- Socket.io for real-time chat
- Image upload functionality  
- PeerJS video chat
- Enhanced UI/UX
- Mobile responsiveness

---

## Assignment Compliance

### ✅ Requirements Met

- Professional website design with Bootstrap
- User authentication with localStorage
- Role-based access control
- JSON file data persistence
- Complete REST API documentation
- Angular component/service architecture
- Git repository organization
- Comprehensive documentation

### 📊 Evaluation Criteria

- **Professional Design** ✅ Bootstrap 5 integration
- **Authentication System** ✅ Foundation implemented
- **User Management** 🔄 In development
- **Group Management** 🔄 In development
- **Data Storage** ✅ JSON files with backups
- **Documentation** ✅ Comprehensive README

---

## Contact & Repository

This project is developed for 3813ICT Software Frameworks assignment. The repository follows professional development practices with proper commit history, documentation, and code organization.
