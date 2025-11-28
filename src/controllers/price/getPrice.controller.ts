import { Response, Request } from "express";
import { priceService } from "../../services";
import { httpStatus } from "types";
import { errorHandlerWrapper } from "utils";

const getPriceHandler = async (_req: Request, res: Response) => {
  const prices = await priceService.getPrices();
  res.status(httpStatus.OK).json(prices);
};

export const getPriceController = errorHandlerWrapper(getPriceHandler);

