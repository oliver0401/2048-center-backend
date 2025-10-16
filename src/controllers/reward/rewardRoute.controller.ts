import { MESSAGE, URL, CONTRACT } from "consts";
import { Request, Response } from "express";
import { httpStatus } from "types";
import { rewardService } from "../../services/reward.service";
import { Web3 } from "web3";
import { Env } from "../../env";
import { createGasPriceStrategy } from "../../utils";

export const bettingReward = async (
    req: Request,
    res: Response
): Promise<void> => {
    // Initialize gas price strategy with config
    const gasPriceStrategy = createGasPriceStrategy({
        minGasPriceGwei: 5,
        maxGasPriceGwei: 50,
        baseIncrease: 10
    });

    try {
        const { address, amount, network, token, rewardAmount } = req.body;
        
        const web3 = new Web3(
            new Web3.providers.HttpProvider(URL.PROVIDER_URL[network])
        );

        if (!web3) {
            throw new Error("Failed to connect to web3 provider.");
        }
        
        let privateKey = Env.signerKey;
        if (!privateKey) {
            throw new Error("Private key is missing in environment variables.");
        }

        const signer = web3.eth.accounts.privateKeyToAccount(privateKey);
        web3.eth.accounts.wallet.add(signer);

        // Get current nonce
        const nonce = await web3.eth.getTransactionCount(signer.address, 'latest');
        
        // Get optimal gas price
        const gasPrice = await gasPriceStrategy.getOptimalGasPrice(web3, nonce);

        const rewardContract = new web3.eth.Contract(
            CONTRACT.REWARD_CONTRACT_INFO.abi,
            CONTRACT.REWARD_CONTRACT_INFO.address,
            { from: signer.address }
        );

        // Convert amount to wei
        const rewardAmountWei = web3.utils.toWei(rewardAmount.toString(), 'ether');

        // Prepare transaction
        const rewardData = rewardContract.methods.distributeReward(address, rewardAmountWei).encodeABI();
        const transaction = {
            from: signer.address,
            to: CONTRACT.REWARD_CONTRACT_INFO.address,
            gas: "300000",
            gasPrice: gasPrice,
            nonce: nonce,
            data: rewardData
        };

        // Execute transaction
        const signedTx = await web3.eth.accounts.signTransaction(transaction, signer.privateKey);
        const txReceipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
        
        const txHash = txReceipt.transactionHash as any;
        console.log("Reward transaction hash:", txHash);

        // Save reward record to database
        await rewardService.saveReward({
            date: new Date(),
            address,
            token,
            network,
            amount,
            rewardAmount,
            txHash
        });

        res.status(httpStatus.OK).json({ 
            message: MESSAGE.RESPONSE.REWARDED_SUCCESS,
            txHash,
            amount: rewardAmount
        });
    } catch (error) {
        console.error("Reward transaction failed:", error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json(MESSAGE.RESPONSE.TRANSACTION_EXECUTION_FAILED);
    }
}