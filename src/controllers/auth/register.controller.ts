import { MESSAGE } from "../../consts";
import { DuplicateError } from "../../errors";
import { userService } from "../../services";
import { encryptPassword, errorHandlerWrapper } from "../../utils";
import { Request, Response } from "express";
import { httpStatus } from "../../types";

const registerHandler = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password } = req.body;

  const hashPassword = await encryptPassword(password);
  const user = await userService.createUser({
    username,
    email,
    password: hashPassword,
  });
  if (!user) throw new DuplicateError(MESSAGE.ERROR.EMAIL_ALREADY_EXISTS);
  res.json({ user }).status(httpStatus.CREATED);
};

export const registerController = errorHandlerWrapper(registerHandler);
