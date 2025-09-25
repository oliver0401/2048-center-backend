import { recordService } from "../../services/record.service";
import { errorHandlerWrapper } from "../../utils";
import { Request, Response } from "express";
import { httpStatus } from "../../types";
import { MESSAGE } from "consts";
import { BadRequestError } from "errors";

const getRecordsByDateRangeHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { uuid } = req.user;
  const { 
    startDate, 
    endDate, 
    limit = 10, 
    offset = 0 
  } = req.query;

  // Validate required parameters
  if (!startDate || !endDate) {
    throw new BadRequestError("startDate and endDate are required");
  }

  // Validate query parameters
  const limitNum = parseInt(limit as string);
  const offsetNum = parseInt(offset as string);

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    throw new BadRequestError("Limit must be a number between 1 and 100");
  }

  if (isNaN(offsetNum) || offsetNum < 0) {
    throw new BadRequestError("Offset must be a non-negative number");
  }

  // Validate date formats
  const startDateObj = new Date(startDate as string);
  const endDateObj = new Date(endDate as string);

  if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
    throw new BadRequestError("Dates must be in valid ISO format (YYYY-MM-DD)");
  }

  if (startDateObj > endDateObj) {
    throw new BadRequestError("startDate must be before or equal to endDate");
  }

  const { records, total } = await recordService.getRecordsByDateRange(
    uuid,
    startDate as string,
    endDate as string,
    limitNum,
    offsetNum
  );

  res.status(httpStatus.OK).json({
    success: true,
    message: MESSAGE.RESPONSE.RECORDS_RETRIEVED,
    records,
    pagination: {
      limit: limitNum,
      offset: offsetNum,
      total,
      hasMore: offsetNum + limitNum < total
    },
    filters: {
      startDate,
      endDate
    }
  });
};

export const getRecordsByDateRangeController = errorHandlerWrapper(getRecordsByDateRangeHandler);
