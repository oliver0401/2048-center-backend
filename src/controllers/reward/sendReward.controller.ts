import { Request, Response } from "express";
import { httpStatus } from "types";
import { MESSAGE } from "consts";
import { errorHandlerWrapper } from "utils";
import { RewardService } from "../../services";
import { NetworkConfigService } from "../../services/network/networkConfig.service";

/**
 * Refactored reward controller with improved modularity and readability
 * Supports multiple networks with different reward strategies:
 * - Fuse Network: DWAT + FUSE native tokens
 * - Ethereum Network: WDWAT only (no ETH)
 */
export const sendReward = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { address, amount, network = "fuse" } = req.body;

        // Validate input
        if (!address || !amount) {
            res.status(httpStatus.BAD_REQUEST).json({
                message: "Recipient address and amount are required",
            });
            return;
        }

        // Validate network
        if (!NetworkConfigService.isValidNetwork(network)) {
            res.status(httpStatus.BAD_REQUEST).json({
                message: MESSAGE.RESPONSE.UNSUPPORTED_NETWORK,
                supportedNetworks: ["fuse", "ethereum"],
            });
            return;
        }

        console.log(`\n=== Reward Distribution Request ===`);
        console.log(`Network: ${network}`);
        console.log(`Recipient: ${address}`);
        console.log(`Token Amount: ${amount}`);

        // Initialize reward service
        const rewardService = new RewardService();

        // Distribute rewards using the appropriate strategy
        const result = await rewardService.distributeReward({
            recipientAddress: address,
            tokenAmount: amount,
            network,
        });

        console.log(`\n=== Reward Distribution Successful ===`);
        console.log(`Network: ${result.network}`);
        console.log(`Transactions:`);
        result.transactions.forEach((tx) => {
            console.log(`  - ${tx.tokenSymbol}: ${tx.amount} (${tx.transactionHash})`);
        });

        // Build response
        const responseData: any = {
            message: MESSAGE.RESPONSE.REWARDED_SUCCESS,
            network: result.network,
            transactions: result.transactions.map((tx) => ({
                token: tx.tokenSymbol,
                amount: tx.amount,
                transactionHash: tx.transactionHash,
            })),
        };

        res.status(httpStatus.OK).json(responseData);
    } catch (error: any) {
        console.error("Reward distribution error:", error);

        // Handle specific error types
        if (error.message?.includes("Insufficient")) {
            res.status(httpStatus.BAD_REQUEST).json({
                message: error.message,
            });
        } else if (error.message?.includes("missing")) {
            res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                message: "Configuration error: " + error.message,
            });
        } else if (error.message?.includes("network")) {
            res.status(httpStatus.BAD_REQUEST).json({
                message: error.message,
            });
        } else {
            res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                message: MESSAGE.RESPONSE.TRANSACTION_EXECUTION_FAILED,
                error: error.message,
            });
        }
    }
};

export const rewardController = errorHandlerWrapper(sendReward);