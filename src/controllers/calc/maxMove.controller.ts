import { Response } from "express";

import { Request } from "express";
import { httpStatus } from "types";
import { errorHandlerWrapper } from "utils";
import { calcService } from "../../services";

export const maxMoveHandler = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { uuid } = req.user;
    const maxMove = await calcService.maxMoveCount(uuid);
    res.json(maxMove).status(httpStatus.ACCEPTED);
};
  
export const maxMoveController = errorHandlerWrapper(maxMoveHandler);
  