import { EnvType } from "../types";
import dotenv from "dotenv";

dotenv.config();

export const Env: EnvType = {
  host: process.env.DB_HOST,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.PORT) || 8000,
  dbPort: Number(process.env.DB_PORT) || 3306,
  dbName: process.env.DB_NAME,
  secretKey: process.env.SECRET_KEY,
  expiresIn: Number(process.env.EXPIRE_TIME) || 3600,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  ethDwatSignerKey: process.env.ETH_DWAT_SIGNER_KEY,
  fuseDwatSignerKey: process.env.FUSE_DWAT_SIGNER_KEY,
  fuseSignerKey: process.env.FUSE_SIGNER_KEY,
  runwareApiKey: process.env.RUNWARE_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  bettingKey: process.env.BETTING_KEY,
};
