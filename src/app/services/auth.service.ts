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
    // Load user from storage on service initialization
    this.loadUserFromStorage();
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
    this.http.post(`${this.API_URL}/logout`, {}).subscribe();
    this.clearCurrentUser();
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

  private loadUserFromStorage(): void {
    const user = this.storageService.loadCurrentUser();
    if (user) {
      this.currentUserSubject.next(user);
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null && this.storageService.exists('authToken');
  }

  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user ? user.roles.includes(role) : false;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.some(role => user.roles.includes(role)) : false;
  }

  isSuperAdmin(): boolean {
    return this.hasRole(UserRole.SUPER_ADMIN);
  }

  isGroupAdmin(): boolean {
    return this.hasAnyRole([UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN]);
  }

  getAuthToken(): string | null {
    return this.storageService.load<string>('authToken');
  }
}
