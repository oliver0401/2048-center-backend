import { Request, Response, NextFunction } from "express";
import { userService } from "../services";
import { Logger } from "./logger";
import { NotFoundError, UnauthorizedError } from "../errors";
import { MESSAGE } from "../consts";

export const checkAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const address = req.header("Authorization");
    const user = await userService.getOneUser({ address });
    if (!user) throw new NotFoundError(MESSAGE.ERROR.USER_DOES_NOT_EXIST);
    if (user.deletedAt)
      throw new UnauthorizedError(MESSAGE.ERROR.ACCOUNT_HAS_BEEN_DISABLED);
    req.user = { ...user, countThemes: user.themes.length };
    next();
  } catch (err) {
    Logger.error(err);
    if (err instanceof UnauthorizedError)
      next(new UnauthorizedError(err.message));
    else next(new UnauthorizedError(MESSAGE.ERROR.TOKEN_IS_INVALID));
  }
};
