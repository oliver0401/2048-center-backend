import { Request, Response, NextFunction } from "express";
import { userService } from "../services";
import { Logger } from "./logger";
import { UnauthorizedError } from "../errors";
import { MESSAGE } from "../consts";

export const checkAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const address = req.header("Authorization");
    if (!address) {
      throw new UnauthorizedError(MESSAGE.ERROR.TOKEN_IS_INVALID);
    }
    
    let user = await userService.getOneUser({ address });
    
    // If user doesn't exist, create a new one
    if (!user) {
      user = await userService.createUser({ address });
      if (!user) {
        throw new UnauthorizedError(MESSAGE.ERROR.TOKEN_IS_INVALID);
      }
    }
    
    if (user.deletedAt) {
      throw new UnauthorizedError(MESSAGE.ERROR.ACCOUNT_HAS_BEEN_DISABLED);
    }

    req.user = { ...user, countThemes: user.userThemes ? user.userThemes.length : 0 };
    next();
  } catch (err) {
    Logger.error(err);
    if (err instanceof UnauthorizedError)
      next(new UnauthorizedError(err.message));
    else next(new UnauthorizedError(MESSAGE.ERROR.TOKEN_IS_INVALID));
  }
};
