import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Env } from "../env";
import { userService } from "../services";
import { Logger } from "./logger";
import { NotFoundError, UnauthorizedError } from "../errors";
import { MESSAGE } from "../consts";
import { TokenType } from "../types";

declare global {
  namespace Express {
    interface Request {
      user?: { uuid: string };
    }
  }
}

export const checkAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const { secretKey } = Env;
    const { uuid } = jwt.verify(token, secretKey) as TokenType;
    const user = await userService.getOneUser({ uuid });
    if (!user) throw new NotFoundError(MESSAGE.ERROR.USER_DOES_NOT_EXIST);
    if (user.deletedAt)
      throw new UnauthorizedError(MESSAGE.ERROR.ACCOUNT_HAS_BEEN_DISABLED);
    req.user = { ...user };
    next();
  } catch (err) {
    Logger.error(err);
    if (err instanceof UnauthorizedError)
      next(new UnauthorizedError(err.message));
    else next(new UnauthorizedError(MESSAGE.ERROR.TOKEN_IS_INVALID));
  }
};
