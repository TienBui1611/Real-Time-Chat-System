import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AuthService } from './auth.service';

export interface UploadResponse {
  success: boolean;
  message: string;
  avatarPath?: string;
  imageMessage?: any;
  fileInfo?: {
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
  };
  error?: string;
}

export interface UploadProgress {
  progress: number;
  loaded: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private readonly API_URL = 'http://localhost:3000/api/upload';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getAuthToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Upload user avatar
   */
  uploadAvatar(file: File): Observable<UploadResponse | UploadProgress> {
    const formData = new FormData();
    formData.append('avatar', file);

    return this.http.post<UploadResponse>(`${this.API_URL}/avatar`, formData, {
      headers: this.getAuthHeaders(),
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<UploadResponse>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            if (event.total) {
              const progress = Math.round(100 * event.loaded / event.total);
              return {
                progress,
                loaded: event.loaded,
                total: event.total
              } as UploadProgress;
            }
            break;
          case HttpEventType.Response:
            return event.body as UploadResponse;
        }
        return { progress: 0, loaded: 0, total: 0 } as UploadProgress;
      })
    );
  }

  /**
   * Remove user avatar
   */
  removeAvatar(): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.API_URL}/avatar`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Upload chat image
   */
  uploadChatImage(file: File, channelId: string): Observable<UploadResponse | UploadProgress> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('channelId', channelId);

    return this.http.post<UploadResponse>(`${this.API_URL}/chat-image`, formData, {
      headers: this.getAuthHeaders(),
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<UploadResponse>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            if (event.total) {
              const progress = Math.round(100 * event.loaded / event.total);
              return {
                progress,
                loaded: event.loaded,
                total: event.total
              } as UploadProgress;
            }
            break;
          case HttpEventType.Response:
            return event.body as UploadResponse;
        }
        return { progress: 0, loaded: 0, total: 0 } as UploadProgress;
      })
    );
  }

  /**
   * Get avatar URL
   */
  getAvatarUrl(avatarPath: string): string {
    if (!avatarPath) return '';
    if (avatarPath.startsWith('http')) return avatarPath;
    return `http://localhost:3000${avatarPath}`;
  }

  /**
   * Get chat image URL
   */
  getChatImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:3000${imagePath}`;
  }

  /**
   * Validate image file
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSizeAvatar = 5 * 1024 * 1024; // 5MB
    const maxSizeChatImage = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Only JPEG, PNG, GIF, and WebP images are allowed'
      };
    }

    if (file.size > maxSizeChatImage) {
      return {
        valid: false,
        error: 'File size must be less than 10MB'
      };
    }

    return { valid: true };
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
