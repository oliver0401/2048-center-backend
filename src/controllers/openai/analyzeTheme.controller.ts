import { Request, Response } from "express";
import { errorHandlerWrapper } from "../../utils";
import { httpStatus } from "../../types";
import { openaiService } from "../../services";
import { Logger } from "../../utils";

export interface ThemeAnalysis {
    themeTopic: string;
    maxTile: number;
    themeStyle: string;
    description: string;
}

const analyzeThemeHandler = async (req: Request, res: Response): Promise<void> => {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
        res.status(httpStatus.BAD_REQUEST).json({ error: "Prompt is required." });
        return;
    }

    try {
        const systemPrompt = `You are an expert at analyzing game theme prompts for a 2048 game. 
Analyze the user's prompt and extract the following information in JSON format:
- themeTopic: A concise title/topic for the theme (e.g., "Space Exploration", "Ocean Life", "Medieval Fantasy")
- maxTile: The maximum tile value (must be a power of 2, between 2 and 65536, default to 2048 if not specified)
- themeStyle: The visual style (e.g., "realistic", "cartoon", "pixel art", "minimalist", "3D", "watercolor")
- description: A brief description of the theme (2-3 sentences)

Return ONLY valid JSON in this exact format:
{
  "themeTopic": "...",
  "maxTile": 2048,
  "themeStyle": "...",
  "description": "..."
}`;

        const completion = await openaiService.openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error("No response from OpenAI");
        }

        const analysis: ThemeAnalysis = JSON.parse(content);

        // Validate and normalize maxTile
        if (!analysis.maxTile || analysis.maxTile < 2) {
            analysis.maxTile = 2048;
        }
        // Ensure maxTile is a power of 2
        analysis.maxTile = Math.pow(2, Math.floor(Math.log2(analysis.maxTile)));

        res.status(httpStatus.OK).json(analysis);
    } catch (error) {
        Logger.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            error: "Failed to analyze theme prompt.",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

export const analyzeThemeController = errorHandlerWrapper(analyzeThemeHandler);


