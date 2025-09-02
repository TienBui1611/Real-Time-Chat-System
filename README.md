# 3813ICT Assignment Phase 1 - Chat System

**🔗 GitHub Repository:** <https://github.com/TienBui1611/3813ICT_Assignment>

## Project Overview

A text/video chat system built using the MEAN stack with three user permission levels. This project demonstrates development practices with documentation, code organization, and implementation of Phase 1 requirements. Phase 1 implements user authentication, role-based access control, group and channel management using JSON file storage

**Assignment Details:**

- **Course:** 3813ICT Software Frameworks
- **Student**: Vo Viet Tien Bui - s5325217  
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
- Role: Super Admin (full system access)

### Quick Troubleshooting

- **Port conflicts**: Frontend runs on :4200, backend on :3000
- **CORS issues**: Backend configured for localhost:4200 requests
- **Authentication**: Clear localStorage if login issues occur
- **Data reset**: Check `server/data/*.json` files for current state

### System Architecture

- **Frontend**: Angular 18 with standalone components
- **Backend**: Node.js Express with middleware-based authentication
- **Authentication**: Bearer token system with localStorage persistence
- **Authorization**: Role-based access control (RBAC)
- **Data Storage**: JSON files with unique ID generation (UUID-based)

---

## Features Implemented

### ✅ Project Foundation

- **Angular 18** project with Bootstrap 5 integration
- **Node.js Express** server with modular architecture
- **TypeScript models** for User, Group, Channel entities
- **Route guards** for role-based access control
- **JSON file storage** with Git-based version control
- **Professional UI** with responsive design

### ✅ Implementation Complete

All Phase 1 requirements have been successfully implemented:

- ✅ **Complete authentication system** with login/logout and session management
- ✅ **User management system** (Super Admin CRUD operations)
- ✅ **Group and channel management** with full administrative controls
- ✅ **Role-based access control** with proper permission enforcement
- ✅ **JSON data persistence** with automatic file storage
- ✅ **Professional responsive UI** with Bootstrap 5 integration

---

## Data Models

### User

```typescript
interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;  // Single role per user
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

### 🔐 Authentication

- `POST /api/auth/login` - User login with credentials validation
- `POST /api/auth/logout` - User logout with token cleanup  
- `GET /api/auth/current` - Get current authenticated user details

### 👥 Users Management

- `GET /api/users` - Get all users (Group Admin+ for member management)
- `GET /api/users/:id` - Get specific user by ID (Super Admin only)
- `POST /api/users` - Create new user account (Super Admin only)
- `PUT /api/users/:id` - Update user details (Super Admin only)
- `DELETE /api/users/:id` - Delete user account (Super Admin only)
- `PUT /api/users/:id/promote` - Change user role (Super Admin only)
- `POST /api/users/validate-username` - Check username availability
- `POST /api/users/validate-email` - Check email availability
- `GET /api/users/search` - Search users by query (Super Admin only)

### 🏢 Groups Management

- `GET /api/groups` - Get groups filtered by user permissions
- `GET /api/groups/my-groups` - Get current user's groups (all users)
- `GET /api/groups/:id` - Get specific group details
- `GET /api/groups/:id/members` - Get group members with roles
- `POST /api/groups` - Create new group (Group Admin+ only)
- `PUT /api/groups/:id` - Update group details (creators, admins, Super Admin)
- `DELETE /api/groups/:id` - Delete group (creators, Super Admin only)
- `POST /api/groups/:id/members` - Add user to group (admins+ only)
- `DELETE /api/groups/:id/members/:userId` - Remove user from group (admins+)
- `POST /api/groups/:id/leave` - Leave group with auto-channel removal

### 📺 Channels Management  

- `GET /api/channels/group/:groupId` - Get all channels in group (group members)
- `GET /api/channels/my-channels` - Get user's accessible channels
- `GET /api/channels/:id` - Get specific channel details
- `POST /api/channels` - Create channel in group (group managers only)
- `PUT /api/channels/:id` - Update channel details (channel/group managers)
- `DELETE /api/channels/:id` - Delete channel (channel/group managers)
- `POST /api/channels/:id/join` - Join channel (group members only)
- `POST /api/channels/:id/leave` - Leave channel (members only)
- `POST /api/channels/:id/members` - Add user to channel (managers+ only)
- `DELETE /api/channels/:id/members/:userId` - Remove user from channel (managers+)

### 📋 API Response Format

API endpoints use different response formats depending on the operation:

#### Success Responses

**Create/Update/Delete Operations:**

```json
{
  "success": true,
  "user": { /* user object */ },
  "group": { /* group object */ },
  "channel": { /* channel object */ },
  "message": "Operation completed successfully"
}
```

**Get/Read Operations:**

```json
{
  "user": { /* user object */ },
  "group": { /* group object */ },
  "channels": [ /* array of channels */ ],
  "groups": [ /* array of groups */ ]
}
```

**Validation Operations:**

```json
{
  "available": true  // for username/email validation
}
```

#### Error Response  

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable error message"
}
```

