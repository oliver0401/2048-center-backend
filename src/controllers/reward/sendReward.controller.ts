import { Request, Response } from "express";
import { Web3 } from "web3";
import { httpStatus } from "types";
import { MESSAGE, URL, CONTRACT } from "consts";
import { errorHandlerWrapper, createGasPriceStrategy } from "utils";
import { Env } from "../../env";

export const sendReward = async (
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
        const { address, amount } = req.body;
        const FUSE_REWARD_AMOUNT = "0.005"; // Fixed amount of FUSE to reward (in FUSE)

        const web3 = new Web3(
            new Web3.providers.HttpProvider(
                URL.WEB3_PROVIDER_URL
            )
        );
        let privateKey = Env.signerKey;
        if (!privateKey) {
            throw new Error("Private key is missing in environment variables.");
        }

        // Get FUSE signer key for native token transfer
        let fuseSignerKey = Env.fuseSignerKey;
        if (!fuseSignerKey) {
            throw new Error("FUSE signer key is missing in environment variables.");
        }

        const signer = web3.eth.accounts.privateKeyToAccount(privateKey);
        const fuseSigner = web3.eth.accounts.privateKeyToAccount(fuseSignerKey);
        web3.eth.accounts.wallet.add(signer);
        web3.eth.accounts.wallet.add(fuseSigner);

        // Get current nonce for both signers
        const nonce = await web3.eth.getTransactionCount(signer.address, 'latest');
        const fuseNonce = await web3.eth.getTransactionCount(fuseSigner.address, 'latest');
        
        // Get optimal gas price for transactions
        const rewardGasPrice = await gasPriceStrategy.getOptimalGasPrice(web3, nonce);
        const fuseGasPrice = await gasPriceStrategy.getOptimalGasPrice(web3, fuseNonce);

        const tokenContract = new web3.eth.Contract(
            CONTRACT.TOKEN_CONTRACT_INFO.abi, 
            CONTRACT.TOKEN_CONTRACT_INFO.address,
            { from: signer.address }
        );

        const rewardContract = new web3.eth.Contract(
            CONTRACT.REWARD_CONTRACT_INFO.abi,
            CONTRACT.REWARD_CONTRACT_INFO.address,
            { from: signer.address }
        );

        // Get the token balances of user and rewardContract
        console.log("Fetching balances...");
        const userBalance = await tokenContract.methods.balanceOf(address).call();
        const rewardContractBalance = await tokenContract.methods.balanceOf(CONTRACT.REWARD_CONTRACT_INFO.address).call() as bigint;
        console.log(`User Balance: ${userBalance}`);
        console.log(`RewardContract Balance: ${rewardContractBalance}`);

        // Check FUSE balance of the FUSE signer
        const fuseBalance = await web3.eth.getBalance(fuseSigner.address);
        const fuseRewardWei = web3.utils.toWei(FUSE_REWARD_AMOUNT, 'ether');
        console.log(`FUSE Signer Balance: ${fuseBalance}`);
        console.log(`FUSE Reward Amount: ${fuseRewardWei}`);

        // Check if we have enough balances for both rewards
        if (rewardContractBalance < BigInt(amount)) {
            res.status(httpStatus.BAD_REQUEST)
                .json(MESSAGE.RESPONSE.INSUFFICIENT_REWARD_CONTRACT_BALANCE);
        }

        if (BigInt(fuseBalance) < BigInt(fuseRewardWei)) {
            res.status(httpStatus.BAD_REQUEST)
                .json({ message: "Insufficient FUSE balance for reward" });
        }

        // Prepare transactions
        console.log("Distributing rewards...");
        
        // 1. Game token reward transaction
        const rewardData = rewardContract.methods.distributeReward(address, amount).encodeABI();
        const rewardTransaction = {
            from: signer.address,
            to: CONTRACT.REWARD_CONTRACT_INFO.address,
            gas: "300000",
            gasPrice: rewardGasPrice,
            nonce: nonce,
            data: rewardData
        };

        // 2. FUSE native token transaction
        const fuseTransaction = {
            from: fuseSigner.address,
            to: address,
            value: fuseRewardWei,
            gas: "21000", // Standard gas for simple transfers
            gasPrice: fuseGasPrice,
            nonce: fuseNonce
        };

        try {
            // Execute both transactions
            const signedRewardTx = await web3.eth.accounts.signTransaction(rewardTransaction, signer.privateKey);
            const rewardTxReceipt = await web3.eth.sendSignedTransaction(signedRewardTx.rawTransaction!);
            console.log("Game token reward transaction hash:", rewardTxReceipt.transactionHash);

            const signedFuseTx = await web3.eth.accounts.signTransaction(fuseTransaction, fuseSigner.privateKey);
            const fuseTxReceipt = await web3.eth.sendSignedTransaction(signedFuseTx.rawTransaction!);
            console.log("FUSE reward transaction hash:", fuseTxReceipt.transactionHash);

            res.status(httpStatus.OK)
                .json({
                    message: MESSAGE.RESPONSE.REWARDED_SUCCESS, 
                    amount: amount,
                    fuseAmount: FUSE_REWARD_AMOUNT
                });
        } catch (txError) {
            console.log("Transaction failed: ", txError);
            res.status(httpStatus.INTERNAL_SERVER_ERROR)
                .json(MESSAGE.RESPONSE.TRANSACTION_EXECUTION_FAILED);
        }
    } catch (error) {
        console.log("Unexpected error: ", error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR)
            .json(error);
    }
}

export const rewardController = errorHandlerWrapper(sendReward);