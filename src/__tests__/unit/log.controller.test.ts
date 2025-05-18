import { Response, NextFunction } from 'express';
import { LogController } from '../../controllers/log.controller';
import { LogRepository } from '../../repositories/log.repository';
import { ILog, UserRole } from '../../types';
import { AuthenticatedRequest } from '../../types/express';
import { ObjectId } from 'mongodb';

// Mock the repository
jest.mock('../../repositories/log.repository');

describe('LogController', () => {
  let logController: LogController;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;
  let mockLogRepo: any;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mocks for request and response
    jsonSpy = jest.fn().mockReturnThis();
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
    
    mockRequest = {
      user: {
        id: 'user123',
        email: 'user@example.com',
        role: UserRole.CLAIMANT
      },
      query: {},
      params: {}
    };
    
    mockResponse = {
      status: statusSpy,
      json: jsonSpy
    };

    mockNext = jest.fn();
    
    // Reset the LogRepository prototype
    LogRepository.prototype.findByUser = jest.fn();
    LogRepository.prototype.findByClaim = jest.fn();
    LogRepository.prototype.findByUserAndClaim = jest.fn();
    
    // Create the controller instance
    logController = new LogController();
    
    // Get reference to the mocked repository
    mockLogRepo = LogRepository.prototype;
  });

  describe('getLogs', () => {
    it('should return logs for a user when no claimId is provided', async () => {
      // Mock log data
      const mockLogs: ILog[] = [
        {
          _id: new ObjectId('507f1f77bcf86cd799439011'),
          userId: 'user123',
          claimId: 'claim123',
          action: 'Created claim',
          date: new Date()
        },
        {
          _id: new ObjectId('507f1f77bcf86cd799439012'),
          userId: 'user123',
          claimId: 'claim456',
          action: 'Updated claim status',
          date: new Date()
        }
      ];

      // Setup mock to return logs
      mockLogRepo.findByUser.mockResolvedValue(mockLogs);

      // Call the controller method
      await logController.getLogs(mockRequest as any, mockResponse as any, mockNext);

      // Assertions
      expect(mockLogRepo.findByUser).toHaveBeenCalledWith('user123');
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: 'Logs retrieved successfully',
        data: mockLogs
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return logs for a specific claim when claimId is provided', async () => {
      // Mock log data
      const claimId = 'claim123';
      const mockLogs: ILog[] = [
        {
          _id: new ObjectId('507f1f77bcf86cd799439011'),
          userId: 'user123',
          claimId,
          action: 'Created claim',
          date: new Date()
        },
        {
          _id: new ObjectId('507f1f77bcf86cd799439012'),
          userId: 'user456',
          claimId,
          action: 'Updated claim status',
          date: new Date()
        }
      ];

      // Setup request with claimId query parameter
      mockRequest.query = { claimId };

      // Setup mock to return logs
      mockLogRepo.findByClaim.mockResolvedValue(mockLogs);

      // Call the controller method
      await logController.getLogs(mockRequest as any, mockResponse as any, mockNext);

      // Assertions
      expect(mockLogRepo.findByClaim).toHaveBeenCalledWith(claimId);
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: 'Logs retrieved successfully',
        data: mockLogs
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle errors when retrieving logs fails', async () => {
      // Setup mock to throw error
      const errorMessage = 'Database connection failed';
      mockLogRepo.findByUser.mockRejectedValue(new Error(errorMessage));

      // Call the controller method
      await logController.getLogs(mockRequest as any, mockResponse as any, mockNext);

      // Assertions
      expect(mockLogRepo.findByUser).toHaveBeenCalledWith('user123');
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to retrieve logs',
        error: errorMessage
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('getClaimLogs', () => {
    it('should return logs for a specific claim', async () => {
      // Mock claim ID and log data
      const claimId = 'claim123';
      const mockLogs: ILog[] = [
        {
          _id: new ObjectId('507f1f77bcf86cd799439011'),
          userId: 'user123',
          claimId,
          action: 'Created claim',
          date: new Date()
        },
        {
          _id: new ObjectId('507f1f77bcf86cd799439012'),
          userId: 'user456',
          claimId,
          action: 'Updated claim status',
          date: new Date()
        }
      ];

      // Setup request with claimId parameter
      mockRequest.params = { claimId };

      // Setup mock to return logs
      mockLogRepo.findByClaim.mockResolvedValue(mockLogs);

      // Call the controller method
      await logController.getClaimLogs(mockRequest as any, mockResponse as any, mockNext);

      // Assertions
      expect(mockLogRepo.findByClaim).toHaveBeenCalledWith(claimId);
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: 'Claim logs retrieved successfully',
        data: mockLogs
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle errors when retrieving claim logs fails', async () => {
      // Setup claim ID and error message
      const claimId = 'claim123';
      const errorMessage = 'Database connection failed';
      
      // Setup request with claimId parameter
      mockRequest.params = { claimId };
      
      // Setup mock to throw error
      mockLogRepo.findByClaim.mockRejectedValue(new Error(errorMessage));

      // Call the controller method
      await logController.getClaimLogs(mockRequest as any, mockResponse as any, mockNext);

      // Assertions
      expect(mockLogRepo.findByClaim).toHaveBeenCalledWith(claimId);
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to retrieve claim logs',
        error: errorMessage
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('getUserClaimLogs', () => {
    it('should return logs for a specific user and claim', async () => {
      // Mock claim ID and log data
      const claimId = 'claim123';
      const userId = 'user123';
      const mockLogs: ILog[] = [
        {
          _id: new ObjectId('507f1f77bcf86cd799439011'),
          userId,
          claimId,
          action: 'Created claim',
          date: new Date()
        },
        {
          _id: new ObjectId('507f1f77bcf86cd799439012'),
          userId,
          claimId,
          action: 'Updated claim status',
          date: new Date()
        }
      ];

      // Setup request with claimId parameter
      mockRequest.params = { claimId };
      mockRequest.user = { id: userId, email: 'user@example.com', role: UserRole.CLAIMANT };

      // Setup mock to return logs
      mockLogRepo.findByUserAndClaim.mockResolvedValue(mockLogs);

      // Call the controller method
      await logController.getUserClaimLogs(mockRequest as any, mockResponse as any, mockNext);

      // Assertions
      expect(mockLogRepo.findByUserAndClaim).toHaveBeenCalledWith(userId, claimId);
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: 'User claim logs retrieved successfully',
        data: mockLogs
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle errors when retrieving user claim logs fails', async () => {
      // Setup IDs and error message
      const claimId = 'claim123';
      const userId = 'user123';
      const errorMessage = 'Database connection failed';
      
      // Setup request with parameters
      mockRequest.params = { claimId };
      mockRequest.user = { id: userId, email: 'user@example.com', role: UserRole.CLAIMANT };
      
      // Setup mock to throw error
      mockLogRepo.findByUserAndClaim.mockRejectedValue(new Error(errorMessage));

      // Call the controller method
      await logController.getUserClaimLogs(mockRequest as any, mockResponse as any, mockNext);

      // Assertions
      expect(mockLogRepo.findByUserAndClaim).toHaveBeenCalledWith(userId, claimId);
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to retrieve user claim logs',
        error: errorMessage
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});