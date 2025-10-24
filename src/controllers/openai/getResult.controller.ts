import { Request, Response } from "express";
import { errorHandlerWrapper } from "../../utils";
import { httpStatus } from "../../types";
// (Assume you have an OpenAI API utility. Replace as appropriate.)
import { openaiService } from "../../services"; // hypothetical import
import { Logger } from "../../utils";

export const getResultHandler = async (req: Request, res: Response): Promise<void> => {
    const { user, system } = req.body;

    if (!user || typeof user !== "string") {
        res.status(httpStatus.BAD_REQUEST).json({ error: "User prompt is required." });
        return;
    }

    try {
        // This code sends a request to OpenAI's API to generate a result for the given user.
        // It uses the `openaiService` to access the OpenAI client, then calls the `responses.create` method.
        // The API is invoked with the model "gpt-4o-mini".
        // It provides two roles in the input:
        //   1. A "system" role with an (empty) system message, usually used to set system behavior or instructions.
        //   2. A "user" role containing the actual user text from the request body.
        // The response, stored in `completion`, contains the result from OpenAI.
        const completion = await openaiService.openai.responses.create({
            model: "gpt-4o-mini",
            input: [
                {
                    role: "system",
                    content: [
                        {
                            type: "input_text",
                            text: system
                        }
                    ]
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "input_text",
                            text: user
                        }
                    ]
                }
            ],
        });

        res.status(httpStatus.OK).json(completion.output_text);
    } catch (error) {
        Logger.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Failed to get result from OpenAI." });
    }   
};

export const getResultController = errorHandlerWrapper(getResultHandler);