import { Request, Response } from "express";
import { updateUserController } from "../updateUser.controller";
import { updateUser } from "../../../services/user.service";
import { MESSAGE } from "consts";
import { httpStatus } from "types";
import { NotFoundError } from "../../../errors";

// Mock the errorHandlerWrapper utility
jest.mock("../../../utils", () => ({
  errorHandlerWrapper: jest.fn((fn) => fn),
}));

// Mock the user service
jest.mock("../../../services/user.service", () => ({
  updateUser: jest.fn(),
}));

describe("updateUserController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      user: {
        uuid: "test-uuid",
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
        userThemes: [],
        countThemes: 0,
      },
      body: { name: "Updated Name", email: "updated@example.com" },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it("should update user and return 200 status with user data", async () => {
    // Mock user service to return updated user
    const mockUpdatedUser = {
      uuid: "test-uuid",
      name: "Updated Name",
      email: "updated@example.com",
    };
    (updateUser as jest.Mock).mockResolvedValue(mockUpdatedUser);

    // Call the controller
    await updateUserController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Verify service was called with correct parameters
    expect(updateUser).toHaveBeenCalledWith({
      uuid: "test-uuid",
      name: "Updated Name",
      email: "updated@example.com",
    });

    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(httpStatus.OK);
    expect(mockResponse.json).toHaveBeenCalledWith(mockUpdatedUser);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should handle case when user is not found", async () => {
    // Mock user service to return null (user not found)
    (updateUser as jest.Mock).mockResolvedValue(null);

    // Call the controller and expect it to throw NotFoundError
    await expect(
      updateUserController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )
    ).rejects.toThrow(new NotFoundError(MESSAGE.ERROR.USER_DOES_NOT_EXIST));

    // Verify service was called
    expect(updateUser).toHaveBeenCalled();

    // Verify response methods were not called
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  it("should handle service errors", async () => {
    // Mock service to throw an error
    const mockError = new Error("Service error");
    (updateUser as jest.Mock).mockRejectedValue(mockError);

    // Call the controller and expect it to throw the same error
    await expect(
      updateUserController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )
    ).rejects.toThrow(mockError);

    // Verify response methods were not called
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });
});
