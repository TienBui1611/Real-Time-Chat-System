import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';
import { User, UserRole, AuthResponse } from '../models';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let storageService: jasmine.SpyObj<StorageService>;

  const mockUser: User = {
    id: 'user123',
    username: 'testuser',
    email: 'test@example.com',
    role: UserRole.USER,
    groups: [],
    isActive: true,
    createdAt: new Date()
  };

  const mockToken = 'session_user123_1234567890';

  beforeEach(() => {
    const storageServiceSpy = jasmine.createSpyObj('StorageService', [
      'saveCurrentUser',
      'loadCurrentUser',
      'clearCurrentUser',
      'save',
      'load',
      'remove',
      'exists'
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: StorageService, useValue: storageServiceSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    storageService = TestBed.inject(StorageService) as jasmine.SpyObj<StorageService>;

    // Default mock implementations
    storageService.loadCurrentUser.and.returnValue(null);
    storageService.load.and.returnValue(null);
    storageService.exists.and.returnValue(false);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', (done) => {
      const mockResponse: AuthResponse = {
        success: true,
        user: mockUser,
        token: mockToken
      };

      service.login('testuser', 'password123').subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.user).toEqual(mockUser);
        expect(response.token).toBe(mockToken);
        expect(storageService.saveCurrentUser).toHaveBeenCalledWith(mockUser);
        expect(storageService.save).toHaveBeenCalledWith('authToken', mockToken);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'testuser', password: 'password123' });
      req.flush(mockResponse);
    });

    it('should handle login failure', (done) => {
      const mockErrorResponse = {
        success: false,
        message: 'Invalid credentials'
      };

      service.login('testuser', 'wrongpassword').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.error.success).toBe(false);
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush(mockErrorResponse, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('logout', () => {
    it('should logout successfully', () => {
      storageService.load.and.returnValue(mockToken);
      
      service.logout();

      const req = httpMock.expectOne('http://localhost:3000/api/auth/logout');
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({ success: true });

      expect(storageService.clearCurrentUser).toHaveBeenCalled();
      expect(storageService.remove).toHaveBeenCalledWith('authToken');
    });

    it('should handle logout without token', () => {
      storageService.load.and.returnValue(null);
      
      service.logout();

      const req = httpMock.expectOne('http://localhost:3000/api/auth/logout');
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when no user is logged in', () => {
      expect(service.getCurrentUser()).toBeNull();
    });

    it('should return current user after login', (done) => {
      const mockResponse: AuthResponse = {
        success: true,
        user: mockUser,
        token: mockToken
      };

      service.login('testuser', 'password123').subscribe(() => {
        expect(service.getCurrentUser()).toEqual(mockUser);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush(mockResponse);
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when not authenticated', () => {
      storageService.exists.and.returnValue(false);
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return true when authenticated', (done) => {
      storageService.exists.and.returnValue(true);
      const mockResponse: AuthResponse = {
        success: true,
        user: mockUser,
        token: mockToken
      };

      service.login('testuser', 'password123').subscribe(() => {
        expect(service.isAuthenticated()).toBe(true);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush(mockResponse);
    });
  });

  describe('hasRole', () => {
    it('should return false when no user is logged in', () => {
      expect(service.hasRole(UserRole.USER)).toBe(false);
    });

    it('should return true when user has the specified role', (done) => {
      const mockResponse: AuthResponse = {
        success: true,
        user: mockUser,
        token: mockToken
      };

      service.login('testuser', 'password123').subscribe(() => {
        expect(service.hasRole(UserRole.USER)).toBe(true);
        expect(service.hasRole(UserRole.SUPER_ADMIN)).toBe(false);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush(mockResponse);
    });
  });

  describe('hasAnyRole', () => {
    it('should return false when no user is logged in', () => {
      expect(service.hasAnyRole([UserRole.USER, UserRole.GROUP_ADMIN])).toBe(false);
    });

    it('should return true when user has any of the specified roles', (done) => {
      const mockResponse: AuthResponse = {
        success: true,
        user: mockUser,
        token: mockToken
      };

      service.login('testuser', 'password123').subscribe(() => {
        expect(service.hasAnyRole([UserRole.USER, UserRole.GROUP_ADMIN])).toBe(true);
        expect(service.hasAnyRole([UserRole.SUPER_ADMIN, UserRole.GROUP_ADMIN])).toBe(false);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush(mockResponse);
    });
  });

  describe('isSuperAdmin', () => {
    it('should return false for regular user', (done) => {
      const mockResponse: AuthResponse = {
        success: true,
        user: mockUser,
        token: mockToken
      };

      service.login('testuser', 'password123').subscribe(() => {
        expect(service.isSuperAdmin()).toBe(false);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush(mockResponse);
    });

    it('should return true for super admin', (done) => {
      const superAdminUser = { ...mockUser, role: UserRole.SUPER_ADMIN };
      const mockResponse: AuthResponse = {
        success: true,
        user: superAdminUser,
        token: mockToken
      };

      service.login('admin', 'adminpass').subscribe(() => {
        expect(service.isSuperAdmin()).toBe(true);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush(mockResponse);
    });
  });

  describe('isGroupAdmin', () => {
    it('should return false for regular user', (done) => {
      const mockResponse: AuthResponse = {
        success: true,
        user: mockUser,
        token: mockToken
      };

      service.login('testuser', 'password123').subscribe(() => {
        expect(service.isGroupAdmin()).toBe(false);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush(mockResponse);
    });

    it('should return true for group admin', (done) => {
      const groupAdminUser = { ...mockUser, role: UserRole.GROUP_ADMIN };
      const mockResponse: AuthResponse = {
        success: true,
        user: groupAdminUser,
        token: mockToken
      };

      service.login('groupadmin', 'password').subscribe(() => {
        expect(service.isGroupAdmin()).toBe(true);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush(mockResponse);
    });

    it('should return true for super admin', (done) => {
      const superAdminUser = { ...mockUser, role: UserRole.SUPER_ADMIN };
      const mockResponse: AuthResponse = {
        success: true,
        user: superAdminUser,
        token: mockToken
      };

      service.login('admin', 'adminpass').subscribe(() => {
        expect(service.isGroupAdmin()).toBe(true);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush(mockResponse);
    });
  });

  describe('getUserRole', () => {
    it('should return null when no user is logged in', () => {
      expect(service.getUserRole()).toBeNull();
    });

    it('should return user role when logged in', (done) => {
      const mockResponse: AuthResponse = {
        success: true,
        user: mockUser,
        token: mockToken
      };

      service.login('testuser', 'password123').subscribe(() => {
        expect(service.getUserRole()).toBe(UserRole.USER);
        done();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush(mockResponse);
    });
  });

  describe('getAuthToken', () => {
    it('should return null when no token exists', () => {
      storageService.load.and.returnValue(null);
      expect(service.getAuthToken()).toBeNull();
    });

    it('should return token when it exists', () => {
      storageService.load.and.returnValue(mockToken);
      expect(service.getAuthToken()).toBe(mockToken);
    });
  });

  describe('updateCurrentUser', () => {
    it('should update current user', () => {
      const updatedUser = { ...mockUser, username: 'updateduser' };
      service.updateCurrentUser(updatedUser);

      expect(storageService.saveCurrentUser).toHaveBeenCalledWith(updatedUser);
      expect(service.getCurrentUser()).toEqual(updatedUser);
    });
  });

  describe('currentUser$ observable', () => {
    it('should emit current user changes', (done) => {
      const mockResponse: AuthResponse = {
        success: true,
        user: mockUser,
        token: mockToken
      };

      service.currentUser$.subscribe(user => {
        if (user) {
          expect(user).toEqual(mockUser);
          done();
        }
      });

      service.login('testuser', 'password123').subscribe();

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush(mockResponse);
    });
  });
});
