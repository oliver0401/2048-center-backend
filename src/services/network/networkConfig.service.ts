import { Web3 } from "web3";
import { URL } from "consts";

export type NetworkType = "fuse" | "ethereum";

export interface NetworkConfig {
    name: NetworkType;
    rpcUrl: string;
    nativeTokenSymbol: string;
    nativeTokenRewardAmount?: string;
}

/**
 * Network configuration service
 * Provides network-specific configuration for different blockchain networks
 */
export class NetworkConfigService {
    private static readonly NETWORK_CONFIGS: Record<NetworkType, NetworkConfig> = {
        fuse: {
            name: "fuse",
            rpcUrl: URL.PROVIDER_URL.fuse,
            nativeTokenSymbol: "FUSE",
            nativeTokenRewardAmount: "0.005", // 0.005 FUSE
        },
        ethereum: {
            name: "ethereum",
            rpcUrl: URL.PROVIDER_URL.ethereum,
            nativeTokenSymbol: "ETH",
            nativeTokenRewardAmount: undefined, // No native token reward on Ethereum
        },
    };

    /**
     * Get network configuration for a specific network
     */
    static getNetworkConfig(network: NetworkType): NetworkConfig {
        const config = this.NETWORK_CONFIGS[network];
        if (!config) {
            throw new Error(`Unsupported network: ${network}`);
        }
        return config;
    }

    /**
     * Create a Web3 instance for a specific network
     * Configured with a reasonable transaction polling timeout
     */
    static createWeb3Instance(network: NetworkType): Web3 {
        const config = this.getNetworkConfig(network);
        
        console.log("\n=== Web3 Instance Configuration ===");
        console.log(`Network: ${network.toUpperCase()}`);
        console.log(`RPC URL: ${config.rpcUrl}`);
        console.log(`Native Token: ${config.nativeTokenSymbol}`);
        
        // Check if using Infura
        if (network === "ethereum") {
            if (process.env.INFURA_PROJECT_ID) {
                console.log(`✓ Using Infura with Project ID: ${process.env.INFURA_PROJECT_ID.substring(0, 8)}...`);
            } else {
                console.error(
                    "\n⚠️  CRITICAL WARNING: INFURA_PROJECT_ID not set!\n" +
                    "   Ethereum RPC will likely fail.\n" +
                    "   Please set INFURA_PROJECT_ID in your .env file.\n" +
                    "   Get your project ID from https://infura.io\n"
                );
            }
        }
        
        const web3 = new Web3(config.rpcUrl);

        // Configure transaction confirmation timeout (60 seconds instead of 750)
        // This is how long to wait for a transaction to be mined
        web3.eth.transactionPollingTimeout = 60000; // 60 seconds (in milliseconds)
        web3.eth.transactionPollingInterval = 1000; // Check every 1 second
        web3.eth.transactionConfirmationBlocks = 1; // Wait for 1 confirmation

        console.log("Web3 Configuration:");
        console.log(`  Transaction Timeout: 60 seconds`);
        console.log(`  Polling Interval: 1 second`);
        console.log(`  Required Confirmations: 1 block`);
        console.log("===================================\n");

        return web3;
    }

    /**
     * Check if a network is valid
     */
    static isValidNetwork(network: string): network is NetworkType {
        return network === "fuse" || network === "ethereum";
    }
}

