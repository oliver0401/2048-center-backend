import { Response } from "express";

import { Request } from "express";
import { httpStatus } from "types";
import { errorHandlerWrapper } from "utils/errorHandler";
import { calcService } from "services";

export const maxScoreHandler = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { uuid } = req.user;
    const maxScore = await calcService.maxScoreCount(uuid);
    res.json(maxScore).status(httpStatus.ACCEPTED);
};
  
export const maxScoreController = errorHandlerWrapper(maxScoreHandler);
  