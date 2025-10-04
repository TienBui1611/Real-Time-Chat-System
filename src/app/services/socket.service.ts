import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface ChatMessage {
  _id?: string;
  id?: string;
  channelId: string;
  userId: string;
  username: string;
  content: string;
  type: 'text' | 'image';
  timestamp: Date;
}

export interface UserNotification {
  username: string;
  message: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private readonly serverUrl = 'http://localhost:3000';
  
  // Observables for real-time data
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private newMessageSubject = new BehaviorSubject<ChatMessage | null>(null);
  private userJoinedSubject = new BehaviorSubject<UserNotification | null>(null);
  private userLeftSubject = new BehaviorSubject<UserNotification | null>(null);
  private typingUsersSubject = new BehaviorSubject<string[]>([]);
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Public observables
  public messages$ = this.messagesSubject.asObservable();
  public newMessage$ = this.newMessageSubject.asObservable();
  public userJoined$ = this.userJoinedSubject.asObservable();
  public userLeft$ = this.userLeftSubject.asObservable();
  public typingUsers$ = this.typingUsersSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  private currentChannelId: string | null = null;
  private typingUsers: string[] = [];

  constructor(private authService: AuthService) {}

  /**
   * Connect to Socket.io server
   */
  connect(): void {
    if (this.socket?.connected) {
      return; // Already connected
    }

    this.socket = io(this.serverUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    this.setupSocketListeners();
  }

  /**
   * Disconnect from Socket.io server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatusSubject.next(false);
      this.currentChannelId = null;
    }
  }

  /**
   * Join a specific channel room
   */
  joinChannel(channelId: string): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.error('User not authenticated');
      return;
    }

    // Leave current channel if any
    if (this.currentChannelId) {
      this.leaveChannel();
    }

    this.currentChannelId = channelId;
    
    this.socket.emit('join-channel', {
      channelId,
      userId: currentUser.id || currentUser._id,
      username: currentUser.username
    });

    console.log(`Joining channel: ${channelId}`);
  }

  /**
   * Leave current channel room
   */
  leaveChannel(): void {
    if (!this.socket?.connected || !this.currentChannelId) {
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return;
    }

    this.socket.emit('leave-channel', {
      channelId: this.currentChannelId,
      username: currentUser.username
    });

    this.currentChannelId = null;
    this.messagesSubject.next([]); // Clear messages
    this.typingUsers = [];
    this.typingUsersSubject.next([]);
  }

  /**
   * Send a message to the current channel
   */
  sendMessage(content: string, type: 'text' | 'image' = 'text'): void {
    if (!this.socket?.connected || !this.currentChannelId) {
      console.error('Socket not connected or no channel joined');
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.error('User not authenticated');
      return;
    }

    this.socket.emit('send-message', {
      channelId: this.currentChannelId,
      userId: currentUser.id || currentUser._id,
      username: currentUser.username,
      content,
      type
    });
  }

  /**
   * Send typing indicator
   */
  startTyping(): void {
    if (!this.socket?.connected || !this.currentChannelId) {
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return;
    }

    this.socket.emit('typing', {
      channelId: this.currentChannelId,
      username: currentUser.username
    });
  }

  /**
   * Stop typing indicator
   */
  stopTyping(): void {
    if (!this.socket?.connected || !this.currentChannelId) {
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return;
    }

    this.socket.emit('stop-typing', {
      channelId: this.currentChannelId,
      username: currentUser.username
    });
  }

  /**
   * Get current channel ID
   */
  getCurrentChannelId(): string | null {
    return this.currentChannelId;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Setup Socket.io event listeners
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to Socket.io server');
      this.connectionStatusSubject.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Socket.io server');
      this.connectionStatusSubject.next(false);
    });

    // Channel message history
    this.socket.on('channel-history', (messages: ChatMessage[]) => {
      console.log('Received channel history:', messages.length, 'messages');
      this.messagesSubject.next(messages);
    });

    // New message received
    this.socket.on('message', (message: ChatMessage) => {
      console.log('New message received:', message);
      
      // Add to messages list
      const currentMessages = this.messagesSubject.value;
      this.messagesSubject.next([...currentMessages, message]);
      
      // Emit new message for notifications
      this.newMessageSubject.next(message);
    });

    // Channel membership changes (only these should show notifications)
    this.socket.on('channel-member-joined', (notification: UserNotification) => {
      console.log('User joined channel:', notification);
      this.userJoinedSubject.next(notification);
    });

    this.socket.on('channel-member-left', (notification: UserNotification) => {
      console.log('User left channel:', notification);
      this.userLeftSubject.next(notification);
    });

    // Typing indicators
    this.socket.on('user-typing', (data: { username: string }) => {
      if (!this.typingUsers.includes(data.username)) {
        this.typingUsers.push(data.username);
        this.typingUsersSubject.next([...this.typingUsers]);
      }
    });

    this.socket.on('user-stop-typing', (data: { username: string }) => {
      this.typingUsers = this.typingUsers.filter(user => user !== data.username);
      this.typingUsersSubject.next([...this.typingUsers]);
    });

    // Error handling
    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
      this.errorSubject.next(error.message || 'An error occurred');
    });
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.errorSubject.next(null);
  }
}

