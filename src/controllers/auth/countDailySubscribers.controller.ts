import { subscribeService } from "../../services";
import { errorHandlerWrapper } from "../../utils";
import { Request, Response } from "express";
import { httpStatus } from "../../types";
import { BadRequestError } from "errors";

const countDailySubscribersHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { startDate, endDate } = req.query;

  // Validate date formats if provided
  if (startDate && typeof startDate === "string") {
    const dateObj = new Date(startDate);
    if (isNaN(dateObj.getTime())) {
      throw new BadRequestError("startDate must be in valid ISO format (YYYY-MM-DD)");
    }
  }

  if (endDate && typeof endDate === "string") {
    const dateObj = new Date(endDate);
    if (isNaN(dateObj.getTime())) {
      throw new BadRequestError("endDate must be in valid ISO format (YYYY-MM-DD)");
    }
  }

  // Validate date range if both are provided
  if (startDate && endDate) {
    const startDateObj = new Date(startDate as string);
    const endDateObj = new Date(endDate as string);
    if (startDateObj > endDateObj) {
      throw new BadRequestError("startDate must be before or equal to endDate");
    }
  }

  const dailyCounts = await subscribeService.countDailySubscribers(
    startDate as string | undefined,
    endDate as string | undefined
  );

  res.status(httpStatus.OK).json({
    success: true,
    dailyCounts,
    total: dailyCounts.reduce((sum, item) => sum + item.count, 0),
    filters: {
      startDate: startDate || null,
      endDate: endDate || null,
    },
  });
};

export const countDailySubscribersController = errorHandlerWrapper(countDailySubscribersHandler);

