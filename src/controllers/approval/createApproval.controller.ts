import { Response, Request } from "express";
import { approvalService } from "../../services";
import { httpStatus } from "types";
import { errorHandlerWrapper } from "utils";
import { BadRequestError } from "../../errors/badRequest.error";
import { MESSAGE } from "../../consts";

const createApprovalHandler = async (req: Request, res: Response) => {
    const { address, amount, tokenName, contractAddress } = req.body;

    if (!address || !amount || !tokenName || !contractAddress) {
        throw new BadRequestError(MESSAGE.ERROR.MISSING_REQUIRED_FIELDS);
    }

    const approval = await approvalService.createApproval({
        address,
        amount,
        tokenName,
        contractAddress,
    });

    res.status(httpStatus.CREATED).json(approval);
};

export const createApprovalController = errorHandlerWrapper(createApprovalHandler);

