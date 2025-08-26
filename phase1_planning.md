# 3813ICT Assignment Phase 1 - Chat System Planning & Implementation

## Project Overview

Building a text/video chat system using the MEAN stack with three user permission levels. Phase 1 focuses on planning, documentation, user authentication, and basic UI implementation with local storage.

**📊 Implementation Status:** Project foundation completed with Angular 18 + Bootstrap 5 frontend, Node.js Express backend, JSON file storage system, and professional development workflow. Ready for authentication and user management implementation.

## Marking Criteria Addressed

This document specifically addresses all marking criteria for Assignment Phase 1:

1. ✅ **Professional Website Design** - Detailed UI/UX requirements and design specifications
2. ✅ **User Authentication System** - Complete login/logout with session management
3. ✅ **Local Storage Implementation** - Username persistence and data management
4. ✅ **Super Admin Functionality** - User creation, management, and removal capabilities
5. ✅ **Group Admin Functionality** - Group/channel creation and user management
6. ✅ **JSON Data Storage** - File-based data persistence with regular saves
7. ✅ **Git Repository Layout** - Version control strategy and repository structure
8. ✅ **Data Structures Documentation** - Comprehensive data model descriptions
9. ✅ **REST API Documentation** - Complete route specifications with parameters and returns
10. ✅ **Angular Architecture** - Components, services, and models detailed breakdown

## Phase 1 Requirements Checklist

### ✅ Must Implement

- [ ] **Documentation & Planning** - Complete design documentation
- [ ] **Professional Website Design** - Modern, responsive UI with professional appearance
- [ ] **User Authentication** - Role-based login system with session persistence
- [ ] **Local Storage Integration** - Username and session data persistence
- [ ] **Super Admin Features** - User creation, management, and removal
- [ ] **Group Admin Features** - Group/channel creation and user management  
- [ ] **JSON File Storage** - Data persistence to text files
- [ ] **REST API** - Complete server-side API with documented routes
- [ ] **Angular Architecture** - Proper component/service/model structure

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

## Professional Website Design Requirements

### Design Standards

The website must maintain a professional appearance throughout all components:

#### Framework & Styling

- **CSS Framework**: Bootstrap 5.x for rapid, professional UI development
- **Icons**: Bootstrap Icons for consistent iconography
- **Responsive Design**: Mobile-first approach using Bootstrap's grid system
- **Color Scheme**: Professional color palette with Bootstrap's utility classes
- **Typography**: Bootstrap's responsive typography system

#### UI Components

- **Forms**: Professional form styling with Bootstrap validation classes
- **Navigation**: Responsive navbar with role-based menu items
- **Tables**: Clean data presentation with Bootstrap table classes
- **Cards**: Consistent card layouts for content organization
- **Modals**: Bootstrap modals for create/edit operations

#### Accessibility Standards

- **WCAG 2.1**: Minimum AA compliance for accessibility
- **Keyboard Navigation**: All features accessible via keyboard
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Color Contrast**: Minimum 4.5:1 contrast ratio for text

---

## Detailed Angular Architecture

### Components Architecture

The Angular frontend follows a modular, component-based architecture with clear separation of concerns:

#### Core Components Structure

