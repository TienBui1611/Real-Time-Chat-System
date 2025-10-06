import { Injectable } from '@angular/core';
import { User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly USER_KEY = 'currentUser';
  private readonly TOKEN_KEY = 'authToken';

  constructor() { }

  // Generic storage methods - Use sessionStorage for tab-specific data
  save<T>(key: string, data: T): void {
    try {
      const serialized = JSON.stringify(data);
      sessionStorage.setItem(key, serialized); // Changed from localStorage to sessionStorage
    } catch (error) {
      console.error('Failed to save to sessionStorage:', error);
    }
  }

  load<T>(key: string): T | null {
    try {
      const item = sessionStorage.getItem(key); // Changed from localStorage to sessionStorage
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Failed to load from sessionStorage:', error);
      return null;
    }
  }

  remove(key: string): void {
    try {
      sessionStorage.removeItem(key); // Changed from localStorage to sessionStorage
    } catch (error) {
      console.error('Failed to remove from sessionStorage:', error);
    }
  }

  clear(): void {
    try {
      sessionStorage.clear(); // Changed from localStorage to sessionStorage
    } catch (error) {
      console.error('Failed to clear sessionStorage:', error);
    }
  }

  exists(key: string): boolean {
    return sessionStorage.getItem(key) !== null; // Changed from localStorage to sessionStorage
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
