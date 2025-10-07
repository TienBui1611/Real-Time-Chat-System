import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GroupService } from './group.service';
import { AuthService } from './auth.service';
import { Group, CreateGroupRequest, UpdateGroupRequest, User, UserRole } from '../models';

describe('GroupService', () => {
  let service: GroupService;
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

  const mockGroup: Group = {
    id: 'group123',
    name: 'Test Group',
    description: 'A test group',
    createdBy: 'user123',
    admins: ['user123'],
    members: ['user123', 'user456'],
    channels: ['channel123'],
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
        GroupService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(GroupService);
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

  describe('getAllGroups', () => {
    it('should get all groups', (done) => {
      const mockGroups = [mockGroup];

      service.getAllGroups().subscribe(response => {
        expect(response.groups).toEqual(mockGroups);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/groups');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({ groups: mockGroups });
    });
  });

  describe('getUserGroups', () => {
    it('should get user groups', (done) => {
      const mockGroups = [mockGroup];

      service.getUserGroups().subscribe(response => {
        expect(response.groups).toEqual(mockGroups);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/groups/my-groups');
      expect(req.request.method).toBe('GET');
      req.flush({ groups: mockGroups });
    });
  });

  describe('getGroupById', () => {
    it('should get group by ID', (done) => {
      service.getGroupById('group123').subscribe(response => {
        expect(response.group).toEqual(mockGroup);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/groups/group123');
      expect(req.request.method).toBe('GET');
      req.flush({ group: mockGroup });
    });
  });

  describe('createGroup', () => {
    it('should create new group', (done) => {
      const createRequest: CreateGroupRequest = {
        name: 'New Group',
        description: 'A new test group'
      };

      service.createGroup(createRequest).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.group.name).toBe('New Group');
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/groups');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      req.flush({ success: true, group: { ...mockGroup, ...createRequest } });
    });
  });

  describe('updateGroup', () => {
    it('should update group', (done) => {
      const updateRequest: UpdateGroupRequest = {
        name: 'Updated Group',
        description: 'Updated description'
      };

      service.updateGroup('group123', updateRequest).subscribe(response => {
        expect(response.success).toBe(true);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/groups/group123');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateRequest);
      req.flush({ success: true, group: { ...mockGroup, ...updateRequest } });
    });
  });

  describe('deleteGroup', () => {
    it('should delete group', (done) => {
      service.deleteGroup('group123').subscribe(response => {
        expect(response.success).toBe(true);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/groups/group123');
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, message: 'Group deleted' });
    });
  });

  describe('addUserToGroup', () => {
    it('should add user to group', (done) => {
      service.addUserToGroup('group123', 'user789').subscribe(response => {
        expect(response.success).toBe(true);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/groups/group123/members');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ userId: 'user789' });
      req.flush({ success: true, message: 'User added' });
    });
  });

  describe('removeUserFromGroup', () => {
    it('should remove user from group', (done) => {
      service.removeUserFromGroup('group123', 'user456').subscribe(response => {
        expect(response.success).toBe(true);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/groups/group123/members/user456');
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, message: 'User removed' });
    });
  });

  describe('canManageGroup', () => {
    it('should return true for super admin', () => {
      authService.isSuperAdmin.and.returnValue(true);
      expect(service.canManageGroup(mockGroup)).toBe(true);
    });

    it('should return true for group creator', () => {
      expect(service.canManageGroup(mockGroup)).toBe(true);
    });

    it('should return false for non-admin user', () => {
      const otherUser = { ...mockUser, id: 'other123' };
      authService.getCurrentUser.and.returnValue(otherUser);
      expect(service.canManageGroup(mockGroup)).toBe(false);
    });
  });

  describe('isGroupMember', () => {
    it('should return true for group member', () => {
      expect(service.isGroupMember(mockGroup)).toBe(true);
    });

    it('should return false for non-member', () => {
      const otherUser = { ...mockUser, id: 'other123' };
      authService.getCurrentUser.and.returnValue(otherUser);
      expect(service.isGroupMember(mockGroup)).toBe(false);
    });
  });

  describe('joinGroup', () => {
    it('should join group', (done) => {
      service.joinGroup('group123').subscribe(response => {
        expect(response.success).toBe(true);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/groups/group123/join');
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, message: 'Joined group' });
    });
  });

  describe('leaveGroup', () => {
    it('should leave group', (done) => {
      service.leaveGroup('group123').subscribe(response => {
        expect(response.success).toBe(true);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/groups/group123/leave');
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, message: 'Left group' });
    });
  });

  describe('searchGroups', () => {
    it('should search groups', (done) => {
      service.searchGroups('test').subscribe(response => {
        expect(response.groups).toEqual([mockGroup]);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/groups/search?q=test');
      expect(req.request.method).toBe('GET');
      req.flush({ groups: [mockGroup] });
    });
  });
});
