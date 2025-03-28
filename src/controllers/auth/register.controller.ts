import { MESSAGE } from "../../consts";
import { DuplicateError } from "../../errors";
import { userService } from "../../services";
import { errorHandlerWrapper } from "../../utils";
import { Request, Response } from "express";
import { httpStatus } from "../../types";

const registerHandler = async (req: Request, res: Response): Promise<void> => {
  const { address } = req.body;

  const user = await userService.createUser({
    address,
  });
  if (!user) throw new DuplicateError(MESSAGE.ERROR.USER_ALREADY_EXISTS);
  res.json({ user }).status(httpStatus.CREATED);
};

export const registerController = errorHandlerWrapper(registerHandler);
