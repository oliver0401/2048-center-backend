import { Request, Response } from "express";
import { errorHandlerWrapper } from "../../utils";
import { updateItem } from "services/user.service";
import { NotFoundError } from "errors";
import { MESSAGE } from "consts";
import { httpStatus } from "types";

const updateItemHandler = async (req: Request, res: Response) => {
  const { uuid } = req.user;
  const { itemId } = req.params;
  const { quantity } = req.body;
  const user = await updateItem(uuid, itemId, quantity);
  if (!user) {
    throw new NotFoundError(MESSAGE.ERROR.USER_DOES_NOT_EXIST);
  }

  res.status(httpStatus.OK).json(user);
};

export const updateItemController = errorHandlerWrapper(updateItemHandler);
