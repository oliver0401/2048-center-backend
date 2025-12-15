import { eventService } from "../../services/event.service";
import { errorHandlerWrapper } from "../../utils";
import { Request, Response } from "express";
import { httpStatus } from "../../types";
import { MESSAGE } from "consts";
import { BadRequestError } from "errors";

const getLeaderboardHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { event } = req.params;
  const { limit = 10, offset = 0 } = req.query;

  if (!event) {
    throw new BadRequestError("Event parameter is required");
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

  const leaderboard = await eventService.getLeaderboard(event, limitNum, offsetNum);

  res.status(httpStatus.OK).json({
    success: true,
    message: MESSAGE.RESPONSE.RECORDS_RETRIEVED || "Leaderboard retrieved successfully",
    leaderboard: leaderboard.records,
    pagination: {
      page: leaderboard.page,
      limit: leaderboard.limit,
      offset: offsetNum,
      total: leaderboard.total,
      hasMore: offsetNum + limitNum < leaderboard.total,
    },
  });
};

export const getLeaderboardController = errorHandlerWrapper(getLeaderboardHandler);

