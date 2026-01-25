import { NextRequest, NextResponse } from "next/server";

/**
 * Endpoint de test pour vérifier la configuration OpenRouter
 * GET /api/test-openrouter
 */
export async function GET(req: NextRequest) {
    const apiKey = process.env.OPENROUTER_API_KEY;

    // Vérifier si la clé existe
    if (!apiKey) {
        return NextResponse.json({
            status: "error",
            message: "OPENROUTER_API_KEY is not configured in environment variables",
            keyPresent: false,
        }, { status: 500 });
    }

    // Masquer la clé pour le debug
    const keyPreview = `${apiKey.slice(0, 15)}...${apiKey.slice(-4)}`;

    try {
        // Test simple avec l'API OpenRouter
        const response = await fetch("https://openrouter.ai/api/v1/models", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json({
                status: "error",
                message: "OpenRouter API returned an error",
                httpStatus: response.status,
                error: errorData,
                keyPreview,
            }, { status: response.status });
        }

        const data = await response.json();

        return NextResponse.json({
            status: "success",
            message: "OpenRouter API is working!",
            keyPreview,
            modelsCount: data.data?.length || 0,
            sampleModels: data.data?.slice(0, 5).map((m: any) => m.id) || [],
        });

    } catch (error) {
        return NextResponse.json({
            status: "error",
            message: "Failed to connect to OpenRouter",
            error: (error as Error).message,
            keyPreview,
        }, { status: 500 });
    }
}
