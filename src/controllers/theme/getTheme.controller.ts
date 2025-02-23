import { themeService } from "../../services";
import { errorHandlerWrapper } from "../../utils";
import { Request, Response } from "express";

import { httpStatus } from "../../types";

const getThemeHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  console.log("getThemeHandler");
  const { uuid } = req.user;
  console.log(uuid);
  const themes = await themeService.getThemes(uuid);
  res.json(themes).status(httpStatus.ACCEPTED);
};

export const getThemeController = errorHandlerWrapper(getThemeHandler);
