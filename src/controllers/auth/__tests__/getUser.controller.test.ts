import { Request, Response } from "express";
import { getUserController } from "../getUser.controller";
import { httpStatus } from "../../../types";
import { NotFoundError } from "../../../errors";
import { MESSAGE } from "../../../consts";

// Mock the errorHandlerWrapper utility
jest.mock("../../../utils", () => ({
  errorHandlerWrapper: jest.fn((fn) => fn),
}));

describe("getUserHandler", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      user: {
        uuid: "123",
        address: "0x123",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        hammer: 0,
        powerup: 0,
        upgrade: 0,
        maxScore: 0,
        maxMoves: 0,
        maxTile: 0,
        rows: 0,
        cols: 0,
        themes: [],
      },
    };

    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return user data with status 202", async () => {
    await getUserController(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.json).toHaveBeenCalledWith({ ...mockRequest.user });
    expect(mockResponse.status).toHaveBeenCalledWith(httpStatus.ACCEPTED);
  });

  it("should handle case when user is undefined", async () => {
    mockRequest.user = undefined;

    await getUserController(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.json).toHaveBeenCalledWith({});
    expect(mockResponse.status).toHaveBeenCalledWith(httpStatus.ACCEPTED);
  });
});

// Integration tests with middleware
describe("getUserController with auth middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should pass user data from middleware to handler", async () => {
    // Mock implementation of checkAuth middleware
    const mockCheckAuth = (req: Request, _res: Response, next: Function) => {
      req.user = {
        uuid: "123",
        address: "0x123",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        hammer: 0,
        powerup: 0,
        upgrade: 0,
        maxScore: 0,
        maxMoves: 0,
        maxTile: 0,
        rows: 0,
        cols: 0,
        themes: [],
      };
      next();
    };

    // Apply middleware then controller
    mockCheckAuth(mockRequest as Request, mockResponse as Response, () => {
      getUserController(mockRequest as Request, mockResponse as Response, mockNext);
    });

    expect(mockResponse.json).toHaveBeenCalledWith({ ...mockRequest.user });
    expect(mockResponse.status).toHaveBeenCalledWith(httpStatus.ACCEPTED);
  });

  it("should handle NotFoundError from middleware", async () => {
    // Mock implementation that throws error
    const mockCheckAuth = (_req: Request, _res: Response, next: Function) => {
      next(new NotFoundError(MESSAGE.ERROR.USER_DOES_NOT_EXIST));
    };

    // Apply middleware
    mockCheckAuth(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: MESSAGE.ERROR.USER_DOES_NOT_EXIST,
        errorCode: httpStatus.NOT_FOUND,
      })
    );
  });
});
