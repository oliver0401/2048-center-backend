import { Response } from "express";

import { Request } from "express";
import { httpStatus } from "types";
import { errorHandlerWrapper } from "utils";
import { monitorService } from "../../services";

export const collectMonitorHandler = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { ip, hddid } = req.body;
    const data = await monitorService.createMonitor({ ip, hddid });
    res.json(data).status(httpStatus.ACCEPTED);
};

export const collectMonitorController = errorHandlerWrapper(collectMonitorHandler);
