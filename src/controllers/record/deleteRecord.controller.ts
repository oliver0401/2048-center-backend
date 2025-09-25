import { recordService } from "../../services/record.service";
import { errorHandlerWrapper } from "../../utils";
import { Request, Response } from "express";
import { httpStatus } from "../../types";
import { MESSAGE } from "consts";
import { NotFoundError } from "errors";

const deleteRecordHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { recordId } = req.params;
  const { uuid } = req.user;

  const deleted = await recordService.deleteRecord(recordId, uuid);

  if (!deleted) {
    throw new NotFoundError(MESSAGE.ERROR.RECORD_NOT_FOUND);
  }

  res.status(httpStatus.OK).json({
    success: true,
    message: MESSAGE.RESPONSE.RECORD_DELETED
  });
};

export const deleteRecordController = errorHandlerWrapper(deleteRecordHandler);
