import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ChannelService } from './channel.service';
import { AuthService } from './auth.service';
import { Channel, CreateChannelRequest, UpdateChannelRequest, User, UserRole } from '../models';

describe('ChannelService', () => {
  let service: ChannelService;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  const mockToken = 'session_user123_1234567890';
  const mockUser: User = {
    _id: 'user123',
    id: 'user123',
    username: 'testuser',
    email: 'test@example.com',
    role: UserRole.USER,
    groups: [],
    isActive: true,
    createdAt: new Date()
  };

  const mockChannel: Channel = {
    id: 'channel123',
    name: 'test-channel',
    description: 'A test channel',
    groupId: 'group123',
    createdBy: 'user123',
    members: ['user123', 'user456'],
    createdAt: new Date(),
    isActive: true
  };

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getAuthToken',
      'getCurrentUser',
      'isSuperAdmin',
      'isGroupAdmin'
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ChannelService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(ChannelService);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    authService.getAuthToken.and.returnValue(mockToken);
    authService.getCurrentUser.and.returnValue(mockUser);
    authService.isSuperAdmin.and.returnValue(false);
    authService.isGroupAdmin.and.returnValue(false);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getChannelsByGroup', () => {
    it('should get channels by group ID', (done) => {
      const mockChannels = [mockChannel];

      service.getChannelsByGroup('group123').subscribe(response => {
        expect(response.channels).toEqual(mockChannels);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/channels/group/group123');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({ channels: mockChannels });
    });
  });

  describe('getChannelById', () => {
    it('should get channel by ID', (done) => {
      service.getChannelById('channel123').subscribe(response => {
        expect(response.channel).toEqual(mockChannel);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/channels/channel123');
      expect(req.request.method).toBe('GET');
      req.flush({ channel: mockChannel });
    });
  });

  describe('createChannel', () => {
    it('should create new channel', (done) => {
      const createRequest: CreateChannelRequest = {
        name: 'new-channel',
        description: 'A new channel',
        groupId: 'group123'
      };

      service.createChannel(createRequest).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.channel.name).toBe('new-channel');
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/channels');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      req.flush({ success: true, channel: { ...mockChannel, ...createRequest } });
    });
  });

  describe('updateChannel', () => {
    it('should update channel', (done) => {
      const updateRequest: UpdateChannelRequest = {
        name: 'updated-channel',
        description: 'Updated description'
      };

      service.updateChannel('channel123', updateRequest).subscribe(response => {
        expect(response.success).toBe(true);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/channels/channel123');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateRequest);
      req.flush({ success: true, channel: { ...mockChannel, ...updateRequest } });
    });
  });

  describe('deleteChannel', () => {
    it('should delete channel', (done) => {
      service.deleteChannel('channel123').subscribe(response => {
        expect(response.success).toBe(true);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/channels/channel123');
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, message: 'Channel deleted' });
    });
  });

  describe('addUserToChannel', () => {
    it('should add user to channel', (done) => {
      service.addUserToChannel('channel123', 'user789').subscribe(response => {
        expect(response.success).toBe(true);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/channels/channel123/members');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ userId: 'user789' });
      req.flush({ success: true, message: 'User added' });
    });
  });

  describe('removeUserFromChannel', () => {
    it('should remove user from channel', (done) => {
      service.removeUserFromChannel('channel123', 'user456').subscribe(response => {
        expect(response.success).toBe(true);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/channels/channel123/members/user456');
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, message: 'User removed' });
    });
  });

  describe('getChannelMembers', () => {
    it('should get channel members', (done) => {
      const mockMembers = [{ id: 'user123', username: 'testuser' }];

      service.getChannelMembers('channel123').subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.members).toEqual(mockMembers);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/channels/channel123/members');
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, members: mockMembers });
    });
  });

  describe('getUserChannels', () => {
    it('should get user channels', (done) => {
      const mockChannels = [mockChannel];

      service.getUserChannels().subscribe(response => {
        expect(response.channels).toEqual(mockChannels);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/channels/my-channels');
      expect(req.request.method).toBe('GET');
      req.flush({ channels: mockChannels });
    });
  });

  describe('canAccessChannel', () => {
    it('should return true for super admin', () => {
      authService.isSuperAdmin.and.returnValue(true);
      expect(service.canAccessChannel(mockChannel)).toBe(true);
    });

    it('should return true for channel creator', () => {
      expect(service.canAccessChannel(mockChannel)).toBe(true);
    });

    it('should return true for channel member', () => {
      expect(service.canAccessChannel(mockChannel)).toBe(true);
    });
  });

  describe('canManageChannel', () => {
    it('should return true for super admin', () => {
      authService.isSuperAdmin.and.returnValue(true);
      expect(service.canManageChannel(mockChannel)).toBe(true);
    });

    it('should return true for channel creator', () => {
      expect(service.canManageChannel(mockChannel)).toBe(true);
    });

    it('should return true for group admin', () => {
      authService.isGroupAdmin.and.returnValue(true);
      expect(service.canManageChannel(mockChannel)).toBe(true);
    });

    it('should return false for regular user', () => {
      const otherUser = { ...mockUser, id: 'other123' };
      authService.getCurrentUser.and.returnValue(otherUser);
      expect(service.canManageChannel(mockChannel)).toBe(false);
    });
  });

  describe('joinChannel', () => {
    it('should join channel', (done) => {
      service.joinChannel('channel123').subscribe(response => {
        expect(response.success).toBe(true);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/channels/channel123/join');
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, message: 'Joined channel' });
    });
  });

  describe('leaveChannel', () => {
    it('should leave channel', (done) => {
      service.leaveChannel('channel123').subscribe(response => {
        expect(response.success).toBe(true);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/channels/channel123/leave');
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, message: 'Left channel' });
    });
  });

  describe('searchChannels', () => {
    it('should search channels', (done) => {
      service.searchChannels('group123', 'test').subscribe(response => {
        expect(response.channels).toEqual([mockChannel]);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/channels/search?groupId=group123&q=test');
      expect(req.request.method).toBe('GET');
      req.flush({ channels: [mockChannel] });
    });
  });
});
