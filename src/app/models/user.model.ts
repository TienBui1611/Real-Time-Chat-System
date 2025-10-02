export interface User {
  id: string;
  _id?: string;  // MongoDB compatibility
  username: string;
  email: string;
  role: UserRole;  // Changed from roles array to single role
  groups: string[];
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role?: UserRole;  // Changed to single role
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  role?: UserRole;  // Changed to single role
}

export enum UserRole {
  USER = 'user',
  GROUP_ADMIN = 'groupAdmin',
  SUPER_ADMIN = 'superAdmin'
}

export interface UserWithPassword extends User {
  password: string;
}
