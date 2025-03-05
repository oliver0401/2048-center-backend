import { userService } from "../../services";
import { errorHandlerWrapper } from "../../utils";
import { Request, Response } from "express";

import { httpStatus } from "../../types";
import { MESSAGE } from "consts";
import { NotFoundError } from "errors";

declare global {
  namespace Express {
    interface Request {
      user?: { uuid: string };
    }
  }
}

export const getUserHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { uuid } = req.user;
  const findUser = await userService.getOneUser({ uuid });
  if (!findUser) throw new NotFoundError(MESSAGE.ERROR.USER_DOES_NOT_EXIST);
  const { password, createdAt, updatedAt, deletedAt, ...user } = findUser;
  res.json({ ...user }).status(httpStatus.ACCEPTED);
};

export const getUserController = errorHandlerWrapper(getUserHandler);
