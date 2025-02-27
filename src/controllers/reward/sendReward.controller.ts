import { Request, Response } from "express";
import { Web3 } from "web3";
import { httpStatus } from "types";
import { MESSAGE, KEY, URL, CONTRACT } from "consts";
import { errorHandlerWrapper } from "utils/errorHandler";
import { createGasPriceStrategy } from "utils/gasPriceStrategy";

export const sendReward = async (
    req: Request,
    res: Response
): Promise<void> => {
    // Initializa gas price strategy with config
    const gasPriceStrategy = createGasPriceStrategy({
        minGasPriceGwei: 5,
        maxGasPriceGwei: 50,
        baseIncrease: 10
    });

    try {
        const { address, amount } = req.body;

        const web3 = new Web3(
            new Web3.providers.HttpProvider(
                URL.WEB3_PROVIDER_URL
            )
        );
        const signer = web3.eth.accounts.privateKeyToAccount(KEY.SIGNER_PRIVATE_KEY);
        web3.eth.accounts.wallet.add(signer);

        // Get current nonce and gas price
        const nonce = await web3.eth.getTransactionCount(signer.address, 'latest');
        
        // Get optimal gas price for approve transaction
        const rewardGasPrice = await gasPriceStrategy.getOptimalGasPrice(web3, nonce);
        console.log(`Reward gas price: ${gasPriceStrategy.getGasPriceInGwei(rewardGasPrice)} Gwei`);

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
        
        // // Ensure the contract has sufficient balance to send the reward
        // if (!rewardContractBalance) {
        //     res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        //         status: "error",
        //         message: "Failed to fetch reward contract balance",
        //     });
        // }

        if (rewardContractBalance < BigInt(amount)) {
            res.json(MESSAGE.RESPONSE.INSUFFICIENT_REWARD_CONTRACT_BALANCE)
                .status(httpStatus.BAD_REQUEST);
        }

        //Distribute reward
        console.log("Distributing reward...");
        const rewardData = rewardContract.methods.distributeReward(address, amount).encodeABI();

        const rewardTransaction = {
            from: signer.address,
            to: CONTRACT.REWARD_CONTRACT_INFO.address,
            gas: "300000",
            gasPrice: rewardGasPrice,
            nonce: nonce,
            data: rewardData
        };

        try {
            const signedRewardTx = await web3.eth.accounts.signTransaction(rewardTransaction, signer.privateKey);
            const rewardTxReceipt = await web3.eth.sendSignedTransaction(signedRewardTx.rawTransaction!);
            console.log("Reward transaction hash:", rewardTxReceipt.transactionHash);

            res.json({message: MESSAGE.RESPONSE.REWARDED_SUCCESS, amount: amount})
                .status(httpStatus.OK);
        } catch (txError) {
            console.log("Transaction failed: ", txError);
            res.json(MESSAGE.RESPONSE.TRANSACTION_EXECUTION_FAILED)
                .status(httpStatus.INTERNAL_SERVER_ERROR);
        }
    } catch (error) {
        console.log("Unexpected error: ", error);
        res.json(MESSAGE.RESPONSE.UNEXPECTED_ERROR)
            .status(httpStatus.INTERNAL_SERVER_ERROR);
    }
    
    
}

export const rewardController = errorHandlerWrapper(sendReward);