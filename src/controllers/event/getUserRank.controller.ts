import { eventService } from "../../services/event.service";
import { errorHandlerWrapper } from "../../utils";
import { Request, Response } from "express";
import { httpStatus } from "../../types";
import { MESSAGE } from "consts";
import { BadRequestError } from "errors";

const getUserRankHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { address } = req.user;
  const { event } = req.params;

  if (!event) {
    throw new BadRequestError("Event parameter is required");
  }

  const userRank = await eventService.getUserRank(event, address);

  if (!userRank) {
    res.status(httpStatus.OK).json({
      success: true,
      message: "User has no record for this event",
      rank: null,
    });
    return;
  }

  res.status(httpStatus.OK).json({
    success: true,
    message: "User rank retrieved successfully",
    rank: userRank.rank,
    points: userRank.points,
    record: userRank.record,
  });
};

export const getUserRankController = errorHandlerWrapper(getUserRankHandler);

