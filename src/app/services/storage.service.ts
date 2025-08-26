import { Injectable } from '@angular/core';
import { User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly USER_KEY = 'currentUser';
  private readonly TOKEN_KEY = 'authToken';

  constructor() { }

  // Generic storage methods
  save<T>(key: string, data: T): void {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  load<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  }

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  exists(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  // Specific storage methods for user data
  saveCurrentUser(user: User): void {
    this.save(this.USER_KEY, user);
  }

  loadCurrentUser(): User | null {
    return this.load<User>(this.USER_KEY);
  }

  clearCurrentUser(): void {
    this.remove(this.USER_KEY);
    this.remove(this.TOKEN_KEY);
  }

  // Session management
  saveUserSession(user: User, token: string): void {
    this.saveCurrentUser(user);
    this.save(this.TOKEN_KEY, token);
    this.save('lastActivity', new Date().toISOString());
  }

  isSessionValid(): boolean {
    const user = this.loadCurrentUser();
    const token = this.load<string>(this.TOKEN_KEY);
    const lastActivity = this.load<string>('lastActivity');
    
    if (!user || !token || !lastActivity) {
      return false;
    }

    // Check if session is older than 24 hours
    const lastActivityDate = new Date(lastActivity);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff < 24;
  }

  updateLastActivity(): void {
    this.save('lastActivity', new Date().toISOString());
  }
}