#### Common Error Codes

- `VALIDATION_ERROR` - Missing or invalid input data
- `AUTHENTICATION_ERROR` - Invalid or missing authentication token
- `AUTHORIZATION_ERROR` - Insufficient permissions for operation
- `NOT_FOUND` - Requested resource does not exist
- `CONFLICT` - Resource already exists (duplicate names, etc.)
- `STORAGE_ERROR` - Database/file system operation failed

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
- **Git-based version control** for data integrity
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

### 📊 Evaluation Criteria - Implementation Status

- **Professional Design** ✅ Bootstrap 5 with responsive UI implementation
- **Authentication System** ✅ Login/logout with session management implemented
- **User Management** ✅ CRUD operations for Super Admin implemented
- **Group Management** ✅ Group and channel administration implemented
- **Data Storage** ✅ JSON files with Git-based version control
- **Documentation** ✅ All required sections included

---

## Git Repository Organization

### Repository Structure

The project follows a clean, organized structure with clear separation of frontend and backend code:

```
3813ICT_Assignment/
├── src/                    # Angular frontend application
├── server/                 # Node.js backend application  
├── README.md              # Complete project documentation
├── package.json           # Root project dependencies
└── angular.json           # Angular CLI configuration
```

### Development Workflow

- **Branching Strategy**: Main branch development with feature-based commits
- **Commit Frequency**: 30 commits made regularly from Aug 14 2025 showing consistent development
- **Development Period**: around 15+ days of active development with commits spanning multiple weeks
- **Version Control**: Git used for all code changes and project history tracking
- **Repository Management**: Clean structure with node_modules excluded via .gitignore

### Actual Commit History Examples

Based on the development timeline, commits include:

- "Phase 1: Repository Installation" (Aug 17, 2025)
- "Project Initial Setup with authentication and JSON storage" (Aug 25, 2025)
- "Implemented prototype of Authentication and User Management" (Aug 28, 2025)
- "Super and Group admins functionalities sorted out" (Aug 30, 2025)
- "Group Management component done" (Aug 30, 2025)
- "Documentation implementation + project features enhancement" (Aug 31, 2025)
- "Minor project updates, polished some UI features and styling" (September 2, 2025)

### Approximate Development Timeline

- **Aug 14-17, 2025**: Initial repository setup and project foundation
- **Aug 25, 2025**: Core authentication and storage implementation
- **Aug 28, 2025**: User management system development
- **Aug 30, 2025**: Group and channel management features completed
- **Aug 31, 2025**: Proper documentation file written
- **Sep 2, 2025**: Final UI refinements, bug fixes, and project polishing before submission
- **Consistent commits**: Regular updates showing iterative development approach

---

## Angular Architecture

### Component Structure

```
src/app/components/
├── auth/login/              # User authentication interface
├── dashboard/               # Role-based main dashboard  
├── users/user-list/         # User management (Super Admin)
├── groups/
│   ├── group-list/          # Group management (Admin+)
│   └── my-groups/           # User's groups view
└── channels/channel-list/   # Channel management within groups
```

### Services Implementation

- **AuthService**: Authentication, session management, and role checking
- **UserService**: User CRUD operations and role assignments  
- **GroupService**: Group operations and member management
- **ChannelService**: Channel management within groups
- **StorageService**: localStorage operations for session persistence

### Models & Interfaces

All entities use TypeScript interfaces for type safety:

- **User**: Authentication, roles, and group memberships
- **Group**: Hierarchical structure with admin/member relationships
- **Channel**: Group-based access control and member management

### Route Protection

- **AuthGuard**: Ensures only authenticated users access protected routes
- **SuperAdminGuard**: Restricts user management to Super Admins only
- **GroupAdminGuard**: Allows Group Admins and Super Admins to manage groups

### Component Interactions

- Services provide reactive data streams using RxJS Observables
- Components communicate through shared services and route parameters
- State management handled through service-based caching and localStorage
