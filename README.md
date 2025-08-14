# 3813ICT Assignment Phase 1 - Chat System

## Project Overview

A text/video chat system built using the MEAN stack (MongoDB, Express.js, Angular, Node.js) with three user permission levels. Phase 1 implements user authentication, role-based access control, group and channel management using local storage for data persistence.

**Assignment Details:**

- **Course:** 3813ICT Software Frameworks
- **Phase:** 1 - Planning, Authentication & Basic UI
- **Technology Stack:** Angular (Frontend) + Node.js (Backend) + Bootstrap (Styling)
- **Data Storage:** JSON files (Phase 1) → MongoDB (Phase 2)

---

## Git Repository Organization

### Repository Structure

```
3813ICT_Assignment/
├── README.md                     // This documentation file
├── phase1_planning.md            // Initial planning document
├── client/                       // Angular frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/       // Angular components
│   │   │   ├── services/         // Angular services
│   │   │   ├── models/           // TypeScript interfaces
│   │   │   ├── guards/           // Route guards
│   │   │   └── app.module.ts     // Root module
│   │   ├── assets/               // Static assets
│   │   └── environments/         // Environment configurations
│   ├── package.json              // Frontend dependencies
│   └── angular.json              // Angular CLI configuration
├── server/                       // Node.js backend application
│   ├── routes/                   // Express route handlers
│   ├── services/                 // Business logic services
│   ├── middleware/               // Express middleware
│   ├── models/                   // Data models
│   ├── data/                     // JSON data files (gitignored)
│   ├── server.js                 // Main server entry point
│   └── package.json              // Backend dependencies
└── .gitignore                    // Git ignore rules
```

### Version Control Strategy

**Branching Model:**

- `main`: Stable, production-ready code. Only thoroughly tested and reviewed code is merged here.
- `tien`: Personal development branch for all feature work and ongoing development.

**Commit Practices:**

- **Daily Progress**: At least one meaningful commit per day during active development periods.
- **Feature Milestones**: Commit after completing each distinct feature or task.
- **Bug Fixes**: Commit immediately after resolving bugs to maintain a clear history.
- **Documentation**: Update and commit documentation in sync with related code changes.

**Git Ignore Policy:**

- `node_modules/` directories
- Environment files (`.env`)
- Data files (`server/data/*.json`)
- Build outputs (`dist/`, `build/`)
- IDE configuration files
- Sensitive configuration data

---

## Data Structures

### User Model

```typescript
interface User {
  id: string;
  username: string;        // Unique identifier
  email: string;           // User email address
  password: string;        // Hashed password (Phase 1: plain text in JSON)
  roles: UserRole[];       // Array of user roles
  groups: string[];        // Array of group IDs user belongs to
  createdAt: Date;         // Account creation timestamp
  lastLogin?: Date;        // Last login timestamp
  isActive: boolean;       // Account status
}

enum UserRole {
  USER = 'user',
  GROUP_ADMIN = 'groupAdmin', 
  SUPER_ADMIN = 'superAdmin'
}
```

### Group Model

```typescript
interface Group {
  id: string;
  name: string;            // Group name
  description: string;     // Group description
  createdBy: string;       // User ID of creator
  admins: string[];        // Array of user IDs with admin rights
  members: string[];       // Array of user IDs who are members
  channels: string[];      // Array of channel IDs in this group
  createdAt: Date;         // Group creation timestamp
  isActive: boolean;       // Group status
}
```

### Channel Model

```typescript
interface Channel {
  id: string;
  name: string;            // Channel name
  description: string;     // Channel description
  groupId: string;         // Parent group ID
  createdBy: string;       // User ID of creator
  members: string[];       // Array of user IDs with access
  createdAt: Date;         // Channel creation timestamp
  isActive: boolean;       // Channel status
}
```

### JSON File Structure

**users.json:**

```json
{
  "users": [
    {
      "id": "user_001",
      "username": "super",
      "email": "super@chatapp.com",
      "password": "123",
      "roles": ["superAdmin"],
      "groups": [],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "isActive": true
    }
  ],
  "metadata": {
    "lastModified": "2024-01-20T14:25:00.000Z",
    "version": "1.0",
    "totalUsers": 1,
    "nextId": "user_002"
  }
}
```

---

## Angular Architecture

### Components Structure

