import { NextRequest, NextResponse } from "next/server";
import { TutorialEngine } from "@/services/engine.service";

export async function POST(req: NextRequest) {
    try {
        const { source, projectName, language } = await req.json();

        if (!source) {
            return NextResponse.json({ error: "Source is required" }, { status: 400 });
        }

        const engine = new TutorialEngine();

        // Note: This is a long-running process. 
        // In a production app, we would use background jobs and SSE/WebSockets.
        // For this demonstration, we'll run it and return the result.
        const tutorial = await engine.generateTutorial(source, projectName || "Project", language || "english");

        return NextResponse.json(tutorial);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
