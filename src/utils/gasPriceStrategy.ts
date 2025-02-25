import { Web3 } from "web3";

interface GasPriceConfig {
    minGasPriceGwei?: number;
    maxGasPriceGwei?: number;
    baseIncrease?: number;
}

export const createGasPriceStrategy = (config?: GasPriceConfig) => {
    let lastNonce: bigint = BigInt(-1);
    let lastGasPrice: bigint = BigInt(0);

    // Constants with defaults
    const MIN_GAS_PRICE = BigInt((config?.minGasPriceGwei || 50) * 1e9);
    const MAX_GAS_PRICE = BigInt((config?.maxGasPriceGwei || 500) * 1e9);
    const BASE_INCREASE = BigInt(config?.baseIncrease || 10);

    // Helper function to keep gas price within range
    const ensureGasPriceInRange = (gasPrice: bigint): bigint => {
        if (gasPrice < MIN_GAS_PRICE) return MIN_GAS_PRICE;
        if (gasPrice > MAX_GAS_PRICE) return MAX_GAS_PRICE;
        return gasPrice;
    };

    // Main function to get optimal gas price
    const getOptimalGasPrice = async (web3: Web3, nonce: bigint): Promise<string> => {
        const currentGasPrice = BigInt(await web3.eth.getGasPrice());

        // For new nonce, use network gas price
        if (nonce !== lastNonce) {
            lastNonce = nonce;
            lastGasPrice = currentGasPrice;
            return ensureGasPriceInRange(currentGasPrice).toString();
        }

        // For same nonce (replacement transaction), increase by BASE_INCREASE
        const increasedGasPrice = (lastGasPrice * (BigInt(100) + BASE_INCREASE)) / BigInt(100);
        lastGasPrice = increasedGasPrice;
        
        return ensureGasPriceInRange(increasedGasPrice).toString();
    };
    
    // Helper to get gas price in gwei for logging
    const getGasPriceInGwei = (weiValue: string): string => {
        return (Number(weiValue) / 1e9).toString();
    };

    // Reset state if needed
    const reset = () => {
        lastNonce = BigInt(-1);
        lastGasPrice = BigInt(0);
    };

    return {
        getOptimalGasPrice,
        getGasPriceInGwei,
        reset
    };
}