```
src/app/
├── components/
│   ├── shared/                    // Reusable UI components
│   │   ├── header/
│   │   │   ├── header.component.ts        // Navigation header with role-based menu
│   │   │   ├── header.component.html      // Header template with logout functionality
│   │   │   └── header.component.scss      // Professional styling
│   │   ├── sidebar/
│   │   │   ├── sidebar.component.ts       // Role-based navigation sidebar
│   │   │   ├── sidebar.component.html     // Dynamic menu based on user permissions
│   │   │   └── sidebar.component.scss     // Responsive sidebar styling
│   │   ├── loading/
│   │   │   ├── loading.component.ts       // Loading spinner component
│   │   │   └── loading.component.html     // Loading animation
│   │   └── confirmation-dialog/
│   │       ├── confirmation-dialog.component.ts  // Reusable confirmation modal
│   │       └── confirmation-dialog.component.html
│   ├── auth/
│   │   └── login/
│   │       ├── login.component.ts         // Login form with validation
│   │       ├── login.component.html       // Professional login form
│   │       ├── login.component.scss       // Modern login page styling
│   │       └── login.component.spec.ts    // Unit tests
│   ├── dashboard/
│   │   ├── dashboard.component.ts         // Main dashboard controller
│   │   ├── dashboard.component.html       // Role-based dashboard layout
│   │   ├── dashboard.component.scss       // Dashboard styling
│   │   └── dashboard.component.spec.ts    // Unit tests
│   ├── users/                             // User management (Super Admin only)
│   │   ├── user-list/
│   │   │   ├── user-list.component.ts     // Display all users in data table
│   │   │   ├── user-list.component.html   // Users table with search/sort
│   │   │   └── user-list.component.scss   // Table styling
│   │   ├── user-create/
│   │   │   ├── user-create.component.ts   // Create new user form
│   │   │   ├── user-create.component.html // User creation form
│   │   │   └── user-create.component.scss // Form styling
│   │   └── user-edit/
│   │       ├── user-edit.component.ts     // Edit user details and roles
│   │       ├── user-edit.component.html   // User editing form
│   │       └── user-edit.component.scss   // Form styling
│   ├── groups/                            // Group management
│   │   ├── group-list/
│   │   │   ├── group-list.component.ts    // Display user's groups
│   │   │   ├── group-list.component.html  // Groups grid/list view
│   │   │   └── group-list.component.scss  // Groups display styling
│   │   ├── group-create/
│   │   │   ├── group-create.component.ts  // Create new group
│   │   │   ├── group-create.component.html // Group creation form
│   │   │   └── group-create.component.scss // Form styling
│   │   ├── group-detail/
│   │   │   ├── group-detail.component.ts  // Group management interface
│   │   │   ├── group-detail.component.html // Group details with member management
│   │   │   └── group-detail.component.scss // Detail page styling
│   │   └── group-members/
│   │       ├── group-members.component.ts  // Manage group members
│   │       ├── group-members.component.html // Member list with add/remove
│   │       └── group-members.component.scss // Members management styling
│   ├── channels/                          // Channel management
│   │   ├── channel-list/
│   │   │   ├── channel-list.component.ts  // Display group channels
│   │   │   ├── channel-list.component.html // Channels within a group
│   │   │   └── channel-list.component.scss // Channel list styling
│   │   ├── channel-create/
│   │   │   ├── channel-create.component.ts // Create new channel
│   │   │   ├── channel-create.component.html // Channel creation form
│   │   │   └── channel-create.component.scss // Form styling
│   │   ├── channel-detail/
│   │   │   ├── channel-detail.component.ts // Channel management
│   │   │   ├── channel-detail.component.html // Channel details and settings
│   │   │   └── channel-detail.component.scss // Detail styling
│   │   └── channel-members/
│   │       ├── channel-members.component.ts // Manage channel members
│   │       ├── channel-members.component.html // Member management interface
│   │       └── channel-members.component.scss // Members styling
│   └── chat/                              // Placeholder for Phase 2
│       ├── chat-room/
│       │   ├── chat-room.component.ts     // Chat interface placeholder
│       │   ├── chat-room.component.html   // Chat UI layout
│       │   └── chat-room.component.scss   // Chat styling
│       └── chat-list/
│           ├── chat-list.component.ts     // Available chats list
│           ├── chat-list.component.html   // Channels user can access
│           └── chat-list.component.scss   // Chat list styling
├── services/                              // Business logic and API communication
├── models/                                // TypeScript interfaces and types
├── guards/                                // Route protection
├── interceptors/                          // HTTP interceptors
├── pipes/                                 // Custom pipes for data transformation
└── directives/                            // Custom directives
```

### Services Architecture

Angular services handle all business logic, API communication, and state management:

#### AuthService (`src/app/services/auth.service.ts`)

```typescript
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  // Methods:
  login(username: string, password: string): Observable<AuthResponse>
  logout(): void
  getCurrentUser(): User | null
  hasRole(role: string): boolean
  hasAnyRole(roles: string[]): boolean
  isAuthenticated(): boolean
  isSuper Admin(): boolean
  isGroupAdmin(): boolean
  refreshToken(): Observable<AuthResponse>
}
```

#### UserService (`src/app/services/user.service.ts`)

```typescript
@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  // CRUD Operations:
  createUser(user: CreateUserRequest): Observable<User>
  getAllUsers(): Observable<User[]>
  getUserById(id: string): Observable<User>
  updateUser(id: string, user: UpdateUserRequest): Observable<User>
  deleteUser(id: string): Observable<void>
  promoteUser(id: string, roles: string[]): Observable<User>
  searchUsers(query: string): Observable<User[]>
  validateUsername(username: string): Observable<boolean>
  validateEmail(email: string): Observable<boolean>
}
```

