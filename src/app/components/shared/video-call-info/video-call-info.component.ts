import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-video-call-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-call-info.component.html',
  styleUrls: ['./video-call-info.component.css']
})
export class VideoCallInfoComponent {
  @Input() isVisible = false;
  @Output() closed = new EventEmitter<void>();

  closeInfo(): void {
    this.closed.emit();
  }
}