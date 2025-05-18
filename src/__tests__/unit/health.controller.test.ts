import { Request, Response } from 'express';
import healthCheck from '../../controllers/health.controller';

describe('HealthController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      send: jest.fn()
    };
  });

  it('should return "ok" as the health status', () => {
    // Call the health check function
    healthCheck(mockRequest as Request, mockResponse as Response);

    // Verify the response
    expect(mockResponse.send).toHaveBeenCalledWith('ok');
  });
}); 