#### GroupService (`src/app/services/group.service.ts`)

```typescript
@Injectable({
  providedIn: 'root'
})
export class GroupService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  // Group Management:
  createGroup(group: CreateGroupRequest): Observable<Group>
  getAllGroups(): Observable<Group[]>
  getGroupById(id: string): Observable<Group>
  getGroupsByUser(userId: string): Observable<Group[]>
  updateGroup(id: string, group: UpdateGroupRequest): Observable<Group>
  deleteGroup(id: string): Observable<void>
  
  // Member Management:
  addUserToGroup(groupId: string, userId: string): Observable<void>
  removeUserFromGroup(groupId: string, userId: string): Observable<void>
  getGroupMembers(groupId: string): Observable<User[]>
  getUserGroups(userId: string): Observable<Group[]>
  
  // Permission Checks:
  canManageGroup(groupId: string): Observable<boolean>
  isGroupMember(groupId: string, userId?: string): Observable<boolean>
}
```

#### ChannelService (`src/app/services/channel.service.ts`)

```typescript
@Injectable({
  providedIn: 'root'
})
export class ChannelService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  // Channel Management:
  createChannel(channel: CreateChannelRequest): Observable<Channel>
  getChannelsByGroup(groupId: string): Observable<Channel[]>
  getChannelById(id: string): Observable<Channel>
  updateChannel(id: string, channel: UpdateChannelRequest): Observable<Channel>
  deleteChannel(id: string): Observable<void>
  
  // Member Management:
  addUserToChannel(channelId: string, userId: string): Observable<void>
  removeUserFromChannel(channelId: string, userId: string): Observable<void>
  getChannelMembers(channelId: string): Observable<User[]>
  getUserChannels(userId: string): Observable<Channel[]>
  
  // Permission Checks:
  canAccessChannel(channelId: string): Observable<boolean>
  canManageChannel(channelId: string): Observable<boolean>
}
```

#### StorageService (`src/app/services/storage.service.ts`)

```typescript
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  // Local Storage Management:
  save<T>(key: string, data: T): void
  load<T>(key: string): T | null
  remove(key: string): void
  clear(): void
  exists(key: string): boolean
  
  // Specific Storage Methods:
  saveCurrentUser(user: User): void
  loadCurrentUser(): User | null
  clearCurrentUser(): void
  saveUserSession(session: UserSession): void
  loadUserSession(): UserSession | null
  
  // Data Synchronization:
  syncToServer(): Observable<void>
  loadFromServer(): Observable<void>
  isDataStale(): boolean
}
```

### Models Architecture

TypeScript interfaces define the data structures used throughout the application:

#### Core Models (`src/app/models/`)

```typescript
// user.model.ts
export interface User {
  id: string;
  username: string;
  email: string;
  roles: UserRole[];
  groups: string[];
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  roles?: UserRole[];
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  roles?: UserRole[];
}

export enum UserRole {
  USER = 'user',
  GROUP_ADMIN = 'groupAdmin',
  SUPER_ADMIN = 'superAdmin'
}

// group.model.ts
export interface Group {
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

export interface CreateGroupRequest {
  name: string;
  description?: string;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
}

// channel.model.ts
export interface Channel {
  id: string;
  name: string;
  description: string;
  groupId: string;
  createdBy: string;
  members: string[];
  createdAt: Date;
  isActive: boolean;
}

export interface CreateChannelRequest {
  name: string;
  description?: string;
  groupId: string;
}

export interface UpdateChannelRequest {
  name?: string;
  description?: string;
}

// auth.model.ts
export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export interface UserSession {
  user: User;
  token: string;
  loginTime: Date;
  lastActivity: Date;
}
```

### Guards Architecture

Route guards implement role-based access control:

#### AuthGuard (`src/app/guards/auth.guard.ts`)

```typescript
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }
    
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}
```

#### SuperAdminGuard (`src/app/guards/super-admin.guard.ts`)

```typescript
@Injectable({
  providedIn: 'root'
})
export class SuperAdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.isSuper Admin()) {
      return true;
    }
    
    this.router.navigate(['/dashboard']);
    return false;
  }
}
```

