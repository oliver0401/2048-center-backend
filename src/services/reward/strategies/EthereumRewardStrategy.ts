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

    console.log("\n=== Ethereum Network Validation Started ===");

    // Validate signer key
    if (!Env.ethDwatSignerKey) {
      throw new Error("ETH WDWAT signer key is missing in environment variables.");
    }

    // Create signer
    const wdwatSigner = web3.eth.accounts.privateKeyToAccount(Env.ethDwatSignerKey);
    console.log(`Signer Address: ${wdwatSigner.address}`);

    // Test RPC connection
    try {
      console.log("Testing RPC connection...");
      const blockNumber = await web3.eth.getBlockNumber();
      console.log(`✓ RPC Connection successful. Current block: ${blockNumber}`);
    } catch (rpcError: any) {
      console.error("✗ RPC Connection failed:");
      console.error(`  Error Type: ${rpcError.type || rpcError.name}`);
      console.error(`  Error Message: ${rpcError.message}`);
      console.error(`  Error Details:`, rpcError);
      throw new Error(`Failed to connect to Ethereum RPC: ${rpcError.message}`);
    }

    // Initialize WDWAT contract
    console.log(`Initializing WDWAT contract at: ${CONTRACT.WDWAT_ETH_CONTRACT_INFO.address}`);
    const wdwatContract = new web3.eth.Contract(
      CONTRACT.WDWAT_ETH_CONTRACT_INFO.abi,
      CONTRACT.WDWAT_ETH_CONTRACT_INFO.address
    );

    // Check WDWAT balance of the signer
    try {
      console.log("Fetching WDWAT balance...");
      const wdwatBalance = await wdwatContract.methods
        .balanceOf(wdwatSigner.address)
        .call() as bigint;
      const tokenRewardWei = web3.utils.toWei(tokenRewardAmount, "ether");

      console.log(`WDWAT Balance: ${web3.utils.fromWei(wdwatBalance.toString(), "ether")} WDWAT`);
      console.log(`Required Amount: ${tokenRewardAmount} WDWAT`);

      if (wdwatBalance < BigInt(tokenRewardWei)) {
        throw new Error("Insufficient WDWAT balance for reward");
      }

      console.log("✓ Sufficient WDWAT balance confirmed");
    } catch (balanceError: any) {
      console.error("✗ Balance check failed:");
      console.error(`  Error Message: ${balanceError.message}`);
      console.error(`  Error Details:`, balanceError);
      throw balanceError;
    }

    console.log("✓ Ethereum Network: All prerequisites validated");
    console.log("=== Validation Complete ===\n");
  }

  async distributeRewards(context: RewardStrategyContext): Promise<RewardTransaction[]> {
    const { web3, recipientAddress, tokenRewardAmount, gasPriceStrategy } = context;

    console.log("\n=== Ethereum Reward Distribution Started ===");

    // Create signer
    const wdwatSigner = web3.eth.accounts.privateKeyToAccount(Env.ethDwatSignerKey!);
    web3.eth.accounts.wallet.add(wdwatSigner);
    console.log(`Using signer address: ${wdwatSigner.address}`);

    // Get nonce
    try {
      console.log("Fetching transaction nonce...");
      const nonce = await web3.eth.getTransactionCount(wdwatSigner.address, "latest");
      console.log(`✓ Nonce: ${nonce}`);

      // Get optimal gas price
      console.log("Calculating optimal gas price...");
      const gasPrice = await gasPriceStrategy.getOptimalGasPrice(web3, nonce);
      console.log(`✓ Gas Price: ${web3.utils.fromWei(gasPrice.toString(), "gwei")} Gwei`);

      // Initialize WDWAT contract
      console.log(`Initializing WDWAT contract at: ${CONTRACT.WDWAT_ETH_CONTRACT_INFO.address}`);
      const wdwatContract = new web3.eth.Contract(
        CONTRACT.WDWAT_ETH_CONTRACT_INFO.abi,
        CONTRACT.WDWAT_ETH_CONTRACT_INFO.address,
        { from: wdwatSigner.address }
      );

      const tokenRewardWei = web3.utils.toWei(tokenRewardAmount, "ether");

      // Distribute WDWAT tokens (ERC-20 transfer)
      console.log("Encoding transfer transaction...");
      console.log(`  To: ${recipientAddress}`);
      console.log(`  Amount: ${tokenRewardAmount} WDWAT`);
      const wdwatData = wdwatContract.methods
        .transfer(recipientAddress, tokenRewardWei)
        .encodeABI();
      console.log(`✓ Transaction data encoded (${wdwatData.length} bytes)`);

      const wdwatTransaction = {
        from: wdwatSigner.address,
        to: CONTRACT.WDWAT_ETH_CONTRACT_INFO.address,
        gas: "100000", // Standard gas for ERC-20 transfer
        gasPrice: gasPrice,
        nonce: nonce,
        data: wdwatData,
      };

      console.log("Signing transaction...");
      const signedWdwatTx = await web3.eth.accounts.signTransaction(
        wdwatTransaction,
        wdwatSigner.privateKey
      );
      console.log(`✓ Transaction signed`);

      console.log("Broadcasting transaction to network...");
      const wdwatReceipt = await web3.eth.sendSignedTransaction(signedWdwatTx.rawTransaction!);

      console.log(`✓ Transaction mined!`);
      console.log(`  Transaction Hash: ${wdwatReceipt.transactionHash}`);
      console.log(`  Block Number: ${wdwatReceipt.blockNumber}`);
      console.log(`  Gas Used: ${wdwatReceipt.gasUsed}`);
      console.log(`  Status: ${wdwatReceipt.status ? 'Success' : 'Failed'}`);
      console.log("=== Distribution Complete ===\n");

      return [
        {
          transactionHash: wdwatReceipt.transactionHash.toString(),
          tokenSymbol: "WDWAT",
          amount: tokenRewardAmount,
        },
      ];
    } catch (error: any) {
      console.error("\n=== Transaction Failed ===");
      console.error(`Error Type: ${error.type || error.name || 'Unknown'}`);
      console.error(`Error Message: ${error.message}`);

      if (error.receipt) {
        console.error("Transaction Receipt:", error.receipt);
      }

      if (error.data) {
        console.error("Error Data:", error.data);
      }

      console.error("Full Error Object:", JSON.stringify(error, null, 2));
      console.error("======================\n");

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

