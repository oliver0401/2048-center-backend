import { Request, Response } from "express";
import { errorHandlerWrapper } from "../../utils";
import { httpStatus } from "../../types";
import { openaiService } from "../../services";
import { Logger } from "../../utils";

export interface TilePrompt {
    value: number;
    prompt: string;
    title: string;
    description: string;
}

const generateTilePromptsHandler = async (req: Request, res: Response): Promise<void> => {
    const { themeTopic, maxTile, themeStyle, description } = req.body;

    if (!themeTopic || !maxTile || !themeStyle) {
        res.status(httpStatus.BAD_REQUEST).json({ 
            error: "themeTopic, maxTile, and themeStyle are required." 
        });
        return;
    }

    try {
        // Calculate all tile values from 2 to maxTile (powers of 2)
        const tileValues: number[] = [];
        for (let value = 2; value <= maxTile; value *= 2) {
            tileValues.push(value);
        }

        const systemPrompt = `You are an expert at creating image generation prompts for game tiles.
Given a theme, generate detailed image generation prompts for each tile value in a 2048 game.
Each tile should represent a progression or evolution within the theme.

Theme Information:
- Topic: ${themeTopic}
- Style: ${themeStyle}
- Description: ${description || "Not provided"}
- Maximum Tile Value: ${maxTile}

For each tile value, provide:
- prompt: A detailed image generation prompt (be specific about style, colors, composition)
- title: A short title for the tile (2-4 words)
- description: A brief description of what the tile represents (1 sentence)

The tiles should show progression/evolution. Lower values should be simpler/basic, higher values should be more complex/advanced.
Return ONLY valid JSON in this exact format:
{
  "tiles": [
    {
      "value": 2,
      "prompt": "...",
      "title": "...",
      "description": "..."
    },
    ...
  ]
}`;

        const userPrompt = `Generate prompts for tile values: ${tileValues.join(", ")}`;

        const completion = await openaiService.openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: userPrompt
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.8,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error("No response from OpenAI");
        }

        const result = JSON.parse(content);
        const tiles: TilePrompt[] = result.tiles || [];

        // Validate that we have prompts for all required tile values
        if (tiles.length !== tileValues.length) {
            throw new Error(`Expected ${tileValues.length} tiles, got ${tiles.length}`);
        }

        res.status(httpStatus.OK).json({ tiles });
    } catch (error) {
        Logger.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ 
            error: "Failed to generate tile prompts.",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

export const generateTilePromptsController = errorHandlerWrapper(generateTilePromptsHandler);