#### GroupAdminGuard (`src/app/guards/group-admin.guard.ts`)

```typescript
@Injectable({
  providedIn: 'root'
})
export class GroupAdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.hasAnyRole(['groupAdmin', 'superAdmin'])) {
      return true;
    }
    
    this.router.navigate(['/dashboard']);
    return false;
  }
}
```

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

## JSON Data Storage & File Management System

### Data Persistence Requirements

Phase 1 requires all data to be stored in JSON format within text files, with regular saves after every data change. This simulates database functionality while maintaining simplicity.

#### File Structure for Data Storage

```
server/data/
├── users.json              // All user accounts and authentication data
├── groups.json             // All group information and memberships  
├── channels.json           // All channel data and member lists
├── sessions.json           // Active user sessions (optional)
└── backups/                // Automatic backups directory
    ├── users_backup_YYYYMMDD_HHMMSS.json
    ├── groups_backup_YYYYMMDD_HHMMSS.json
    └── channels_backup_YYYYMMDD_HHMMSS.json
```

#### JSON Data Format Specifications

**users.json Structure:**

```json
{
  "users": [
    {
      "id": "user_001",
      "username": "super",
      "email": "super@chatapp.com",
      "password": "123",
      "roles": ["superAdmin"],
      "groups": ["group_001", "group_002"],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "lastLogin": "2024-01-20T14:25:00.000Z",
      "isActive": true
    },
    {
      "id": "user_002", 
      "username": "john_doe",
      "email": "john@example.com",
      "password": "password123",
      "roles": ["user"],
      "groups": ["group_001"],
      "createdAt": "2024-01-16T09:15:00.000Z",
      "lastLogin": "2024-01-20T11:45:00.000Z",
      "isActive": true
    }
  ],
  "metadata": {
    "lastModified": "2024-01-20T14:25:00.000Z",
    "version": "1.0",
    "totalUsers": 2,
    "nextId": "user_003"
  }
}
```

**groups.json Structure:**

```json
{
  "groups": [
    {
      "id": "group_001",
      "name": "General Discussion",
      "description": "Main discussion group for all team members",
      "createdBy": "user_001",
      "admins": ["user_001"],
      "members": ["user_001", "user_002"],
      "channels": ["channel_001", "channel_002"],
      "createdAt": "2024-01-15T10:35:00.000Z",
      "isActive": true
    }
  ],
  "metadata": {
    "lastModified": "2024-01-20T14:25:00.000Z",
    "version": "1.0",
    "totalGroups": 1,
    "nextId": "group_002"
  }
}
```

**channels.json Structure:**

```json
{
  "channels": [
    {
      "id": "channel_001",
      "name": "general",
      "description": "General discussion channel",
      "groupId": "group_001",
      "createdBy": "user_001",
      "members": ["user_001", "user_002"],
      "createdAt": "2024-01-15T10:40:00.000Z",
      "isActive": true
    }
  ],
  "metadata": {
    "lastModified": "2024-01-20T14:25:00.000Z",
    "version": "1.0",
    "totalChannels": 1,
    "nextId": "channel_002"
  }
}
```

### Data Management Service Implementation

#### FileStorageService (`server/services/fileStorage.js`)

```javascript
const fs = require('fs').promises;
const path = require('path');

class FileStorageService {
  constructor() {
    this.dataPath = path.join(__dirname, '../data');
    this.backupPath = path.join(this.dataPath, 'backups');
    this.initializeStorage();
  }

  // Core Methods:
  async readData(filename) {
    // Read and parse JSON file
    // Return data with error handling
  }

  async writeData(filename, data) {
    // Create backup before writing
    // Write data to JSON file
    // Update metadata (lastModified, version)
    // Trigger auto-backup if configured
  }

  async createBackup(filename) {
    // Create timestamped backup file
    // Maintain backup retention policy
  }

  async initializeStorage() {
    // Create directories if they don't exist
    // Initialize default data files
    // Set up default Super Admin account
  }

  // Specific Data Access Methods:
  async getUsers() { return this.readData('users.json'); }
  async saveUsers(users) { return this.writeData('users.json', users); }
  async getGroups() { return this.readData('groups.json'); }
  async saveGroups(groups) { return this.writeData('groups.json', groups); }
  async getChannels() { return this.readData('channels.json'); }
  async saveChannels(channels) { return this.writeData('channels.json', channels); }
}
```

