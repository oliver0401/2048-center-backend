import { themeService } from "../../services";
import { errorHandlerWrapper } from "../../utils";
import { Request, Response } from "express";

import { httpStatus } from "../../types";

const getCreatedThemesHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { address } = req.user;
  const themes = await themeService.getCreatedThemes(address);
  res.json(themes).status(httpStatus.ACCEPTED);
};

export const getCreatedThemesController = errorHandlerWrapper(getCreatedThemesHandler);
