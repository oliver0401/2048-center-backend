import { errorHandlerWrapper } from "../../utils";
import { runwareService } from "../../services";
import { Request, Response } from "express";
import { httpStatus } from "../../types";
import { Logger } from "../../utils";

const MAX_RETRIES = 3;

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

    // Retry logic: attempt up to MAX_RETRIES times
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const images = await runwareService.runware.requestImages(params);
            res.status(httpStatus.OK).json(images.map(image => image.imageURL));
            return;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            Logger.error(`Image generation attempt ${attempt}/${MAX_RETRIES} failed:`, lastError);
            
            // If this is not the last attempt, wait a bit before retrying
            if (attempt < MAX_RETRIES) {
                const delayMs = attempt * 1000; // Exponential backoff: 1s, 2s, 3s
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }

    // All retries failed
    Logger.error("Image generation failed after all retries");
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ 
        error: "Failed to generate image after multiple attempts.",
        details: lastError?.message || "Unknown error"
    });
}

export const textToImageController = errorHandlerWrapper(textToImageHandler);