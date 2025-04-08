import { Request, Response } from "express";
import { getThemeController } from "../getTheme.controller";
import { themeService } from "../../../services";
import { httpStatus } from "../../../types";

// Mock the theme service
jest.mock("../../../services", () => ({
  themeService: {
    getThemes: jest.fn(),
  },
}));

describe("getThemeController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockThemes: any[];
  let mockNext: jest.Mock = jest.fn().mockImplementation((fn) => {
    return fn;
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock data
    mockThemes = [
      { id: 1, name: "Theme 1" },
      { id: 2, name: "Theme 2" },
    ];

    // Mock request with user
    mockRequest = {
      user: {
        uuid: "test-user-uuid",
        address: "test-address",
        maxScore: 0,
        maxTile: 0,
        maxMoves: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        rows: 0,
        cols: 0,
        themes: [],
        hammer: 0,
        upgrade: 0,
        powerup: 0,
      },
    };

    // Mock response
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };

    // Mock the service response
    (themeService.getThemes as jest.Mock).mockResolvedValue(mockThemes);
  });

  it("should get themes for the user and return them", async () => {
    // Call the controller
    await getThemeController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Verify service was called with correct user uuid
    expect(themeService.getThemes).toHaveBeenCalledWith("test-user-uuid");

    // Verify response
    expect(mockResponse.json).toHaveBeenCalledWith(mockThemes);
    expect(mockResponse.status).toHaveBeenCalledWith(httpStatus.ACCEPTED);
  });

  it("should handle errors through the error wrapper", async () => {
    // Setup service to throw an error
    const errorMessage = "Service error";
    (themeService.getThemes as jest.Mock).mockRejectedValue(
      new Error(errorMessage)
    );

    // The error handler wrapper should catch this error, so we don't expect
    // the test to throw. Instead, we're verifying the service was called.
    await getThemeController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(themeService.getThemes).toHaveBeenCalledWith("test-user-uuid");
    // The error handler wrapper would handle the response in the actual code
  });
});