### Data Consistency & Integrity

#### Automatic Save Triggers

All data modifications must trigger immediate saves to maintain consistency:

```javascript
// User Operations
await userService.createUser(userData);
await fileStorage.saveUsers(updatedUsersList);  // Immediate save

// Group Operations  
await groupService.addUserToGroup(userId, groupId);
await fileStorage.saveGroups(updatedGroupsList);  // Immediate save

// Channel Operations
await channelService.createChannel(channelData);
await fileStorage.saveChannels(updatedChannelsList);  // Immediate save
```

#### Data Validation & Backup Strategy

```javascript
// Data Validation Before Save
const validateData = (data, schema) => {
  // Validate against JSON schema
  // Check for required fields
  // Verify data relationships (foreign keys)
  // Return validation results
};

// Automatic Backup Strategy
const backupSchedule = {
  frequency: 'afterEveryChange',  // Phase 1 requirement
  retention: '7days',             // Keep backups for 7 days
  compression: false,             // Keep as readable JSON
  verification: true              // Verify backup integrity
};
```

#### Error Handling & Recovery

```javascript
// File Operation Error Handling
try {
  await fileStorage.saveUsers(userData);
} catch (error) {
  console.error('Save failed:', error);
  
  // Attempt recovery from backup
  await fileStorage.recoverFromBackup('users.json');
  
  // Log error for debugging
  await errorLogger.log('DATA_SAVE_FAILED', error);
  
  // Return error response to client
  return { success: false, error: 'Data save failed' };
}
```

#### Concurrency & Data Locking

```javascript
// Simple file locking for concurrent access
class DataLockManager {
  constructor() {
    this.locks = new Map();
  }

  async acquireLock(filename) {
    // Wait for existing lock to release
    // Acquire lock for file operations
    // Return lock token
  }

  async releaseLock(filename, token) {
    // Verify token matches
    // Release file lock
    // Process queued operations
  }
}
```

### Default Data Setup

#### Initial System Data

The system will initialize with default data on first startup:

```javascript
// Default Super Admin Account
const defaultSuperAdmin = {
  id: 'user_001',
  username: 'super',
  email: 'super@chatapp.com', 
  password: '123',
  roles: ['superAdmin'],
  groups: [],
  createdAt: new Date().toISOString(),
  isActive: true
};

// Default Group for Testing
const defaultGroup = {
  id: 'group_001',
  name: 'General Discussion',
  description: 'Default group for system testing',
  createdBy: 'user_001',
  admins: ['user_001'],
  members: ['user_001'],
  channels: ['channel_001'],
  createdAt: new Date().toISOString(),
  isActive: true
};

// Default Channel for Testing
const defaultChannel = {
  id: 'channel_001',
  name: 'general',
  description: 'Default channel for system testing',
  groupId: 'group_001',
  createdBy: 'user_001',
  members: ['user_001'],
  createdAt: new Date().toISOString(),
  isActive: true
};
```

### Performance Considerations

#### File I/O Optimization

```javascript
// Batch Operations for Better Performance
class BatchProcessor {
  constructor() {
    this.pendingOperations = [];
    this.batchTimeout = 100; // ms
  }

  async queueOperation(operation) {
    this.pendingOperations.push(operation);
    
    // Process batch after timeout or when batch is full
    if (this.pendingOperations.length >= 10) {
      await this.processBatch();
    }
  }

  async processBatch() {
    // Process all pending operations together
    // Reduce file I/O overhead
    // Maintain data consistency
  }
}
```

#### Memory Management

```javascript
// Efficient Data Loading and Caching
class DataCache {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async getData(filename) {
    // Check cache first
    // Load from file if not cached or expired
    // Update cache with fresh data
    // Return cached data
  }

  invalidateCache(filename) {
    // Clear specific file from cache
    // Force reload on next access
  }
}
```

---

## Git Repository Structure & Version Control Strategy

### Repository Organization

The git repository follows a clear, organized structure that separates frontend, backend, and documentation:

