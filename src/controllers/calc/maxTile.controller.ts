import { Response } from "express";

import { Request } from "express";
import { httpStatus } from "types";
import { errorHandlerWrapper } from "utils";
import { calcService } from "../../services";

export const maxTileHandler = async (
    _req: Request,
    res: Response
): Promise<void> => {
    const maxTile = await calcService.maxTileCount();
    res.json(maxTile).status(httpStatus.ACCEPTED);
};
  
export const maxTileController = errorHandlerWrapper(maxTileHandler);
  