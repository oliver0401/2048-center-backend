import { Request, Response } from "express";
import { Web3 } from "web3";
import { httpStatus, Network, Token } from "types";
import { MESSAGE, ADDRESSES, URL, CONTRACT } from "consts";
import { errorHandlerWrapper, createGasPriceStrategy } from "utils";
import { Env } from "../../env";
import { getBalance, updateBalance } from "../../services/balance.service";
import { BadRequestError } from "../../errors";

export const withdrawBalanceHandler = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { network, token, amount, toAddress } = req.body;
    const userAddress = req.user?.address;

    // Validate required fields
    if (!network || !token || !amount || !toAddress) {
        throw new BadRequestError(MESSAGE.ERROR.MISSING_REQUIRED_FIELDS);
    }

    // Validate network
    if (![Network.ETH, Network.BSC, Network.FUSE].includes(network)) {
        throw new BadRequestError(MESSAGE.RESPONSE.UNSUPPORTED_NETWORK);
    }

    // Validate token
    if (![Token.USDT, Token.USDC].includes(token)) {
        throw new BadRequestError(MESSAGE.RESPONSE.UNSUPPORTED_TOKEN);
    }

    // Validate amount
    if (amount <= 0) {
        throw new BadRequestError("Amount must be greater than 0");
    }

    // Get user's balance from database
    const userBalance = await getBalance(userAddress!);
    if (!userBalance) {
        throw new BadRequestError(MESSAGE.ERROR.BALANCE_NOT_FOUND);
    }

    // Check if user has enough balance
    let currentBalance = 0;
    if (network === Network.ETH) {
        currentBalance = token === Token.USDT ? userBalance.etbalance : userBalance.ecbalance;
    } else if (network === Network.BSC) {
        currentBalance = token === Token.USDT ? userBalance.btbalance : userBalance.bcbalance;
    } else if (network === Network.FUSE) {
        currentBalance = token === Token.USDT ? userBalance.ftbalance : userBalance.fcbalance;
    }

    if (currentBalance < amount) {
        throw new BadRequestError("Insufficient balance");
    }

    // Initialize gas price strategy
    const gasPriceStrategy = createGasPriceStrategy({
        minGasPriceGwei: 5,
        maxGasPriceGwei: 50,
        baseIncrease: 10
    });

    // Get the appropriate provider URL and token contract address
    const providerUrl = URL.PROVIDER_URL[network];
    const tokenAddress = ADDRESSES.TOKEN_CONTRACTS[network][token.toLowerCase()];

    if (!tokenAddress) {
        throw new BadRequestError(MESSAGE.RESPONSE.UNSUPPORTED_TOKEN);
    }

    // Initialize Web3
    const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));

    // Get signer from private key
    const privateKey = Env.signerKey;
    if (!privateKey) {
        throw new Error("Private key is missing in environment variables.");
    }

    const signer = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(signer);

    // Create token contract instance (standard ERC20 ABI)
    const tokenContract = new web3.eth.Contract(
        CONTRACT.TOKEN_CONTRACT_INFO.abi,
        tokenAddress,
        { from: signer.address }
    );

    // Get current nonce
    const nonce = await web3.eth.getTransactionCount(signer.address, 'latest');

    // Get optimal gas price
    const gasPrice = await gasPriceStrategy.getOptimalGasPrice(web3, nonce);

    // Convert amount to wei (assuming 18 decimals for USDT/USDC on most chains)
    // Note: USDT on Ethereum has 6 decimals, but we'll use standard conversion
    const decimals = await tokenContract.methods.decimals().call() as number;
    const amountWei = BigInt(amount * Math.pow(10, Number(decimals)));

    // Check signer's token balance
    const signerBalance = await tokenContract.methods.balanceOf(signer.address).call() as bigint;
    if (signerBalance < amountWei) {
        throw new BadRequestError("Insufficient signer balance for withdrawal");
    }

    // Prepare transfer transaction
    const transferData = tokenContract.methods.transfer(toAddress, amountWei.toString()).encodeABI();
    const transaction = {
        from: signer.address,
        to: tokenAddress,
        gas: "100000",
        gasPrice: gasPrice,
        nonce: nonce,
        data: transferData
    };

    try {
        // Execute transaction
        const signedTx = await web3.eth.accounts.signTransaction(transaction, signer.privateKey);
        const txReceipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);

        console.log("Withdrawal transaction hash:", txReceipt.transactionHash);

        // Update user's balance in database (subtract the withdrawn amount)
        await updateBalance(userAddress!, -amount, network, token);

        res.status(httpStatus.OK).json({
            message: "Withdrawal successful",
            transactionHash: txReceipt.transactionHash,
            amount: amount,
            token: token,
            network: network,
            toAddress: toAddress
        });
    } catch (txError) {
        console.log("Withdrawal transaction failed:", txError);
        throw new BadRequestError(MESSAGE.RESPONSE.TRANSACTION_EXECUTION_FAILED);
    }
}

export const withdrawBalanceController = errorHandlerWrapper(withdrawBalanceHandler);