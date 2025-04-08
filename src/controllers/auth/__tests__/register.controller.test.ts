import { Request, Response } from 'express';
import { registerController } from '../register.controller';
import { userService } from '../../../services';
import { DuplicateError } from '../../../errors';
import { MESSAGE } from '../../../consts';
import { httpStatus } from '../../../types';

// Mock the userService
jest.mock('../../../services', () => ({
  userService: {
    createUser: jest.fn(),
  },
}));

describe('Register Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    responseJson = jest.fn().mockReturnThis();
    responseStatus = jest.fn().mockReturnThis();
    
    mockRequest = {
      body: {
        address: '0x123456789abcdef',
      },
    };
    
    mockResponse = {
      json: responseJson,
      status: responseStatus,
    };
    
    mockNext = jest.fn();
    
    jest.clearAllMocks();
  });

  it('should register a new user successfully', async () => {
    const mockUser = { id: 1, address: '0x123456789abcdef' };
    (userService.createUser as jest.Mock).mockResolvedValue(mockUser);

    await registerController(mockRequest as Request, mockResponse as Response, mockNext);

    expect(userService.createUser).toHaveBeenCalledWith({
      address: '0x123456789abcdef',
    });
    expect(responseJson).toHaveBeenCalledWith({ user: mockUser });
    expect(responseStatus).toHaveBeenCalledWith(httpStatus.CREATED);
  });

  it('should handle duplicate user error', async () => {
    (userService.createUser as jest.Mock).mockResolvedValue(null);

    await registerController(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: MESSAGE.ERROR.USER_ALREADY_EXISTS
      })
    );
    expect(userService.createUser).toHaveBeenCalledWith({
      address: '0x123456789abcdef',
    });
  });

  it('should handle service errors', async () => {
    const error = new Error('Service error');
    (userService.createUser as jest.Mock).mockRejectedValue(error);

    await registerController(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
    expect(userService.createUser).toHaveBeenCalledWith({
      address: '0x123456789abcdef',
    });
  });
}); 