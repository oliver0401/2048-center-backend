import { Request, Response } from "express";
import { errorHandlerWrapper } from "utils";

export const withdrawBalanceHandler = async (
    req: Request,
    res: Response
): Promise<void> => {

}

export const withdrawBalanceController = errorHandlerWrapper(withdrawBalanceHandler);