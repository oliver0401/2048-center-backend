import { Request, Response } from 'express';
import { calcService } from '../../../services';
import { maxScoreHandler } from '../maxScore.controller';
import { httpStatus } from 'types';

// Mock the calcService
jest.mock('../../../services', () => ({
  calcService: {
    maxScoreCount: jest.fn(),
  },
}));

describe('maxScoreHandler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();
    
    mockRequest = {
      user: {
        uuid: 'test-uuid',
        address: 'test-address',
        maxScore: 0,
        maxTile: 0,
        maxMoves: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        rows: 0,
        cols: 0,
        themes: [],
        hammer: 0,
        upgrade: 0,
        powerup: 0,
      },
    };
    
    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };

    // Clear mock calls between tests
    jest.clearAllMocks();
  });

  it('should return max score for the user', async () => {
    // Arrange
    const mockMaxScore = { score: 100 };
    (calcService.maxScoreCount as jest.Mock).mockResolvedValue(mockMaxScore);

    // Act
    await maxScoreHandler(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(calcService.maxScoreCount).toHaveBeenCalledWith('test-uuid');
    expect(mockJson).toHaveBeenCalledWith(mockMaxScore);
    expect(mockStatus).toHaveBeenCalledWith(httpStatus.ACCEPTED);
  });

  it('should handle errors from the service', async () => {
    // Arrange
    const mockError = new Error('Service error');
    (calcService.maxScoreCount as jest.Mock).mockRejectedValue(mockError);

    // Act & Assert
    await expect(maxScoreHandler(mockRequest as Request, mockResponse as Response))
      .rejects.toThrow('Service error');
    expect(calcService.maxScoreCount).toHaveBeenCalledWith('test-uuid');
    expect(mockJson).not.toHaveBeenCalled();
    expect(mockStatus).not.toHaveBeenCalled();
  });
}); 