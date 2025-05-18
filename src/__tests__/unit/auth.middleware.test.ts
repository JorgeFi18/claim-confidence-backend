import { Request, Response, NextFunction } from 'express';
import { AuthMiddleware } from '../../middlewares/auth.middleware';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../types';
import { AuthenticatedRequest } from '../../types/express';

// Mock the AuthService class
jest.mock('../../services/auth.service');

describe('AuthMiddleware', () => {
  let authMiddleware: AuthMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mocks for request, response, and next
    jsonSpy = jest.fn();
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
    
    mockRequest = {
      headers: {},
      user: undefined
    };
    
    mockResponse = {
      status: statusSpy,
      json: jsonSpy
    };
    
    mockNext = jest.fn();

    // Create the middleware instance
    authMiddleware = new AuthMiddleware();
  });

  describe('authenticate', () => {
    it('should authenticate user with valid token', async () => {
      // Mock decoded user
      const mockDecodedUser = {
        id: 'user123',
        email: 'test@example.com',
        role: UserRole.CLAIMANT
      };

      // Mock validateToken method
      (AuthService.prototype.validateToken as jest.Mock).mockResolvedValue(mockDecodedUser);

      // Setup request with valid token
      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      // Call method
      await authMiddleware.authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Assertions
      expect(AuthService.prototype.validateToken).toHaveBeenCalledWith('valid-token');
      expect((mockRequest as AuthenticatedRequest).user).toEqual(mockDecodedUser);
      expect(mockNext).toHaveBeenCalled();
      expect(statusSpy).not.toHaveBeenCalled();
      expect(jsonSpy).not.toHaveBeenCalled();
    });

    it('should return 401 when no token is provided', async () => {
      // Setup request with no authorization header
      mockRequest.headers = {};

      // Call method
      await authMiddleware.authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Assertions
      expect(AuthService.prototype.validateToken).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'No token provided',
        error: 'Authentication required'
      });
    });

    it('should return 401 when token format is invalid', async () => {
      // Setup request with invalid token format
      mockRequest.headers = {
        authorization: 'InvalidToken'
      };

      // Call method
      await authMiddleware.authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Assertions
      expect(AuthService.prototype.validateToken).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token format',
        error: 'Token must be Bearer token'
      });
    });

    it('should return 401 when token validation fails', async () => {
      // Mock validateToken to throw an error
      (AuthService.prototype.validateToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      // Setup request with invalid token
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      // Call method
      await authMiddleware.authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Assertions
      expect(AuthService.prototype.validateToken).toHaveBeenCalledWith('invalid-token');
      expect(mockNext).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication failed',
        error: 'Invalid token'
      });
    });
  });

  describe('authorizeManager', () => {
    it('should authorize user with manager role', () => {
      // Setup request with manager user
      const mockAuthRequest = {
        user: {
          id: 'manager123',
          email: 'manager@example.com',
          role: UserRole.MANAGER
        }
      } as AuthenticatedRequest;

      // Call method
      authMiddleware.authorizeManager(mockAuthRequest, mockResponse as Response, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(statusSpy).not.toHaveBeenCalled();
      expect(jsonSpy).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not a manager', () => {
      // Setup request with non-manager user
      const mockAuthRequest = {
        user: {
          id: 'claimant123',
          email: 'claimant@example.com',
          role: UserRole.CLAIMANT
        }
      } as AuthenticatedRequest;

      // Call method
      authMiddleware.authorizeManager(mockAuthRequest, mockResponse as Response, mockNext);

      // Assertions
      expect(mockNext).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(403);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied',
        error: 'Manager role required'
      });
    });
  });

  describe('authorizeProvider', () => {
    it('should authorize manager with matching provider ID', () => {
      // Setup request with matching provider ID
      const providerId = 'provider123';
      const mockAuthRequest = {
        user: {
          id: 'manager123',
          email: 'manager@example.com',
          role: UserRole.MANAGER,
          providerId
        }
      } as AuthenticatedRequest;

      // Create middleware function for specific provider
      const middleware = authMiddleware.authorizeProvider(providerId);

      // Call method
      middleware(mockAuthRequest, mockResponse as Response, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(statusSpy).not.toHaveBeenCalled();
      expect(jsonSpy).not.toHaveBeenCalled();
    });

    it('should return 403 when provider ID does not match', () => {
      // Setup request with non-matching provider ID
      const mockAuthRequest = {
        user: {
          id: 'manager123',
          email: 'manager@example.com',
          role: UserRole.MANAGER,
          providerId: 'provider456'
        }
      } as AuthenticatedRequest;

      // Create middleware function for specific provider
      const middleware = authMiddleware.authorizeProvider('provider123');

      // Call method
      middleware(mockAuthRequest, mockResponse as Response, mockNext);

      // Assertions
      expect(mockNext).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(403);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied',
        error: 'Invalid provider access'
      });
    });

    it('should return 403 when user is not a manager', () => {
      // Setup request with non-manager user
      const mockAuthRequest = {
        user: {
          id: 'claimant123',
          email: 'claimant@example.com',
          role: UserRole.CLAIMANT
        }
      } as AuthenticatedRequest;

      // Create middleware function for specific provider
      const middleware = authMiddleware.authorizeProvider('provider123');

      // Call method
      middleware(mockAuthRequest, mockResponse as Response, mockNext);

      // Assertions
      expect(mockNext).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(403);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied',
        error: 'Invalid provider access'
      });
    });
  });

  describe('authorizeClaimant', () => {
    it('should authorize user with claimant role', () => {
      // Setup request with claimant user
      const mockAuthRequest = {
        user: {
          id: 'claimant123',
          email: 'claimant@example.com',
          role: UserRole.CLAIMANT
        }
      } as unknown as Request;

      // Call method
      authMiddleware.authorizeClaimant(mockAuthRequest, mockResponse as Response, mockNext);

      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(statusSpy).not.toHaveBeenCalled();
      expect(jsonSpy).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not a claimant', () => {
      // Setup request with non-claimant user
      const mockAuthRequest = {
        user: {
          id: 'manager123',
          email: 'manager@example.com',
          role: UserRole.MANAGER
        }
      } as unknown as Request;

      // Call method
      authMiddleware.authorizeClaimant(mockAuthRequest, mockResponse as Response, mockNext);

      // Assertions
      expect(mockNext).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(403);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied',
        error: 'Claimant role required'
      });
    });

    it('should return 403 when no user is present', () => {
      // Setup request with no user
      const mockAuthRequest = {} as Request;

      // Call method
      authMiddleware.authorizeClaimant(mockAuthRequest, mockResponse as Response, mockNext);

      // Assertions
      expect(mockNext).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(403);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied',
        error: 'Claimant role required'
      });
    });
  });
}); 