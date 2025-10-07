import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { AuthService } from './auth.service';
import { User, UserRole, CreateUserRequest, UpdateUserRequest } from '../models';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  const mockToken = 'session_user123_1234567890';
  const mockUser: User = {
    id: 'user123',
    username: 'testuser',
    email: 'test@example.com',
    role: UserRole.USER,
    groups: [],
    isActive: true,
    createdAt: new Date()
  };

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getAuthToken']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UserService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    authService.getAuthToken.and.returnValue(mockToken);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllUsers', () => {
    it('should get all users', (done) => {
      const mockUsers = [mockUser];

      service.getAllUsers().subscribe(response => {
        expect(response.users).toEqual(mockUsers);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/users');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({ users: mockUsers });
    });
  });

  describe('getUserById', () => {
    it('should get user by ID', (done) => {
      service.getUserById('user123').subscribe(response => {
        expect(response.user).toEqual(mockUser);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/users/user123');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({ user: mockUser });
    });
  });

  describe('createUser', () => {
    it('should create new user', (done) => {
      const createRequest: CreateUserRequest = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        role: UserRole.USER
      };

      const createdUser = { ...mockUser, ...createRequest };

      service.createUser(createRequest).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.user.username).toBe('newuser');
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/users');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({ success: true, user: createdUser });
    });
  });

  describe('updateUser', () => {
    it('should update user', (done) => {
      const updateRequest: UpdateUserRequest = {
        username: 'updateduser',
        email: 'updated@example.com'
      };

      const updatedUser = { ...mockUser, ...updateRequest };

      service.updateUser('user123', updateRequest).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.user.username).toBe('updateduser');
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/users/user123');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateRequest);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({ success: true, user: updatedUser });
    });
  });

  describe('deleteUser', () => {
    it('should delete user', (done) => {
      service.deleteUser('user123').subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('User deleted successfully');
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/users/user123');
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({ success: true, message: 'User deleted successfully' });
    });
  });

  describe('promoteUser', () => {
    it('should promote user to group admin', (done) => {
      const promotedUser = { ...mockUser, role: UserRole.GROUP_ADMIN };

      service.promoteUser('user123', UserRole.GROUP_ADMIN).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.user.role).toBe(UserRole.GROUP_ADMIN);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/users/user123/promote');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ role: UserRole.GROUP_ADMIN });
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({ success: true, user: promotedUser });
    });
  });

  describe('validateUsername', () => {
    it('should return available for new username', (done) => {
      service.validateUsername('newuser').subscribe(response => {
        expect(response.available).toBe(true);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/users/validate-username');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'newuser' });
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({ available: true });
    });

    it('should return unavailable for existing username', (done) => {
      service.validateUsername('testuser').subscribe(response => {
        expect(response.available).toBe(false);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/users/validate-username');
      req.flush({ available: false });
    });
  });

  describe('validateEmail', () => {
    it('should return available for new email', (done) => {
      service.validateEmail('new@example.com').subscribe(response => {
        expect(response.available).toBe(true);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/users/validate-email');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'new@example.com' });
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({ available: true });
    });

    it('should return unavailable for existing email', (done) => {
      service.validateEmail('test@example.com').subscribe(response => {
        expect(response.available).toBe(false);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/users/validate-email');
      req.flush({ available: false });
    });
  });

  describe('searchUsers', () => {
    it('should search users by query', (done) => {
      const mockUsers = [mockUser];

      service.searchUsers('test').subscribe(response => {
        expect(response.users).toEqual(mockUsers);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/users/search?q=test');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({ users: mockUsers });
    });

    it('should encode special characters in search query', (done) => {
      service.searchUsers('test@user').subscribe();

      const req = httpMock.expectOne('http://localhost:3000/api/users/search?q=test%40user');
      expect(req.request.method).toBe('GET');
      req.flush({ users: [] });
      done();
    });
  });

  describe('error handling', () => {
    it('should handle HTTP errors', (done) => {
      service.getAllUsers().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/api/users');
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
