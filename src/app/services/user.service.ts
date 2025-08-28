import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, UserRole, CreateUserRequest, UpdateUserRequest } from '../models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = 'http://localhost:3000/api/users';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getAuthToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Get all users (Super Admin only)
  getAllUsers(): Observable<{ users: User[] }> {
    return this.http.get<{ users: User[] }>(this.API_URL, {
      headers: this.getAuthHeaders()
    });
  }

  // Get user by ID
  getUserById(id: string): Observable<{ user: User }> {
    return this.http.get<{ user: User }>(`${this.API_URL}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Create new user
  createUser(userRequest: CreateUserRequest): Observable<{ success: boolean; user: User; message?: string }> {
    return this.http.post<{ success: boolean; user: User; message?: string }>(this.API_URL, userRequest, {
      headers: this.getAuthHeaders()
    });
  }

  // Update user
  updateUser(id: string, userRequest: UpdateUserRequest): Observable<{ success: boolean; user: User; message?: string }> {
    return this.http.put<{ success: boolean; user: User; message?: string }>(`${this.API_URL}/${id}`, userRequest, {
      headers: this.getAuthHeaders()
    });
  }

  // Delete user
  deleteUser(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.API_URL}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Promote user (change role)
  promoteUser(id: string, role: UserRole): Observable<{ success: boolean; user: User; message?: string }> {
    return this.http.put<{ success: boolean; user: User; message?: string }>(`${this.API_URL}/${id}/promote`, { role }, {
      headers: this.getAuthHeaders()
    });
  }

  // Validate username availability
  validateUsername(username: string): Observable<{ available: boolean }> {
    return this.http.post<{ available: boolean }>(`${this.API_URL}/validate-username`, { username }, {
      headers: this.getAuthHeaders()
    });
  }

  // Validate email availability
  validateEmail(email: string): Observable<{ available: boolean }> {
    return this.http.post<{ available: boolean }>(`${this.API_URL}/validate-email`, { email }, {
      headers: this.getAuthHeaders()
    });
  }

  // Search users
  searchUsers(query: string): Observable<{ users: User[] }> {
    return this.http.get<{ users: User[] }>(`${this.API_URL}/search?q=${encodeURIComponent(query)}`, {
      headers: this.getAuthHeaders()
    });
  }
}
