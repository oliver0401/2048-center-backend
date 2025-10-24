import { Request, Response } from "express";
import { errorHandlerWrapper } from "utils";

export const depositBalanceHandler = async (
    req: Request,
    res: Response
): Promise<void> => {

}

export const depositBalanceController = errorHandlerWrapper(depositBalanceHandler);