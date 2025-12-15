import { eventService } from "../../services/event.service";
import { errorHandlerWrapper } from "../../utils";
import { Request, Response } from "express";
import { httpStatus } from "../../types";
import { MESSAGE } from "consts";
import { BadRequestError } from "errors";

const saveOrUpdateEventRecordHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { address } = req.user;
  const { event, time, score, swipes, maxTile } = req.body;

  // Validate required fields
  if (!event || time === undefined || score === undefined || swipes === undefined || maxTile === undefined) {
    throw new BadRequestError(MESSAGE.ERROR.MISSING_REQUIRED_FIELDS);
  }

  // Validate data types and ranges
  if (typeof time !== 'number' || time < 0) {
    throw new BadRequestError("Time must be a non-negative number");
  }

  if (typeof score !== 'number' || score < 0) {
    throw new BadRequestError("Score must be a non-negative number");
  }

  if (typeof swipes !== 'number' || swipes < 0) {
    throw new BadRequestError("Swipes must be a non-negative number");
  }

  if (typeof maxTile !== 'number' || maxTile < 0) {
    throw new BadRequestError("MaxTile must be a non-negative number");
  }

  // Save or update event record
  const eventRecord = await eventService.saveOrUpdateEventRecord({
    event,
    address,
    time: Math.floor(time),
    score: Math.floor(score),
    swipes: Math.floor(swipes),
    maxTile: Math.floor(maxTile),
  });

  res.status(httpStatus.OK).json({
    success: true,
    message: MESSAGE.RESPONSE.RECORD_SAVED || "Event record saved successfully",
    record: eventRecord,
  });
};

export const saveOrUpdateEventRecordController = errorHandlerWrapper(saveOrUpdateEventRecordHandler);

