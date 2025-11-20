import { errorHandlerWrapper } from "../../utils";
import { Request, Response } from "express";

import { httpStatus } from "../../types";
import { subscribeService } from "services";
import { MESSAGE } from "consts";
import { BadRequestError } from "errors";

const createSubscribeHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    throw new BadRequestError(MESSAGE.ERROR.MISSING_REQUIRED_FIELDS);
  }
  const subscribe = await subscribeService.createSubscribe({ email });
  res.json(subscribe).status(httpStatus.ACCEPTED);
};

export const createSubscribeController = errorHandlerWrapper(createSubscribeHandler);