```
3813ICT_Assignment/
├── .gitignore                    // Ignore node_modules, dist, logs, etc.
├── README.md                     // This comprehensive documentation
├── package.json                  // Root package.json for scripts
├── client/                       // Angular frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/       // All Angular components
│   │   │   ├── services/         // All Angular services
│   │   │   ├── models/           // TypeScript interfaces
│   │   │   ├── guards/           // Route guards
│   │   │   └── app.module.ts     // Root module
│   │   ├── assets/               // Static assets (images, styles)
│   │   ├── environments/         // Environment configurations
│   │   └── index.html            // Main HTML file
│   ├── angular.json              // Angular CLI configuration
│   ├── package.json              // Frontend dependencies
│   └── tsconfig.json             // TypeScript configuration
├── server/                       // Node.js backend application
│   ├── routes/                   // Express route handlers
│   │   ├── auth.js               // Authentication routes
│   │   ├── users.js              // User management routes
│   │   ├── groups.js             // Group management routes
│   │   └── channels.js           // Channel management routes
│   ├── middleware/               // Express middleware
│   │   ├── auth.js               // Authentication middleware
│   │   └── validation.js         // Input validation middleware
│   ├── services/                 // Business logic services
│   │   ├── fileStorage.js        // JSON file management
│   │   ├── userService.js        // User business logic
│   │   ├── groupService.js       // Group business logic
│   │   └── channelService.js     // Channel business logic
│   ├── models/                   // Data models and schemas
│   │   ├── User.js               // User model
│   │   ├── Group.js              // Group model
│   │   └── Channel.js            // Channel model
│   ├── data/                     // JSON data files (not committed)
│   │   ├── users.json            // User data
│   │   ├── groups.json           // Group data
│   │   ├── channels.json         // Channel data
│   │   └── backups/              // Backup files
│   ├── server.js                 // Main server entry point
│   └── package.json              // Backend dependencies
├── docs/                         // Additional documentation
│   ├── api-documentation.md      // Detailed API docs
│   ├── setup-instructions.md     // Setup and installation guide
│   └── testing-guide.md          // Testing procedures
└── scripts/                      // Utility scripts
    ├── setup.sh                  // Environment setup script
    ├── start-dev.sh              // Development startup script
    └── backup-data.sh            // Data backup script
```

### Version Control Approach

#### Branching Strategy

- `main`: Stable, production-ready code. Only thoroughly tested and reviewed code is merged here.
- `tien`: My dedicated development branch for all feature work and ongoing development on my personal computer.

#### Commit Practices

- **Daily Progress**: At least one meaningful commit per day during active development periods.
- **Feature Milestones**: Commit after completing each distinct feature or task.
- **Bug Fixes**: Commit immediately after resolving bugs to maintain a clear history.
- **Documentation**: Update and commit documentation in sync with related code changes.

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

## Complete REST API Documentation

### API Base URL: `http://localhost:3000/api`

#### Authentication Routes (`/api/auth`)

**POST /api/auth/login**

- **Purpose**: Authenticate user credentials and start session
- **Parameters**:

  ```json
  {
    "username": "string (required)",
    "password": "string (required)"
  }
  ```

- **Return Values**:

  ```json
  {
    "success": true,
    "user": {
      "id": "string",
      "username": "string", 
      "email": "string",
      "roles": ["string"]
    },
    "token": "string"
  }
  ```

- **Error Response**:

  ```json
  {
    "success": false,
    "message": "Invalid credentials"
  }
  ```

**POST /api/auth/logout**

- **Purpose**: End user session and clear authentication
- **Parameters**: None (uses session/token)
- **Return Values**:

  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

**GET /api/auth/current**

- **Purpose**: Get current authenticated user information
- **Parameters**: None (uses session/token)
- **Return Values**:

  ```json
  {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string", 
      "roles": ["string"],
      "groups": ["string"]
    }
  }
  ```

#### User Routes (`/api/users`)

**GET /api/users**

- **Purpose**: Retrieve all system users (Super Admin only)
- **Parameters**: None
- **Return Values**:

  ```json
  {
    "users": [
      {
        "id": "string",
        "username": "string",
        "email": "string",
        "roles": ["string"],
        "groups": ["string"],
        "createdAt": "ISO date string"
      }
    ]
  }
  ```

**POST /api/users**

- **Purpose**: Create new user account
- **Parameters**:

  ```json
  {
    "username": "string (required, unique)",
    "email": "string (required, unique)",
    "password": "string (required)",
    "roles": ["string"] // optional, defaults to ['user']
  }
  ```

- **Return Values**:

  ```json
  {
    "success": true,
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "roles": ["string"]
    }
  }
  ```

**GET /api/users/:id**

