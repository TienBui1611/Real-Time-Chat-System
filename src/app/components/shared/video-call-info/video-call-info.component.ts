import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-video-call-info',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="info-modal" *ngIf="isVisible" (click)="closeInfo()">
      <div class="info-container" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="info-header">
          <div class="d-flex align-items-center">
            <i class="bi bi-info-circle text-primary me-2"></i>
            <h5 class="mb-0">How to Make Video Calls</h5>
          </div>
          <button 
            class="btn btn-outline-secondary btn-sm" 
            (click)="closeInfo()"
            title="Close"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <!-- Content -->
        <div class="info-content">
          <div class="step-guide">
            <div class="step">
              <div class="step-number">1</div>
              <div class="step-content">
                <h6>Connect to Peer Network</h6>
                <p>Click the <span class="badge bg-success">Connect</span> button in the chat header to join the video call network.</p>
              </div>
            </div>

            <div class="step">
              <div class="step-number">2</div>
              <div class="step-content">
                <h6>Share Your Peer ID</h6>
                <p>Once connected, your unique Peer ID will appear next to the "Connected" status. Click the <i class="bi bi-clipboard text-muted"></i> button to copy it and share it in the chat with the person you want to call.</p>
              </div>
            </div>

            <div class="step">
              <div class="step-number">3</div>
              <div class="step-content">
                <h6>Get Their Peer ID</h6>
                <p>Ask the other person to share their Peer ID with you in the chat. They need to be connected to the peer network too and have clicked the <span class="badge bg-primary">Video Call</span> button.</p>
              </div>
            </div>

            <div class="step">
              <div class="step-number">4</div>
              <div class="step-content">
                <h6>Start the Video Call</h6>
                <p>Click the <span class="badge bg-primary">Video Call</span> button, then paste the other person's Peer ID and click "Call".</p>
              </div>
            </div>
          </div>

          <div class="tips-section">
            <h6><i class="bi bi-lightbulb text-warning me-2"></i>Tips</h6>
            <ul class="tips-list">
              <li><strong>Both users</strong> must be connected to the peer network</li>
              <li><strong>Peer IDs</strong> stay the same during your browser session</li>
              <li><strong>Camera permission</strong> will be requested when you start a call</li>
              <li>Use the <i class="bi bi-arrow-clockwise text-warning"></i> button if you have connection issues</li>
            </ul>
          </div>

          <div class="troubleshooting">
            <h6><i class="bi bi-tools text-info me-2"></i>Troubleshooting</h6>
            <div class="trouble-item">
              <strong>Can't connect?</strong> Try refreshing the page or clicking the reset button.
            </div>
            <div class="trouble-item">
              <strong>Call not working?</strong> Make sure both users are connected and using the correct Peer IDs.
            </div>
            <div class="trouble-item">
              <strong>No video/audio?</strong> Check your browser permissions for camera and microphone access.
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="info-footer">
          <button class="btn btn-primary" (click)="closeInfo()">
            <i class="bi bi-check me-1"></i>
            Got it!
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .info-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
    }

    .info-container {
      width: 90vw;
      max-width: 600px;
      max-height: 80vh;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .info-header {
      background: #f8f9fa;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #dee2e6;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .info-header h5 {
      color: #333;
      font-weight: 600;
    }

    .info-content {
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
    }

    .step-guide {
      margin-bottom: 2rem;
    }

    .step {
      display: flex;
      margin-bottom: 1.5rem;
      align-items: flex-start;
    }

    .step-number {
      width: 32px;
      height: 32px;
      background: #007bff;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.9rem;
      margin-right: 1rem;
      flex-shrink: 0;
    }

    .step-content h6 {
      color: #333;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .step-content p {
      color: #666;
      margin: 0;
      line-height: 1.5;
    }

    .tips-section, .troubleshooting {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e9ecef;
    }

    .tips-section h6, .troubleshooting h6 {
      color: #333;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .tips-list {
      margin: 0;
      padding-left: 1.2rem;
    }

    .tips-list li {
      color: #666;
      margin-bottom: 0.5rem;
      line-height: 1.4;
    }

    .trouble-item {
      background: #f8f9fa;
      padding: 0.75rem;
      border-radius: 6px;
      margin-bottom: 0.5rem;
      border-left: 3px solid #17a2b8;
    }

    .trouble-item strong {
      color: #333;
    }

    .info-footer {
      background: #f8f9fa;
      padding: 1rem 1.5rem;
      border-top: 1px solid #dee2e6;
      text-align: center;
    }

    .badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .info-container {
        width: 95vw;
        max-height: 90vh;
      }
      
      .info-header, .info-content, .info-footer {
        padding: 1rem;
      }
      
      .step-number {
        width: 28px;
        height: 28px;
        font-size: 0.8rem;
      }
    }

    /* Animation */
    .info-modal {
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .info-container {
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        transform: translateY(50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `]
})
export class VideoCallInfoComponent {
  @Input() isVisible = false;
  @Output() closed = new EventEmitter<void>();

  closeInfo(): void {
    this.closed.emit();
  }
}