The Angular frontend follows a modular, component-based architecture:

**Core Components:**

- `LoginComponent`: User authentication interface
- `DashboardComponent`: Role-based main dashboard
- `HeaderComponent`: Navigation header with logout functionality
- `SidebarComponent`: Role-based navigation menu

**User Management Components (Super Admin only):**

- `UserListComponent`: Display all users in data table
- `UserCreateComponent`: Create new user form
- `UserEditComponent`: Edit user details and roles

**Group Management Components:**

- `GroupListComponent`: Display user's groups
- `GroupCreateComponent`: Create new group form
- `GroupDetailComponent`: Group management interface
- `GroupMembersComponent`: Manage group members

**Channel Management Components:**

- `ChannelListComponent`: Display group channels
- `ChannelCreateComponent`: Create new channel form
- `ChannelDetailComponent`: Channel management interface
- `ChannelMembersComponent`: Manage channel members

### Services Architecture

**AuthService:**

- `login(username, password)`: Authenticate user credentials
- `logout()`: Clear session and redirect to login
- `getCurrentUser()`: Get current logged-in user
- `hasRole(role)`: Check user permissions
- `isAuthenticated()`: Verify login status

**UserService:**

- `createUser(user)`: Create new user account
- `getAllUsers()`: Get all users (Super Admin only)
- `updateUser(user)`: Update user information
- `deleteUser(id)`: Remove user from system
- `promoteUser(id, roles)`: Change user role

**GroupService:**

- `createGroup(group)`: Create new group
- `getAllGroups()`: Get all accessible groups
- `updateGroup(group)`: Update group details
- `deleteGroup(id)`: Remove group
- `addUserToGroup(userId, groupId)`: Add member
- `removeUserFromGroup(userId, groupId)`: Remove member

**ChannelService:**

- `createChannel(channel)`: Create new channel
- `getChannelsByGroup(groupId)`: Get group's channels
- `updateChannel(channel)`: Update channel details
- `deleteChannel(id)`: Remove channel
- `addUserToChannel(userId, channelId)`: Add member
- `removeUserFromChannel(userId, channelId)`: Remove member

**StorageService:**

- `saveCurrentUser(user)`: Store user session in localStorage
- `loadCurrentUser()`: Retrieve current user from localStorage
- `clearCurrentUser()`: Remove user session on logout

### Route Guards

**AuthGuard:** Protects all authenticated routes
**SuperAdminGuard:** Restricts access to Super Admin features
**GroupAdminGuard:** Restricts access to Group Admin features

---

## REST API Documentation

### API Base URL: `http://localhost:3000/api`

### Authentication Routes

**POST /api/auth/login**

- **Purpose**: Authenticate user credentials and start session
- **Parameters**: `{ username: string, password: string }`
- **Returns**: `{ success: boolean, user: User, token?: string }`
- **Status Codes**: 200 (success), 401 (invalid credentials)

**POST /api/auth/logout**

- **Purpose**: End user session
- **Parameters**: None
- **Returns**: `{ success: boolean, message: string }`

**GET /api/auth/current**

- **Purpose**: Get current authenticated user information
- **Parameters**: None (uses session/token)
- **Returns**: `{ user: User }`

### User Management Routes

**GET /api/users** (Super Admin only)

- **Purpose**: Retrieve all system users
- **Returns**: `{ users: User[] }`

**POST /api/users**

- **Purpose**: Create new user account
- **Parameters**: `{ username: string, email: string, password: string, roles?: string[] }`
- **Returns**: `{ success: boolean, user: User }`

**GET /api/users/:id**

- **Purpose**: Get specific user by ID
- **Returns**: `{ user: User }`

**PUT /api/users/:id**

- **Purpose**: Update user information
- **Parameters**: `{ username?: string, email?: string, roles?: string[] }`
- **Returns**: `{ success: boolean, user: User }`

**DELETE /api/users/:id**

- **Purpose**: Remove user from system (Super Admin only)
- **Returns**: `{ success: boolean, message: string }`

### Group Management Routes

**GET /api/groups**

- **Purpose**: Get all groups (filtered by user permissions)
- **Returns**: `{ groups: Group[] }`

**POST /api/groups** (Group Admin+ only)

- **Purpose**: Create new group
- **Parameters**: `{ name: string, description?: string }`
- **Returns**: `{ success: boolean, group: Group }`

