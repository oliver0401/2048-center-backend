import { userService } from "../../services";
import { errorHandlerWrapper } from "../../utils";
import { Request, Response } from "express";
import { httpStatus } from "../../types";

const getUsersPaginatedHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sortBy = (req.query.sortBy as string) || 'createdAt';
  const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'ASC' : 'DESC';

  const result = await userService.getUsersPaginated(page, limit, sortBy, sortOrder);

  res.status(httpStatus.OK).json(result);
};

export const getUsersPaginatedController = errorHandlerWrapper(getUsersPaginatedHandler);

