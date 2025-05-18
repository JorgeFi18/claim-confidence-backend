import { Request, Response } from 'express';
import { ProviderController } from '../../controllers/provider.controller';
import { ProviderRepository } from '../../repositories/provider.repository';
import { IProvider, ProviderStatus } from '../../types';
import { ObjectId } from 'mongodb';

// Mock the repository
jest.mock('../../repositories/provider.repository');

describe('ProviderController', () => {
  let providerController: ProviderController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;
  let mockProviderRepo: any;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mocks for request and response
    jsonSpy = jest.fn().mockReturnThis();
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
    
    mockRequest = {};
    
    mockResponse = {
      status: statusSpy,
      json: jsonSpy
    };

    // Reset the ProviderRepository prototype
    ProviderRepository.prototype.findActive = jest.fn();
    
    // Create the controller instance
    providerController = new ProviderController();
    
    // Get reference to the mocked repository
    mockProviderRepo = ProviderRepository.prototype;
  });

  describe('getProviders', () => {
    it('should return active providers successfully', async () => {
      // Mock providers data
      const mockProviders: IProvider[] = [
        { 
          _id: new ObjectId('507f1f77bcf86cd799439011'),
          name: 'Provider 1',
          email: 'provider1@example.com',
          address: '123 Test St',
          status: ProviderStatus.ACTIVE
        },
        {
          _id: new ObjectId('507f1f77bcf86cd799439012'),
          name: 'Provider 2',
          email: 'provider2@example.com',
          address: '456 Sample Ave',
          status: ProviderStatus.ACTIVE
        }
      ];

      // Setup mock to return providers
      mockProviderRepo.findActive.mockResolvedValue(mockProviders);

      // Call the controller method
      await providerController.getProviders(mockRequest as Request, mockResponse as Response);

      // Assertions
      expect(mockProviderRepo.findActive).toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: 'Providers retrieved successfully',
        data: mockProviders
      });
    });

    it('should handle errors when retrieving providers fails', async () => {
      // Setup mock to throw error
      const errorMessage = 'Database connection failed';
      mockProviderRepo.findActive.mockRejectedValue(new Error(errorMessage));

      // Call the controller method
      await providerController.getProviders(mockRequest as Request, mockResponse as Response);

      // Assertions
      expect(mockProviderRepo.findActive).toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to retrieve providers',
        error: errorMessage
      });
    });
  });
}); 