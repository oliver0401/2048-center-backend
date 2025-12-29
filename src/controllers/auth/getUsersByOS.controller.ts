import { userService } from "../../services";
import { errorHandlerWrapper } from "../../utils";
import { Request, Response } from "express";
import { httpStatus } from "../../types";

const getUsersByOSHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const osCounts = await userService.countUsersByOS();

  res.status(httpStatus.OK).json(osCounts);
};

export const getUsersByOSController = errorHandlerWrapper(getUsersByOSHandler);