- **Purpose**: Get specific user by ID
- **Parameters**: `id` (URL parameter)
- **Return Values**:

  ```json
  {
    "user": {
      "id": "string",
      "username": "string", 
      "email": "string",
      "roles": ["string"],
      "groups": ["string"]
    }
  }
  ```

**PUT /api/users/:id**

- **Purpose**: Update user information
- **Parameters**:

  ```json
  {
    "username": "string (optional)",
    "email": "string (optional)",
    "roles": ["string"] // Super Admin only
  }
  ```

- **Return Values**:

  ```json
  {
    "success": true,
    "user": {
      "id": "string",
      "username": "string",
      "email": "string", 
      "roles": ["string"]
    }
  }
  ```

**DELETE /api/users/:id**

- **Purpose**: Remove user from system (Super Admin only)
- **Parameters**: `id` (URL parameter)
- **Return Values**:

  ```json
  {
    "success": true,
    "message": "User deleted successfully"
  }
  ```

**PUT /api/users/:id/promote**

- **Purpose**: Change user role/permissions (Super Admin only)
- **Parameters**:

  ```json
  {
    "roles": ["string"] // new role array
  }
  ```

- **Return Values**:

  ```json
  {
    "success": true,
    "user": {
      "id": "string",
      "username": "string",
      "roles": ["string"]
    }
  }
  ```

#### Group Routes (`/api/groups`)

**GET /api/groups**

- **Purpose**: Get all groups (filtered by user permissions)
- **Parameters**: None
- **Return Values**:

  ```json
  {
    "groups": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "createdBy": "string",
        "admins": ["string"],
        "members": ["string"],
        "channels": ["string"],
        "createdAt": "ISO date string"
      }
    ]
  }
  ```

**POST /api/groups**

- **Purpose**: Create new group (Group Admin+ only)
- **Parameters**:

  ```json
  {
    "name": "string (required, unique)",
    "description": "string (optional)"
  }
  ```

- **Return Values**:

  ```json
  {
    "success": true,
    "group": {
      "id": "string",
      "name": "string",
      "description": "string",
      "createdBy": "string",
      "admins": ["string"],
      "members": ["string"],
      "channels": []
    }
  }
  ```

**GET /api/groups/:id**

- **Purpose**: Get specific group details
- **Parameters**: `id` (URL parameter)
- **Return Values**:

  ```json
  {
    "group": {
      "id": "string",
      "name": "string",
      "description": "string",
      "createdBy": "string",
      "admins": ["string"],
      "members": ["string"], 
      "channels": ["string"]
    }
  }
  ```

**PUT /api/groups/:id**

- **Purpose**: Update group information (Creator/Super Admin only)
- **Parameters**:

  ```json
  {
    "name": "string (optional)",
    "description": "string (optional)"
  }
  ```

- **Return Values**:

  ```json
  {
    "success": true,
    "group": {
      "id": "string",
      "name": "string",
      "description": "string"
    }
  }
  ```

**DELETE /api/groups/:id**

- **Purpose**: Delete group and all associated channels (Creator/Super Admin only)
- **Parameters**: `id` (URL parameter)
- **Return Values**:

  ```json
  {
    "success": true,
    "message": "Group and associated channels deleted successfully"
  }
  ```

**POST /api/groups/:id/members**

- **Purpose**: Add user to group (Group Admin+ only)
- **Parameters**:

  ```json
  {
    "userId": "string (required)"
  }
  ```

- **Return Values**:

  ```json
  {
    "success": true,
    "message": "User added to group successfully"
  }
  ```

**DELETE /api/groups/:id/members/:userId**

- **Purpose**: Remove user from group (Group Admin+ only)
- **Parameters**: `id`, `userId` (URL parameters)
- **Return Values**:

  ```json
  {
    "success": true,
    "message": "User removed from group successfully"
  }
  ```

#### Channel Routes (`/api/channels`)

**GET /api/channels/group/:groupId**

- **Purpose**: Get all channels in a specific group (members only)
- **Parameters**: `groupId` (URL parameter)
- **Return Values**:

  ```json
  {
    "channels": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "groupId": "string",
        "createdBy": "string",
        "members": ["string"],
        "createdAt": "ISO date string"
      }
    ]
  }
  ```

**POST /api/channels**

- **Purpose**: Create new channel within a group (Group Admin+ only)
- **Parameters**:

  ```json
  {
    "name": "string (required)",
    "description": "string (optional)",
    "groupId": "string (required)"
  }
  ```

