import { Router } from "express";
import { priceController } from "../controllers";

const priceRouter = Router();

priceRouter.get("/", priceController.getPriceController);

export default priceRouter;

