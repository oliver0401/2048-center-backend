import { Request, Response } from "express";
import { calcService } from "../../../services";
import { maxMoveHandler } from "../maxMove.controller";
import { httpStatus } from "types";

// Mock the calcService
jest.mock("../../../services", () => ({
  calcService: {
    maxMoveCount: jest.fn(),
  },
}));

describe("maxMoveController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();

    mockRequest = {
      user: {
        uuid: "test-uuid",
        address: "test-address",
        maxScore: 0,
        maxTile: 0,
        maxMoves: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        rows: 0,
        cols: 0,
        userThemes: [],
        hammer: 0,
        upgrade: 0,
        powerup: 0,
        countThemes: 0,
      },
    };

    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };

    // Clear mock calls between tests
    jest.clearAllMocks();
  });

  it("should return max move count for the user", async () => {
    // Arrange
    const mockMaxMove = { maxMoves: 10 };
    (calcService.maxMoveCount as jest.Mock).mockResolvedValue(mockMaxMove);

    // Act
    await maxMoveHandler(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(calcService.maxMoveCount).toHaveBeenCalledWith("test-uuid");
    expect(mockJson).toHaveBeenCalledWith(mockMaxMove);
    expect(mockStatus).toHaveBeenCalledWith(httpStatus.ACCEPTED);
  });

  it("should handle errors from the service", async () => {
    // Arrange
    const mockError = new Error("Service error");
    (calcService.maxMoveCount as jest.Mock).mockRejectedValue(mockError);

    // Act & Assert
    await expect(
      maxMoveHandler(mockRequest as Request, mockResponse as Response)
    ).rejects.toThrow("Service error");

    expect(calcService.maxMoveCount).toHaveBeenCalledWith("test-uuid");
    expect(mockJson).not.toHaveBeenCalled();
    expect(mockStatus).not.toHaveBeenCalled();
  });
});