- **Return Values**:

  ```json
  {
    "success": true,
    "channel": {
      "id": "string",
      "name": "string",
      "description": "string",
      "groupId": "string",
      "createdBy": "string",
      "members": []
    }
  }
  ```

**GET /api/channels/:id**

- **Purpose**: Get specific channel details (members only)
- **Parameters**: `id` (URL parameter)
- **Return Values**:

  ```json
  {
    "channel": {
      "id": "string",
      "name": "string",
      "description": "string",
      "groupId": "string",
      "createdBy": "string",
      "members": ["string"]
    }
  }
  ```

**PUT /api/channels/:id**

- **Purpose**: Update channel information (Creator/Super Admin only)
- **Parameters**:

  ```json
  {
    "name": "string (optional)",
    "description": "string (optional)"
  }
  ```

- **Return Values**:

  ```json
  {
    "success": true,
    "channel": {
      "id": "string",
      "name": "string",
      "description": "string"
    }
  }
  ```

**DELETE /api/channels/:id**

- **Purpose**: Delete channel (Creator/Super Admin only)
- **Parameters**: `id` (URL parameter)
- **Return Values**:

  ```json
  {
    "success": true,
    "message": "Channel deleted successfully"
  }
  ```

**POST /api/channels/:id/members**

- **Purpose**: Add user to channel (Group Admin+ only)
- **Parameters**:

  ```json
  {
    "userId": "string (required)"
  }
  ```

- **Return Values**:

  ```json
  {
    "success": true,
    "message": "User added to channel successfully"
  }
  ```

**DELETE /api/channels/:id/members/:userId**

- **Purpose**: Remove user from channel (Group Admin+ only)
- **Parameters**: `id`, `userId` (URL parameters)
- **Return Values**:

  ```json
  {
    "success": true,
    "message": "User removed from channel successfully"
  }
  ```

### API Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "details": {} // Optional additional error details
}
```

Common HTTP Status Codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate username/email)
- `500` - Internal Server Error

---

## Implementation Tasks

### ✅ Project Setup & Planning - COMPLETED

- [x] Set up Angular project structure with Bootstrap 5 integration
- [x] Set up Node.js server structure with Express and file storage
- [x] Create TypeScript data models and interfaces (User, Group, Channel, Auth)
- [x] Implement JSON file storage system with automatic backups
- [x] Create authentication and route guard foundations
- [x] Set up development workflow with concurrent scripts
- [x] Write comprehensive documentation (README.md)
- [x] Project restructuring (moved from client/ to root structure)

### 🔄 Next Phase: Authentication & User Management

- [ ] Complete authentication service implementation
- [ ] Implement login/logout functionality with localStorage
- [ ] Create user registration system
- [ ] Complete role-based guards implementation
- [ ] Implement user CRUD operations (Super Admin)
- [ ] Create user management UI components

### 🔄 Future Phase: Group & Channel Management

- [ ] Implement group CRUD operations
- [ ] Create group management UI components
- [ ] Implement channel CRUD operations  
- [ ] Create channel management UI components
- [ ] Set up navigation between components
- [ ] Complete member management functionality

### 🔄 Final Phase: Integration & Testing

- [ ] Connect frontend to backend APIs
- [ ] Complete local storage persistence implementation
- [ ] Test all user workflows and role-based access
- [ ] Create placeholder chat interface components
- [ ] Complete all CRUD operations testing
- [ ] Finalize documentation and submission preparation

### 📊 Current Status Summary

**✅ Completed Foundation:**

- Angular 18 + Bootstrap 5 + Node.js Express setup
- JSON file storage with automatic backups
- TypeScript models and interfaces
- Professional UI framework and routing structure
- Development workflow and documentation

**🎯 Ready for Next Phase:**

- Authentication implementation
- User management features
- Group and channel management
- Complete role-based access control

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

- **Branching Model:** Use a `main` branch for stable releases and a dedicated development branch (e.g., `tien`) for ongoing work. Feature branches may be created for major features or bug fixes.
- **Commit Practices:** Make frequent, descriptive commits (at least daily during active development). Use clear commit messages that summarize the changes.
- **.gitignore:** Ensure `node_modules`, environment files, and sensitive data are excluded from version control.
- **Backup:** Regularly push local changes to the remote repository to prevent data loss.

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
