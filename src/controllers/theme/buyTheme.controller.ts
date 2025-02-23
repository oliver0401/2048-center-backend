import { Response } from "express";

import { Request } from "express";
import { themeService } from "services";
import { httpStatus } from "types";
import { errorHandlerWrapper } from "utils";

const buyThemeHandler = async (req: Request, res: Response) => {
  const { uuid } = req.user;
  const { themeId } = req.body;
  const theme = await themeService.buyTheme(uuid, themeId);
  res.json(theme).status(httpStatus.ACCEPTED);
};

export const buyThemeController = errorHandlerWrapper(buyThemeHandler);
