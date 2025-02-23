import { Request, Response } from "express";
import { errorHandlerWrapper } from "../../utils";
import { updateUser } from "services/user.service";
import { NotFoundError } from "errors";
import { MESSAGE } from "consts";
import { httpStatus } from "types";

const updateUserHandler = async (req: Request, res: Response) => {
  const { uuid } = req.user;
  const user = await updateUser({ uuid, ...req.body });
  if (!user) {
    throw new NotFoundError(MESSAGE.ERROR.USER_DOES_NOT_EXIST);
  }

  res.status(httpStatus.OK).json(user);
};

export const updateUserController = errorHandlerWrapper(updateUserHandler);
