import { approvalService } from "../../services";
import { errorHandlerWrapper } from "../../utils";
import { Request, Response } from "express";
import { httpStatus } from "../../types";

const getAllApprovalsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const approvals = await approvalService.getAllApprovals();

  res.status(httpStatus.OK).json(approvals);
};

export const getAllApprovalsController = errorHandlerWrapper(getAllApprovalsHandler);

