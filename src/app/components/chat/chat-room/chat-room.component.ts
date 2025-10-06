import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SocketService, ChatMessage, UserNotification } from '../../../services/socket.service';
import { ChannelService } from '../../../services/channel.service';
import { AuthService } from '../../../services/auth.service';
import { FileUploadService, UploadResponse } from '../../../services/file-upload.service';
import { PeerConnectionService, PeerConnectionState } from '../../../services/peer-connection.service';
import { Channel, User } from '../../../models';
import { ImageUploadComponent } from '../../shared/image-upload/image-upload.component';
import { VideoCallComponent } from '../../shared/video-call/video-call.component';
import { VideoCallInfoComponent } from '../../shared/video-call-info/video-call-info.component';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUploadComponent, VideoCallComponent, VideoCallInfoComponent],
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.css']
})
export class ChatRoomComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  channel: Channel | null = null;
  messages: ChatMessage[] = [];
  systemNotifications: UserNotification[] = [];
  newMessage: string = '';
  
  // Video call state
  showVideoCall = false;
  showVideoCallInfo = false;
  currentUser: User | null = null;
  isConnected: boolean = false;
  typingUsers: string[] = [];
  isLoading: boolean = true;
  error: string = '';
  socketError: string = '';

  // Peer connection state
  peerConnectionState: PeerConnectionState = {
    isConnected: false,
    isConnecting: false,
    peerId: null,
    status: 'Disconnected',
    error: null
  };

  private subscriptions: Subscription[] = [];
  private typingTimer: any;
  private shouldScrollToBottom = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private socketService: SocketService,
    private channelService: ChannelService,
    private authService: AuthService,
    private fileUploadService: FileUploadService,
    private peerConnectionService: PeerConnectionService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    // Get channel ID from route
    const channelId = this.route.snapshot.paramMap.get('channelId');
    if (!channelId) {
      this.error = 'Channel ID not provided';
      return;
    }

    // Setup socket subscriptions FIRST, then initialize socket and load channel
    this.setupSocketSubscriptions();
    this.setupPeerConnectionSubscription();
    
    // Initialize socket connection
    this.initializeSocket();
    
    // Load channel data
    this.loadChannel(channelId);
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Leave channel and disconnect
    this.socketService.leaveChannel();
    
    // Clear typing timer
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
    
    // Clear system notifications
    this.systemNotifications = [];
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
    }
  }

  /**
   * Load channel information
   */
  private loadChannel(channelId: string): void {
    this.channelService.getChannelById(channelId).subscribe({
      next: (response) => {
        this.channel = response.channel;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to load channel';
        this.isLoading = false;
      }
    });
  }

  /**
   * Initialize socket connection
   */
  private initializeSocket(): void {
    // Connect to socket server
    this.socketService.connect();
    
    // Wait for connection before joining channel
    const connectionSub = this.socketService.connectionStatus$.subscribe(isConnected => {
      if (isConnected) {
        const channelId = this.route.snapshot.paramMap.get('channelId');
        if (channelId) {
          console.log('Socket connected, joining channel:', channelId);
          this.socketService.joinChannel(channelId);
        }
        // Unsubscribe after first successful connection
        connectionSub.unsubscribe();
      }
    });
    
    // Add to subscriptions for cleanup (in case connection never happens)
    this.subscriptions.push(connectionSub);
  }

  /**
   * Setup socket event subscriptions
   */
  private setupSocketSubscriptions(): void {
    // Connection status
    this.subscriptions.push(
      this.socketService.connectionStatus$.subscribe(status => {
        this.isConnected = status;
      })
    );

    // Messages
    this.subscriptions.push(
      this.socketService.messages$.subscribe(messages => {
        this.messages = messages;
        this.shouldScrollToBottom = true;
      })
    );

    // New message notifications
    this.subscriptions.push(
      this.socketService.newMessage$.subscribe(message => {
        if (message) {
          // Play notification sound or show notification
          this.shouldScrollToBottom = true;
        }
      })
    );

    // User joined/left notifications
    this.subscriptions.push(
      this.socketService.userJoined$.subscribe(notification => {
        if (notification) {
          console.log(notification.message);
          // Add to system notifications for display
          this.systemNotifications.push(notification);
          this.shouldScrollToBottom = true;
          
          // Remove notification after 5 seconds
          setTimeout(() => {
            this.systemNotifications = this.systemNotifications.filter(n => n !== notification);
          }, 5000);
        }
      })
    );

    this.subscriptions.push(
      this.socketService.userLeft$.subscribe(notification => {
        if (notification) {
          console.log(notification.message);
          // Add to system notifications for display
          this.systemNotifications.push(notification);
          this.shouldScrollToBottom = true;
          
          // Remove notification after 5 seconds
          setTimeout(() => {
            this.systemNotifications = this.systemNotifications.filter(n => n !== notification);
          }, 5000);
        }
      })
    );

    // Typing indicators
    this.subscriptions.push(
      this.socketService.typingUsers$.subscribe(users => {
        this.typingUsers = users.filter(user => user !== this.currentUser?.username);
      })
    );

    // Socket errors
    this.subscriptions.push(
      this.socketService.error$.subscribe(error => {
        this.socketError = error || '';
      })
    );
  }

  /**
   * Send a message
   */
  sendMessage(): void {
    if (!this.newMessage.trim() || !this.isConnected) {
      return;
    }

    this.socketService.sendMessage(this.newMessage.trim());
    this.newMessage = '';
    
    // Stop typing indicator
    this.socketService.stopTyping();
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
  }

  /**
   * Handle typing
   */
  onTyping(): void {
    if (!this.isConnected) return;

    // Send typing indicator
    this.socketService.startTyping();

    // Clear existing timer
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }

    // Stop typing after 3 seconds of inactivity
    this.typingTimer = setTimeout(() => {
      this.socketService.stopTyping();
    }, 3000);
  }

  /**
   * Handle Enter key press
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Scroll to bottom of messages
   */
  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  /**
   * Format message timestamp
   */
  formatTimestamp(timestamp: Date): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      // Show time for messages within 24 hours
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      // Show date and time for older messages
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  /**
   * Check if message is from current user
   */
  isMyMessage(message: ChatMessage): boolean {
    return message.userId === (this.currentUser?.id || this.currentUser?._id);
  }

  /**
   * Go back to channel list
   */
  goBack(): void {
    this.router.navigate(['/channels', this.channel?.groupId]);
  }

  /**
   * Clear socket error
   */
  clearSocketError(): void {
    this.socketError = '';
    this.socketService.clearError();
  }

  /**
   * Handle image upload success
   */
  onImageUploadSuccess(response: UploadResponse): void {
    if (response.success && response.imageMessage) {
      console.log('Image uploaded successfully:', response);
      // Message will be received via Socket.io and displayed automatically
    }
  }

  /**
   * Handle image upload error
   */
  onImageUploadError(error: string): void {
    console.error('Image upload error:', error);
    // You could show a toast notification here
  }

  /**
   * Get image URL for display
   */
  getImageUrl(imagePath: string): string {
    return this.fileUploadService.getChatImageUrl(imagePath);
  }

  /**
   * Open image in modal (placeholder for future enhancement)
   */
  openImageModal(imagePath: string): void {
    // For now, just open in new tab
    const imageUrl = this.getImageUrl(imagePath);
    window.open(imageUrl, '_blank');
  }

  /**
   * Get typing indicator text
   */
  getTypingText(): string {
    if (this.typingUsers.length === 0) return '';
    if (this.typingUsers.length === 1) return `${this.typingUsers[0]} is typing...`;
    if (this.typingUsers.length === 2) return `${this.typingUsers[0]} and ${this.typingUsers[1]} are typing...`;
    return `${this.typingUsers.length} people are typing...`;
  }

  // Video call methods
  startVideoCall(): void {
    this.showVideoCall = true;
  }

  endVideoCall(): void {
    this.showVideoCall = false;
  }

  onVideoCallError(error: string): void {
    // Video call component handles its own errors internally
    // Don't set this.error as it would hide the chat content
    console.error('Video call error:', error);
  }

  // Peer connection methods
  setupPeerConnectionSubscription(): void {
    const peerSub = this.peerConnectionService.connectionState$.subscribe(
      (state: PeerConnectionState) => {
        this.peerConnectionState = state;
      }
    );
    this.subscriptions.push(peerSub);
  }

  connectToPeer(): void {
    this.peerConnectionService.connect();
  }

  disconnectFromPeer(): void {
    this.peerConnectionService.disconnect();
  }

  resetPeerConnection(): void {
    this.peerConnectionService.reset();
  }

  copyPeerId(): void {
    this.peerConnectionService.copyPeerId().then(success => {
      if (success) {
        console.log('Peer ID copied successfully');
        // You could show a toast notification here
      } else {
        console.error('Failed to copy Peer ID');
      }
    });
  }

  // Video call info methods
  showVideoCallInfoDialog(): void {
    this.showVideoCallInfo = true;
  }

  closeVideoCallInfo(): void {
    this.showVideoCallInfo = false;
  }
}
