import { Request, Response } from "express";
import { updateItemController } from "../updateItem.controller";
import { updateItem } from "../../../services/user.service";
import { NotFoundError } from "errors";
import { MESSAGE } from "consts";
import { httpStatus } from "types";

// Mock the errorHandlerWrapper utility
jest.mock("../../../utils", () => ({
  errorHandlerWrapper: jest.fn((fn) => fn),
}));

// Mock the user service
jest.mock("../../../services/user.service", () => ({
  updateItem: jest.fn(),
}));

describe("updateItemController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockUser: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockNext = jest.fn();
    mockUser = {
      uuid: "test-uuid",
      items: [{ id: "item-1", quantity: 2 }],
    };

    mockRequest = {
      user: {
        uuid: "test-uuid",
        address: "test-address",
        maxScore: 0,
        maxTile: 0,
        maxMoves: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        rows: 0,
        cols: 0,
        userThemes: [],
        hammer: 0,
        upgrade: 0,
        powerup: 0,
        countThemes: 0,
      },
      params: { itemId: "item-1" },
      body: { quantity: 3 },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  it("should update an item and return the updated user", async () => {
    // Mock the service to return a user
    (updateItem as jest.Mock).mockResolvedValue(mockUser);

    // Call the controller
    await updateItemController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Verify service was called with correct parameters
    expect(updateItem).toHaveBeenCalledWith("test-uuid", "item-1", 3);

    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(httpStatus.OK);
    expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
  });

  it("should throw NotFoundError when user does not exist", async () => {
    // Mock the service to return null
    (updateItem as jest.Mock).mockResolvedValue(null);

    // Call the controller and expect it to throw
    await expect(
      updateItemController(mockRequest as Request, mockResponse as Response, mockNext)
    ).rejects.toThrow(new NotFoundError(MESSAGE.ERROR.USER_DOES_NOT_EXIST));

    // Verify service was called
    expect(updateItem).toHaveBeenCalledWith("test-uuid", "item-1", 3);

    // Verify response was not called
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  it("should handle missing quantity in request body", async () => {
    // Set up request without quantity
    mockRequest.body = {};

    // Mock the service
    (updateItem as jest.Mock).mockResolvedValue(mockUser);

    // Call the controller
    await updateItemController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Verify service was called with undefined quantity
    expect(updateItem).toHaveBeenCalledWith("test-uuid", "item-1", undefined);

    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(httpStatus.OK);
    expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
  });
});
