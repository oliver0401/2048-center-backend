import { NetworkConfigService, NetworkType } from "../network/networkConfig.service";
import {
  IRewardStrategy,
  FuseRewardStrategy,
  EthereumRewardStrategy,
  RewardTransaction,
} from "./strategies";
import { createGasPriceStrategy } from "../../utils";

export interface RewardRequest {
  recipientAddress: string;
  tokenAmount: string;
  network: NetworkType;
}

export interface RewardResult {
  success: boolean;
  network: NetworkType;
  transactions: RewardTransaction[];
}

/**
 * Main reward service that orchestrates reward distribution
 * Uses strategy pattern to handle different network reward mechanisms
 */
export class RewardService {
  private readonly strategies: Map<NetworkType, IRewardStrategy>;
  private readonly gasPriceStrategy;

  constructor() {
    // Initialize reward strategies for each network
    this.strategies = new Map();
    this.strategies.set("fuse", new FuseRewardStrategy());
    this.strategies.set("ethereum", new EthereumRewardStrategy());

    // Initialize gas price strategy
    this.gasPriceStrategy = createGasPriceStrategy({
      minGasPriceGwei: 5,
      maxGasPriceGwei: 50,
      baseIncrease: 10,
    });
  }

  /**
   * Distribute rewards based on the network
   */
  async distributeReward(request: RewardRequest): Promise<RewardResult> {
    const { recipientAddress, tokenAmount, network } = request;

    // Validate network
    if (!NetworkConfigService.isValidNetwork(network)) {
      throw new Error(`Invalid network: ${network}`);
    }

    // Get the appropriate strategy
    const strategy = this.strategies.get(network);
    if (!strategy) {
      throw new Error(`No reward strategy found for network: ${network}`);
    }

    // Create Web3 instance for the network
    const web3 = NetworkConfigService.createWeb3Instance(network);

    const context = {
      web3,
      recipientAddress,
      tokenRewardAmount: tokenAmount,
      gasPriceStrategy: this.gasPriceStrategy,
    };

    // Validate prerequisites
    console.log(`Validating prerequisites for ${network} network...`);
    await strategy.validatePrerequisites(context);

    // Distribute rewards
    console.log(`Distributing rewards on ${network} network...`);
    const transactions = await strategy.distributeRewards(context);

    return {
      success: true,
      network,
      transactions,
    };
  }
}

