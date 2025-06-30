import { errorHandlerWrapper } from "../../utils";
import { Request, Response } from "express";

import { httpStatus } from "../../types";
import { UserEntity } from "entities";

declare global {
  namespace Express {
    interface Request {
      user?: UserEntity & { countThemes: number };
    }
  }
}

export const getUserHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  res.json({ ...req.user }).status(httpStatus.ACCEPTED);
};
export const getUserController = errorHandlerWrapper(getUserHandler);

