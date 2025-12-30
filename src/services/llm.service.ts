import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export const GEMINI_MODELS = {
    // Gemini 3 Series (Preview)
    GEMINI_3_PRO: "gemini-3-pro-preview",
    GEMINI_3_FLASH: "gemini-3-flash-preview",
    GEMINI_3_PRO_IMAGE: "gemini-3-pro-image-preview",

    // Gemini Flash Latest (Points to 2.5)
    GEMINI_FLASH_LATEST: "gemini-flash-latest",
    GEMINI_FLASH_LITE: "gemini-flash-lite-latest",

    // Stable / Legacy
    GEMINI_1_5_FLASH: "gemini-1.5-flash",
    GEMINI_2_0_FLASH_EXP: "gemini-2.0-flash-exp"
};

export class LLMService {
    private model: any;

    constructor(modelName: string = GEMINI_MODELS.GEMINI_1_5_FLASH) {
        if (!API_KEY) {
            console.error("CRITICAL: GEMINI_API_KEY is missing in environment variables.");
        }
        this.model = genAI.getGenerativeModel({
            model: modelName,
        });
    }

    async generateContent(prompt: string, useCache: boolean = true): Promise<string> {
        // Note: Caching logic can be implemented here using Bun's native SQLite if needed.
        // For now, we'll focus on the core functionality.

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("LLMService Error Details:", JSON.stringify(error, null, 2));
            throw new Error(`Failed to generate content from LLM: ${(error as Error).message}`);
        }
    }

    async generateStructuredContent<T>(prompt: string, schema: any): Promise<T> {
        const structuredPrompt = `${prompt}\n\nIMPORTANT: Return ONLY a valid JSON object (or array) matching this schema: ${JSON.stringify(schema)}. Do not include Markdown formatting or explanations.`;
        const response = await this.generateContent(structuredPrompt);

        try {
            // Robust JSON extraction
            let jsonStr = response.trim();

            // Remove markdown code blocks if present
            jsonStr = jsonStr.replace(/^```(json)?|```$/g, "");

            // Find first '{' or '[' and last '}' or ']'
            const firstOpen = jsonStr.search(/[{[]/);
            const lastClose = jsonStr.search(/[}\]]$/); // Search from end usually, but regex searches from start.

            // Better approach: simple substring search
            const firstBrace = jsonStr.indexOf('{');
            const firstBracket = jsonStr.indexOf('[');
            const start = (firstBrace === -1) ? firstBracket : (firstBracket === -1) ? firstBrace : Math.min(firstBrace, firstBracket);

            if (start !== -1) {
                const endBrace = jsonStr.lastIndexOf('}');
                const endBracket = jsonStr.lastIndexOf(']');
                const end = Math.max(endBrace, endBracket);

                if (end !== -1 && end > start) {
                    jsonStr = jsonStr.substring(start, end + 1);
                }
            }

            return JSON.parse(jsonStr) as T;
        } catch (error) {
            console.error("Failed to parse LLM response as JSON. Raw response:", response);
            throw new Error(`LLM response was not valid JSON: ${(error as Error).message}`);
        }
    }
}
