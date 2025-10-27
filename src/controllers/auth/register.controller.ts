import { MESSAGE } from "../../consts";
import { DuplicateError } from "../../errors";
import { userService } from "../../services";
import { errorHandlerWrapper, getOSFromRequest } from "../../utils";
import { Request, Response } from "express";
import { httpStatus } from "../../types";

const registerHandler = async (req: Request, res: Response): Promise<void> => {
  const { address } = req.body;
  
  // Detect OS from request (either from body or User-Agent header)
  const os = getOSFromRequest(req);

  const user = await userService.createUser({
    address,
    os,
  });
  if (!user) throw new DuplicateError(MESSAGE.ERROR.USER_ALREADY_EXISTS);
  res.json({ user }).status(httpStatus.CREATED);
};

export const registerController = errorHandlerWrapper(registerHandler);
