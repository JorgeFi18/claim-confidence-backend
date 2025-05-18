import { Request, Response } from 'express';
import { AuthController } from '../../controllers/auth.controller';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../types';
import { LoginResponse } from '../../types/auth';

// Mock the AuthService class
jest.mock('../../services/auth.service');

describe('AuthController', () => {
  let authController: AuthController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mocks for request and response
    jsonSpy = jest.fn().mockReturnThis();
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
    
    mockRequest = {
      body: {}
    };
    
    mockResponse = {
      status: statusSpy,
      json: jsonSpy
    };

    // Create the controller instance
    authController = new AuthController();
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      // Mock implementation for the register method
      (AuthService.prototype.register as jest.Mock).mockResolvedValue({
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.CLAIMANT
      });

      // Setup request
      mockRequest.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.CLAIMANT
      };

      // Call method
      await authController.register(mockRequest as Request, mockResponse as Response);

      // Assertions
      expect(AuthService.prototype.register).toHaveBeenCalledWith(mockRequest.body);
      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: 'User registered successfully'
      });
    });

    it('should return 400 when required fields are missing', async () => {
      // Setup request with missing fields
      mockRequest.body = {
        name: 'Test User',
        // Missing email, password and role
      };

      // Call method
      await authController.register(mockRequest as Request, mockResponse as Response);

      // Assertions
      expect(AuthService.prototype.register).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Missing required fields',
        error: 'All fields are required'
      });
    });

    it('should return 400 when role is invalid', async () => {
      // Setup request with invalid role
      mockRequest.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'invalid-role' // Not a valid UserRole
      };

      // Call method
      await authController.register(mockRequest as Request, mockResponse as Response);

      // Assertions
      expect(AuthService.prototype.register).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid role',
        error: 'Role must be either manager or claimant'
      });
    });

    it('should return 400 when providerId is missing for manager role', async () => {
      // Setup request with manager role but missing providerId
      mockRequest.body = {
        name: 'Manager User',
        email: 'manager@example.com',
        password: 'password123',
        role: UserRole.MANAGER
        // Missing providerId
      };

      // Call method
      await authController.register(mockRequest as Request, mockResponse as Response);

      // Assertions
      expect(AuthService.prototype.register).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Provider ID is required for managers',
        error: 'providerId is required'
      });
    });

    it('should return 400 when registration fails', async () => {
      // Mock implementation to throw an error
      const errorMessage = 'User already exists';
      (AuthService.prototype.register as jest.Mock).mockRejectedValue(new Error(errorMessage));

      // Setup request
      mockRequest.body = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
        role: UserRole.CLAIMANT
      };

      // Call method
      await authController.register(mockRequest as Request, mockResponse as Response);

      // Assertions
      expect(AuthService.prototype.register).toHaveBeenCalledWith(mockRequest.body);
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to register user',
        error: errorMessage
      });
    });
  });

  describe('login', () => {
    it('should login a user successfully', async () => {
      // Mock login result
      const mockLoginResult: LoginResponse = {
        token: 'fake-jwt-token',
        user: {
          id: 'user123',
          name: 'Test User',
          email: 'test@example.com',
          role: UserRole.CLAIMANT
        }
      };

      // Mock implementation
      (AuthService.prototype.login as jest.Mock).mockResolvedValue(mockLoginResult);

      // Setup request
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Call method
      await authController.login(mockRequest as Request, mockResponse as Response);

      // Assertions
      expect(AuthService.prototype.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: mockLoginResult
      });
    });

    it('should return 400 when credentials are missing', async () => {
      // Setup request with missing credentials
      mockRequest.body = {
        // Missing email and password
      };

      // Call method
      await authController.login(mockRequest as Request, mockResponse as Response);

      // Assertions
      expect(AuthService.prototype.login).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Missing credentials',
        error: 'Email and password are required'
      });
    });

    it('should return 401 when login fails', async () => {
      // Mock implementation to throw an error
      const errorMessage = 'Invalid credentials';
      (AuthService.prototype.login as jest.Mock).mockRejectedValue(new Error(errorMessage));

      // Setup request
      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrong-password'
      };

      // Call method
      await authController.login(mockRequest as Request, mockResponse as Response);

      // Assertions
      expect(AuthService.prototype.login).toHaveBeenCalledWith('test@example.com', 'wrong-password');
      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Login failed',
        error: errorMessage
      });
    });
  });
}); 