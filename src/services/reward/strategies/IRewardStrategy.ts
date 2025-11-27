import { Web3 } from "web3";

export interface RewardTransaction {
  transactionHash: string;
  tokenSymbol: string;
  amount: string;
}

export interface RewardStrategyContext {
  web3: Web3;
  recipientAddress: string;
  tokenRewardAmount: string;
  gasPriceStrategy: any;
}

/**
 * Interface for reward distribution strategies
 * Different networks can implement different reward mechanisms
 */
export interface IRewardStrategy {
  /**
   * Distribute rewards to the recipient address
   * @returns Array of transaction details
   */
  distributeRewards(context: RewardStrategyContext): Promise<RewardTransaction[]>;

  /**
   * Validate that all necessary prerequisites are met before distributing rewards
   */
  validatePrerequisites(context: RewardStrategyContext): Promise<void>;
}

