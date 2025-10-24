import OpenAI from "openai";

// You may want to use environment variables or a config system for your API Key
export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