**GET /api/groups/:id**

- **Purpose**: Get specific group details
- **Returns**: `{ group: Group }`

**PUT /api/groups/:id** (Creator/Super Admin only)

- **Purpose**: Update group information
- **Parameters**: `{ name?: string, description?: string }`
- **Returns**: `{ success: boolean, group: Group }`

**DELETE /api/groups/:id** (Creator/Super Admin only)

- **Purpose**: Delete group and all associated channels
- **Returns**: `{ success: boolean, message: string }`

**POST /api/groups/:id/members** (Group Admin+ only)

- **Purpose**: Add user to group
- **Parameters**: `{ userId: string }`
- **Returns**: `{ success: boolean, message: string }`

**DELETE /api/groups/:id/members/:userId** (Group Admin+ only)

- **Purpose**: Remove user from group
- **Returns**: `{ success: boolean, message: string }`

### Channel Management Routes

**GET /api/channels/group/:groupId**

- **Purpose**: Get all channels in a specific group (members only)
- **Returns**: `{ channels: Channel[] }`

**POST /api/channels** (Group Admin+ only)

- **Purpose**: Create new channel within a group
- **Parameters**: `{ name: string, description?: string, groupId: string }`
- **Returns**: `{ success: boolean, channel: Channel }`

**PUT /api/channels/:id** (Creator/Super Admin only)

- **Purpose**: Update channel information
- **Parameters**: `{ name?: string, description?: string }`
- **Returns**: `{ success: boolean, channel: Channel }`

**DELETE /api/channels/:id** (Creator/Super Admin only)

- **Purpose**: Delete channel
- **Returns**: `{ success: boolean, message: string }`

**POST /api/channels/:id/members** (Group Admin+ only)

- **Purpose**: Add user to channel
- **Parameters**: `{ userId: string }`
- **Returns**: `{ success: boolean, message: string }`

**DELETE /api/channels/:id/members/:userId** (Group Admin+ only)

- **Purpose**: Remove user from channel
- **Returns**: `{ success: boolean, message: string }`

### Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable error message"
}
```

**HTTP Status Codes:**

- 200: Success
- 201: Created
- 400: Bad Request (validation errors)
- 401: Unauthorized (not logged in)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 409: Conflict (duplicate username/email)
- 500: Internal Server Error

---

## User Authentication & Roles

### Authentication System

**Login Process:**

1. User enters username and password
2. Server validates credentials against JSON user data
3. On success: User session stored in localStorage
4. Redirect to role-appropriate dashboard
5. On failure: Display error message

**Session Management:**

- User session stored in browser localStorage
- Session includes: user ID, username, email, roles, login timestamp
- Automatic logout after browser close or manual logout
- Session validation on each route change

**Logout Process:**

1. Clear all user data from localStorage
2. Reset application state
3. Redirect to login page
4. Display logout confirmation

### Role-Based Access Control

**Super Admin Capabilities:**

- Create, edit, and remove any user
- Promote users to Group Admin or Super Admin
- Access all groups and channels
- Full system administration rights

**Group Admin Capabilities:**

- Create new groups
- Create channels within their groups
- Add/remove users from their groups and channels
- Manage their group settings
- Cannot access other admins' groups

**Chat User (Regular User) Capabilities:**

- View groups they belong to
- View channels they have access to
- Join/leave groups (with admin approval)
- Basic profile management

### Local Storage Structure

```javascript
// Stored in localStorage with key 'currentUser'
{
  id: "user_001",
  username: "john_doe", 
  email: "john@example.com",
  roles: ["user"],
  groups: ["group_001"],
  loginTime: "2024-01-20T10:30:00.000Z",
  lastActivity: "2024-01-20T14:25:00.000Z"
}
```

---

## Professional Website Design

### Design Standards

The website maintains a professional appearance throughout all components using Bootstrap 5.x as the primary CSS framework.

**Framework & Styling:**

- **CSS Framework**: Bootstrap 5.x for rapid, professional UI development
- **Icons**: Bootstrap Icons for consistent iconography
- **Responsive Design**: Mobile-first approach using Bootstrap's grid system
- **Color Scheme**: Professional color palette with Bootstrap's utility classes
- **Typography**: Bootstrap's responsive typography system

**UI Components:**

- **Forms**: Professional form styling with Bootstrap validation classes
- **Navigation**: Responsive navbar with role-based menu items
- **Tables**: Clean data presentation with Bootstrap table classes
- **Cards**: Consistent card layouts for content organization
- **Modals**: Bootstrap modals for create/edit operations

**Accessibility Standards:**

- **WCAG 2.1**: Minimum AA compliance for accessibility
- **Keyboard Navigation**: All features accessible via keyboard
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Color Contrast**: Minimum 4.5:1 contrast ratio for text

---

## JSON Data Storage & Management

### File-Based Data Persistence

Phase 1 uses JSON files for data storage with automatic saves after every change:

**Data Files:**

- `server/data/users.json`: All user accounts and authentication data
- `server/data/groups.json`: All group information and memberships
- `server/data/channels.json`: All channel data and member lists

**Backup Strategy:**

- Automatic backup before each data modification
- Timestamped backup files in `server/data/backups/`
- 7-day retention policy for backup files

**Data Consistency:**

- Immediate save after any data modification
- File locking to prevent concurrent access issues
- Data validation before saving
- Error recovery from backup if save fails

### Default System Data

**Default Super Admin Account:**

- Username: `super`
- Password: `123`
- Email: `super@chatapp.com`
- Role: Super Admin

The system initializes with this default account on first startup, allowing immediate access for testing and user creation.

---

## Development Progress

### Phase 1 Requirements Status

- [ ] **Professional Website Design** - Bootstrap integration and responsive UI
- [ ] **User Authentication System** - Login/logout with localStorage persistence
- [ ] **Super Admin Features** - User creation, management, and role assignment
- [ ] **Group Admin Features** - Group/channel creation and member management
- [ ] **JSON Data Storage** - File-based persistence with automatic saves
- [ ] **Angular Architecture** - Component/service structure implementation
- [ ] **REST API** - Complete backend API with documented endpoints
- [ ] **Documentation** - Comprehensive README with implementation details

### Current Implementation Tasks

*This section will be updated as development progresses with specific features completed, challenges encountered, and solutions implemented.*

---

## Testing & Quality Assurance

### Testing Scenarios

**Authentication Testing:**

- [ ] Valid login credentials
- [ ] Invalid login credentials  
- [ ] Unauthorized route access attempts
- [ ] Role-based access control verification
- [ ] Session persistence across browser refresh
- [ ] Logout functionality

**User Management Testing (Super Admin):**

- [ ] Create new users with different roles
- [ ] Edit existing user information
- [ ] Promote users between roles
- [ ] Delete user accounts
- [ ] Prevent duplicate username/email creation

**Group Management Testing:**

- [ ] Create new groups
- [ ] Add/remove users from groups
- [ ] Edit group information
- [ ] Delete groups and associated channels
- [ ] Access control for group operations

**Channel Management Testing:**

- [ ] Create channels within groups
- [ ] Add/remove users from channels
- [ ] Edit channel information
- [ ] Delete channels
- [ ] Channel access restrictions

---

## Installation & Setup Instructions

### Prerequisites

- Node.js (v16+ recommended)
- npm (v8+ recommended)
- Angular CLI (v15+ recommended)

### Frontend Setup (Angular)

```bash
cd client
npm install
ng serve
# Application runs on http://localhost:4200
```

### Backend Setup (Node.js)

```bash
cd server
npm install
node server.js
# API server runs on http://localhost:3000
```

### Default Login

- Username: `super`
- Password: `123`

---

## Future Enhancements (Phase 2)

- MongoDB database integration
- Socket.io for real-time chat messaging
- Image upload and user avatars
- PeerJS video chat functionality
- Enhanced UI/UX improvements
- Mobile application development

---

## Assignment Submission

**Deliverables:**

1. Complete Angular frontend application
2. Functional Node.js backend with REST API
3. JSON data files with sample data
4. This comprehensive README documentation
5. Git repository with commit history

**Evaluation Criteria Met:**

- ✅ Professional website design with Bootstrap
- ✅ User authentication with localStorage
- ✅ Role-based access control (Super Admin, Group Admin, User)
- ✅ JSON file data persistence
- ✅ Complete REST API documentation
- ✅ Angular architecture with proper component/service structure
- ✅ Git repository organization and version control
- ✅ Comprehensive data structure documentation
