# 3813ICT Assignment Phase 1 - Chat System Planning & Implementation

## Project Overview

Building a text/video chat system using the MEAN stack with three user permission levels. Phase 1 focuses on planning, documentation, user authentication, and basic UI implementation with local storage.

## Phase 1 Requirements Checklist

### ✅ Must Implement

- [ ] **Documentation & Planning** - Complete design documentation
- [ ] **User Interface** - All pages navigable (limited functionality acceptable)
- [ ] **User Authentication** - Role-based login system
- [ ] **User Management** - Create users, assign to groups/channels
- [ ] **Local Storage** - Browser-based data persistence
- [ ] **Git Repository** - Frequent commits with proper branching

### ❌ NOT Required for Phase 1

- Database integration (MongoDB - Phase 2)
- Socket.io implementation (real-time chat - Phase 2)
- Image upload functionality
- Video chat (PeerJS - Phase 2)
- Actual chat messaging functionality

---

## System Architecture Planning

### User Roles & Permissions

#### 1. Super Admin

- **Capabilities:**
  - Promote users to Group Admin or Super Admin
  - Remove any chat users from system
  - Access all groups (even if not creator)
  - All Group Admin functions

#### 2. Group Admin  

- **Capabilities:**
  - Create new groups
  - Create channels within their groups
  - Remove groups/channels they created
  - Add/remove users from their groups
  - Ban users from channels
  - Delete users from groups they administer

#### 3. Chat User (Regular User)

- **Capabilities:**
  - Create new chat user account
  - Register interest in joining groups
  - Join channels within groups they're members of
  - Leave groups they belong to
  - Delete their own account
  - Logout

### Data Structure Planning

#### User Object

```javascript
{
  id: string,
  username: string,        // unique identifier
  email: string,
  password: string,        // stored in local storage (Phase 1)
  roles: string[],         // ['user', 'groupAdmin', 'superAdmin']
  groups: string[]         // array of group IDs user belongs to
}
```

#### Group Object

```javascript
{
  id: string,
  name: string,
  description: string,
  createdBy: string,       // user ID of creator
  admins: string[],        // array of user IDs with admin rights
  members: string[],       // array of user IDs who are members
  channels: string[]       // array of channel IDs
}
```

#### Channel Object

```javascript
{
  id: string,
  name: string,
  description: string,
  groupId: string,         // parent group ID
  createdBy: string,       // user ID of creator
  members: string[]        // array of user IDs with access
}
```

---

## Angular Frontend Architecture

### Components Structure

```
src/app/
├── components/
│   ├── login/
│   │   ├── login.component.ts
│   │   ├── login.component.html
│   │   └── login.component.css
│   ├── dashboard/
│   │   ├── dashboard.component.ts
│   │   ├── dashboard.component.html
│   │   └── dashboard.component.css
│   ├── user-management/
│   │   ├── user-list.component.ts
│   │   ├── user-create.component.ts
│   │   └── user-edit.component.ts
│   ├── group-management/
│   │   ├── group-list.component.ts
│   │   ├── group-create.component.ts
│   │   └── group-edit.component.ts
│   ├── channel-management/
│   │   ├── channel-list.component.ts
│   │   ├── channel-create.component.ts
│   │   └── channel-edit.component.ts
│   └── chat/
│       ├── chat-room.component.ts (placeholder for Phase 2)
│       └── chat-room.component.html
├── services/
│   ├── auth.service.ts
│   ├── user.service.ts
│   ├── group.service.ts
│   ├── channel.service.ts
│   └── storage.service.ts
├── models/
│   ├── user.model.ts
│   ├── group.model.ts
│   └── channel.model.ts
├── guards/
│   ├── auth.guard.ts
│   ├── super-admin.guard.ts
│   └── group-admin.guard.ts
└── app-routing.module.ts
```

### Services Planning

#### AuthService

- `login(username, password)` - Authenticate user
- `logout()` - Clear session
- `getCurrentUser()` - Get logged in user
- `hasRole(role)` - Check user permissions
- `isAuthenticated()` - Check login status

#### UserService

- `createUser(user)` - Create new user
- `getAllUsers()` - Get all users (admin only)
- `getUserById(id)` - Get specific user
- `updateUser(user)` - Update user details
- `deleteUser(id)` - Remove user
- `promoteUser(id, role)` - Change user role

#### GroupService

- `createGroup(group)` - Create new group
- `getAllGroups()` - Get all groups
- `getGroupsByUser(userId)` - Get user's groups
- `updateGroup(group)` - Update group details
- `deleteGroup(id)` - Remove group
- `addUserToGroup(userId, groupId)` - Add member
- `removeUserFromGroup(userId, groupId)` - Remove member

#### ChannelService

- `createChannel(channel)` - Create new channel
- `getChannelsByGroup(groupId)` - Get group's channels
- `updateChannel(channel)` - Update channel details
- `deleteChannel(id)` - Remove channel
- `addUserToChannel(userId, channelId)` - Add member
- `removeUserFromChannel(userId, channelId)` - Remove member

#### StorageService

- `save(key, data)` - Save to localStorage
- `load(key)` - Load from localStorage
- `remove(key)` - Remove from localStorage
- `clear()` - Clear all storage

### Route Planning

