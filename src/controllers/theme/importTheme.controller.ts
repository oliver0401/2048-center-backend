import { themeService } from "../../services";
import { errorHandlerWrapper } from "../../utils";
import { Request, Response } from "express";

import { httpStatus } from "../../types";
import { MESSAGE } from "consts";
import { UnauthorizedError } from "errors";
import jwt from "jsonwebtoken";

const importThemeHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { shareLink } = req.body;
  console.log("shareLink", shareLink);
  const { themeId, uuid } = jwt.verify(shareLink, process.env.JWT_SECRET as string);
  console.log("themeId", themeId);
  console.log("uuid", uuid);
  const ownership = await themeService.checkOwnership(themeId, uuid);
  if (!ownership) {
    throw new UnauthorizedError(MESSAGE.ERROR.NOT_OWNER);
  }
  console.log("ownership", ownership);
  const theme = await themeService.importTheme(themeId, req.user.uuid);
  console.log("theme", theme);
  res.json(theme).status(httpStatus.ACCEPTED);
};

export const importThemeController = errorHandlerWrapper(importThemeHandler);
