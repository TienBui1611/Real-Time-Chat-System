import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadService, UploadResponse, UploadProgress } from '../../../services/file-upload.service';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.css']
})
export class ImageUploadComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  @Input() uploadType: 'chat-image' = 'chat-image';
  @Input() channelId?: string;
  @Input() buttonText: string = 'Upload Image';
  @Input() buttonClass: string = 'btn btn-primary';
  @Input() acceptedTypes: string = 'image/jpeg,image/jpg,image/png,image/gif,image/webp';
  @Input() maxSize: number = 5; // MB
  @Input() disabled: boolean = false;

  @Output() uploadSuccess = new EventEmitter<UploadResponse>();
  @Output() uploadError = new EventEmitter<string>();
  @Output() uploadProgress = new EventEmitter<UploadProgress>();

  isUploading = false;
  uploadProgressValue = 0;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  error: string = '';

  constructor(private fileUploadService: FileUploadService) {}

  /**
   * Trigger file input click
   */
  triggerFileInput(): void {
    if (!this.disabled && !this.isUploading) {
      this.fileInput.nativeElement.click();
    }
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.handleFileSelection(file);
    }
  }

  /**
   * Handle drag and drop
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.disabled || this.isUploading) return;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  /**
   * Handle file selection and validation
   */
  private handleFileSelection(file: File): void {
    this.error = '';
    this.selectedFile = null;
    this.previewUrl = null;

    // Validate file
    const validation = this.fileUploadService.validateImageFile(file);
    if (!validation.valid) {
      this.error = validation.error || 'Invalid file';
      return;
    }

    // Check size limit
    const maxSizeBytes = this.maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      this.error = `File size must be less than ${this.maxSize}MB`;
      return;
    }

    this.selectedFile = file;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Auto-upload for chat images (only type supported now)
    this.uploadFile();
  }

  /**
   * Upload the selected file
   */
  uploadFile(): void {
    if (!this.selectedFile) return;

    if (!this.channelId) {
      this.error = 'Channel ID is required for chat images';
      return;
    }

    this.isUploading = true;
    this.uploadProgressValue = 0;
    this.error = '';

    const uploadObservable = this.fileUploadService.uploadChatImage(this.selectedFile, this.channelId);

    uploadObservable.subscribe({
      next: (result: UploadResponse | UploadProgress) => {
        if ('progress' in result) {
          // Progress update
          this.uploadProgressValue = result.progress;
          this.uploadProgress.emit(result);
        } else {
          // Upload complete
          if (result.success) {
            this.uploadSuccess.emit(result);
            this.resetComponent();
          } else {
            this.error = result.message || 'Upload failed';
            this.uploadError.emit(this.error);
          }
          this.isUploading = false;
        }
      },
      error: (error: any) => {
        console.error('Upload error:', error);
        this.error = error.error?.message || 'Upload failed';
        this.uploadError.emit(this.error);
        this.isUploading = false;
      }
    });
  }

  /**
   * Cancel upload
   */
  cancelUpload(): void {
    this.resetComponent();
  }

  /**
   * Reset component state
   */
  private resetComponent(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.uploadProgressValue = 0;
    this.isUploading = false;
    this.error = '';
    
    // Reset file input
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  /**
   * Get formatted file size
   */
  getFileSize(): string {
    if (!this.selectedFile) return '';
    return this.fileUploadService.formatFileSize(this.selectedFile.size);
  }
}
