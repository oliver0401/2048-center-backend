import { MESSAGE } from "./consts";
import { AppDataSource, backendSetup } from "./setup";
import { Logger, dbCreate } from "./utils";
import { priceService } from "./services";
import cron from "node-cron";
import dotenv from "dotenv";

dotenv.config();

const setupServer = async () => {
  try {
    await dbCreate();
    Logger.info(MESSAGE.DATABASE.MIGARATION_SUCCESS);
    await AppDataSource.initialize();
    Logger.info(MESSAGE.DATABASE.CONNECTION_SUCCESS);
  } catch (error) {
    Logger.info(MESSAGE.DATABASE.CONNECTION_FAILURE);
    Logger.error(error);
    process.exit(0);
  }

  try {
    await backendSetup();

    // Fetch prices immediately on startup
    await priceService.fetchAndStorePrices();
    Logger.info("Initial price fetch completed");

    // Schedule price fetch every hour using cron (runs at minute 0 of every hour)
    cron.schedule("0 * * * *", async () => {
      try {
        await priceService.fetchAndStorePrices();
      } catch (error) {
        Logger.error(`Scheduled price fetch failed: ${error}`);
      }
    });

    Logger.info("Price fetch cron job started (runs every hour at minute 0)");
  } catch (error) {
    Logger.info(MESSAGE.SERVER.STARTING_FAILURE);
    Logger.error(error);
  }
};

setupServer();
