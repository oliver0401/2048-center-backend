import { recordService } from "../../services/record.service";
import { errorHandlerWrapper } from "../../utils";
import { Request, Response } from "express";
import { httpStatus } from "../../types";
import { MESSAGE } from "consts";
import { BadRequestError } from "errors";

const searchRecordsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { uuid } = req.user;
  const { 
    date, 
    sortBy = 'date', 
    sortOrder = 'desc', 
    limit = 10, 
    offset = 0 
  } = req.query;

  // Validate query parameters
  const limitNum = parseInt(limit as string);
  const offsetNum = parseInt(offset as string);

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    throw new BadRequestError("Limit must be a number between 1 and 100");
  }

  if (isNaN(offsetNum) || offsetNum < 0) {
    throw new BadRequestError("Offset must be a non-negative number");
  }

  // Validate sortBy parameter
  const validSortFields = ['score', 'moves', 'date'];
  if (!validSortFields.includes(sortBy as string)) {
    throw new BadRequestError("sortBy must be one of: score, moves, date");
  }

  // Validate sortOrder parameter
  const validSortOrders = ['asc', 'desc'];
  if (!validSortOrders.includes(sortOrder as string)) {
    throw new BadRequestError("sortOrder must be 'asc' or 'desc'");
  }

  // Validate date format if provided
  if (date && typeof date === 'string') {
    const dateObj = new Date(date as string);
    if (isNaN(dateObj.getTime())) {
      throw new BadRequestError("Date must be in valid ISO format (YYYY-MM-DD)");
    }
  }

  const searchOptions = {
    userId: uuid,
    date: date as string,
    sortBy: sortBy as 'score' | 'moves' | 'date',
    sortOrder: sortOrder as 'asc' | 'desc',
    limit: limitNum,
    offset: offsetNum
  };

  const { records, total } = await recordService.searchRecords(searchOptions);

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
      date: date || null,
      sortBy,
      sortOrder
    }
  });
};

export const searchRecordsController = errorHandlerWrapper(searchRecordsHandler);
