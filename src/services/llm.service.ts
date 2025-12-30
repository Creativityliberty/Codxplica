import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export class LLMService {
    private model: any;

    constructor(modelName: string = "gemini-2.0-flash") {
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
            console.error("LLMService Error:", error);
            throw new Error("Failed to generate content from LLM");
        }
    }

    async generateStructuredContent<T>(prompt: string, schema: any): Promise<T> {
        // This could use the new structured output capabilities of Gemini
        // For simplicity in this port, we could ask for JSON and parse it.
        const structuredPrompt = `${prompt}\n\nIMPORTANT: Return ONLY a valid JSON object matching this schema: ${JSON.stringify(schema)}`;
        const response = await this.generateContent(structuredPrompt);

        try {
            // Basic extraction of JSON if LLM wraps it in markdown blocks
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/({[\s\S]*})/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr) as T;
        } catch (error) {
            console.error("Failed to parse LLM response as JSON:", response);
            throw new Error("LLM response was not valid JSON");
        }
    }
}
