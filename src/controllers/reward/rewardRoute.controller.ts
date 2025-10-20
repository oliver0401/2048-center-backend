import { MESSAGE, URL, ADDRESSES } from "consts";
import { Request, Response } from "express";
import { httpStatus } from "types";
import { rewardService } from "../../services/reward.service";
import { Web3 } from "web3";
import { Env } from "../../env";
import { createGasPriceStrategy } from "../../utils";

// Minimal ERC20 ABI for USDC/USDT transfers
const ERC20_ABI = [
    {
        "constant": false,
        "inputs": [
            {
                "name": "_to",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "type": "function"
    }
];

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
        
        // Validate network and token
        if (!network || !token) {
            res.status(httpStatus.BAD_REQUEST).json({ 
                message: "Network and token are required" 
            });
            return;
        }

        const tokenLower = token.toLowerCase();
        
        // Check if network is supported
        if (!ADDRESSES.TOKEN_CONTRACTS[network]) {
            res.status(httpStatus.BAD_REQUEST).json({ 
                message: `Unsupported network: ${network}. Supported networks: ethereum, binance, fuse, arbitrum, polygon, avalanche` 
            });
            return;
        }

        // Check if token is supported on this network
        if (!ADDRESSES.TOKEN_CONTRACTS[network][tokenLower]) {
            res.status(httpStatus.BAD_REQUEST).json({ 
                message: `Unsupported token: ${token} on network: ${network}` 
            });
            return;
        }

        // Get token contract address
        const tokenContractAddress = ADDRESSES.TOKEN_CONTRACTS[network][tokenLower];
        
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

        // Create token contract instance (USDC/USDT are ERC20 tokens)
        const tokenContract = new web3.eth.Contract(
            ERC20_ABI as any,
            tokenContractAddress,
            { from: signer.address }
        );

        // USDC and USDT typically use 6 decimals, not 18
        const decimals = 18;
        const rewardAmountInTokenUnits = Math.floor(rewardAmount * Math.pow(10, decimals)).toString();

        // Prepare transaction - use ERC20 transfer method
        const transferData = tokenContract.methods.transfer(address, rewardAmountInTokenUnits).encodeABI();
        const transaction = {
            from: signer.address,
            to: tokenContractAddress,
            gas: "100000",
            gasPrice: gasPrice,
            nonce: nonce,
            data: transferData
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
            amount: rewardAmount,
            token,
            network
        });
    } catch (error) {
        console.error("Reward transaction failed:", error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json(MESSAGE.RESPONSE.TRANSACTION_EXECUTION_FAILED);
    }
}