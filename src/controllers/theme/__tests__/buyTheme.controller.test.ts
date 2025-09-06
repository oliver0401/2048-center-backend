import { Request, Response } from "express";
import { buyThemeController } from "../buyTheme.controller";
import { themeService } from "../../../services";
import axios from "axios";
import Web3 from "web3";
import { ADDRESSES, CONSTANTS } from "consts";

// Mock dependencies
jest.mock("../../../services", () => ({
  themeService: {
    buyTheme: jest
      .fn()
      .mockImplementation((_userId: string, _themeId: string) => {
        return {
          id: "test-theme-id",
          name: "Test Theme",
        };
      }),
  },
}));

jest.mock("axios", () => ({
  get: jest.fn().mockResolvedValue({
    data: {
      binancecoin: { usd: 0.5 },
      tether: { usd: 0.5 },
    },
  }),
}));
jest.mock("web3");

describe("buyThemeController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockWeb3Instance: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock request and response
    mockRequest = {
      user: {
        uuid: "test-user-id",
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
      body: {
        themeId: "test-theme-id",
        txData: {
          txHash: "0x123456789abcdef",
          tokenType: "usdt",
          network: "polygon",
          fromAddr: "0xUserAddress",
          toAddr: "0xContractAddress",
          amount: 10,
        },
      },
    };

    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    // Mock Web3 functionality
    mockWeb3Instance = {
      eth: {
        getTransaction: jest.fn(),
        getTransactionReceipt: jest.fn(),
        abi: {
          decodeLog: jest.fn(),
        },
      },
      utils: {
        keccak256: jest.fn(),
      },
    };

    (Web3 as jest.MockedClass<typeof Web3>).mockImplementation(
      () => mockWeb3Instance as any
    );
    (Web3.utils.keccak256 as jest.Mock).mockReturnValue(
      "0xTransferEventSignature"
    );

    // Mock environment variables
    process.env.POLYGON_RPC_URL = "https://polygon-rpc.com";
    process.env.BINANCE_RPC_URL = "https://binance-rpc.com";
    process.env.ARBITRUM_RPC_URL = "https://arbitrum-rpc.com";
    process.env.FUSE_RPC_URL = "https://fuse-rpc.com";
  });

  it("should successfully buy a theme with USDT token", async () => {
    // Mock transaction data
    mockWeb3Instance.eth.getTransaction.mockResolvedValue({
      from: "0xUserAddress",
      to: ADDRESSES.TOKEN_CONTRACTS.polygon.usdt,
      value: "0",
    });

    mockWeb3Instance.eth.getTransactionReceipt.mockResolvedValue({
      status: true,
      logs: [
        {
          address: ADDRESSES.TOKEN_CONTRACTS.polygon.usdt.toLowerCase(),
          data: "0xdata",
          topics: ["0xTransferEventSignature", "topic1", "topic2"],
        },
      ],
    });

    mockWeb3Instance.eth.abi.decodeLog.mockReturnValue({
      from: "0xUserAddress".toLowerCase(),
      to: "0xContractAddress".toLowerCase(),
      value: CONSTANTS.CONVERT_AMOUNT * 10 * 2,
    });

    await buyThemeController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(themeService.buyTheme).toHaveBeenCalledWith(
      "test-user-id",
      "test-theme-id"
    );
    expect(mockResponse.json).toHaveBeenCalledWith({
      id: "test-theme-id",
      name: "Test Theme",
    });
  });

  it("should successfully buy a theme with native token (BNB)", async () => {
    // Update request to use BNB
    mockRequest.body.txData.tokenType = "bnb";
    mockRequest.body.txData.network = "binance";

    // Mock transaction data for native token
    mockWeb3Instance.eth.getTransaction.mockResolvedValue({
      from: "0xUserAddress".toLowerCase(),
      to: "0xContractAddress".toLowerCase(),
      value: CONSTANTS.CONVERT_AMOUNT * 10 * 2,
    });

    mockWeb3Instance.eth.getTransactionReceipt.mockResolvedValue({
      status: true,
      logs: [],
    });

    await buyThemeController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(themeService.buyTheme).toHaveBeenCalledWith(
      "test-user-id",
      "test-theme-id"
    );
    expect(mockResponse.json).toHaveBeenCalledWith({
      id: "test-theme-id",
      name: "Test Theme",
    });
  });

  it("should throw an error if transaction data is incomplete", async () => {
    // Missing required fields
    mockRequest.body.txData = {
      txHash: "0x123456789abcdef",
      tokenType: "usdt",
      // Missing network and other fields
    };

    await buyThemeController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: "Internal server error",
    });
  });

  it("should throw an error if network is unsupported", async () => {
    // Unsupported network
    mockRequest.body.txData.network = "ethereum";

    await buyThemeController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: "Internal server error",
    });
  });

  it("should throw an error if token is unsupported on the network", async () => {
    // Assume ADDRESSES.TOKEN_CONTRACTS doesn't have this combination
    mockRequest.body.txData.tokenType = "dai";

    await buyThemeController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: "Internal server error",
    });
  });

  it("should throw an error if transaction failed", async () => {
    // Transaction receipt shows failure
    mockWeb3Instance.eth.getTransaction.mockResolvedValue({
      from: "0xUserAddress",
      to: "0xContractAddress",
      value: "0",
    });

    mockWeb3Instance.eth.getTransactionReceipt.mockResolvedValue({
      status: false, // Failed transaction
      logs: [],
    });

    await buyThemeController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: "Internal server error",
    });
  });

  it("should throw an error if transaction details are incorrect for token transfer", async () => {
    // Mock transaction data
    mockWeb3Instance.eth.getTransaction.mockResolvedValue({
      from: "0xUserAddress",
      to: "0xContractAddress",
      value: "0",
    });

    mockWeb3Instance.eth.getTransactionReceipt.mockResolvedValue({
      status: true,
      logs: [
        {
          address: ADDRESSES.TOKEN_CONTRACTS.polygon.usdt,
          data: "0xdata",
          topics: ["topic0", "topic1", "topic2"],
        },
      ],
    });

    // Decoded log shows wrong addresses
    mockWeb3Instance.eth.abi.decodeLog.mockReturnValue({
      from: "0xWrongAddress", // Different from fromAddr
      to: "0xContractAddress",
      value: CONSTANTS.CONVERT_AMOUNT * 10 * 2,
    });

    await buyThemeController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: "Internal server error",
    });
  });

  it("should throw an error if transaction amount is incorrect", async () => {
    // Mock transaction data
    mockWeb3Instance.eth.getTransaction.mockResolvedValue({
      from: "0xUserAddress",
      to: "0xContractAddress",
      value: "0",
    });

    mockWeb3Instance.eth.getTransactionReceipt.mockResolvedValue({
      status: true,
      logs: [
        {
          address: ADDRESSES.TOKEN_CONTRACTS.polygon.usdt,
          data: "0xdata",
          topics: ["topic0", "topic1", "topic2"],
        },
      ],
    });

    // Decoded log shows wrong amount
    mockWeb3Instance.eth.abi.decodeLog.mockReturnValue({
      from: "0xUserAddress",
      to: "0xContractAddress",
      value: 100, // Much less than expected
    });

    // Mock price API
    (axios.get as jest.Mock).mockResolvedValue({
      data: {
        polygon: { usd: 0.5 },
      },
    });

    await buyThemeController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: "Internal server error",
    });
  });

  it("should throw an error if price fetching fails", async () => {
    // Mock price API failure
    (axios.get as jest.Mock).mockRejectedValue(new Error("API error"));

    await buyThemeController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: "Internal server error",
    });
  });
});
