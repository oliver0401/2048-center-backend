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
 * 
 * Note: WDWAT (Wrapped DWAT) is the technical contract name on Ethereum,
 * but displayed as "DWAT" in the UI for consistency.
 */
export const sendReward = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { address, amount, network = "fuse" } = req.body;

        console.log(`\n${'='.repeat(60)}`);
        console.log(`REWARD DISTRIBUTION REQUEST RECEIVED`);
        console.log(`${'='.repeat(60)}`);
        console.log(`Timestamp: ${new Date().toISOString()}`);
        console.log(`Network: ${network}`);
        console.log(`Recipient: ${address}`);
        console.log(`Token Amount: ${amount}`);
        console.log(`Request IP: ${req.ip || req.socket.remoteAddress}`);
        console.log(`${'='.repeat(60)}\n`);

        // Validate input
        if (!address || !amount) {
            console.error("✗ Validation failed: Missing address or amount");
            res.status(httpStatus.BAD_REQUEST).json({
                message: "Recipient address and amount are required",
            });
            return;
        }

        // Validate network
        if (!NetworkConfigService.isValidNetwork(network)) {
            console.error(`✗ Validation failed: Invalid network '${network}'`);
            res.status(httpStatus.BAD_REQUEST).json({
                message: MESSAGE.RESPONSE.UNSUPPORTED_NETWORK,
                supportedNetworks: ["fuse", "ethereum"],
            });
            return;
        }

        console.log("✓ Request validation passed");

        // Initialize reward service
        const rewardService = new RewardService();

        // Distribute rewards using the appropriate strategy
        console.log("\nInitiating reward distribution...\n");
        const result = await rewardService.distributeReward({
            recipientAddress: address,
            tokenAmount: amount,
            network,
        });

        console.log(`\n${'='.repeat(60)}`);
        console.log(`REWARD DISTRIBUTION SUCCESSFUL ✓`);
        console.log(`${'='.repeat(60)}`);
        console.log(`Network: ${result.network.toUpperCase()}`);
        console.log(`Transactions:`);
        result.transactions.forEach((tx) => {
            console.log(`  ✓ ${tx.tokenSymbol}: ${tx.amount}`);
            console.log(`    TX Hash: ${tx.transactionHash}`);
        });
        console.log(`Timestamp: ${new Date().toISOString()}`);
        console.log(`${'='.repeat(60)}\n`);

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
        console.error(`\n${'='.repeat(60)}`);
        console.error(`REWARD DISTRIBUTION FAILED ✗`);
        console.error(`${'='.repeat(60)}`);
        console.error(`Timestamp: ${new Date().toISOString()}`);
        console.error(`Error Type: ${error.type || error.name || 'Unknown'}`);
        console.error(`Error Message: ${error.message}`);

        if (error.stack) {
            console.error(`\nStack Trace:`);
            console.error(error.stack);
        }

        if (error.response) {
            console.error(`\nHTTP Response:`);
            console.error(`  Status: ${error.response.status}`);
            console.error(`  Data:`, error.response.data);
        }

        console.error(`\nFull Error Object:`);
        console.error(JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        console.error(`${'='.repeat(60)}\n`);

        // Handle specific error types
        if (error.message?.includes("Insufficient")) {
            res.status(httpStatus.BAD_REQUEST).json({
                message: error.message,
            });
        } else if (error.message?.includes("missing")) {
            res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                message: "Configuration error: " + error.message,
            });
        } else if (error.message?.includes("network") || error.message?.includes("RPC")) {
            res.status(httpStatus.BAD_REQUEST).json({
                message: error.message,
                hint: "Check if INFURA_PROJECT_ID is set in .env file"
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