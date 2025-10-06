import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FileUploadService, UploadResponse, UploadProgress } from '../../../services/file-upload.service';
import { User } from '../../../models';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  currentUser: User | null = null;
  isUploading = false;
  uploadProgress = 0;
  uploadError: string = '';
  uploadSuccess: string = '';

  constructor(
    private authService: AuthService,
    private fileUploadService: FileUploadService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Handle avatar file selection
   */
  onAvatarSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    
    // Validate file
    const validation = this.fileUploadService.validateImageFile(file);
    if (!validation.valid) {
      this.uploadError = validation.error || 'Invalid file';
      return;
    }

    this.uploadAvatar(file);
  }

  /**
   * Upload avatar file
   */
  private uploadAvatar(file: File): void {
    this.isUploading = true;
    this.uploadProgress = 0;
    this.uploadError = '';
    this.uploadSuccess = '';

    this.fileUploadService.uploadAvatar(file).subscribe({
      next: (result: UploadResponse | UploadProgress) => {
        if ('progress' in result) {
          // Progress update
          this.uploadProgress = result.progress;
        } else {
          // Upload complete
          if (result.success) {
            this.uploadSuccess = 'Avatar updated successfully!';
            
            // Update current user with new avatar path
            if (this.currentUser && result.avatarPath) {
              this.currentUser.avatarPath = result.avatarPath;
              // Update the auth service with the new user data
              this.authService.updateCurrentUser(this.currentUser);
            }
            
            // Clear success message after 3 seconds
            setTimeout(() => {
              this.uploadSuccess = '';
            }, 3000);
          } else {
            this.uploadError = result.message || 'Upload failed';
          }
          this.isUploading = false;
          this.uploadProgress = 0;
        }
      },
      error: (error) => {
        console.error('Avatar upload error:', error);
        this.uploadError = error.error?.message || 'Upload failed. Please try again.';
        this.isUploading = false;
        this.uploadProgress = 0;
      }
    });
  }

  /**
   * Get avatar URL for display
   */
  getAvatarUrl(): string {
    if (!this.currentUser?.avatarPath) {
      return '';
    }
    return this.fileUploadService.getAvatarUrl(this.currentUser.avatarPath);
  }

  /**
   * Check if user has avatar
   */
  hasAvatar(): boolean {
    return !!this.currentUser?.avatarPath;
  }

  /**
   * Remove avatar
   */
  removeAvatar(): void {
    if (!this.currentUser?.avatarPath) {
      return;
    }

    if (!confirm('Are you sure you want to remove your avatar?')) {
      return;
    }

    this.uploadError = '';
    this.uploadSuccess = '';

    this.fileUploadService.removeAvatar().subscribe({
      next: (response) => {
        if (response.success) {
          this.uploadSuccess = 'Avatar removed successfully!';
          
          // Update current user
          if (this.currentUser) {
            this.currentUser.avatarPath = undefined;
            this.authService.updateCurrentUser(this.currentUser);
          }
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            this.uploadSuccess = '';
          }, 3000);
        } else {
          this.uploadError = response.message || 'Failed to remove avatar';
        }
      },
      error: (error) => {
        console.error('Avatar removal error:', error);
        this.uploadError = error.error?.message || 'Failed to remove avatar. Please try again.';
      }
    });
  }

  /**
   * Go back to dashboard
   */
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
