import { CONTRACT } from "consts";
import { Env } from "../../../env";
import { IRewardStrategy, RewardStrategyContext, RewardTransaction } from "./IRewardStrategy";

/**
 * Reward strategy for Fuse Network
 * Distributes both DWAT tokens and FUSE native tokens
 */
export class FuseRewardStrategy implements IRewardStrategy {
  private readonly FUSE_REWARD_AMOUNT = "0.005"; // Fixed amount of FUSE to reward

  async validatePrerequisites(context: RewardStrategyContext): Promise<void> {
    const { web3, recipientAddress, tokenRewardAmount } = context;

    // Validate signer keys
    if (!Env.fuseDwatSignerKey) {
      throw new Error("FUSE DWAT signer key is missing in environment variables.");
    }
    if (!Env.fuseSignerKey) {
      throw new Error("FUSE native token signer key is missing in environment variables.");
    }

    // Create signers
    const dwatSigner = web3.eth.accounts.privateKeyToAccount(Env.fuseDwatSignerKey);
    const fuseSigner = web3.eth.accounts.privateKeyToAccount(Env.fuseSignerKey);

    // Initialize token contract
    const tokenContract = new web3.eth.Contract(
      CONTRACT.TOKEN_CONTRACT_INFO.abi,
      CONTRACT.TOKEN_CONTRACT_INFO.address
    );

    // Check DWAT balance in reward contract
    const rewardContractBalance = await tokenContract.methods
      .balanceOf(CONTRACT.REWARD_CONTRACT_INFO.address)
      .call() as bigint;
    const tokenRewardWei = web3.utils.toWei(tokenRewardAmount, "ether");

    if (rewardContractBalance < BigInt(tokenRewardWei)) {
      throw new Error("Insufficient DWAT balance in reward contract");
    }

    // Check FUSE balance
    const fuseBalance = await web3.eth.getBalance(fuseSigner.address);
    const fuseRewardWei = web3.utils.toWei(this.FUSE_REWARD_AMOUNT, "ether");

    if (BigInt(fuseBalance) < BigInt(fuseRewardWei)) {
      throw new Error("Insufficient FUSE balance for reward");
    }

    console.log("✓ Fuse Network: All prerequisites validated");
  }

  async distributeRewards(context: RewardStrategyContext): Promise<RewardTransaction[]> {
    const { web3, recipientAddress, tokenRewardAmount, gasPriceStrategy } = context;

    // Create signers
    const dwatSigner = web3.eth.accounts.privateKeyToAccount(Env.fuseDwatSignerKey!);
    const fuseSigner = web3.eth.accounts.privateKeyToAccount(Env.fuseSignerKey!);

    web3.eth.accounts.wallet.add(dwatSigner);
    web3.eth.accounts.wallet.add(fuseSigner);

    // Get nonces
    const dwatNonce = await web3.eth.getTransactionCount(dwatSigner.address, "latest");
    const fuseNonce = await web3.eth.getTransactionCount(fuseSigner.address, "latest");

    // Get optimal gas prices
    const dwatGasPrice = await gasPriceStrategy.getOptimalGasPrice(web3, dwatNonce);
    const fuseGasPrice = await gasPriceStrategy.getOptimalGasPrice(web3, fuseNonce);

    // Initialize contracts
    const rewardContract = new web3.eth.Contract(
      CONTRACT.REWARD_CONTRACT_INFO.abi,
      CONTRACT.REWARD_CONTRACT_INFO.address,
      { from: dwatSigner.address }
    );

    const tokenRewardWei = web3.utils.toWei(tokenRewardAmount, "ether");
    const fuseRewardWei = web3.utils.toWei(this.FUSE_REWARD_AMOUNT, "ether");

    const results: RewardTransaction[] = [];

    // 1. Distribute DWAT tokens
    console.log("Distributing DWAT tokens on Fuse Network...");
    const dwatData = rewardContract.methods
      .distributeReward(recipientAddress, tokenRewardWei)
      .encodeABI();

    const dwatTransaction = {
      from: dwatSigner.address,
      to: CONTRACT.REWARD_CONTRACT_INFO.address,
      gas: "300000",
      gasPrice: dwatGasPrice,
      nonce: dwatNonce,
      data: dwatData,
    };

    const signedDwatTx = await web3.eth.accounts.signTransaction(
      dwatTransaction,
      dwatSigner.privateKey
    );
    
    try {
      const dwatReceipt = await web3.eth.sendSignedTransaction(signedDwatTx.rawTransaction!);
      
      results.push({
        transactionHash: dwatReceipt.transactionHash.toString(),
        tokenSymbol: "DWAT",
        amount: tokenRewardAmount,
      });

      console.log(`✓ DWAT reward sent: ${dwatReceipt.transactionHash}`);
    } catch (error: any) {
      const errorName = error?.name || "";
      const errorMessage = error?.message || "";
      
      if (errorName === "TransactionPollingTimeoutError" || errorMessage.includes("not mined within")) {
        console.error(`⚠ DWAT transaction timeout - transaction may still be pending`);
        throw new Error(
          `DWAT reward transaction timed out after 60 seconds. ` +
          `The transaction may still complete. Please check the blockchain explorer.`
        );
      }
      
      throw error;
    }

    // 2. Distribute FUSE native tokens
    console.log("Distributing FUSE native tokens...");
    const fuseTransaction = {
      from: fuseSigner.address,
      to: recipientAddress,
      value: fuseRewardWei,
      gas: "21000",
      gasPrice: fuseGasPrice,
      nonce: fuseNonce,
    };

    const signedFuseTx = await web3.eth.accounts.signTransaction(
      fuseTransaction,
      fuseSigner.privateKey
    );
    
    try {
      const fuseReceipt = await web3.eth.sendSignedTransaction(signedFuseTx.rawTransaction!);

      results.push({
        transactionHash: fuseReceipt.transactionHash.toString(),
        tokenSymbol: "FUSE",
        amount: this.FUSE_REWARD_AMOUNT,
      });

      console.log(`✓ FUSE reward sent: ${fuseReceipt.transactionHash}`);
    } catch (error: any) {
      const errorName = error?.name || "";
      const errorMessage = error?.message || "";
      
      if (errorName === "TransactionPollingTimeoutError" || errorMessage.includes("not mined within")) {
        console.error(`⚠ FUSE transaction timeout - transaction may still be pending`);
        throw new Error(
          `FUSE reward transaction timed out after 60 seconds. ` +
          `The transaction may still complete. Please check the blockchain explorer.`
        );
      }
      
      throw error;
    }

    return results;
  }
}

