import Web3 from "web3";
import { Repository } from "typeorm";
import { AppDataSource } from "../setup";
import { PriceEntity } from "../entities";
import { Logger } from "../utils";
import { URL } from "../consts";

const TOKEN_ADDRESSES: Record<string, string> = {
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    STETH: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
    PENDLE: "0x808507121B80c02388fAd14726482e061B8da827",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
};

// Uniswap V2 Factory address
const UNISWAP_V2_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

// ERC20 ABI for decimals and balanceOf
const ERC20_ABI = [
    {
        constant: true,
        inputs: [],
        name: "decimals",
        outputs: [{ name: "", type: "uint8" }],
        type: "function",
    },
    {
        constant: true,
        inputs: [{ name: "_owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "balance", type: "uint256" }],
        type: "function",
    },
];

// Uniswap V2 Pair ABI for getReserves
const PAIR_ABI = [
    {
        constant: true,
        inputs: [],
        name: "getReserves",
        outputs: [
            { name: "_reserve0", type: "uint112" },
            { name: "_reserve1", type: "uint112" },
            { name: "_blockTimestampLast", type: "uint32" },
        ],
        type: "function",
    },
    {
        constant: true,
        inputs: [],
        name: "token0",
        outputs: [{ name: "", type: "address" }],
        type: "function",
    },
    {
        constant: true,
        inputs: [],
        name: "token1",
        outputs: [{ name: "", type: "address" }],
        type: "function",
    },
];

// Uniswap V2 Factory ABI for getPair
const FACTORY_ABI = [
    {
        constant: true,
        inputs: [
            { name: "tokenA", type: "address" },
            { name: "tokenB", type: "address" },
        ],
        name: "getPair",
        outputs: [{ name: "pair", type: "address" }],
        type: "function",
    },
];

const getTokenDecimals = async (web3: Web3, tokenAddress: string): Promise<number> => {
    try {
        const tokenContract = new web3.eth.Contract(ERC20_ABI as any, tokenAddress);
        const decimals = await tokenContract.methods.decimals().call();
        return Number(decimals);
    } catch (error) {
        Logger.warn(`Failed to get decimals for ${tokenAddress}: ${error}`);
        return 18; // Default to 18 if we can't fetch
    }
};

const getPairReserves = async (
    web3: Web3,
    pairAddress: string
): Promise<{ reserve0: bigint; reserve1: bigint; token0: string; token1: string } | null> => {
    try {
        const pairContract = new web3.eth.Contract(PAIR_ABI as any, pairAddress);
        const [reserves, token0, token1] = await Promise.all([
            pairContract.methods.getReserves().call() as Promise<{ _reserve0: string; _reserve1: string; _blockTimestampLast: string }>,
            pairContract.methods.token0().call() as Promise<string>,
            pairContract.methods.token1().call() as Promise<string>,
        ]);

        return {
            reserve0: BigInt(reserves._reserve0),
            reserve1: BigInt(reserves._reserve1),
            token0: token0.toLowerCase(),
            token1: token1.toLowerCase(),
        };
    } catch (error) {
        Logger.warn(`Failed to get reserves for pair ${pairAddress}: ${error}`);
        return null;
    }
};

const getPairAddress = async (
    web3: Web3,
    tokenA: string,
    tokenB: string
): Promise<string | null> => {
    try {
        const factoryContract = new web3.eth.Contract(FACTORY_ABI as any, UNISWAP_V2_FACTORY);
        const pairAddress = await factoryContract.methods.getPair(tokenA, tokenB).call() as string;
        return pairAddress && pairAddress !== "0x0000000000000000000000000000000000000000"
            ? pairAddress.toLowerCase()
            : null;
    } catch (error) {
        Logger.warn(`Failed to get pair address for ${tokenA}/${tokenB}: ${error}`);
        return null;
    }
};

const getTokenPriceFromPair = async (
    web3: Web3,
    tokenAddress: string,
    quoteTokenAddress: string
): Promise<number | null> => {
    try {
        const pairAddress = await getPairAddress(web3, tokenAddress, quoteTokenAddress);
        if (!pairAddress) {
            return null;
        }

        const reserves = await getPairReserves(web3, pairAddress);
        if (!reserves) {
            return null;
        }

        const tokenDecimals = await getTokenDecimals(web3, tokenAddress);
        const quoteDecimals = await getTokenDecimals(web3, quoteTokenAddress);

        const tokenLower = tokenAddress.toLowerCase();
        let tokenReserve: bigint;
        let quoteReserve: bigint;

        if (reserves.token0 === tokenLower) {
            tokenReserve = reserves.reserve0;
            quoteReserve = reserves.reserve1;
        } else {
            tokenReserve = reserves.reserve1;
            quoteReserve = reserves.reserve0;
        }

        // Calculate price: (quoteReserve / tokenReserve) * (10^tokenDecimals / 10^quoteDecimals)
        const price =
            (Number(quoteReserve) / Number(tokenReserve)) *
            Math.pow(10, tokenDecimals - quoteDecimals);

        return price;
    } catch (error) {
        Logger.warn(`Failed to get price for ${tokenAddress} from pair: ${error}`);
        return null;
    }
};

const getWETHPrice = async (web3: Web3): Promise<number | null> => {
    // Get WETH price from WETH/USDC pair
    const wethAddress = TOKEN_ADDRESSES.WETH.toLowerCase();
    const usdcAddress = TOKEN_ADDRESSES.USDC.toLowerCase();

    const price = await getTokenPriceFromPair(web3, wethAddress, usdcAddress);
    return price;
};

const getTokenPrice = async (web3: Web3, tokenSymbol: string, tokenAddress: string): Promise<number | null> => {
    const tokenLower = tokenAddress.toLowerCase();
    const wethAddress = TOKEN_ADDRESSES.WETH.toLowerCase();
    const usdcAddress = TOKEN_ADDRESSES.USDC.toLowerCase();
    const usdtAddress = TOKEN_ADDRESSES.USDT.toLowerCase();

    // For stablecoins, default to 1.0 USD (they're pegged)
    if (tokenSymbol === "USDC" || tokenSymbol === "USDT") {
        return 1.0;
    }

    // For WETH, get price from WETH/USDC pair
    if (tokenSymbol === "WETH") {
        const wethPrice = await getWETHPrice(web3);
        return wethPrice;
    }

    // For other tokens, try WETH pair first, then USDC pair
    let price = await getTokenPriceFromPair(web3, tokenLower, wethAddress);
    if (price !== null) {
        const wethPrice = await getWETHPrice(web3);
        if (wethPrice !== null) {
            return price * wethPrice; // Convert to USD
        }
    }

    // Fallback to USDC pair
    price = await getTokenPriceFromPair(web3, tokenLower, usdcAddress);
    if (price !== null) {
        return price; // Already in USD terms
    }

    // Last fallback: USDT pair
    price = await getTokenPriceFromPair(web3, tokenLower, usdtAddress);
    if (price !== null) {
        return price; // Already in USD terms
    }

    return null;
};

export const fetchAndStorePrices = async (): Promise<void> => {
    try {
        const priceRepository: Repository<PriceEntity> =
            AppDataSource.getRepository(PriceEntity);

        // Initialize Web3 with Infura
        const infuraUrl = URL.PROVIDER_URL.ethereum;
        if (!infuraUrl || infuraUrl.includes("YOUR_INFURA_PROJECT_ID")) {
            throw new Error("INFURA_PROJECT_ID not configured. Please set INFURA_PROJECT_ID in your .env file.");
        }

        const web3 = new Web3(infuraUrl);

        // Get WETH price first (needed for other token calculations)
        const wethPrice = await getWETHPrice(web3);
        if (wethPrice === null) {
            Logger.warn("Failed to get WETH price, some token prices may be unavailable");
        } else {
            Logger.info(`WETH price: $${wethPrice.toFixed(2)}`);
        }

        for (const [symbol, address] of Object.entries(TOKEN_ADDRESSES)) {
            try {
                const price = await getTokenPrice(web3, symbol, address);

                if (price !== null && price > 0) {
                    let priceEntity = await priceRepository.findOne({
                        where: { token: symbol },
                    });

                    if (priceEntity) {
                        priceEntity.price = price;
                        await priceRepository.save(priceEntity);
                    } else {
                        priceEntity = new PriceEntity();
                        priceEntity.token = symbol;
                        priceEntity.price = price;
                        await priceRepository.save(priceEntity);
                    }

                    Logger.info(`Updated price for ${symbol}: $${price.toFixed(6)}`);
                } else {
                    Logger.warn(`Price not found for ${symbol} (${address})`);
                }
            } catch (error) {
                Logger.error(`Error fetching price for ${symbol}: ${error}`);
            }
        }

        Logger.info("Price fetch completed successfully");
    } catch (error) {
        Logger.error(`Error fetching prices: ${error}`);
        throw error;
    }
};

export const getPrices = async (): Promise<PriceEntity[]> => {
    const priceRepository: Repository<PriceEntity> =
        AppDataSource.getRepository(PriceEntity);

    const prices = await priceRepository.find({
        order: {
            token: "ASC",
        },
    });

    return prices;
};

