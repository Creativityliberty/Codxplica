import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { OpenRouterService, OPENROUTER_MODELS, FREE_MODELS_LIST } from "./openrouter.service";

const API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// Types de providers disponibles
export type LLMProvider = "gemini" | "openrouter";

export const GEMINI_MODELS = {
    // Latest Experimental (Fast & Smart)
    GEMINI_2_0_FLASH_EXP: "gemini-2.0-flash-exp",

    // Stable Production
    GEMINI_1_5_FLASH: "gemini-1.5-flash",
    GEMINI_1_5_PRO: "gemini-1.5-pro",
};

// Réexporter les modèles OpenRouter pour faciliter l'accès
export { OPENROUTER_MODELS, FREE_MODELS_LIST };

// Liste des modèles Gemini pour le frontend
export const GEMINI_MODELS_LIST = [
    { id: GEMINI_MODELS.GEMINI_2_0_FLASH_EXP, name: "Gemini 2.0 Flash Exp", description: "Rapide et intelligent" },
    { id: GEMINI_MODELS.GEMINI_1_5_FLASH, name: "Gemini 1.5 Flash", description: "Stable, rapide" },
    { id: GEMINI_MODELS.GEMINI_1_5_PRO, name: "Gemini 1.5 Pro", description: "Plus puissant" },
];

export class LLMService {
    private model: any;
    private provider: LLMProvider;
    private openRouterService?: OpenRouterService;

    constructor(
        modelName: string = GEMINI_MODELS.GEMINI_2_0_FLASH_EXP,
        provider: LLMProvider = "gemini"
    ) {
        this.provider = provider;

        if (provider === "openrouter") {
            this.openRouterService = new OpenRouterService(modelName);
        } else {
            // Gemini (default)
            if (!API_KEY) {
                console.error("CRITICAL: GEMINI_API_KEY is missing in environment variables.");
            }
            this.model = genAI.getGenerativeModel({
                model: modelName,
            });
        }
    }

    async generateContent(prompt: string, useCache: boolean = true): Promise<string> {
        // Note: Caching logic can be implemented here using Bun's native SQLite if needed.

        try {
            if (this.provider === "openrouter" && this.openRouterService) {
                return await this.openRouterService.generateContent(prompt);
            }

            // Gemini (default)
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("LLMService Error Details:", JSON.stringify(error, null, 2));
            throw new Error(`Failed to generate content from LLM: ${(error as Error).message}`);
        }
    }

    async generateStructuredContent<T>(prompt: string, schema: any): Promise<T> {
        // Si OpenRouter, utiliser directement son service avec parsing amélioré
        if (this.provider === "openrouter" && this.openRouterService) {
            return await this.openRouterService.generateStructuredContent<T>(prompt, schema);
        }

        const structuredPrompt = `${prompt}\n\nIMPORTANT: Return ONLY a valid JSON object (or array) matching this schema: ${JSON.stringify(schema)}. Do not include Markdown formatting or explanations.`;
        const response = await this.generateContent(structuredPrompt);

        try {
            // Robust JSON extraction
            let jsonStr = response.trim();

            // Remove markdown code blocks if present
            jsonStr = jsonStr.replace(/^```(json)?|```$/g, "");

            // Remove <think> tags (for reasoning models like DeepSeek R1)
            jsonStr = jsonStr.replace(/<think>[\s\S]*?<\/think>/g, "");

            // Find first '{' or '[' and last '}' or ']'
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
