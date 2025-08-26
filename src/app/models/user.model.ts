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

export interface UserWithPassword extends User {
  password: string;
}
