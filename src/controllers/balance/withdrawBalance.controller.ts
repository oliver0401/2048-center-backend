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
    console.log(`Withdraw: Signer address being used: ${signer.address}`);

    // Select the appropriate ABI based on token type
    let tokenAbi;
    if (token === Token.USDT) {
        tokenAbi = CONTRACT.USDT_CONTRACT_INFO.abi;
        console.log(`Withdraw: Using USDT contract ABI`);
    } else if (token === Token.USDC) {
        tokenAbi = CONTRACT.USDC_CONTRACT_INFO.abi;
        console.log(`Withdraw: Using USDC contract ABI`);
    } else {
        // Fallback to generic token ABI
        tokenAbi = CONTRACT.TOKEN_CONTRACT_INFO.abi;
        console.log(`Withdraw: Using generic token contract ABI`);
    }

    // Create token contract instance with the correct ABI
    const tokenContract = new web3.eth.Contract(
        tokenAbi,
        tokenAddress,
        { from: signer.address }
    );
    console.log(`Withdraw: Token contract address: ${tokenAddress}`);

    console.log(`Withdraw: Web3, signer, and contract initialized for ${token} on ${internalNetwork}`);

    // Get current nonce
    const nonce = await web3.eth.getTransactionCount(signer.address, 'latest');

    // Get optimal gas price
    const gasPrice = await gasPriceStrategy.getOptimalGasPrice(web3, nonce);

    console.log(`Withdraw: Nonce ${nonce}, Gas Price ${gasPrice}`);

    // Convert amount to wei
    // Note: USDT on Ethereum has 6 decimals, but we'll use standard conversion

    console.log(`Withdraw: Fetching decimals`);

    let decimals: number;
    try {
        const decimalsResult = await tokenContract.methods.decimals().call();
        decimals = Number(decimalsResult);
        console.log(`Withdraw: Decimals fetched: ${decimals}, type: ${typeof decimals}`);
    } catch (error) {
        console.error(`Withdraw: Error fetching decimals: ${(error as Error).message}`);
        throw error;
    }

    console.log(`Withdraw: Calculating amount in wei`);
    let amountWei: bigint;
    try {
        const amountStr = amount.toString();
        console.log(`Withdraw: Amount string: ${amountStr}`);

        const dotIndex = amountStr.indexOf('.');
        let precision = 0;
        if (dotIndex !== -1) {
            precision = amountStr.length - dotIndex - 1;
        }
        console.log(`Withdraw: Precision: ${precision}, Decimals: ${decimals}`);

        if (precision > decimals) {
            throw new BadRequestError(`Amount precision exceeds token decimals (${decimals})`);
        }

        const amountWithoutDecimal = amountStr.replace('.', '');
        console.log(`Withdraw: Amount without decimal: ${amountWithoutDecimal}`);

        const paddedAmount = amountWithoutDecimal + '0'.repeat(decimals - precision);
        console.log(`Withdraw: Padded amount (before): ${paddedAmount}`);

        // Remove any leading zeros, but keep at least one digit
        const cleanedAmount = paddedAmount.replace(/^0+/, '') || '0';
        console.log(`Withdraw: Cleaned amount: ${cleanedAmount}`);

        amountWei = BigInt(cleanedAmount);
        console.log(`Withdraw: Amount in wei: ${amountWei.toString()}`);
    } catch (error) {
        console.error(`Withdraw: Error calculating amount in wei:`, error);
        throw new BadRequestError(`Failed to convert amount to wei: ${(error as Error).message}`);
    }

    // Check signer's token balance
    console.log(`Withdraw: Checking signer's token balance...`);
    let signerBalance: bigint;
    try {
        const balanceResult = await tokenContract.methods.balanceOf(signer.address).call();
        console.log(`Withdraw: Raw balance result: ${balanceResult}, type: ${typeof balanceResult}`);

        if (!balanceResult) {
            throw new Error("Balance result is empty or undefined");
        }

        signerBalance = BigInt(String(balanceResult));

        // Calculate human-readable balance
        const humanReadableBalance = Number(signerBalance) / Math.pow(10, decimals);
        console.log(`Withdraw: Signer token balance (wei): ${signerBalance.toString()}`);
        console.log(`Withdraw: Signer token balance (human): ${humanReadableBalance} ${token}`);
    } catch (error) {
        console.error(`Withdraw: Error fetching signer balance: ${(error as Error).message}`);
        throw new BadRequestError("Failed to fetch signer balance");
    }

    if (signerBalance < amountWei) {
        const humanReadableRequired = Number(amountWei) / Math.pow(10, decimals);
        const humanReadableAvailable = Number(signerBalance) / Math.pow(10, decimals);
        console.log(`Withdraw: Insufficient balance!`);
        console.log(`  - Required: ${amountWei.toString()} wei (${humanReadableRequired} ${token})`);
        console.log(`  - Available: ${signerBalance.toString()} wei (${humanReadableAvailable} ${token})`);
        throw new BadRequestError(`Insufficient signer balance: need ${humanReadableRequired} ${token}, have ${humanReadableAvailable} ${token}`);
    }

    console.log(`Withdraw: Signer balance sufficient`);

    // Check signer's native balance for gas
    console.log(`Withdraw: Checking signer's native balance for gas...`);
    const gasLimit = BigInt(100000); // Using the same gas limit as in transaction
    const maxGasCost = gasLimit * BigInt(gasPrice);

    let signerNativeBalance: bigint;
    try {
        const nativeBalanceResult = await web3.eth.getBalance(signer.address);
        console.log(`Withdraw: Raw native balance result: ${nativeBalanceResult}, type: ${typeof nativeBalanceResult}`);

        if (!nativeBalanceResult) {
            throw new Error("Native balance result is empty or undefined");
        }

        signerNativeBalance = BigInt(String(nativeBalanceResult));
        console.log(`Withdraw: Signer native balance (converted): ${signerNativeBalance.toString()}, Estimated max gas cost: ${maxGasCost.toString()}`);
    } catch (error) {
        console.error(`Withdraw: Error fetching native balance: ${(error as Error).message}`);
        throw new BadRequestError("Failed to fetch signer native balance");
    }

    if (signerNativeBalance < maxGasCost) {
        console.log(`Withdraw: Insufficient gas funds - Required: ${maxGasCost.toString()}, Available: ${signerNativeBalance.toString()}`);
        throw new BadRequestError("Insufficient native funds in signer account for gas fees");
    }

    // Prepare transfer transaction
    console.log(`Withdraw: Preparing transaction data...`);
    let transferData;
    try {
        transferData = tokenContract.methods.transfer(toAddress, amountWei.toString()).encodeABI();
        console.log(`Withdraw: Transfer data encoded`);
    } catch (error) {
        console.error(`Withdraw: Error encoding transfer data: ${(error as Error).message}`);
        throw new BadRequestError("Failed to encode transaction data");
    }

    const transaction = {
        from: signer.address,
        to: tokenAddress,
        gas: "100000",
        gasPrice: gasPrice,
        nonce: nonce,
        data: transferData
    };

    console.log(`Withdraw: Transaction prepared, signing...`);

    try {
        // Execute transaction
        const signedTx = await web3.eth.accounts.signTransaction(transaction, signer.privateKey);
        console.log(`Withdraw: Transaction signed, sending...`);

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
        console.error("Withdrawal transaction failed:", txError);
        const errorMessage = (txError as Error).message || "Unknown transaction error";
        console.error("Withdrawal error details:", errorMessage);
        throw new BadRequestError(`Transaction execution failed: ${errorMessage}`);
    }
}

export const withdrawBalanceController = errorHandlerWrapper(withdrawBalanceHandler);