import { CONTRACT } from "consts";
import { Env } from "../../../env";
import { IRewardStrategy, RewardStrategyContext, RewardTransaction } from "./IRewardStrategy";

/**
 * Reward strategy for Ethereum Network
 * Distributes ONLY WDWAT tokens (ERC-20 standard)
 * NO ETH native token rewards on Ethereum
 */
export class EthereumRewardStrategy implements IRewardStrategy {
  async validatePrerequisites(context: RewardStrategyContext): Promise<void> {
    const { web3, recipientAddress, tokenRewardAmount } = context;

    // Validate signer key
    if (!Env.ethDwatSignerKey) {
      throw new Error("ETH WDWAT signer key is missing in environment variables.");
    }

    // Create signer
    const wdwatSigner = web3.eth.accounts.privateKeyToAccount(Env.ethDwatSignerKey);

    // Initialize WDWAT contract
    const wdwatContract = new web3.eth.Contract(
      CONTRACT.WDWAT_ETH_CONTRACT_INFO.abi,
      CONTRACT.WDWAT_ETH_CONTRACT_INFO.address
    );

    // Check WDWAT balance of the signer
    const wdwatBalance = await wdwatContract.methods
      .balanceOf(wdwatSigner.address)
      .call() as bigint;
    const tokenRewardWei = web3.utils.toWei(tokenRewardAmount, "ether");

    if (wdwatBalance < BigInt(tokenRewardWei)) {
      throw new Error("Insufficient WDWAT balance for reward");
    }

    console.log("✓ Ethereum Network: All prerequisites validated");
  }

  async distributeRewards(context: RewardStrategyContext): Promise<RewardTransaction[]> {
    const { web3, recipientAddress, tokenRewardAmount, gasPriceStrategy } = context;

    // Create signer
    const wdwatSigner = web3.eth.accounts.privateKeyToAccount(Env.ethDwatSignerKey!);
    web3.eth.accounts.wallet.add(wdwatSigner);

    // Get nonce
    const nonce = await web3.eth.getTransactionCount(wdwatSigner.address, "latest");

    // Get optimal gas price
    const gasPrice = await gasPriceStrategy.getOptimalGasPrice(web3, nonce);

    // Initialize WDWAT contract
    const wdwatContract = new web3.eth.Contract(
      CONTRACT.WDWAT_ETH_CONTRACT_INFO.abi,
      CONTRACT.WDWAT_ETH_CONTRACT_INFO.address,
      { from: wdwatSigner.address }
    );

    const tokenRewardWei = web3.utils.toWei(tokenRewardAmount, "ether");

    // Distribute WDWAT tokens (ERC-20 transfer)
    console.log("Distributing WDWAT tokens on Ethereum Network...");
    const wdwatData = wdwatContract.methods
      .transfer(recipientAddress, tokenRewardWei)
      .encodeABI();

    const wdwatTransaction = {
      from: wdwatSigner.address,
      to: CONTRACT.WDWAT_ETH_CONTRACT_INFO.address,
      gas: "100000", // Standard gas for ERC-20 transfer
      gasPrice: gasPrice,
      nonce: nonce,
      data: wdwatData,
    };

    const signedWdwatTx = await web3.eth.accounts.signTransaction(
      wdwatTransaction,
      wdwatSigner.privateKey
    );
    
    try {
      const wdwatReceipt = await web3.eth.sendSignedTransaction(signedWdwatTx.rawTransaction!);

      console.log(`✓ WDWAT reward sent: ${wdwatReceipt.transactionHash}`);

      return [
        {
          transactionHash: wdwatReceipt.transactionHash.toString(),
          tokenSymbol: "WDWAT",
          amount: tokenRewardAmount,
        },
      ];
    } catch (error: any) {
      const errorName = error?.name || "";
      const errorMessage = error?.message || "";
      
      if (errorName === "TransactionPollingTimeoutError" || errorMessage.includes("not mined within")) {
        console.error(`⚠ WDWAT transaction timeout - transaction may still be pending`);
        throw new Error(
          `WDWAT reward transaction timed out after 60 seconds. ` +
          `The transaction may still complete. Please check the blockchain explorer.`
        );
      }
      
      throw error;
    }
  }
}

