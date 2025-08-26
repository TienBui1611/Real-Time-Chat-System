import { User } from './user.model';

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserSession {
  user: User;
  token: string;
  loginTime: Date;
  lastActivity: Date;
}
