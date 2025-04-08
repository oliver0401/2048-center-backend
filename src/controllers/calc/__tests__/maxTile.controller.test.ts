import { Request, Response } from 'express';
import { maxTileController } from '../maxTile.controller';
import { calcService } from '../../../services';
import { httpStatus } from 'types';

// Mock the calcService
jest.mock('../../../services', () => ({
  calcService: {
    maxTileCount: jest.fn(),
  },
}));

describe('maxTileController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();
    mockNext = jest.fn();
    
    mockRequest = {};
    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };

    jest.clearAllMocks();
  });

  it('should return max tile count with status 202', async () => {
    // Arrange
    const mockMaxTileData = { value: 2048, count: 5 };
    (calcService.maxTileCount as jest.Mock).mockResolvedValue(mockMaxTileData);

    // Act
    await maxTileController(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(calcService.maxTileCount).toHaveBeenCalledTimes(1);
    expect(mockJson).toHaveBeenCalledWith(mockMaxTileData);
    expect(mockStatus).toHaveBeenCalledWith(httpStatus.ACCEPTED);
  });

  it('should handle errors properly', async () => {
    // Arrange
    const mockError = new Error('Service error');
    (calcService.maxTileCount as jest.Mock).mockRejectedValue(mockError);

    // Act
    await maxTileController(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(calcService.maxTileCount).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith(mockError);
  });
}); 