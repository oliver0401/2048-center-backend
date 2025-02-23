import { MESSAGE } from "../../consts";
import { UnauthorizedError } from "../../errors";
import { userService } from "../../services";
import { comparePassword, errorHandlerWrapper } from "../../utils";
import { generateToken } from "../../utils";
import { Request, Response } from "express";

import { httpStatus } from "../../types";

export const loginHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email, password: signinPassword } = req.body;

  const findUser = await userService.getOneUser({ email });
  if (!findUser)
    throw new UnauthorizedError(MESSAGE.ERROR.EMAIL_OR_PASSWORD_IS_INCORRECT);
  if (findUser.deletedAt)
    throw new UnauthorizedError(MESSAGE.ERROR.ACCOUNT_HAS_BEEN_DISABLED);
  const compare = await comparePassword(signinPassword, findUser.password);
  if (!compare)
    throw new UnauthorizedError(MESSAGE.ERROR.EMAIL_OR_PASSWORD_IS_INCORRECT);
  const token = generateToken(findUser.uuid);

  const { password, createdAt, updatedAt, deletedAt, ...user } = findUser;

  res.json({ token, user }).status(httpStatus.ACCEPTED);
};

export const loginController = errorHandlerWrapper(loginHandler);
