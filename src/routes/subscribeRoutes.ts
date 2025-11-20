import { Router } from "express";
import { subscribeController } from "../controllers";

const subscribeRouter = Router();

subscribeRouter.post("/", subscribeController.createSubscribeController);
export default subscribeRouter;
