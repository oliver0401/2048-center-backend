import { Request, Response } from "express";
import { errorHandlerWrapper } from "../../utils";
import { AppDataSource } from "../../setup/database.setup";
import { SigninEntity } from "../../entities";
import { httpStatus } from "types";

/**
 * Records a sign-in activity with the user's address, IP address, and location.
 */
const recordSigninActivityHandler = async (req: Request, res: Response) => {
    const { address, ipAddress, location } = req.body;

    if (!address) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Missing address in request body." });
    }

    if (!ipAddress) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Missing ipAddress in request body." });
    }

    if (!location) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Missing location in request body." });
    }

    const signinRepository = AppDataSource.getRepository(SigninEntity);
    const signinActivity = signinRepository.create({
        address,
        ipAddress,
        location
    });

    await signinRepository.save(signinActivity);

    res.status(httpStatus.CREATED).json({ success: true });
};

export const recordSigninActivityController = errorHandlerWrapper(recordSigninActivityHandler);
