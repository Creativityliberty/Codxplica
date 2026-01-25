/**
 * OpenRouter Service - Accès aux modèles gratuits et payants via OpenRouter API
 * Documentation: https://openrouter.ai/docs
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// Modèles gratuits disponibles sur OpenRouter
export const OPENROUTER_MODELS = {
    // === MODÈLES GRATUITS ===
    // DeepSeek
    DEEPSEEK_R1_FREE: "deepseek/deepseek-r1:free",
    DEEPSEEK_CHAT_FREE: "deepseek/deepseek-chat:free",

    // Meta Llama
    LLAMA_3_3_70B_FREE: "meta-llama/llama-3.3-70b-instruct:free",
    LLAMA_3_2_3B_FREE: "meta-llama/llama-3.2-3b-instruct:free",
    LLAMA_3_1_8B_FREE: "meta-llama/llama-3.1-8b-instruct:free",

    // Google
    GEMMA_2_9B_FREE: "google/gemma-2-9b-it:free",

    // Mistral
    MISTRAL_7B_FREE: "mistralai/mistral-7b-instruct:free",

    // Qwen
    QWEN_2_5_7B_FREE: "qwen/qwen-2.5-7b-instruct:free",
    QWEN_2_5_72B_FREE: "qwen/qwen-2.5-72b-instruct:free",

    // Microsoft
    PHI_3_MINI_FREE: "microsoft/phi-3-mini-128k-instruct:free",
    PHI_3_MEDIUM_FREE: "microsoft/phi-3-medium-128k-instruct:free",

    // Hugging Face
    ZEPHYR_7B_FREE: "huggingfaceh4/zephyr-7b-beta:free",

    // Nous Research
    HERMES_3_LLAMA_FREE: "nousresearch/hermes-3-llama-3.1-405b:free",

    // === MODÈLES PAYANTS (low-cost) ===
    CLAUDE_3_HAIKU: "anthropic/claude-3-haiku",
    GPT_4O_MINI: "openai/gpt-4o-mini",
    GEMINI_FLASH: "google/gemini-flash-1.5",
};

// Liste des modèles gratuits pour le frontend
export const FREE_MODELS_LIST = [
    { id: OPENROUTER_MODELS.DEEPSEEK_R1_FREE, name: "DeepSeek R1", description: "Reasoning model, excellent pour l'analyse" },
    { id: OPENROUTER_MODELS.DEEPSEEK_CHAT_FREE, name: "DeepSeek Chat", description: "Chat rapide et efficace" },
    { id: OPENROUTER_MODELS.LLAMA_3_3_70B_FREE, name: "Llama 3.3 70B", description: "Très puissant, 70B paramètres" },
    { id: OPENROUTER_MODELS.LLAMA_3_2_3B_FREE, name: "Llama 3.2 3B", description: "Léger et rapide" },
    { id: OPENROUTER_MODELS.QWEN_2_5_72B_FREE, name: "Qwen 2.5 72B", description: "Excellent pour le code" },
    { id: OPENROUTER_MODELS.GEMMA_2_9B_FREE, name: "Gemma 2 9B", description: "Par Google, équilibré" },
    { id: OPENROUTER_MODELS.MISTRAL_7B_FREE, name: "Mistral 7B", description: "Français, rapide" },
    { id: OPENROUTER_MODELS.PHI_3_MEDIUM_FREE, name: "Phi-3 Medium", description: "Par Microsoft, 128k context" },
];

export interface OpenRouterMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface OpenRouterResponse {
    id: string;
    choices: Array<{
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export class OpenRouterService {
    private apiKey: string;
    private model: string;

    constructor(modelName: string = OPENROUTER_MODELS.DEEPSEEK_R1_FREE) {
        this.apiKey = OPENROUTER_API_KEY;
        this.model = modelName;

        if (!this.apiKey) {
            console.error("CRITICAL: OPENROUTER_API_KEY is missing in environment variables.");
        }
    }

    async generateContent(prompt: string): Promise<string> {
        try {
            const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://codxplica.vercel.app",
                    "X-Title": "Codxplica",
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: "user",
                            content: prompt,
                        },
                    ],
                    max_tokens: 4096,
                    temperature: 0.7,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`OpenRouter API Error: ${response.status} - ${JSON.stringify(errorData)}`);
            }

            const data: OpenRouterResponse = await response.json();

            if (!data.choices || data.choices.length === 0) {
                throw new Error("No response from OpenRouter API");
            }

            return data.choices[0].message.content;
        } catch (error) {
            console.error("OpenRouterService Error:", error);
            throw new Error(`Failed to generate content from OpenRouter: ${(error as Error).message}`);
        }
    }

    async generateStructuredContent<T>(prompt: string, schema: any): Promise<T> {
        const structuredPrompt = `${prompt}\n\nIMPORTANT: Return ONLY a valid JSON object (or array) matching this schema: ${JSON.stringify(schema)}. Do not include Markdown formatting or explanations.`;
        const response = await this.generateContent(structuredPrompt);

        try {
            // Robust JSON extraction (same as Gemini service)
            let jsonStr = response.trim();

            // Remove markdown code blocks if present
            jsonStr = jsonStr.replace(/^```(json)?|```$/g, "");

            // Remove <think> tags from DeepSeek R1
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
            console.error("Failed to parse OpenRouter response as JSON. Raw response:", response);
            throw new Error(`OpenRouter response was not valid JSON: ${(error as Error).message}`);
        }
    }
}