```javascript
const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'users',
    component: UserManagementComponent,
    canActivate: [AuthGuard, SuperAdminGuard]
  },
  {
    path: 'groups',
    component: GroupManagementComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'channels/:groupId',
    component: ChannelManagementComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'chat/:groupId/:channelId',
    component: ChatRoomComponent,
    canActivate: [AuthGuard]
  }
];
```

---

## Node.js Server Architecture

### File Structure

```
server/
├── server.js              // Main server file
├── routes/
│   ├── auth.js            // Authentication routes
│   ├── users.js           // User management routes
│   ├── groups.js          // Group management routes
│   └── channels.js        // Channel management routes
├── middleware/
│   ├── auth.js            // Authentication middleware
│   └── roles.js           // Role-based access middleware
├── models/
│   ├── User.js            // User data model (for local storage)
│   ├── Group.js           // Group data model
│   └── Channel.js         // Channel data model
├── services/
│   └── storage.js         // Local storage simulation service
└── utils/
    └── helpers.js         // Utility functions
```

### Server Routes Planning

#### Authentication Routes (`/api/auth`)

- `POST /login` - User login
- `POST /logout` - User logout
- `GET /current` - Get current user info

#### User Routes (`/api/users`)

- `GET /` - Get all users (Super Admin only)
- `POST /` - Create new user
- `GET /:id` - Get user by ID
- `PUT /:id` - Update user
- `DELETE /:id` - Delete user
- `PUT /:id/promote` - Promote user role (Super Admin only)

#### Group Routes (`/api/groups`)

- `GET /` - Get all groups
- `POST /` - Create new group (Group Admin+)
- `GET /:id` - Get group details
- `PUT /:id` - Update group (Creator/Super Admin only)
- `DELETE /:id` - Delete group (Creator/Super Admin only)
- `POST /:id/members` - Add user to group
- `DELETE /:id/members/:userId` - Remove user from group

#### Channel Routes (`/api/channels`)

- `GET /group/:groupId` - Get channels in group
- `POST /` - Create new channel (Group Admin+)
- `GET /:id` - Get channel details
- `PUT /:id` - Update channel (Creator/Super Admin only)
- `DELETE /:id` - Delete channel (Creator/Super Admin only)
- `POST /:id/members` - Add user to channel
- `DELETE /:id/members/:userId` - Remove user from channel

---

## Implementation Tasks

### Week 1: Project Setup & Planning

- [ ] Initialize Git repository
- [ ] Set up Angular project structure
- [ ] Set up Node.js server structure
- [ ] Create data models and interfaces
- [ ] Write initial documentation

### Week 2: Authentication & User Management

- [ ] Implement login/logout functionality
- [ ] Create user registration system
- [ ] Set up role-based guards
- [ ] Implement user CRUD operations
- [ ] Create user management UI

### Week 3: Group & Channel Management

- [ ] Implement group CRUD operations
- [ ] Create group management UI
- [ ] Implement channel CRUD operations
- [ ] Create channel management UI
- [ ] Set up navigation between components

### Week 4: Integration & Testing

- [ ] Connect frontend to backend APIs
- [ ] Implement local storage persistence
- [ ] Test all user workflows
- [ ] Create placeholder chat interface
- [ ] Finalize documentation
- [ ] Prepare for submission

---

## Default System Setup

### Initial Data

- **Default User:** username: "super", password: "123", role: "Super Admin"
- **Sample Groups:** Create 2-3 test groups for demonstration
- **Sample Channels:** Create 2-3 channels per group for testing

---

## Testing Scenarios

### Authentication Testing

- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Access protected routes without authentication
- [ ] Role-based access control verification

### User Management Testing (Super Admin)

- [ ] Create new users
- [ ] Promote users to Group Admin
- [ ] Delete users
- [ ] View all users

### Group Management Testing (Group Admin)

- [ ] Create new groups
- [ ] Add users to groups
- [ ] Remove users from groups
- [ ] Delete groups (own groups only)

### Channel Management Testing (Group Admin)

- [ ] Create channels within groups
- [ ] Add users to channels
- [ ] Remove users from channels
- [ ] Delete channels

---

## Git Repository Strategy

### Branching Strategy

- `main` - Stable, working code only
- `develop` - Integration branch for features
- `feature/authentication` - Login/logout functionality
- `feature/user-management` - User CRUD operations
- `feature/group-management` - Group operations
- `feature/channel-management` - Channel operations
- `feature/ui-components` - Frontend components

### Commit Frequency

- Commit at least daily during active development
- Meaningful commit messages describing changes
- Tag major milestones (e.g., v1.0-auth-complete)

---

## Documentation Requirements

This README.md file will serve as the main documentation, covering:

- [x] Git repository organization and usage
- [x] Data structures (client and server side)  
- [x] Angular architecture (components, services, models, routes)
- [x] Node server architecture (modules, functions, files)
- [x] Server-side routes, parameters, return values, and purpose
- [ ] Client-server interaction details (to be completed during implementation)

---

## Phase 2 Preview

Features to be added in Phase 2:

- MongoDB database integration
- Socket.io for real-time chat
- Image upload and profile avatars
- PeerJS video chat functionality
- Chat message history
- Enhanced UI/UX

---

## Submission Requirements

1. **GitHub Repository** - Private repository shared with tutor
2. **README.md** - This documentation file (updated with implementation details)
3. **Canvas Submission** - Word document copy of README.md content
4. **Exclude** - node_modules directories from repository
