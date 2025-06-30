import { themeService } from "../../services";
import { errorHandlerWrapper } from "../../utils";
import { Request, Response } from "express";

import { httpStatus, ThemeVisibility } from "../../types";

const getThemeHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { uuid, address } = req.user;
  const { visibility } = req.params;
  const themes = await themeService.getThemes(uuid, address, visibility as ThemeVisibility);
  res.json(themes).status(httpStatus.ACCEPTED);
};

export const getThemeController = errorHandlerWrapper(getThemeHandler);
