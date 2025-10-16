import { AppDataSource } from "../setup/database.setup";
import { RewardEntity } from "../entities";

export class RewardService {
  private rewardRepository = AppDataSource.getRepository(RewardEntity);

  async saveReward(rewardData: {
    date: Date;
    address: string;
    token: string;
    network: string;
    amount: number;
    rewardAmount: number;
    txHash: string;
  }): Promise<RewardEntity> {
    const reward = this.rewardRepository.create(rewardData);
    return await this.rewardRepository.save(reward);
  }
}

export const rewardService = new RewardService();
