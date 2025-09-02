import { themeService } from "../../services";
import { errorHandlerWrapper } from "../../utils";
import { Request, Response } from "express";

import { httpStatus, ThemeVisibility } from "../../types";

const getPublicThemeHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { visibility } = req.params;
  const themes = await themeService.getPublicThemes(visibility as Exclude<ThemeVisibility, "all">);
  res.json(themes).status(httpStatus.ACCEPTED);
};

export const getPublicThemeController = errorHandlerWrapper(getPublicThemeHandler);
