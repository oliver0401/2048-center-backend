import { recordService } from "../../services/record.service";
import { errorHandlerWrapper } from "../../utils";
import { Request, Response } from "express";
import { httpStatus } from "../../types";
import { MESSAGE } from "consts";
import { NotFoundError, UnauthorizedError } from "errors";

const getRecordByIdHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { recordId } = req.params;
  const { uuid } = req.user;

  const record = await recordService.getRecordById(recordId);

  if (!record) {
    throw new NotFoundError(MESSAGE.ERROR.RECORD_NOT_FOUND);
  }

  // Check if the record belongs to the authenticated user
  if (record.user.uuid !== uuid) {
    throw new UnauthorizedError(MESSAGE.ERROR.NOT_OWNER);
  }

  res.status(httpStatus.OK).json({
    success: true,
    message: MESSAGE.RESPONSE.RECORD_RETRIEVED,
    record
  });
};

export const getRecordByIdController = errorHandlerWrapper(getRecordByIdHandler);
