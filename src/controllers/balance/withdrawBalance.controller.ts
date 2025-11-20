import { Request, Response } from "express";
import { Web3 } from "web3";
import { httpStatus, Network, Token } from "types";
import { MESSAGE, ADDRESSES, URL, CONTRACT } from "consts";
import { errorHandlerWrapper, createGasPriceStrategy } from "utils";
import { Env } from "../../env";
import { getBalance, updateBalance } from "../../services/balance.service";
import { BadRequestError } from "../../errors";
// Remove BalanceEntity imports
// import { AppDataSource } from "../../setup/database.setup";
// import { Repository } from "typeorm";
// import { BalanceEntity } from "../../entities";

export const withdrawBalanceHandler = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { network, token, amount, toAddress } = req.body;
    const userAddress = req.user?.address;

    const internalNetwork = network.toLowerCase();

    console.log(`Withdraw process started for user: ${userAddress}, network: ${internalNetwork}, token: ${token}, amount: ${amount}, to: ${toAddress}`);

    // Validate required fields
    if (!network || !token || !amount || !toAddress) {
        throw new BadRequestError(MESSAGE.ERROR.MISSING_REQUIRED_FIELDS);
    }

    // Validate network
    if (![Network.ETH, Network.BSC, Network.FUSE].includes(internalNetwork)) {
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

    console.log(`Withdraw: Inputs validated for user ${userAddress}`);

    // Get user's balance from database
    let userBalance = await getBalance(userAddress!);
    if (!userBalance) {
        throw new BadRequestError(MESSAGE.ERROR.BALANCE_NOT_FOUND);
        // Remove creation code, as user creation handles defaults
    }

    // Check if user has enough balance
    let currentBalance = 0;
    if (internalNetwork === Network.ETH) {
        currentBalance = token === Token.USDT ? userBalance.ethusdt : userBalance.ethusdc;
    } else if (internalNetwork === Network.BSC) {
        currentBalance = token === Token.USDT ? userBalance.bnbusdt : userBalance.bnbusdc;
    } else if (internalNetwork === Network.FUSE) {
        currentBalance = token === Token.USDT ? userBalance.fuseusdt : userBalance.fuseusdc;
    }

    console.log(`Withdraw: Current balance for ${token} on ${internalNetwork}: ${currentBalance}`);

    if (currentBalance < amount) {
        throw new BadRequestError("Insufficient balance");
    }

    console.log(`Withdraw: Sufficient balance confirmed`);

    // Initialize gas price strategy
    const gasPriceStrategy = createGasPriceStrategy({
        minGasPriceGwei: 5,
        maxGasPriceGwei: 50,
        baseIncrease: 10
    });

    // Get the appropriate provider URL and token contract address
    const providerUrl = URL.PROVIDER_URL[internalNetwork];
    const tokenAddress = ADDRESSES.TOKEN_CONTRACTS[internalNetwork][token.toLowerCase()];

    if (!tokenAddress) {
        throw new BadRequestError(MESSAGE.RESPONSE.UNSUPPORTED_TOKEN);
    }

    console.log(`Withdraw: Provider and contract addresses set`);

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

    console.log(`Withdraw: Web3, signer, and contract initialized`);

    // Get current nonce
    const nonce = await web3.eth.getTransactionCount(signer.address, 'latest');

    // Get optimal gas price
    const gasPrice = await gasPriceStrategy.getOptimalGasPrice(web3, nonce);

    console.log(`Withdraw: Nonce ${nonce}, Gas Price ${gasPrice}`);

    // Convert amount to wei
    // Note: USDT on Ethereum has 6 decimals, but we'll use standard conversion

    console.log(`Withdraw: Fetching decimals`);

    let decimals;
    try {
        decimals = await tokenContract.methods.decimals().call() as number;
        console.log(`Withdraw: Decimals fetched: ${decimals}`);
    } catch (error) {
        console.error(`Withdraw: Error fetching decimals: ${(error as Error).message}`);
        throw error;
    }

    const amountStr = amount.toString();
    const dotIndex = amountStr.indexOf('.');
    let precision = 0;
    if (dotIndex !== -1) {
        precision = amountStr.length - dotIndex - 1;
    }
    if (precision > decimals) {
        throw new BadRequestError(`Amount precision exceeds token decimals (${decimals})`);
    }
    const amountWithoutDecimal = amountStr.replace('.', '');
    const paddedAmount = amountWithoutDecimal + '0'.repeat(decimals - precision);
    const amountWei = BigInt(paddedAmount);

    console.log(`Withdraw: Amount in wei: ${amountWei.toString()}`);

    // Check signer's token balance
    const signerBalance = await tokenContract.methods.balanceOf(signer.address).call() as bigint;
    if (signerBalance < amountWei) {
        throw new BadRequestError("Insufficient signer balance for withdrawal");
    }

    console.log(`Withdraw: Signer balance sufficient: ${signerBalance.toString()}`);

    // Check signer's native balance for gas
    const gasLimit = BigInt(100000); // Using the same gas limit as in transaction
    const maxGasCost = gasLimit * BigInt(gasPrice);
    const signerNativeBalance = await web3.eth.getBalance(signer.address);

    console.log(`Withdraw: Signer native balance: ${signerNativeBalance}, Estimated max gas cost: ${maxGasCost}`);

    if (BigInt(signerNativeBalance) < maxGasCost) {
        throw new BadRequestError("Insufficient native funds in signer account for gas fees");
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

    console.log(`Withdraw: Transaction prepared`);

    try {
        // Execute transaction
        const signedTx = await web3.eth.accounts.signTransaction(transaction, signer.privateKey);
        const txReceipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);

        console.log("Withdrawal transaction hash:", txReceipt.transactionHash);

        // Update user's balance in database (subtract the withdrawn amount)
        await updateBalance(userAddress!, -amount, internalNetwork, token);

        console.log(`Withdraw: User balance updated`);

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