import { errorHandlerWrapper } from "../../utils";
import { runwareService } from "../../services";
import { Request, Response } from "express";
import { httpStatus } from "../../types";
import { Logger } from "../../utils";

interface ImageRequest {
    value: number;
    positivePrompt: string;
    negativePrompt?: string;
    model?: string;
    width?: number;
    height?: number;
    steps?: number;
    CFGScale?: number;
}

const batchTextToImageHandler = async (req: Request, res: Response): Promise<void> => {
    const { requests } = req.body;

    if (!requests || !Array.isArray(requests) || requests.length === 0) {
        res.status(httpStatus.BAD_REQUEST).json({
            error: "requests array is required and must not be empty."
        });
        return;
    }

    try {
        // Process all image generation requests in parallel using Promise.all
        const imagePromises = requests.map(async (imageReq: ImageRequest) => {
            const {
                value,
                positivePrompt = "",
                negativePrompt = "blurry, low quality, distorted",
                model = "google:4@1",
                width = 512,
                height = 512,
                steps = 30,
                CFGScale = 15,
            } = imageReq;

            if (!positivePrompt) {
                throw new Error(`Missing positivePrompt for tile value ${value}`);
            }

            const params = {
                positivePrompt,
                negativePrompt,
                model,
                numImages: 1,
            } as any;

            if (model !== "google:4@1") {
                params.width = width;
                params.height = height;
                params.steps = steps;
                params.CFGScale = CFGScale;
            }

            try {
                const images = await runwareService.runware.requestImages(params);
                return {
                    value,
                    success: true,
                    imageURL: images && images.length > 0 ? images[0].imageURL : null,
                };
            } catch (error) {
                Logger.error(`Failed to generate image for tile ${value}:`, error);
                return {
                    value,
                    success: false,
                    imageURL: null,
                    error: error instanceof Error ? error.message : "Unknown error",
                };
            }
        });

        // Wait for all requests to complete
        const results = await Promise.all(imagePromises);

        // Format response: map tile values to image URLs
        const imageMap: Record<number, string> = {};
        const errors: Array<{ value: number; error: string }> = [];

        results.forEach((result) => {
            if (result.success && result.imageURL) {
                imageMap[result.value] = result.imageURL;
            } else {
                errors.push({
                    value: result.value,
                    error: result.error || "Failed to generate image",
                });
            }
        });

        res.status(httpStatus.OK).json({
            images: imageMap,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        Logger.error("Batch image generation error:", error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            error: "Failed to generate images.",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

export const batchTextToImageController = errorHandlerWrapper(batchTextToImageHandler);

