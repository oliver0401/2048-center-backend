import { Request, Response } from "express";
import { Web3 } from "web3";
import { sendReward } from "../sendReward.controller";
import { Env } from "../../../env";
import { httpStatus } from "../../../types";
import { MESSAGE } from "consts";
// Mock dependencies
jest.mock("web3");
jest.mock("../../../utils", () => ({
  errorHandlerWrapper: jest.fn((fn) => fn),
  createGasPriceStrategy: jest.fn(() => ({
    getGasPrice: jest.fn().mockResolvedValue(5),
    getOptimalGasPrice: jest.fn().mockResolvedValue(5),
  })),
}));
jest.mock("../../../env", () => ({
  Env: {
    signerKey: "mock-signer-key",
    fuseSignerKey: "mock-fuse-signer-key",
  },
}));

describe("sendReward Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockWeb3: any;
  let mockContract: any;
  let mockAccounts: any;
  let mockWallet: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup request and response mocks
    mockRequest = {
      body: {
        address: "0x123456789abcdef",
        amount: "1000000000000000000", // 1 token in wei
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Setup Web3 mocks
    mockContract = {
      methods: {
        balanceOf: jest.fn().mockImplementation((address) => ({
          call: jest.fn().mockResolvedValue("2000000000000000000"), // 2 tokens in wei
        })),
        distributeReward: jest.fn().mockImplementation((address, amount) => ({
          encodeABI: jest.fn().mockReturnValue("0xmocked-data"),
        })),
      },
    };

    mockAccounts = {
      privateKeyToAccount: jest.fn().mockImplementation((key) => ({
        address:
          key === Env.signerKey ? "0xsigner-address" : "0xfuse-signer-address",
        privateKey: key,
      })),
      signTransaction: jest.fn().mockImplementation((tx, key) => ({
        rawTransaction: "signed-raw-transaction",
      })),
    };

    mockWallet = {
      add: jest.fn(),
    };

    mockWeb3 = {
      eth: {
        Contract: jest.fn().mockReturnValue(mockContract),
        accounts: mockAccounts,
        getTransactionCount: jest.fn().mockResolvedValue(5),
        getBalance: jest.fn().mockResolvedValue("5000000000000000000"), // 5 FUSE
        sendSignedTransaction: jest.fn().mockResolvedValue({
          transactionHash: "mocked-tx-hash",
        }),
      },
      utils: {
        toWei: jest
          .fn()
          .mockImplementation((amount, unit) => "5000000000000000"), // 0.005 FUSE in wei
      },
    };

    mockWeb3.eth.accounts.wallet = mockWallet;

    // Mock Web3 constructor
    (Web3 as unknown as jest.Mock).mockImplementation(() => mockWeb3);
    (Web3 as unknown as any).providers = {
      HttpProvider: jest.fn(),
    };
  });

  it("should successfully send rewards when all conditions are met", async () => {
    await sendReward(mockRequest as Request, mockResponse as Response);

    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(httpStatus.OK);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: MESSAGE.RESPONSE.REWARDED_SUCCESS,
      amount: mockRequest.body.amount,
      fuseAmount: "0.005",
    });

    // Verify Web3 interactions
    expect(mockWeb3.eth.accounts.wallet.add).toHaveBeenCalledTimes(2);
    expect(mockWeb3.eth.getTransactionCount).toHaveBeenCalledTimes(2);
    expect(mockWeb3.eth.sendSignedTransaction).toHaveBeenCalledTimes(2);
  });

  it("should return error when reward contract has insufficient balance", async () => {
    // Mock insufficient balance in reward contract
    mockContract.methods.balanceOf = jest
      .fn()
      .mockImplementation((address) => ({
        call: jest.fn().mockResolvedValue("500000000000000000"), // 0.5 tokens (less than 1 token)
      }));

    await sendReward(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(httpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      MESSAGE.RESPONSE.INSUFFICIENT_REWARD_CONTRACT_BALANCE
    );
  });

  it("should return error when FUSE signer has insufficient balance", async () => {
    // Mock insufficient FUSE balance
    mockWeb3.eth.getBalance = jest.fn().mockResolvedValue("1000000000000000"); // Less than 0.005 FUSE

    await sendReward(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(httpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Insufficient FUSE balance for reward",
    });
  });

  it("should handle transaction execution failure", async () => {
    // Mock transaction failure
    mockWeb3.eth.sendSignedTransaction = jest
      .fn()
      .mockRejectedValue(new Error("Transaction failed"));

    await sendReward(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(
      httpStatus.INTERNAL_SERVER_ERROR
    );
    expect(mockResponse.json).toHaveBeenCalledWith(
      MESSAGE.RESPONSE.TRANSACTION_EXECUTION_FAILED
    );
  });

  it("should handle missing private keys", async () => {
    // Mock missing private keys
    (Env as any).signerKey = null;

    await sendReward(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(
      httpStatus.INTERNAL_SERVER_ERROR
    );
    expect(mockResponse.json).toHaveBeenCalled();
  });

  it("should handle unexpected errors", async () => {
    // Mock unexpected error
    (Web3 as unknown as jest.Mock).mockImplementation(() => {
      throw new Error("Unexpected error");
    });

    await sendReward(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(
      httpStatus.INTERNAL_SERVER_ERROR
    );
    expect(mockResponse.json).toHaveBeenCalled();
  });
});
