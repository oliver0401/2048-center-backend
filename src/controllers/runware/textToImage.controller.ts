import { errorHandlerWrapper } from "utils";
import { runwareService } from "../../services";
import { Request, Response } from "express";
import { httpStatus } from "../../types";

const textToImageHandler = async (req: Request, res: Response): Promise<void> => {
    const {
        positivePrompt = "",
        negativePrompt = "",
        model = "google:4@1",
        numImages = 1,
        width = 512,
        height = 512,
        steps = 30,
        CFGScale = 15,
    } = req.body;

    const params = {
        positivePrompt,
        negativePrompt,
        model,
        numImages,
    } as any;

    if (model !== "google:4@1") {
        params.width = width;
        params.height = height;
        params.steps = steps;
        params.CFGScale = CFGScale;
    }

    const images = await runwareService.runware.requestImages(params);

    res.status(httpStatus.OK).json(images.map(image => image.imageURL));
}

export const textToImageController = errorHandlerWrapper(textToImageHandler);