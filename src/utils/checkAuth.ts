import { Request, Response, NextFunction } from "express";
import { userService } from "../services";
import { Logger } from "./logger";
import { UnauthorizedError } from "../errors";
import { MESSAGE } from "../consts";
import { getOSFromRequest } from "./detectOS";

export const checkAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const address = req.header("Authorization");
    const src = req.query.src as string || "";
    console.log("address", address);
    if (!address) {
      throw new UnauthorizedError(MESSAGE.ERROR.TOKEN_IS_INVALID);
    }
    const os = getOSFromRequest(req);
    let user = await userService.getOneUser({ address, os, src });

    // If user doesn't exist, create a new one
    if (!user) {
      user = await userService.createUser({ address, os, src: src || "" });
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
