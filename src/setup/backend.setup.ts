import express, { Express, Request, Response } from "express";
import cors from "cors";
import { json as bodyParser } from "body-parser";
import { Env } from "../env";
import { Logger } from "../utils";
import { MESSAGE } from "../consts";
import { appRouter } from "../routes";
import { errorHandlerMiddleware, routeMiddleware, clerkMiddleware } from "../middlewares";


export const backendSetup = () => {
  const app: Express = express();

  app.use(cors());
  app.use(bodyParser());

  app.use(routeMiddleware);
  
  // Add Clerk webhook middleware to handle user creation events
  app.use("/webhook", clerkMiddleware);

  app.use("/health", (_req: Request, res: Response) =>
    res.send(MESSAGE.SERVER.HELLO_WORLD)
  );

  app.use("/api", appRouter);

  app.use(errorHandlerMiddleware);

  const { port } = Env;

  app.listen(port, () => {
    Logger.info(MESSAGE.SERVER.STARTING_SUCCESS);
  });
};