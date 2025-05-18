import { Request, Response, NextFunction } from 'express';
import { ClaimController } from '../../controllers/claim.controller';
import { ClaimRepository } from '../../repositories/claim.repository';
import { LogRepository } from '../../repositories/log.repository';
import { IClaim, ClaimStatus, UserRole } from '../../types';
import { AuthenticatedRequest, AuthenticatedUser } from '../../types/express';
import { ApiResponse } from '../../types/response';
import { ObjectId } from 'mongodb';

// Mock the repositories
jest.mock('../../repositories/claim.repository');
jest.mock('../../repositories/log.repository');

// Create a mock response type that satisfies the Response interface
interface MockResponse<T = any> extends Partial<Response> {
  status: jest.Mock<any, any>;
  json: jest.Mock<any, any>;
  locals: {
    user?: AuthenticatedUser;
  };
}

describe('ClaimController', () => {
  let claimController: ClaimController;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: MockResponse;
  let mockNext: NextFunction;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;
  let mockClaimRepo: any;
  let mockLogRepo: any;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mocks for request and response
    jsonSpy = jest.fn();
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
    
    mockRequest = {
      user: {
        id: 'user123',
        email: 'user@example.com',
        role: UserRole.CLAIMANT
      },
      params: {},
      body: {}
    };
    
    mockResponse = {
      status: statusSpy,
      json: jsonSpy,
      locals: {
        user: mockRequest.user
      }
    };

    mockNext = jest.fn();
    
    // Initialize mock repositories
    ClaimRepository.prototype.findByUser = jest.fn();
    ClaimRepository.prototype.findByProvider = jest.fn();
    ClaimRepository.prototype.create = jest.fn();
    ClaimRepository.prototype.findById = jest.fn();
    ClaimRepository.prototype.updateStatus = jest.fn();
    ClaimRepository.prototype.addComment = jest.fn();
    LogRepository.prototype.logAction = jest.fn();
    
    // Create controller instance
    claimController = new ClaimController();
    
    // Get references to mocked repositories
    mockClaimRepo = ClaimRepository.prototype;
    mockLogRepo = LogRepository.prototype;
  });

  describe('getClaims', () => {
    it('should return claims for a user when role is claimant', async () => {
      // Mock claims data
      const mockClaims: IClaim[] = [
        {
          _id: new ObjectId('507f1f77bcf86cd799439011'),
          userId: 'user123',
          benefit: 'Health Insurance',
          fullName: 'John Doe',
          birthDate: new Date('1990-01-01'),
          gender: 'Male',
          phoneNumber: '1234567890',
          workPhoneNumber: '0987654321',
          dependants: true,
          roleStartDate: new Date('2020-01-01'),
          providerId: 'provider123',
          status: ClaimStatus.PENDING,
          createdAt: new Date(),
          comments: [],
          isDeleted: false
        }
      ];

      // Setup mock to return claims
      mockClaimRepo.findByUser.mockResolvedValue(mockClaims);

      // Call the controller method
      await claimController.getClaims(mockRequest as any, mockResponse as any, mockNext);

      // Assertions
      expect(mockClaimRepo.findByUser).toHaveBeenCalledWith('user123');
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: 'Claims retrieved successfully',
        data: mockClaims
      });
    });

    it('should return claims for a provider when role is manager', async () => {
      // Setup user as manager
      mockRequest.user = {
        id: 'manager123',
        email: 'manager@example.com',
        role: UserRole.MANAGER,
        providerId: 'provider123'
      };
      mockResponse.locals.user = mockRequest.user;

      // Mock claims data
      const mockClaims: IClaim[] = [
        {
          _id: new ObjectId('507f1f77bcf86cd799439011'),
          userId: 'user123',
          benefit: 'Health Insurance',
          fullName: 'John Doe',
          birthDate: new Date('1990-01-01'),
          gender: 'Male',
          phoneNumber: '1234567890',
          workPhoneNumber: '0987654321',
          dependants: true,
          roleStartDate: new Date('2020-01-01'),
          providerId: 'provider123',
          status: ClaimStatus.PENDING,
          createdAt: new Date(),
          comments: [],
          isDeleted: false
        }
      ];

      // Setup mock to return claims
      mockClaimRepo.findByProvider.mockResolvedValue(mockClaims);

      // Call the controller method
      await claimController.getClaims(mockRequest as any, mockResponse as any, mockNext);

      // Assertions
      expect(mockClaimRepo.findByProvider).toHaveBeenCalledWith('provider123');
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: 'Claims retrieved successfully',
        data: mockClaims
      });
    });

    it('should handle errors when retrieving claims fails', async () => {
      // Setup mock to throw error
      const errorMessage = 'Database connection failed';
      mockClaimRepo.findByUser.mockRejectedValue(new Error(errorMessage));

      // Call the controller method
      await claimController.getClaims(mockRequest as any, mockResponse as any, mockNext);

      // Assertions
      expect(mockClaimRepo.findByUser).toHaveBeenCalledWith('user123');
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to retrieve claims',
        error: errorMessage
      });
    });
  });

  describe('createClaim', () => {
    it('should create a claim successfully', async () => {
      // Mock claim data
      const claimData = {
        benefit: 'Health Insurance',
        fullName: 'John Doe',
        birthDate: new Date('1990-01-01'),
        gender: 'Male',
        phoneNumber: '1234567890',
        workPhoneNumber: '0987654321',
        dependants: true,
        roleStartDate: new Date('2020-01-01'),
        providerId: 'provider123'
      };

      // Setup request body
      mockRequest.body = claimData;

      // Mock created claim
      const createdClaim = {
        _id: new ObjectId('507f1f77bcf86cd799439011'),
        ...claimData,
        userId: 'user123',
        status: ClaimStatus.PENDING,
        createdAt: expect.any(Date),
        comments: [],
        isDeleted: false
      };

      // Setup mocks
      mockClaimRepo.create.mockResolvedValue(createdClaim);
      mockLogRepo.logAction.mockResolvedValue({});

      // Call the controller method
      await claimController.createClaim(mockRequest as any, mockResponse as any, mockNext);

      // Assertions
      expect(mockClaimRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        ...claimData,
        userId: 'user123',
        status: ClaimStatus.PENDING,
        comments: [],
        isDeleted: false
      }));
      expect(mockLogRepo.logAction).toHaveBeenCalledWith(
        'user123',
        createdClaim._id!.toString(),
        'Created new claim'
      );
      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: 'Claim created successfully',
        data: createdClaim
      });
    });

    it('should handle errors when creating a claim fails', async () => {
      // Setup claim data
      const claimData = {
        benefit: 'Health Insurance',
        fullName: 'John Doe',
        birthDate: new Date('1990-01-01'),
        gender: 'Male',
        phoneNumber: '1234567890',
        workPhoneNumber: '0987654321',
        dependants: true,
        roleStartDate: new Date('2020-01-01'),
        providerId: 'provider123'
      };

      // Setup request body
      mockRequest.body = claimData;

      // Setup mock to throw error
      const errorMessage = 'Database connection failed';
      mockClaimRepo.create.mockRejectedValue(new Error(errorMessage));

      // Call the controller method
      await claimController.createClaim(mockRequest as any, mockResponse as any, mockNext);

      // Assertions
      expect(mockClaimRepo.create).toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to create claim',
        error: errorMessage
      });
    });
  });

  describe('updateClaimStatus', () => {
    it('should update a claim status successfully', async () => {
      // Setup claim ID and new status
      const claimId = '507f1f77bcf86cd799439011';
      const newStatus = ClaimStatus.APPROVED;

      // Setup existing claim
      const existingClaim = {
        _id: new ObjectId(claimId),
        userId: 'user123',
        benefit: 'Health Insurance',
        fullName: 'John Doe',
        birthDate: new Date('1990-01-01'),
        gender: 'Male',
        phoneNumber: '1234567890',
        workPhoneNumber: '0987654321',
        dependants: true,
        roleStartDate: new Date('2020-01-01'),
        providerId: 'provider123',
        status: ClaimStatus.REVIEW,
        createdAt: new Date(),
        comments: [],
        isDeleted: false
      };

      // Setup updated claim
      const updatedClaim = {
        ...existingClaim,
        status: newStatus
      };

      // Setup request params and body
      mockRequest.params = { id: claimId };
      mockRequest.body = { status: newStatus };
      mockRequest.user = {
        id: 'manager123',
        email: 'manager@example.com',
        role: UserRole.MANAGER,
        providerId: 'provider123'
      };
      mockResponse.locals.user = mockRequest.user;

      // Setup mocks
      mockClaimRepo.findById.mockResolvedValue(existingClaim);
      mockClaimRepo.updateStatus.mockResolvedValue(updatedClaim);
      mockLogRepo.logAction.mockResolvedValue({});

      // Call the controller method
      await claimController.updateClaimStatus(mockRequest as any, mockResponse as any, mockNext);

      // Assertions
      expect(mockClaimRepo.findById).toHaveBeenCalledWith(claimId);
      expect(mockClaimRepo.updateStatus).toHaveBeenCalledWith(claimId, newStatus);
      expect(mockLogRepo.logAction).toHaveBeenCalledWith(
        'manager123',
        claimId,
        `Updated claim status from ${existingClaim.status} to ${newStatus}`
      );
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: 'Claim status updated successfully',
        data: updatedClaim
      });
    });

    it('should return 404 when claim not found', async () => {
      // Setup claim ID and new status
      const claimId = '507f1f77bcf86cd799439011';
      const newStatus = ClaimStatus.APPROVED;

      // Setup request params and body
      mockRequest.params = { id: claimId };
      mockRequest.body = { status: newStatus };

      // Setup mock to return null (claim not found)
      mockClaimRepo.findById.mockResolvedValue(null);

      // Call the controller method
      await claimController.updateClaimStatus(mockRequest as any, mockResponse as any, mockNext);

      // Assertions
      expect(mockClaimRepo.findById).toHaveBeenCalledWith(claimId);
      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Claim not found',
        error: 'Invalid claim ID'
      });
    });
  });
}); 