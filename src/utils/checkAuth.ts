import { Request, Response, NextFunction } from "express";
import { userService } from "../services";
import { Logger } from "./logger";
import { UnauthorizedError } from "../errors";
import { MESSAGE } from "../consts";
import { getOSFromRequest } from "./detectOS";
import { RewardService } from "../services/reward/RewardService";

/**
 * Send welcome rewards to new users
 * 1000 DWAT on Ethereum and 1000 DWAT on Fuse
 */
const sendWelcomeRewards = async (address: string): Promise<void> => {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`WELCOME REWARDS - NEW USER DETECTED`);
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
    // Log error but don't throw - we don't want reward failures to block auth
    console.error("Error sending welcome rewards:", error);
    Logger.error("Welcome rewards error:", error);
  }
};

export const checkAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const address = req.header("Authorization");
    console.log("address", address);
    if (!address) {
      throw new UnauthorizedError(MESSAGE.ERROR.TOKEN_IS_INVALID);
    }
    const os = getOSFromRequest(req);
    let user = await userService.getOneUser({ address, os });

    // If user doesn't exist, create a new one
    let isNewUser = false;
    if (!user) {
      user = await userService.createUser({ address });
      if (!user) {
        throw new UnauthorizedError(MESSAGE.ERROR.TOKEN_IS_INVALID);
      }
      isNewUser = true;
    }

    if (user.deletedAt) {
      throw new UnauthorizedError(MESSAGE.ERROR.ACCOUNT_HAS_BEEN_DISABLED);
    }

    req.user = { ...user, countThemes: user.userThemes ? user.userThemes.length : 0 };

    // Send welcome rewards for new users (async, non-blocking)
    if (isNewUser) {
      // Fire and forget - don't wait for rewards to complete
      sendWelcomeRewards(address).catch((err) => {
        Logger.error("Welcome rewards failed:", err);
      });
    }

    next();
  } catch (err) {
    Logger.error(err);
    if (err instanceof UnauthorizedError)
      next(new UnauthorizedError(err.message));
    else next(new UnauthorizedError(MESSAGE.ERROR.TOKEN_IS_INVALID));
  }
};
