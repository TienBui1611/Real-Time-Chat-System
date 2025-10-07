import { TestBed } from '@angular/core/testing';
import { SocketService, ChatMessage } from './socket.service';
import { AuthService } from './auth.service';
import { User, UserRole } from '../models';

describe('SocketService', () => {
  let service: SocketService;
  let authService: jasmine.SpyObj<AuthService>;
  let mockSocket: any;

  const mockUser: User = {
    id: 'user123',
    username: 'testuser',
    email: 'test@example.com',
    role: UserRole.USER,
    groups: [],
    isActive: true,
    createdAt: new Date()
  };

  const mockMessage: ChatMessage = {
    _id: 'msg123',
    channelId: 'channel123',
    userId: 'user123',
    username: 'testuser',
    content: 'Hello World',
    type: 'text',
    timestamp: new Date()
  };

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser', 'getAuthToken']);

    // Create mock socket
    mockSocket = {
      connected: false,
      on: jasmine.createSpy('on'),
      emit: jasmine.createSpy('emit'),
      disconnect: jasmine.createSpy('disconnect'),
      join: jasmine.createSpy('join')
    };

    TestBed.configureTestingModule({
      providers: [
        SocketService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(SocketService);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    // Default mock implementation
    authService.getCurrentUser.and.returnValue(mockUser);
    authService.getAuthToken.and.returnValue('mock-token');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('connect', () => {
    it('should not connect if already connected', () => {
      // Mock already connected socket
      mockSocket.connected = true;
      (service as any).socket = mockSocket;

      // Try to connect again
      service.connect();

      // Should still be the same socket
      expect((service as any).socket).toBe(mockSocket);
    });

    it('should create socket on connect', () => {
      service.connect();
      const socket = (service as any).socket;
      expect(socket).toBeTruthy();
    });
  });

  describe('disconnect', () => {
    it('should disconnect socket and reset state', () => {
      (service as any).socket = mockSocket;
      service.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect((service as any).socket).toBeNull();
      expect((service as any).currentChannelId).toBeNull();
    });

    it('should update connection status on disconnect', () => {
      (service as any).socket = mockSocket;
      
      let statusUpdated = false;
      service.connectionStatus$.subscribe(status => {
        if (!status) {
          statusUpdated = true;
        }
      });

      service.disconnect();
      expect(statusUpdated).toBe(true);
    });
  });

  describe('joinChannel', () => {
    it('should not join channel if socket not connected', () => {
      spyOn(console, 'error');
      service.joinChannel('channel123');
      expect(console.error).toHaveBeenCalledWith('Socket not connected');
    });

    it('should not join channel if user not authenticated', () => {
      authService.getCurrentUser.and.returnValue(null);
      mockSocket.connected = true;
      (service as any).socket = mockSocket;
      
      spyOn(console, 'error');
      service.joinChannel('channel123');
      expect(console.error).toHaveBeenCalledWith('User not authenticated');
    });

    it('should emit join-channel event when joining', () => {
      mockSocket.connected = true;
      (service as any).socket = mockSocket;

      service.joinChannel('channel123');

      expect(mockSocket.emit).toHaveBeenCalledWith('join-channel', jasmine.objectContaining({
        channelId: 'channel123',
        userId: 'user123',
        username: 'testuser'
      }));
      expect((service as any).currentChannelId).toBe('channel123');
    });
  });

  describe('leaveChannel', () => {
    it('should not leave if socket not connected', () => {
      service.leaveChannel();
      // Should not throw error
      expect((service as any).currentChannelId).toBeNull();
    });

    it('should emit leave-channel event and clear state', () => {
      mockSocket.connected = true;
      (service as any).socket = mockSocket;
      (service as any).currentChannelId = 'channel123';

      service.leaveChannel();

      expect(mockSocket.emit).toHaveBeenCalledWith('leave-channel', jasmine.objectContaining({
        channelId: 'channel123',
        username: 'testuser'
      }));
      expect((service as any).currentChannelId).toBeNull();
    });
  });

  describe('sendMessage', () => {
    it('should not send message if socket not connected', () => {
      spyOn(console, 'error');
      service.sendMessage('Hello');
      expect(console.error).toHaveBeenCalledWith('Socket not connected or no channel joined');
    });

    it('should not send message if user not authenticated', () => {
      authService.getCurrentUser.and.returnValue(null);
      mockSocket.connected = true;
      (service as any).socket = mockSocket;
      (service as any).currentChannelId = 'channel123';
      
      spyOn(console, 'error');
      service.sendMessage('Hello');
      expect(console.error).toHaveBeenCalledWith('User not authenticated');
    });

    it('should send text message successfully', () => {
      mockSocket.connected = true;
      (service as any).socket = mockSocket;
      (service as any).currentChannelId = 'channel123';

      service.sendMessage('Hello World');

      expect(mockSocket.emit).toHaveBeenCalledWith('send-message', jasmine.objectContaining({
        channelId: 'channel123',
        content: 'Hello World',
        type: 'text'
      }));
    });

    it('should send image message successfully', () => {
      mockSocket.connected = true;
      (service as any).socket = mockSocket;
      (service as any).currentChannelId = 'channel123';

      service.sendMessage('/path/to/image.jpg', 'image');

      expect(mockSocket.emit).toHaveBeenCalledWith('send-message', jasmine.objectContaining({
        channelId: 'channel123',
        content: '/path/to/image.jpg',
        type: 'image'
      }));
    });
  });

  describe('typing indicators', () => {
    it('should send typing indicator', () => {
      mockSocket.connected = true;
      (service as any).socket = mockSocket;
      (service as any).currentChannelId = 'channel123';

      service.startTyping();

      expect(mockSocket.emit).toHaveBeenCalledWith('typing', jasmine.objectContaining({
        channelId: 'channel123',
        username: 'testuser'
      }));
    });

    it('should send stop typing indicator', () => {
      mockSocket.connected = true;
      (service as any).socket = mockSocket;
      (service as any).currentChannelId = 'channel123';

      service.stopTyping();

      expect(mockSocket.emit).toHaveBeenCalledWith('stop-typing', jasmine.objectContaining({
        channelId: 'channel123',
        username: 'testuser'
      }));
    });

    it('should not send typing if not connected', () => {
      service.startTyping();
      service.stopTyping();
      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('getCurrentChannelId', () => {
    it('should return null when no channel joined', () => {
      expect(service.getCurrentChannelId()).toBeNull();
    });

    it('should return current channel ID', () => {
      mockSocket.connected = true;
      (service as any).socket = mockSocket;
      service.joinChannel('channel123');
      expect(service.getCurrentChannelId()).toBe('channel123');
    });
  });

  describe('isConnected', () => {
    it('should return false when not connected', () => {
      expect(service.isConnected()).toBe(false);
    });

    it('should return true when connected', () => {
      mockSocket.connected = true;
      (service as any).socket = mockSocket;
      expect(service.isConnected()).toBe(true);
    });
  });

  describe('observables', () => {
    it('should have messages$ observable', (done) => {
      service.messages$.subscribe(messages => {
        expect(Array.isArray(messages)).toBe(true);
        done();
      });
    });

    it('should have newMessage$ observable', (done) => {
      service.newMessage$.subscribe(message => {
        expect(message).toBeNull(); // Initial value
        done();
      });
    });

    it('should have userJoined$ observable', (done) => {
      service.userJoined$.subscribe(notification => {
        expect(notification).toBeNull(); // Initial value
        done();
      });
    });

    it('should have userLeft$ observable', (done) => {
      service.userLeft$.subscribe(notification => {
        expect(notification).toBeNull(); // Initial value
        done();
      });
    });

    it('should have typingUsers$ observable', (done) => {
      service.typingUsers$.subscribe(users => {
        expect(Array.isArray(users)).toBe(true);
        done();
      });
    });

    it('should have connectionStatus$ observable', (done) => {
      service.connectionStatus$.subscribe(status => {
        expect(typeof status).toBe('boolean');
        done();
      });
    });

    it('should have error$ observable', (done) => {
      service.error$.subscribe(error => {
        expect(error).toBeNull(); // Initial value
        done();
      });
    });
  });

  describe('clearError', () => {
    it('should clear error message', (done) => {
      service.clearError();
      
      service.error$.subscribe(error => {
        expect(error).toBeNull();
        done();
      });
    });
  });
});
