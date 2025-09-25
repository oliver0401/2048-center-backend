import { recordService } from "../../services/record.service";
import { errorHandlerWrapper } from "../../utils";
import { Request, Response } from "express";
import { httpStatus } from "../../types";
import { MESSAGE } from "consts";
import { BadRequestError } from "errors";

const getUserRecordsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { uuid } = req.user;
  const { limit = 10, offset = 0 } = req.query;

  // Validate query parameters
  const limitNum = parseInt(limit as string);
  const offsetNum = parseInt(offset as string);

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    throw new BadRequestError("Limit must be a number between 1 and 100");
  }

  if (isNaN(offsetNum) || offsetNum < 0) {
    throw new BadRequestError("Offset must be a non-negative number");
  }

  const records = await recordService.getRecordsByUserId(uuid, limitNum, offsetNum);

  res.status(httpStatus.OK).json({
    success: true,
    message: MESSAGE.RESPONSE.RECORDS_RETRIEVED,
    records,
    pagination: {
      limit: limitNum,
      offset: offsetNum,
      count: records.length
    }
  });
};

export const getUserRecordsController = errorHandlerWrapper(getUserRecordsHandler);
