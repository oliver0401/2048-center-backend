import { Response } from "express";
import axios from 'axios';
import { Request } from "express";
import Web3 from "web3";
import dotenv from "dotenv";
import { themeService } from "../../services";
import { httpStatus } from "types";
import { errorHandlerWrapper } from "utils";
import { MESSAGE, ADDRESSES, CONSTANTS } from 'consts';
import { BadRequestError } from "../../errors/badRequest.error";

dotenv.config();

interface TransactionData {
  txHash: string;
  tokenType: string;
  network: "binance" | "arbitrum" | "polygon" | "fuse";
  fromAddr: string;
  toAddr: string;
  amount: number;
}

interface DecodedTransferLog {
  from: string;
  to: string;
  value; number;
}

const RPC_URL: Record<string, string> = {
  polygon: process.env.POLYGON_RPC_URL || "",
  binance: process.env.BINANCE_RPC_URL || "",
  arbitrum: process.env.ARBITRUM_RPC_URL || "",
  fuse: process.env.FUSE_RPC_URL || ""
};

const TRANSFER_EVENT_SIGNATURE = Web3.utils.keccak256("Transfer(address, address, uint256)");

const getUsdtPriceInNativeToken = async (tokenType: string | null): Promise<number> => {
  try {
    const coinId = CONSTANTS.COINGECKO_ID[tokenType as any];
    const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
      params: {
        ids: coinId,
        vs_currencies: "usd"
      }
    });

    const priceInUSD = response.data[coinId]?.usd;
    if (!priceInUSD) throw new Error("Price fetch failed");

    return 1 / priceInUSD; // Convert 1 USDT to native token amount
  } catch (error) {
    console.error("Error fetching price:", error);
    throw error;
  }

}

const buyThemeHandler = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.user;
    const { themeId, txData } = req.body;

    const { txHash, tokenType, network, fromAddr, toAddr, amount }: TransactionData = txData;

    console.log(txData);

    if (!txHash || !tokenType || !network || !fromAddr || !toAddr || !amount) {
      throw new BadRequestError(MESSAGE.RESPONSE.TRANSACTION_DATA_REQUIRED);
    }

    if (!RPC_URL[network]) {
      throw new BadRequestError(MESSAGE.RESPONSE.UNSUPPORTED_NETWORK);
    }

    if ((tokenType.toLowerCase() === "usdt" || tokenType.toLowerCase() === "usdc") && !ADDRESSES.TOKEN_CONTRACTS[network][tokenType]) {
      throw new BadRequestError(MESSAGE.RESPONSE.UNSUPPORTED_TOKEN);
    }

    const web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL[network]));

    const [tx, txReceipt] = await Promise.all([
      web3.eth.getTransaction(txHash),
      web3.eth.getTransactionReceipt(txHash)
    ]);

    if (!txReceipt || !txReceipt.status) {
      throw new BadRequestError(MESSAGE.RESPONSE.TRANSACTION_EXECUTION_FAILED);
    }

    if (tokenType === "bnb" || tokenType === "fuse") {

      const convertedAmount = amount * await getUsdtPriceInNativeToken(tokenType);

      if (tx.from.toLowerCase() !== fromAddr.toLowerCase() ||
          tx.to.toLowerCase() !== toAddr.toLowerCase() ||
          (Math.abs(Number(tx.value) - Math.floor(convertedAmount * CONSTANTS.CONVERT_AMOUNT)) > CONSTANTS.DEVIATION_AMOUNT)) {
        throw new BadRequestError(MESSAGE.RESPONSE.WRONG_TRANSACTION_DETAIL);
      }
    } else {

      const tokenAddress = ADDRESSES.TOKEN_CONTRACTS[network][tokenType];
      const transferLog = txReceipt.logs.find(
        log => log?.address?.toLowerCase() === tokenAddress?.toLowerCase()
      );

      if (!transferLog) {
        throw new BadRequestError(MESSAGE.RESPONSE.WRONG_TRANSACTION_DETAIL);
      }
      const decodedLog = web3.eth.abi.decodeLog(
        [
          { type: "address", name: "from", indexed: true },
          { type: "address", name: "to", indexed: true },
          { type: "uint256", name: "value", indexed: false }
        ],
        transferLog.data,
        transferLog.topics.slice(1)
      ) as unknown as DecodedTransferLog;

      console.log("Decoded Log: ", decodedLog);
      console.log(typeof (decodedLog.value));

      if (!decodedLog || !decodedLog.from || !decodedLog.to) {
        throw new BadRequestError(MESSAGE.RESPONSE.WRONG_TRANSACTION_DETAIL);
      }

      const sender: string = decodedLog.from.toLowerCase();
      const recipient: string = decodedLog.to.toLowerCase();
      const value: bigint = decodedLog.value;
      
      const convertedAmount = amount * await getUsdtPriceInNativeToken(tokenType);
      console.log(Number(value));//10^16
      console.log(Math.floor(convertedAmount * CONSTANTS.CONVERT_AMOUNT)); // 10^17
      console.log(Math.abs(Number(value) - Math.floor(convertedAmount * CONSTANTS.CONVERT_AMOUNT))); //10^25
      console.log(CONSTANTS.DEVIATION_AMOUNT);
      console.log(sender);
      console.log(fromAddr.toLowerCase());
      console.log(recipient);
      console.log(toAddr.toLowerCase());
      if (sender !== fromAddr.toLowerCase() ||
        recipient !== toAddr.toLowerCase() ||
        (Math.abs(Number(value) - Math.floor(convertedAmount * CONSTANTS.CONVERT_AMOUNT)) > CONSTANTS.DEVIATION_AMOUNT)
      ) {
        throw new BadRequestError(MESSAGE.RESPONSE.WRONG_TRANSACTION_DETAIL);
      }
    }

    const theme = await themeService.buyTheme(uuid, themeId);
    res.json(theme).status(httpStatus.OK);

  } catch (error) {
    console.error("Internal Server Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const buyThemeController = errorHandlerWrapper(buyThemeHandler);
