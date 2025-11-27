import { MESSAGE } from "../../consts";
import { DuplicateError } from "../../errors";
import { userService } from "../../services";
import { errorHandlerWrapper, getOSFromRequest, Logger } from "../../utils";
import { Request, Response } from "express";
import { httpStatus } from "../../types";
import { RewardService } from "../../services/reward/RewardService";

/**
 * Send welcome rewards to new users
 * 1000 DWAT on Ethereum and 1000 DWAT on Fuse
 */
const sendWelcomeRewards = async (address: string): Promise<void> => {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`WELCOME REWARDS - NEW USER REGISTRATION`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Address: ${address}`);
    console.log(`Reward Amount: 1000 DWAT per network`);
    console.log(`Networks: Ethereum, Fuse`);
    console.log(`${'='.repeat(60)}\n`);

    const rewardService = new RewardService();
    const welcomeAmount = "1000";

    // Send rewards on both networks in parallel
    const rewardPromises = [
      rewardService.distributeReward({
        recipientAddress: address,
        tokenAmount: welcomeAmount,
        network: "ethereum",
      }),
      rewardService.distributeReward({
        recipientAddress: address,
        tokenAmount: welcomeAmount,
        network: "fuse",
      }),
    ];

    const results = await Promise.allSettled(rewardPromises);

    // Log results
    results.forEach((result, index) => {
      const network = index === 0 ? "Ethereum" : "Fuse";
      if (result.status === "fulfilled") {
        console.log(`✓ Welcome reward sent on ${network}:`);
        result.value.transactions.forEach((tx) => {
          console.log(`  - ${tx.tokenSymbol}: ${tx.amount} (${tx.transactionHash})`);
        });
      } else {
        console.error(`✗ Welcome reward failed on ${network}:`, result.reason?.message || result.reason);
      }
    });

    console.log(`\n${'='.repeat(60)}`);
    console.log(`WELCOME REWARDS COMPLETE`);
    console.log(`${'='.repeat(60)}\n`);
  } catch (error) {
    // Log error but don't throw - we don't want reward failures to block registration
    console.error("Error sending welcome rewards:", error);
    Logger.error("Welcome rewards error:", error);
  }
};

const registerHandler = async (req: Request, res: Response): Promise<void> => {
  const { address } = req.body;
  
  // Detect OS from request (either from body or User-Agent header)
  const os = getOSFromRequest(req);

  const user = await userService.createUser({
    address,
    os,
  });
  if (!user) throw new DuplicateError(MESSAGE.ERROR.USER_ALREADY_EXISTS);
  
  // Send welcome rewards (async, non-blocking)
  sendWelcomeRewards(address).catch((err) => {
    Logger.error("Welcome rewards failed:", err);
  });
  
  res.json({ user }).status(httpStatus.CREATED);
};

export const registerController = errorHandlerWrapper(registerHandler);
