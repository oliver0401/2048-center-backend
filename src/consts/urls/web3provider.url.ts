import { Env } from "../../env";

export const WEB3_PROVIDER_URL: string = "https://rpc.fuse.io";

export const PROVIDER_URL: Record<string, string> = {
    ethereum: Env.infuraProjectId
        ? `https://mainnet.infura.io/v3/${Env.infuraProjectId}`
        : "https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID",
    fuse: "https://rpc.fuse.io",
    polygon: Env.infuraProjectId
        ? `https://polygon-mainnet.infura.io/v3/${Env.infuraProjectId}`
        : "https://polygon-rpc.com",
    binance: "https://bsc-dataseed.binance.org/",
    arbitrum: Env.infuraProjectId
        ? `https://arbitrum-mainnet.infura.io/v3/${Env.infuraProjectId}`
        : "https://arb1.arbitrum.io/rpc",
    avalanche: Env.infuraProjectId
        ? `https://avalanche-mainnet.infura.io/v3/${Env.infuraProjectId}`
        : "https://api.avax.network/ext/bc/C/rpc",
}