import { themeService } from "../../services";
import { errorHandlerWrapper } from "../../utils";
import { Request, Response } from "express";

import { httpStatus } from "../../types";
import { MESSAGE } from "consts";
import { UnauthorizedError } from "errors";

const shareThemeHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { themeId } = req.body;
  const { uuid } = req.user;
  const ownership = await themeService.checkOwnership(themeId, uuid);
  if (!ownership) {
    throw new UnauthorizedError(MESSAGE.ERROR.NOT_OWNER);
  }
  const shareLink = await themeService.shareTheme(themeId, uuid);
  res.json(shareLink).status(httpStatus.ACCEPTED);
};

export const shareThemeController = errorHandlerWrapper(shareThemeHandler);
