import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, User, UserRole } from '../models';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {
    // Validate stored session on service initialization
    this.initializeAuth();
  }

  login(username: string, password: string): Observable<AuthResponse> {
    const loginRequest: LoginRequest = { username, password };
    
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, loginRequest)
      .pipe(
        tap(response => {
          if (response.success && response.user && response.token) {
            this.setCurrentUser(response.user, response.token);
          }
        })
      );
  }

  logout(): void {
    const token = this.getAuthToken();
    const options = token 
      ? { headers: { 'Authorization': `Bearer ${token}` } }
      : {};
    
    this.http.post(`${this.API_URL}/logout`, {}, options).subscribe({
      next: () => {
        console.log('Logout successful');
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Still clear local data even if server logout fails
      },
      complete: () => {
        this.clearCurrentUser();
      }
    });
  }

  private setCurrentUser(user: User, token: string): void {
    this.currentUserSubject.next(user);
    this.storageService.saveCurrentUser(user);
    this.storageService.save('authToken', token);
  }

  private clearCurrentUser(): void {
    this.currentUserSubject.next(null);
    this.storageService.clearCurrentUser();
    this.storageService.remove('authToken');
  }

  private initializeAuth(): void {
    const user = this.storageService.loadCurrentUser();
    const token = this.storageService.load<string>('authToken');
    
    if (user && token) {
      // Validate the stored token with the server
      this.validateStoredSession(token, user);
    }
  }

  private validateStoredSession(token: string, user: User): void {
    const headers = { 'Authorization': `Bearer ${token}` };
    
    this.http.get<{ user: User }>(`${this.API_URL}/current`, { headers }).subscribe({
      next: (response) => {
        // Token is valid, set the user
        this.currentUserSubject.next(response.user);
      },
      error: (error) => {
        console.warn('Stored session invalid, clearing local data:', error);
        // Token is invalid or expired, clear local storage
        this.clearCurrentUser();
      }
    });
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null && this.storageService.exists('authToken');
  }

  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  isSuperAdmin(): boolean {
    return this.hasRole(UserRole.SUPER_ADMIN);
  }

  isGroupAdmin(): boolean {
    return this.hasAnyRole([UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN]);
  }

  getUserRole(): UserRole | null {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }

  getAuthToken(): string | null {
    return this.storageService.load<string>('authToken');
  }

  updateCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
    this.storageService.saveCurrentUser(user);
  }
}
